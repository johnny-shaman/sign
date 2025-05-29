// matchcase書き換えモジュール（改良版）
// 完全なインデントブロック処理対応

Start = input:$(.*)  {
  
  // 関数ブロック全体を処理する関数
  function processMatchCaseBlock(lines, startIndex) {
    const functionLine = lines[startIndex];
    
    // 関数定義の検出
    const colonIndex = functionLine.indexOf(':');
    const questionIndex = functionLine.indexOf('?');
    
    if (colonIndex === -1 || questionIndex === -1 || questionIndex <= colonIndex) {
      return { processedLines: [functionLine], nextIndex: startIndex + 1 };
    }
    
    // 同じ行に本体がある場合は処理しない（インデントブロックでない）
    const samLineBody = functionLine.substring(questionIndex + 1).trim();
    if (samLineBody.length > 0) {
      return { processedLines: [functionLine], nextIndex: startIndex + 1 };
    }
    
    // 関数定義行はそのまま
    const result = [functionLine];
    
    // インデントブロックの収集
    const indentedLines = [];
    let currentIndex = startIndex + 1;
    
    while (currentIndex < lines.length) {
      const line = lines[currentIndex];
      
      // 空行はそのまま追加
      if (line.trim() === '') {
        indentedLines.push(line);
        currentIndex++;
        continue;
      }
      
      // インデントのチェック
      if (line.match(/^\s+/)) {
        indentedLines.push(line);
        currentIndex++;
      } else {
        // インデントされていない行なので、関数ブロック終了
        break;
      }
    }
    
    // インデントブロックをmatchcase形式に変換
    if (indentedLines.length > 0) {
      const convertedLines = convertMatchCase(indentedLines);
      result.push(...convertedLines);
    }
    
    return { processedLines: result, nextIndex: currentIndex };
  }
  
  // matchcase形式に変換する関数
  function convertMatchCase(indentedLines) {
    const converted = [];
    const conditions = [];
    let defaultValue = null;
    
    for (const line of indentedLines) {
      const trimmed = line.trim();
      
      // 空行はスキップ
      if (trimmed === '') {
        continue;
      }
      
      if (trimmed.includes(' : ')) {
        // 条件分岐行: "condition : result"
        const parts = trimmed.split(' : ');
        if (parts.length >= 2) {
          const condition = parts[0].trim();
          const result = parts.slice(1).join(' : ').trim();
          conditions.push({ condition, result });
        }
      } else {
        // デフォルト値（条件なしの行）
        defaultValue = trimmed;
      }
    }
    
    // 短絡評価チェーンに変換
    const indent = indentedLines.find(line => line.trim() !== '')?.match(/^(\s*)/)?.[1] || '\t';
    
    conditions.forEach((item, index) => {
      if (index === conditions.length - 1 && !defaultValue) {
        // 最後の条件で、デフォルト値がない場合は "|" なし
        converted.push(`${indent}${item.condition} & ${item.result}`);
      } else {
        converted.push(`${indent}${item.condition} & ${item.result} |`);
      }
    });
    
    // デフォルト値がある場合
    if (defaultValue) {
      converted.push(`${indent}${defaultValue}`);
    }
    
    return converted;
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
      const result = processMatchCaseBlock(lines, i);
      processedLines.push(...result.processedLines);
      i = result.nextIndex;
    } else {
      processedLines.push(line);
      i++;
    }
  }
  
  return processedLines.join('\n');
}