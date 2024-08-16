{
  const fs = require('fs');
  const readline = require('readline');

  // コマンドライン引数からファイル名を取得
  const filename = process.argv[2];

  if (!filename) {
    console.error('ファイル名を指定してください。');
    process.exit(1);
  }

  // 読み込みストリームと書き込みストリームを作成
  const readStream  = fs.createReadStream(filename, {});
  const writeStream = fs.createWriteStream(`${filename}.ready`);
  const debugWrite  = fs.createWriteStream(`${filename}.debug`);

  // readline インターフェースを作成
  (async function (rl) {
    const lift = require('./lifter.js');
    let counter = 1;
    //対象とするreaderを巡回する。
    for await (const line of rl) {
  
      //コメントを削除
      const commentRemoved = line.replace(/^`.*`/g, '');
  
      ///require('./syntax_checker.js')(counter, commentRemoved, [/(?=_)\w+/g]);
  
      //削除された行か空行でないなら
      if (commentRemoved !== '') {
  
        /*
          プリプロセスしないトークンを持ち上げる。
          最初のliftで文字列を
          flatMapを上から順に
          文字
          エスケープされた改行の再挿入
  
        */
        const preamble = lift(commentRemoved, /[@]?`[^`\r\n`]*`/g) //import含む文字列
          .flatMap(
            o => typeof o === "string"
            ? lift(o, /\\[\s\S]/g) //文字
            : [o]
          )
          .flatMap(
            o => typeof o === "string"
            ? lift(o, /\\/g, /\\/g, '$&\n') //改行文字
            : [o]
          )
          .flatMap(
            o => typeof o === "string"
            ? lift(o, /([!~]*|['#@]?)[a-zA-Z]\w+[!~]*/g) //前置、後置含むident
            : [o]
          )
          .flatMap(
            o => typeof o === "string"
            ? lift(o, /0x[0-9a-fA-F]+/g) //hexリテラル
            : [o]
          )
          .flatMap(
            o => typeof o === "string"
            ? lift(o, /-?[0-9]+\.?[0-9]*/g) //Numberリテラル
            : [o]
          )
  
        await debugWrite.write(`${JSON.stringify(preamble)}\n`);
        await writeStream.write(commentRemoved + '\n');
  
        ++counter;
      };
    }
  })(
    readline.createInterface({
      input: readStream,
      output: writeStream,
      crlfDelay: Infinity
    })
  );
}
