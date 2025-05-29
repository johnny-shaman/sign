// Sign言語フォーマッター（単項マイナス対応版）
// `,` 演算子と単項マイナス `-` の正確な処理

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
      
      // 単項マイナスの文脈検出
      function isUnaryMinusContext() {
        if (char !== '-') return false;
        
        // 次の文字が識別子（アルファベットまたはアンダースコア）でない場合は二項演算子
        if (!/[a-zA-Z_]/.test(nextChar)) return false;
        
        // 単項マイナスの文脈パターン
        const unaryContexts = [
          // 1. 行頭または空白のみの後
          () => i === 0 || /^\s*$/.test(formatted.split('\n').pop()),
          
          // 2. 制御構造の後（?、:、|、&の直後）
          () => /[?:|&]\s*$/.test(formatted),
          
          // 3. 区切り文字の後（,、(の直後）
          () => /[,(]\s*$/.test(formatted),
          
          // 4. 演算子の後（+、*、/、%、^、=、<、>の直後）
          () => /[+*/%^=<>]\s*$/.test(formatted)
        ];
        
        return unaryContexts.some(check => check());
      }
      
      // 二項演算子のリスト（マイナスを除く）
      const binaryOps = ['+', '*', '/', '%', '^', '=', '<', '>', '&', '|', ':', '?', ','];
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
      
      // マイナス記号の特別処理
      if (char === '-') {
        if (isUnaryMinusContext()) {
          // 単項マイナス: 前に空白があれば残し、後ろには空白を入れない
          if (prevChar === ' ' || prevChar === '\t') {
            formatted += char; // 前の空白は既にformattedに含まれている
          } else {
            formatted += char;
          }
        } else {
          // 二項マイナス: 前後に空白を挿入
          const needSpaceBefore = prevChar !== ' ' && prevChar !== '' && 
                                 prevChar !== '\t' && prevChar !== '\n' &&
                                 !['(', '[', '{'].includes(prevChar);
          const needSpaceAfter = nextChar !== ' ' && nextChar !== '' && 
                                nextChar !== '\t' && nextChar !== '\n' &&
                                ![')', ']', '}'].includes(nextChar);
          
          if (needSpaceBefore) {
            formatted += ' ';
          }
          formatted += char;
          if (needSpaceAfter) {
            formatted += ' ';
          }
        }
      }
      // その他の二項演算子の処理
      else if (binaryOps.includes(char)) {
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