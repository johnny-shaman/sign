// Sign言語 引数書き換えモジュール（改良版）
// インデントブロック全体を処理する版

Start = input:$(.*)  {
  
  // 安全な文字列置換関数
  function safeTokenReplace(text, oldToken, newToken) {
    if (!oldToken || oldToken === newToken) return text;
    
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
  
  // 関数ブロック全体を処理する関数
  function processFunctionBlock(lines, startIndex) {
    const functionLine = lines[startIndex];
    
    // 関数定義の検出
    const colonIndex = functionLine.indexOf(':');
    const questionIndex = functionLine.indexOf('?');
    
    if (colonIndex === -1 || questionIndex === -1 || questionIndex <= colonIndex) {
      return { processedLines: [functionLine], nextIndex: startIndex + 1 };
    }
    
    // 関数名部分（export prefix を含む）
    const beforeColon = functionLine.substring(0, colonIndex).trim();
    let funcName = beforeColon;
    let exportPrefix = '';
    
    if (beforeColon.startsWith('#')) {
      exportPrefix = '#';
      funcName = beforeColon.substring(1);
    }
    
    // 引数部分
    const paramsPart = functionLine.substring(colonIndex + 1, questionIndex).trim();
    if (paramsPart.length === 0) {
      return { processedLines: [functionLine], nextIndex: startIndex + 1 };
    }
    
    // 本体部分（同じ行にある場合）
    const bodyStartIndex = questionIndex + 1;
    const samLineBody = functionLine.substring(bodyStartIndex).trim();
    
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
    
    // 関数定義行の処理
    let newSameLineBody = samLineBody;
    Object.keys(mapping).forEach(oldName => {
      const newName = mapping[oldName];
      newSameLineBody = safeTokenReplace(newSameLineBody, oldName, newName);
    });
    
    const processedFunctionLine = `${exportPrefix}${funcName} : ${newParams.join(' ')} ? ${newSameLineBody}`;
    const result = [processedFunctionLine];
    
    // インデントブロックの処理
    let currentIndex = startIndex + 1;
    while (currentIndex < lines.length) {
      const line = lines[currentIndex];
      
      // 空行はそのまま追加
      if (line.trim() === '') {
        result.push(line);
        currentIndex++;
        continue;
      }
      
      // インデントのチェック（タブまたは空白で開始）
      if (line.match(/^\s+/)) {
        // インデントされた行なので、関数ブロックの一部として処理
        let processedLine = line;
        Object.keys(mapping).forEach(oldName => {
          const newName = mapping[oldName];
          processedLine = safeTokenReplace(processedLine, oldName, newName);
        });
        result.push(processedLine);
        currentIndex++;
      } else {
        // インデントされていない行なので、関数ブロック終了
        break;
      }
    }
    
    return { processedLines: result, nextIndex: currentIndex };
  }
  
  // 行ごとに処理
  const lines = input.split('\n');
  const processedLines = [];
  let i = 0;
  
  while (i < lines.length) {
    const line = lines[i];
    
    // コメント行や空行はそのまま
    if (line.trim() === '' || line.trim().startsWith('`')) {
      processedLines.push(line);
      i++;
      continue;
    }
    
    // 関数定義かチェック
    if (line.includes(':') && line.includes('?')) {
      const result = processFunctionBlock(lines, i);
      processedLines.push(...result.processedLines);
      i = result.nextIndex;
    } else {
      processedLines.push(line);
      i++;
    }
  }
  
  return processedLines.join('\n');
}