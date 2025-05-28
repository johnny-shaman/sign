// Sign言語フォーマッター（カンマ修正版）
// `,` 演算子の空白処理を確実に行う版

Start = input:$(.*)  {
  
  // 演算子と空白処理のロジック
  function formatOperators(text) {
    let result = text;
    let inString = false;
    let inComment = false;
    let formatted = '';
    
    for (let i = 0; i < result.length; i++) {
      const char = result[i];
      const prevChar = i > 0 ? result[i-1] : '';
      const nextChar = i < result.length - 1 ? result[i+1] : '';
      
      // 文字列・コメントの状態管理
      if (char === '`' && prevChar !== '\\') {
        if (!inComment) {
          inString = !inString;
        }
        if (!inString) {
          inComment = !inComment;
        }
        formatted += char;
        continue;
      }
      
      // 文字列・コメント内はそのまま
      if (inString || inComment) {
        formatted += char;
        continue;
      }
      
      // 二項演算子のリスト（カンマを含む）
      const binaryOps = ['+', '-', '*', '/', '%', '^', '=', '<', '>', '&', '|', ':', '?', ','];
      const compoundOps = ['<=', '>=', '!='];
      
      // 複合演算子のチェック
      const twoCharOp = char + nextChar;
      if (compoundOps.includes(twoCharOp)) {
        // 複合演算子の前後に空白を挿入
        if (prevChar !== ' ' && i > 0) {
          formatted += ' ';
        }
        formatted += twoCharOp;
        if (nextChar !== ' ' && i < result.length - 2) {
          formatted += ' ';
        }
        i++; // 次の文字をスキップ
        continue;
      }
      
      // 単項演算子のチェック（カンマを特に重視）
      if (binaryOps.includes(char)) {
        // 前後に空白がない場合は挿入
        const needSpaceBefore = prevChar !== ' ' && prevChar !== '' && 
                               prevChar !== '\t' && prevChar !== '\n' &&
                               !['(', '[', '{'].includes(prevChar);
        const needSpaceAfter = nextChar !== ' ' && nextChar !== '' && 
                              nextChar !== '\t' && nextChar !== '\n' &&
                              ![')', ']', '}'].includes(nextChar);
        
        // カンマの場合は特に確実に空白を挿入
        if (char === ',') {
          if (needSpaceBefore && prevChar) {
            formatted += ' ';
          }
          formatted += char;
          if (needSpaceAfter && nextChar) {
            formatted += ' ';
          }
        } else {
          if (needSpaceBefore) {
            formatted += ' ';
          }
          formatted += char;
          if (needSpaceAfter) {
            formatted += ' ';
          }
        }
      } else {
        formatted += char;
      }
    }
    
    return formatted;
  }
  
  // 行ごとに処理してフォーマット
  const lines = input.split('\n');
  const formattedLines = lines.map(line => {
    // 空行やコメント行はそのまま
    if (line.trim() === '' || line.trim().startsWith('`')) {
      return line;
    }
    
    // インデントを保持しながらフォーマット
    const indent = line.match(/^(\s*)/)[1];
    const content = line.substring(indent.length);
    const formattedContent = formatOperators(content);
    
    return indent + formattedContent;
  });
  
  return formattedLines.join('\n');
}