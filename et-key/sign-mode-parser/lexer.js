// lexer.js
/**
 * Sign言語の簡易字句解析器
 * 
 * 機能:
 * - 入力テキストを単純なトークン配列に変換
 * - 基本的なトークン認識（識別子、演算子、括弧、リテラル）
 * - 空白の処理（Sign言語では演算子として機能する場合あり）
 * - コメント行（行頭のバッククォート）の処理
 * - 文字リテラル(\の後の1文字)の処理
 * 
 * CreateBy: Claude3.7Sonnet
 * ver_20250321_0
 */

/**
 * テキストを解析してトークン配列を返す
 * @param {string} text - 解析対象のテキスト
 * @returns {string[]} トークンの配列
 */
function tokenize(text) {
    const tokens = [];
    let currentPos = 0;
    const length = text.length;
    let lineStart = true;  // 行の先頭かどうかのフラグ
    
    // テキストの終端まで解析を続ける
    while (currentPos < length) {
      const currentChar = text[currentPos];
      
      // 改行の処理
      if (currentChar === '\n' || currentChar === '\r') {
        // \r\nの場合は2文字で1つの改行として扱う
        if (currentChar === '\r' && currentPos + 1 < length && text[currentPos + 1] === '\n') {
          currentPos++;
        }
        tokens.push('\n');
        currentPos++;
        lineStart = true;
        continue;
      }
      
      // 行頭のコメント処理
      if (lineStart && currentChar === '`') {
        // コメント行：次の改行または終端までスキップ
        while (currentPos < length && text[currentPos] !== '\n' && text[currentPos] !== '\r') {
          currentPos++;
        }
        continue;
      }
      
      // タブの処理
      if (currentChar === '\t') {
        tokens.push('\t');
        currentPos++;
        lineStart = false;
        continue;
      }
      
      // 空白の処理（Sign言語では演算子として機能することがある）
      if (currentChar === ' ') {
        // 空白を演算子として扱う
        tokens.push(' ');
        currentPos++;
        lineStart = false;
        continue;
      }
      
      // 識別子の解析（英数字とアンダースコア）
      if (/[a-zA-Z_]/.test(currentChar)) {
        let identifier = '';
        while (currentPos < length && /[a-zA-Z0-9_]/.test(text[currentPos])) {
          identifier += text[currentPos];
          currentPos++;
        }
        tokens.push(identifier);
        lineStart = false;
        continue;
      }
      
      // 数値の解析
      if (/[0-9]/.test(currentChar)) {
        let number = '';
        // 16進数、8進数、2進数の特殊チェック
        if (currentChar === '0' && currentPos + 1 < length) {
          const nextChar = text[currentPos + 1];
          if (nextChar === 'x' || nextChar === 'o' || nextChar === 'b') {
            number = '0' + nextChar;
            currentPos += 2;
            
            // 対応する数字を読み取る
            const digitPattern = nextChar === 'x' ? /[0-9a-fA-F]/ : 
                                 nextChar === 'o' ? /[0-7]/ : /[01]/;
            
            while (currentPos < length && digitPattern.test(text[currentPos])) {
              number += text[currentPos];
              currentPos++;
            }
            tokens.push(number);
            lineStart = false;
            continue;
          }
        }
        
        // 通常の数値（整数または浮動小数点）
        while (currentPos < length && /[0-9.]/.test(text[currentPos])) {
          number += text[currentPos];
          currentPos++;
        }
        tokens.push(number);
        lineStart = false;
        continue;
      }
      
      // 文字リテラルの解析（\の後ろの1文字）
      if (currentChar === '\\') {
        currentPos++; // バックスラッシュをスキップ
        
        // 入力の終端チェック
        if (currentPos >= length) {
          // エラー処理（簡易版では省略）
          currentPos++;
          continue;
        }
        
        // 次の文字を取得（何であれ1文字）
        const charLiteral = '\\' + text[currentPos];
        tokens.push(charLiteral);
        currentPos++;
        lineStart = false;
        continue;
      }
      
      // 文字列リテラルの解析（バッククォート囲み）
      if (currentChar === '`') {
        let string = '`';
        currentPos++; // バッククォートをスキップ
        
        // 終了のバッククォートまたは改行が見つかるまで読み取り
        while (currentPos < length && text[currentPos] !== '`' && text[currentPos] !== '\n' && text[currentPos] !== '\r') {
          string += text[currentPos];
          currentPos++;
        }
        
        // 終了のバッククォートがあれば消費
        if (currentPos < length && text[currentPos] === '`') {
          string += '`';
          currentPos++;
        }
        
        tokens.push(string);
        lineStart = false;
        continue;
      }
      
      // 演算子と括弧の処理
      const operators = [':', '?', '+', '-', '*', '/', '%', '=', '<', '>', '!', '&', '|', ';', ',', '~', "'", '^', '#', '@'];
      const brackets = ['[', ']', '{', '}', '(', ')'];
      
      // 複合演算子のチェック（<=, >=, != など）
      if (currentPos + 1 < length) {
        const twoChars = currentChar + text[currentPos + 1];
        if (['<=', '>=', '!=', '==', '<>', '><'].includes(twoChars)) {
          tokens.push(twoChars);
          currentPos += 2;
          lineStart = false;
          continue;
        }
      }
      
      // 単一演算子または括弧
      if (operators.includes(currentChar) || brackets.includes(currentChar)) {
        tokens.push(currentChar);
        currentPos++;
        lineStart = false;
        continue;
      }
      
      // 認識できない文字はスキップ
      currentPos++;
    }
    
    return tokens;
  }
  
  // モジュールのエクスポート
  module.exports = {
    tokenize
  };