// Sign言語 引数書き換えモジュール（超安全版）
// 正規表現を最小限に抑えた実装

Start = input:$(.*)  {
  
  // 文字列を安全にトークン化して置換する関数
  function safeTokenReplace(text, oldToken, newToken) {
    const tokens = [];
    let current = '';
    let inString = false;
    let inComment = false;
    
    for (let i = 0; i < text.length; i++) {
      const char = text[i];
      const prevChar = i > 0 ? text[i-1] : '';
      
      // 文字列・コメントの判定
      if (char === '`' && prevChar !== '\\') {
        if (!inComment) {
          inString = !inString;
        }
        if (!inString) {
          inComment = !inComment;
        }
      }
      
      // 区切り文字の判定（文字列・コメント内でない場合）
      if (!inString && !inComment && /[\s+\-*\/=<>&|:?()[\]{}.,~!@#$%^]/.test(char)) {
        if (current.length > 0) {
          tokens.push(current);
          current = '';
        }
        tokens.push(char);
      } else {
        current += char;
      }
    }
    
    if (current.length > 0) {
      tokens.push(current);
    }
    
    // トークンを置換
    const replacedTokens = tokens.map(token => {
      return (!inString && !inComment && token === oldToken) ? newToken : token;
    });
    
    return replacedTokens.join('');
  }
  
  // 行ごとに処理
  const lines = input.split('\n');
  const processedLines = lines.map(line => {
    
    // 関数定義の検出（シンプルなパターンマッチング）
    const colonIndex = line.indexOf(':');
    const questionIndex = line.indexOf('?');
    
    if (colonIndex === -1 || questionIndex === -1 || questionIndex <= colonIndex) {
      return line; // 関数定義でない行はそのまま
    }
    
    // 関数名部分（export prefix を含む）
    const beforeColon = line.substring(0, colonIndex).trim();
    let funcName = beforeColon;
    let exportPrefix = '';
    
    if (beforeColon.startsWith('#')) {
      exportPrefix = '#';
      funcName = beforeColon.substring(1);
    }
    
    // 引数部分
    const paramsPart = line.substring(colonIndex + 1, questionIndex).trim();
    if (paramsPart.length === 0) {
      return line; // 引数がない場合はそのまま
    }
    
    // 本体部分
    const bodyStartIndex = questionIndex + 1;
    const bodyPart = line.substring(bodyStartIndex);
    
    // パラメータを解析
    const paramList = paramsPart.split(/\s+/).filter(p => p.length > 0);
    
    // 引数マッピングを作成
    const mapping = {};
    const newParams = [];
    
    paramList.forEach((param, index) => {
      const isContinuous = param.startsWith('~');
      const paramName = isContinuous ? param.slice(1) : param;
      const newParamName = '_' + index;
      
      mapping[paramName] = newParamName;
      newParams.push(isContinuous ? '~' + newParamName : newParamName);
    });
    
    // 本体内の引数名を安全に置換
    let newBody = bodyPart;
    Object.keys(mapping).forEach(oldName => {
      const newName = mapping[oldName];
      newBody = safeTokenReplace(newBody, oldName, newName);
    });
    
    return `${exportPrefix}${funcName} : ${newParams.join(' ')} ? ${newBody}`;
  });
  
  return processedLines.join('\n');
}