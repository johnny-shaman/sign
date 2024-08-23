{
  const fs = require('fs');
  const readline = require('readline');
  const check = require('./check.js');

  // コマンドライン引数からファイル名を取得
  const filename = process.argv[2];

  if (!filename) {
    console.error('ファイル名を指定してください。');
    process.exit(1);
  }

  // 読み込みストリームと書き込みストリームを作成
  const readStream  = fs.createReadStream(filename, {});
  const commentRemoved  = fs.createWriteStream(`${filename}.remcm`);
  const preamble = fs.createWriteStream(`${filename}.pre`);
  const jsonWriter = fs.createWriteStream(`${filename}.json`);

  // readline インターフェースを作成
  (async function (rl, remcm, pre, jsonW) {
    const lift = require('./lifter.js');
    let lineNumber = 1;
    let stack = [];
    //対象とするreaderを巡回する。
    for await (const line of rl) {
      //コメントを削除
      const commentRemoved = line.replace(/^`.*`/g, '');

      //削除された行か空行でないなら
      if (commentRemoved !== '') {

        //言語仕様上、予約されている記号を再定義することは出来ないので、そのcheck。
        check(
          commentRemoved,
          (
            `Illegal Definition that "${commentRemoved}" at line ${lineNumber}.\n` +
            `"'", ",", "?", "\`", '"', "(", ")", "{", "}", "[", "]", "\t", "\\"' is reserved...\n` +
            `Please define that, 2 or more letters operator.`
          ),
          /"[,]" ?:/g,
          /"[?]" ?:/g,
          /" " ?:/g,
          /"`" ?:/g,
          /"\\" ?:/g,
          /"\\""|"\""|""" ?:/g,
          /"\(" ?:/g,
          /"\)" ?:/g,
          /"\{" ?:/g,
          /"\}" ?:/g,
          /"\[" ?:/g,
          /"\]" ?:/g,
          /"[\t]" ?:/g
        );

        const preamble = (
          
          //imporot,export付きを含み、文字列を持ち上げる。
          lift(commentRemoved, /[@#]?`[^`\r\n]*`/g)

          //文字を持ち上げる
          .map(
            o => typeof o === "string"
            ? o.replace(/\\[\s\S]/g, " $&")
            : o
          )
          .flatMap(
            o => typeof o === "string"
            ? lift(o, /\\[\s\S]/g)
            : [o]
          )
          //二項演算子のみ両側に空白を挿入
          .map(
            o => typeof o === "string"
            ? o.replace(/<=|>=|!=|,+|[:?|;&<=>+\-*\/%^]/g,' $& ')
            : o
          )

          //空白文字は演算子なので、重複をたたむ。
          .map(
            o => typeof o === "string"
            ? o.replace(/ +/g,' ') 
            : o
          )

          //各カッコの種類に対して、空白を削除
          .map(
            o => typeof o === "string"
            ? o.replace(/\[ /g,'[')
            : o
          )
          .map(
            o => typeof o === "string"
            ? o.replace(/\ \]/g,']')
            : o
          )
          .map(
            o => typeof o === "string"
            ? o.replace(/\{ /g,'{')
            : o
          )
          .map(
            o => typeof o === "string"
            ? o.replace(/ \}/g,'}')
            : o
          )
          .map(
            o => typeof o === "string"
            ? o.replace(/\( /g,'(')
            : o
          )
          .map(
            o => typeof o === "string"
            ? o.replace(/ \)/g,')')
            : o
          )
          .map(
            o => typeof o === "string"
            ? o.replace(/^ +/g,'')
            : o
          )

          //lambdaを持ち上げる
          .flatMap(
            o => typeof o === "string"
            ? lift(o, /\[[\s\S]+\]/g)
            : [o]
          )

          //imporot,export,get付きを含み、identを持ち上げる。
          .flatMap(
            o => typeof o === "string"
            ? lift(o, /[@#']?[~!]*[a-zA-Z]\w*[~!]*/g)
            : [o]
          )

          //numberを持ち上げる
          .flatMap(
            o => typeof o === "string"
            ? lift(o, /-?[0-9]+\.?[0-9]*/g)
            : [o]
          )
        );
          
        remcm.write(`${commentRemoved}\n`);
        pre.write(`${preamble.flat(Infinity).join("")}\n`);
        jsonW.write(`${JSON.stringify(preamble)}\n`);
        ++lineNumber;
      };
    }
  })(
    readline.createInterface({
      input: readStream,
      output: preamble,
      crlfDelay: Infinity
    }),
    commentRemoved,
    preamble,
    jsonWriter
  );
}
