use std::fs::File;
use std::io::{BufRead, BufReader};

#[derive(Debug, Clone, PartialEq)]
enum Token {
    Colon,
    Question,
    Comma,
    Space,
    NewLine,
    Indent(usize),
    Dedent,
    Identifier(String),
    StringLiteral(String),
}

#[derive(Debug, Clone)]
enum Expr {
    Define(String, Box<Expr>),
    Lambda(Vec<(Expr, Expr)>),
    Product(Vec<Expr>),
    Apply(Box<Expr>, Box<Expr>),
    Coproduct(Vec<Expr>),
    Evaluate(Box<Expr>),
    Str(String),
    Var(String),
}

struct Parser {
    tokens: Vec<Token>,
    position: usize,
}

impl Parser {
    fn new(tokens: Vec<Token>) -> Self {
        Parser {
            tokens,
            position: 0,
        }
    }

    fn parse(&mut self) -> Expr {
        let expr = self.parse_expr();
        if self.consume(Token::NewLine) {
            Expr::Evaluate(Box::new(expr))
        } else {
            expr
        }
    }

    fn parse_expr(&mut self) -> Expr {
        let mut expr = self.parse_term();

        while self.position < self.tokens.len() {
            match &self.tokens[self.position] {
                Token::Space => {
                    self.position += 1;
                    let right = self.parse_term();
                    expr = Expr::Apply(Box::new(expr), Box::new(right));
                }
                Token::Comma => {
                    self.position += 1;
                    let right = self.parse_term();
                    expr = match expr {
                        Expr::Product(mut v) => {
                            v.push(right);
                            Expr::Product(v)
                        }
                        _ => Expr::Product(vec![expr, right]),
                    };
                }
                _ => break,
            }
        }

        expr
    }

    fn parse_term(&mut self) -> Expr {
        match self.tokens.get(self.position) {
            Some(Token::Identifier(name)) => {
                self.position += 1;
                if self.consume(Token::Colon) {
                    let value = self.parse_expr();
                    Expr::Define(name.clone(), Box::new(value))
                } else {
                    Expr::Var(name.clone())
                }
            }
            Some(Token::Question) => {
                self.position += 1;
                self.parse_lambda()
            }
            Some(Token::StringLiteral(s)) => {
                self.position += 1;
                Expr::Str(s.clone())
            }
            Some(Token::Indent(_)) => {
                self.position += 1;
                let body = self.parse_expr();
                self.consume(Token::Dedent);
                body
            }
            _ => panic!("Unexpected token"),
        }
    }

    fn parse_lambda(&mut self) -> Expr {
        let mut cases = vec![];
        while self.position < self.tokens.len() {
            let pattern = self.parse_expr();
            self.consume(Token::Colon);
            let body = self.parse_expr();
            cases.push((pattern, body));
            if !matches!(self.tokens.get(self.position), Some(Token::Indent(_))) {
                break;
            }
            self.position += 1; // Skip Indent
        }
        Expr::Lambda(cases)
    }

    fn consume(&mut self, expected: Token) -> bool {
        if self.position < self.tokens.len() && self.tokens[self.position] == expected {
            self.position += 1;
            true
        } else {
            false
        }
    }
}

// Lexer implementation (omitted for brevity)

fn load_file(filename: &str) -> Vec<Expr> {
    let file = File::open(filename).expect("Failed to open file");
    let reader = BufReader::new(file);
    let mut content = String::new();
    for line in reader.lines() {
        content.push_str(&line.unwrap());
        content.push('\n');
    }

    let mut lexer = Lexer::new(content);
    let mut tokens = Vec::new();
    while let Some(token) = lexer.next_token() {
        tokens.push(token);
    }

    let mut parser = Parser::new(tokens);
    let mut expressions = Vec::new();
    while parser.position < parser.tokens.len() {
        expressions.push(parser.parse());
    }
    expressions
}

fn main() {
    let args: Vec<String> = env::args().collect();

    if args.len() != 2 {
        eprintln!("Usage: {} <filename>", args[0]);
        process::exit(1);
    }

    let filename = &args[1];
    
    println!("Compiling file: {}", filename);

    let ast = load_file(filename);
    println!("AST: {:?}", ast);  // ASTの内容を表示（デバッグ用）

    let mut compiler = Compiler::new("sign_module");

    unsafe {
        compiler.compile(&ast);
        compiler.dump_module();
    }
}
