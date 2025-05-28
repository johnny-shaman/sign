// matchcase書き換えモジュール（最小限版）
// PEG.js エラー回避のための超シンプル実装

Start = input:$(.*)  {
  // 正規表現で条件分岐構文を検索・置換
  return input.replace(
    /([a-zA-Z_][a-zA-Z0-9_]*)\s*:\s*([^?]+?)\s*\?\s*\n((?:\t[^\n]+\n)*)/g,
    function(match, funcName, params, body) {
      // 条件分岐の各行を処理
      const lines = body.split('\n').filter(line => line.trim().length > 0);
      const converted = [];
      
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i].replace(/^\t+/, ''); // インデント削除
        
        if (line.includes(' : ')) {
          // 条件分岐行: "condition : result" → "condition & result |"
          const parts = line.split(' : ');
          if (parts.length === 2) {
            const condition = parts[0].trim();
            const result = parts[1].trim();
            
            if (i === lines.length - 1) {
              // 最後の行は | なし
              converted.push(`\t${condition} & ${result}`);
            } else {
              converted.push(`\t${condition} & ${result} |`);
            }
          } else {
            converted.push(`\t${line}`);
          }
        } else {
          // デフォルト値（条件なし）
          converted.push(`\t${line}`);
        }
      }
      
      return `${funcName} : ${params.trim()} ?\n${converted.join('\n')}\n`;
    }
  );
}