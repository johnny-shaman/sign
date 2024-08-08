use regex::Regex;
use std::collections::HashMap;

pub struct SignPreprocessor {
    replacements: Vec<(Regex, Box<dyn Fn(&regex::Captures) -> String>)>,
}

impl SignPreprocessor {
    pub fn new() -> Self {
        let mut preprocessor = SignPreprocessor {
            replacements: Vec::new(),
        };

        // Dictionaryからmatch_caseへの変換
        preprocessor.add_replacement(
            r"(?s)(\w+)\s*:\s*\n((?:\s+\w+\s*:\s*.+\n?)+)",
            Box::new(|caps: &regex::Captures| {
                let name = &caps[1];
                let entries = caps[2].trim().split('\n');
                let mut match_case = format!("{} : ?\n", name);
                for entry in entries {
                    let parts: Vec<&str> = entry.splitn(2, ':').collect();
                    if parts.len() == 2 {
                        let key = parts[0].trim();
                        let value = parts[1].trim();
                        match_case.push_str(&format!("  [= `{}`] & {} ;\n", key, value));
                    }
                }
                match_case.push_str("  []");
                match_case
            })
        );

        // 関数定義の自動カリー化
        preprocessor.add_replacement(
            r"(\w+)\s*:\s*(\w+(?:\s+\w+)*)\s*\?\s*(.+)",
            Box::new(|caps: &regex::Captures| {
                let name = &caps[1];
                let params: Vec<_> = caps[2].split_whitespace().collect();
                let body = &caps[3];
                let mut curried = format!("{} : ", name);
                for (i, param) in params.iter().enumerate() {
                    if i == params.len() - 1 {
                        curried.push_str(&format!("{} ? {}", param, body));
                    } else {
                        curried.push_str(&format!("{} ? ", param));
                    }
                }
                curried
            })
        );

        // 比較演算子の連鎖の変換
        preprocessor.add_replacement(
            r"(\w+(?:\s*(?:==|!=|<|<=|>|>=|=)\s*\w+)+)",
            Box::new(|caps: &regex::Captures| {
                let expr = &caps[1];
                let parts: Vec<&str> = expr.split_whitespace().collect();
                let mut result = String::new();
                let mut last_var = parts[0];
                for i in (1..parts.len()).step_by(2) {
                    if i > 1 {
                        result.push_str(" & ");
                    }
                    result.push_str(&format!("({} {} {})", last_var, parts[i], parts[i+1]));
                    last_var = parts[i+1];
                }
                result
            })
        );

        preprocessor
    }

    pub fn add_replacement(&mut self, pattern: &str, replacement: Box<dyn Fn(&regex::Captures) -> String>) {
        let regex = Regex::new(pattern).expect("Invalid regex pattern");
        self.replacements.push((regex, replacement));
    }

    pub fn process(&self, input: &str) -> String {
        let mut result = input.to_string();
        for (regex, replacement_fn) in &self.replacements {
            result = regex.replace_all(&result, |caps: &regex::Captures| {
                replacement_fn(caps)
            }).to_string();
        }
        result
    }
}

pub struct SignCompiler {
    preprocessor: SignPreprocessor,
}

impl SignCompiler {
    pub fn new() -> Self {
        SignCompiler {
            preprocessor: SignPreprocessor::new(),
        }
    }

    pub fn compile(&self, input: &str) -> Result<String, String> {
        let processed_sign = self.preprocessor.process(input);
        Ok(processed_sign)
    }
}

fn main() {
    let compiler = SignCompiler::new();
    let inputs = vec![
        "foo : \n  t : $\n  f : \\\n  n : _",
        "add : x y ? x + y",
        "x < y < z",
    ];

    for input in inputs {
        println!("Original Sign Input:\n{}", input);
        match compiler.compile(input) {
            Ok(output) => println!("Processed Sign Output:\n{}", output),
            Err(e) => eprintln!("Processing error: {}", e),
        }
        println!();
    }
}
