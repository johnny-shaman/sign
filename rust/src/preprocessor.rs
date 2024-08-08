use regex::Regex;
use std::collections::HashMap;

pub struct Preprocessor {
    simple_replacements: HashMap<String, String>,
    complex_replacements: Vec<(Regex, String)>,
}

impl Preprocessor {
    pub fn new() -> Self {
        let mut preprocessor = Preprocessor {
            simple_replacements: HashMap::new(),
            complex_replacements: Vec::new(),
        };

        // 全ての比較演算子に対する特殊な置換ルールを追加
        preprocessor.add_complex_replacement(
            r"(\w+)\s*=\s*(\w+)\s*(==|!=|<|<=|>|>=)\s*(\w+)",
            "($1 = $2) & ($2 $3 $4)"
        );

        preprocessor
    }

    pub fn add_simple_replacement(&mut self, pattern: String, replacement: String) {
        self.simple_replacements.insert(pattern, replacement);
    }

    pub fn add_complex_replacement(&mut self, pattern: &str, replacement: &str) {
        let regex = Regex::new(pattern).expect("Invalid regex pattern");
        self.complex_replacements.push((regex, replacement.to_string()));
    }

    pub fn process(&self, input: &str) -> String {
        let mut result = input.to_string();

        // 複雑な置換ルールを適用
        for (regex, replacement) in &self.complex_replacements {
            result = regex.replace_all(&result, replacement).to_string();
        }

        // 単純な置換を適用
        for (pattern, replacement) in &self.simple_replacements {
            result = result.replace(pattern, replacement);
        }

        result
    }
}

pub struct Compiler {
    preprocessor: Preprocessor,
    // 他のコンパイラコンポーネント
}

impl Compiler {
    pub fn new() -> Self {
        Compiler {
            preprocessor: Preprocessor::new(),
            // 他のコンポーネントの初期化
        }
    }

    pub fn compile(&mut self, input: &str) -> Result<String, String> {
        // 1. プリプロセス
        let preprocessed = self.preprocessor.process(input);
        println!("Preprocessed: {}", preprocessed); // デバッグ用出力

        // 2. 字句解析と構文解析
        let ast = self.parse(&preprocessed)?;

        // 3. 意味解析と型チェック
        self.analyze(&ast)?;

        // 4. コード生成
        let output = self.generate_code(&ast)?;

        Ok(output)
    }

    // parse, analyze, generate_code メソッドは以前と同じ
    fn parse(&self, input: &str) -> Result<String, String> {
        // 仮の実装
        Ok(input.to_string())
    }

    fn analyze(&self, ast: &str) -> Result<(), String> {
        // 仮の実装
        Ok(())
    }

    fn generate_code(&self, ast: &str) -> Result<String, String> {
        // 仮の実装
        Ok(ast.to_string())
    }
}

// 使用例
fn main() {
    let mut compiler = Compiler::new();
    let inputs = vec![
        "x = y > z",
        "a = b < c",
        "p = q == r",
        "m = n != o",
        "i = j <= k",
        "u = v >= w",
    ];

    for input in inputs {
        println!("Input: {}", input);
        match compiler.compile(input) {
            Ok(output) => println!("Compiled output: {}", output),
            Err(e) => eprintln!("Compilation error: {}", e),
        }
        println!();
    }
}