use std::env;
use std::fs::File;
use std::io::{self, BufRead, BufReader, Write};
use regex::Regex;

fn main() -> io::Result<()> {
    let args: Vec<String> = env::args().collect();
    if args.len() < 2 {
        eprintln!("ファイル名を指定してください。");
        std::process::exit(1);
    }

    let filename = &args[1];
    let input_file = File::open(filename)?;
    let output_file = File::create(format!("{}.ready", filename))?;
    let debug_file = File::create(format!("{}.debug", filename))?;

    let reader = BufReader::new(input_file);
    let mut writer = io::BufWriter::new(output_file);
    let mut debug_writer = io::BufWriter::new(debug_file);

    let comment_regex = Regex::new(r"^`[^\r\n]*`").unwrap();
    let string_regex = Regex::new(r"`[^`\r\n]*`").unwrap();

    for line in reader.lines() {
        let line = line?;
        
        // コメントを削除
        let l0 = comment_regex.replace_all(&line, "");

        // 削除された行か空行でないなら
        if !l0.trim().is_empty() {
            // 文字列をプリプロセスから除外する
            let mut string_lifted = Vec::new();
            let mut last_end = 0;
            for cap in string_regex.captures_iter(&l0) {
                let m = cap.get(0).unwrap();
                let start = m.start();
                let end = m.end();
                if start > last_end {
                    string_lifted.push(l0[last_end..start].to_string());
                }
                string_lifted.push(m.as_str().to_string());
                last_end = end;
            }
            if last_end < l0.len() {
                string_lifted.push(l0[last_end..].to_string());
            }

            // デバッグ出力
            writeln!(debug_writer, "{:?}", string_lifted)?;

            // 処理済みの行を書き込み
            writeln!(writer, "{}", l0)?;
        }
    }

    Ok(())
}
