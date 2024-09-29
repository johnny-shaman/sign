use regex::Regex;

fn removeComment(input: &str) -> String {
    // 行頭が ` で始まる行を削除する正規表現
    let comment_regex = Regex::new(r"(?m)^`.*$").unwrap();

    // コメントを削除
    let without_comments = comment_regex.replace_all(input, "");

    without_empty_lines.to_string()
}

fn transform_chained_comparisons(input: &str) -> String {
    let comparison_regex = Regex::new(r"(\S+)\s*(([<>=]|!=|<=|>=))\s*(\S+)(?:\s*(([<>=]|!=|<=|>=))\s*(\S+))+").unwrap();
    
    comparison_regex.replace_all(input, |caps: &regex::Captures| {
        let mut result = String::new();
        let mut last_value = &caps[1];
        let mut pairs = caps.iter().skip(2).collect::<Vec<_>>();
        
        for chunk in pairs.chunks(2) {
            if chunk.len() == 2 {
                if let (Some(op), Some(value)) = (chunk[0], chunk[1]) {
                    if !result.is_empty() {
                        result.push_str(" & ");
                    }
                    result.push_str(&format!("{} {} {}", last_value, op.as_str(), value.as_str()));
                    last_value = value.as_str();
                }
            }
        }
        
        result
    }).to_string()
}
