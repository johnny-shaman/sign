use llvm_sys::core::*;
use llvm_sys::prelude::*;
use std::ffi::CString;
use std::collections::HashMap;

#[derive(Debug, Clone)]
enum Expr {
    Def(String, Box<Expr>),
    Lambda(Vec<String>, Box<Expr>),
    Apply(Box<Expr>, Vec<Expr>),
    If(Box<Expr>, Box<Expr>, Box<Expr>),
    List(Vec<Expr>),
    Str(String),
    Var(String),
}

struct Compiler {
    context: LLVMContextRef,
    module: LLVMModuleRef,
    builder: LLVMBuilderRef,
    named_values: HashMap<String, LLVMValueRef>,
}

impl Compiler {
    fn new(module_name: &str) -> Self {
        unsafe {
            let context = LLVMContextCreate();
            let module = LLVMModuleCreateWithNameInContext(
                CString::new(module_name).unwrap().as_ptr(),
                context,
            );
            let builder = LLVMCreateBuilderInContext(context);

            Compiler {
                context,
                module,
                builder,
                named_values: HashMap::new(),
            }
        }
    }

    fn compile(&mut self, expr: &Expr) -> LLVMValueRef {
        unsafe {
            match expr {
                Expr::Def(name, value) => {
                    let val = self.compile(value);
                    let global = LLVMAddGlobal(self.module, LLVMTypeOf(val), name.as_ptr() as *const _);
                    LLVMSetInitializer(global, val);
                    LLVMSetGlobalConstant(global, 0);
                    self.named_values.insert(name.clone(), global);
                    global
                }
                Expr::Lambda(params, body) => {
                    let param_types = vec![LLVMPointerType(LLVMInt8TypeInContext(self.context), 0); params.len()];
                    let fn_type = LLVMFunctionType(
                        LLVMPointerType(LLVMInt8TypeInContext(self.context), 0),
                        param_types.as_ptr() as *mut _,
                        params.len() as u32,
                        0,
                    );
                    let function = LLVMAddFunction(self.module, b"lambda\0".as_ptr() as *const _, fn_type);

                    let entry = LLVMAppendBasicBlockInContext(self.context, function, b"entry\0".as_ptr() as *const _);
                    LLVMPositionBuilderAtEnd(self.builder, entry);

                    let old_values = params.iter().enumerate().map(|(i, param)| {
                        let arg = LLVMGetParam(function, i as u32);
                        LLVMSetValueName2(arg, param.as_ptr() as *const _, param.len());
                        self.named_values.insert(param.clone(), arg)
                    }).collect::<Vec<_>>();

                    let body_val = self.compile(body);
                    LLVMBuildRet(self.builder, body_val);

                    for (param, old_value) in params.iter().zip(old_values) {
                        if let Some(old) = old_value {
                            self.named_values.insert(param.clone(), old);
                        } else {
                            self.named_values.remove(param);
                        }
                    }

                    function
                }
                Expr::Apply(func, args) => {
                    let callee = self.compile(func);
                    let mut compiled_args: Vec<LLVMValueRef> = args.iter().map(|arg| self.compile(arg)).collect();
                    LLVMBuildCall2(
                        self.builder,
                        LLVMTypeOf(callee),
                        callee,
                        compiled_args.as_mut_ptr(),
                        compiled_args.len() as u32,
                        b"calltmp\0".as_ptr() as *const _,
                    )
                }
                Expr::If(cond, then_expr, else_expr) => {
                    let cond_val = self.compile(cond);
                    let function = LLVMGetBasicBlockParent(LLVMGetInsertBlock(self.builder));

                    let then_bb = LLVMAppendBasicBlockInContext(self.context, function, b"then\0".as_ptr() as *const _);
                    let else_bb = LLVMAppendBasicBlockInContext(self.context, function, b"else\0".as_ptr() as *const _);
                    let merge_bb = LLVMAppendBasicBlockInContext(self.context, function, b"ifcont\0".as_ptr() as *const _);

                    LLVMBuildCondBr(self.builder, cond_val, then_bb, else_bb);

                    LLVMPositionBuilderAtEnd(self.builder, then_bb);
                    let then_val = self.compile(then_expr);
                    LLVMBuildBr(self.builder, merge_bb);

                    LLVMPositionBuilderAtEnd(self.builder, else_bb);
                    let else_val = self.compile(else_expr);
                    LLVMBuildBr(self.builder, merge_bb);

                    LLVMPositionBuilderAtEnd(self.builder, merge_bb);
                    let phi = LLVMBuildPhi(
                        self.builder,
                        LLVMTypeOf(then_val),
                        b"iftmp\0".as_ptr() as *const _,
                    );
                    let mut incoming_values = vec![then_val, else_val];
                    let mut incoming_blocks = vec![then_bb, else_bb];
                    LLVMAddIncoming(
                        phi,
                        incoming_values.as_mut_ptr(),
                        incoming_blocks.as_mut_ptr(),
                        2,
                    );
                    phi
                }
                Expr::List(elements) => {
                    let list_type = LLVMArrayType(LLVMPointerType(LLVMInt8TypeInContext(self.context), 0), elements.len() as u32);
                    let list_alloca = LLVMBuildAlloca(self.builder, list_type, b"list\0".as_ptr() as *const _);

                    for (i, elem) in elements.iter().enumerate() {
                        let elem_val = self.compile(elem);
                        let elem_ptr = LLVMBuildGEP2(
                            self.builder,
                            list_type,
                            list_alloca,
                            &mut [
                                LLVMConstInt(LLVMInt32TypeInContext(self.context), 0, 0),
                                LLVMConstInt(LLVMInt32TypeInContext(self.context), i as u64, 0),
                            ] as *mut _,
                            2,
                            b"elemptr\0".as_ptr() as *const _,
                        );
                        LLVMBuildStore(self.builder, elem_val, elem_ptr);
                    }

                    list_alloca
                }
                Expr::Str(s) => {
                    LLVMBuildGlobalStringPtr(self.builder, s.as_ptr() as *const _, b"strptr\0".as_ptr() as *const _)
                }
                Expr::Var(name) => {
                    *self.named_values.get(name).expect("Unknown variable name")
                }
            }
        }
    }
}

fn main() {
    let mut compiler = Compiler::new("sign_module");

    // Example usage
    let expr = Expr::Def(
        "factorial".to_string(),
        Box::new(Expr::Lambda(
            vec!["n".to_string()],
            Box::new(Expr::If(
                Box::new(Expr::Apply(
                    Box::new(Expr::Var("=".to_string())),
                    vec![Expr::Var("n".to_string()), Expr::Str("0".to_string())],
                )),
                Box::new(Expr::Str("1".to_string())),
                Box::new(Expr::Apply(
                    Box::new(Expr::Var("*".to_string())),
                    vec![
                        Expr::Var("n".to_string()),
                        Expr::Apply(
                            Box::new(Expr::Var("factorial".to_string())),
                            vec![Expr::Apply(
                                Box::new(Expr::Var("-".to_string())),
                                vec![Expr::Var("n".to_string()), Expr::Str("1".to_string())],
                            )],
                        ),
                    ],
                )),
            )),
        )),
    );

    compiler.compile(&expr);

    unsafe {
        LLVMDumpModule(compiler.module);
    }
}
