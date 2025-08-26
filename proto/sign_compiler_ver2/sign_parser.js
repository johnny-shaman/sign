// Sign言語構文解析器 - 設計仕様完全準拠版（重複解消済み）
// Parse_Strategy_ja-jp.md に基づく段階的テキスト置換

class SignParser {
  constructor() {
    this.protectedTokens = {
      inline: [],
      block: [],
      string: [],
      char: []
    };
    
    this.operatorPriority = {
      1: [{ symbol: '#', type: 'prefix' }],
      2: [{ symbol: ':', type: 'infix_right' }],
      3: [{ symbol: '#', type: 'infix_right' }],
      7: [{ symbol: '?', type: 'infix_right' }],
      8: [{ symbol: ',', type: 'infix_right' }],
      9: [{ symbol: '~', type: 'infix' }],
      10: [{ symbol: '~', type: 'prefix' }],
      11: [
        { symbol: ';', type: 'infix' },
        { symbol: '|', type: 'infix' }
      ],
      12: [{ symbol: '&', type: 'infix' }],
      13: [{ symbol: '!', type: 'prefix' }],
      14: [
        { symbol: '<=', type: 'infix' },
        { symbol: '>=', type: 'infix' },
        { symbol: '!=', type: 'infix' },
        { symbol: '<', type: 'infix' },
        { symbol: '>', type: 'infix' },
        { symbol: '=', type: 'infix' }
      ],
      15: [
        { symbol: '+', type: 'infix' },
        { symbol: '-', type: 'infix' }
      ],
      16: [
        { symbol: '*', type: 'infix' },
        { symbol: '/', type: 'infix' },
        { symbol: '%', type: 'infix' }
      ],
      17: [{ symbol: '^', type: 'infix_right' }],
      18: [{ symbol: '!', type: 'postfix' }],
      20: [{ symbol: '~', type: 'postfix' }],
      21: [{ symbol: '$', type: 'prefix' }],
      22: [
        { symbol: "'", type: 'infix' },
        { symbol: '@', type: 'infix_right' }
      ],
      23: [{ symbol: '@', type: 'prefix' }],
      24: [{ symbol: '@', type: 'postfix' }]
    };
  }

  parse(input) {
    console.log('=== Sign言語構文解析開始 ===');
    console.log('入力:', input);
    
    let text = input.trim();
    let step = 0;
    
    console.log('\n--- Step 1: トークン保護 ---');
    text = this.protectTokens(text);
    console.log('保護後:', text);

    console.log('\n--- Step 1.5: 囲み記法処理 ---');
    text = this.processEnclosures(text);
    console.log('囲み処理後:', text);

    console.log('\n--- Step 2: 段階的変換 ---');
    let previousText;
    do {
      previousText = text;
      step++;
      console.log('\n変換ステップ ' + step + ':');
      
      // 同一優先順位内での完全処理
      for (let priority = 24; priority >= 1; priority--) {
        let priorityChanged = true;
        while (priorityChanged) {
          const newText = this.transformByPriority(text, priority);
          priorityChanged = (newText !== text);
          if (priorityChanged) {
            console.log('  優先順位' + priority + ': ' + text + ' → ' + newText);
            text = newText;
          }
        }
      }
      
    } while (text !== previousText && step < 20);
    
    console.log('\n--- Step 3: トークン復元 ---');
    // 段階的復元：保護されたトークンも再帰処理
    text = this.restoreTokensRecursively(text);
    console.log('最終結果:', text);
    
    return text;
  }

  protectTokens(text) {
    text = this.protectStrings(text);
    text = this.protectChars(text);
    text = this.protectAbsoluteValues(text);
    text = this.protectInlineBlocks(text);
    return text;
  }

  protectStrings(text) {
    const regex = /`([^`\n\r]*)`/g;
    return text.replace(regex, (match, content) => {
      const index = this.protectedTokens.string.length;
      this.protectedTokens.string.push(content);
      console.log('文字列保護: "' + match + '" -> __string_' + index + '__ (内容: "' + content + '")');
      return '__string_' + index + '__';
    });
  }

  protectAbsoluteValues(text) {
    let result = text;
    const regex = /\|([^|]+)\|/g;
    return result.replace(regex, (match, content) => {
      if (this.isAbsoluteValueContext(match, result)) {
        const index = this.protectedTokens.inline.length;
        this.protectedTokens.inline.push('|_| ' + content.trim());
        console.log('絶対値保護: "' + match + '" -> __inline_' + index + '__');
        return '__inline_' + index + '__';
      }
      return match;
    });
  }

  isAbsoluteValueContext(match, text) {
    const index = text.indexOf(match);
    if (index === -1) return false;
    
    // OR演算子の文脈（前後に空白）でないかチェック
    const before = index > 0 ? text[index - 1] : '';
    const after = index + match.length < text.length ? text[index + match.length] : '';
    
    // 前後に空白がある場合はOR演算子の可能性が高い
    const hasSpaceBefore = /\s/.test(before);
    const hasSpaceAfter = /\s/.test(after);
    
    if (hasSpaceBefore && hasSpaceAfter) {
      // ただし、明らかに式が囲まれている場合は絶対値
      const content = match.slice(1, -1).trim();
      return content.includes('+') || content.includes('-') || content.includes('*') || content.includes('/');
    }
    
    return true; // デフォルトは絶対値として扱う
  }

  protectChars(text) {
    const regex = /\\(.)/g;
    return text.replace(regex, (match, char) => {
      const index = this.protectedTokens.char.length;
      this.protectedTokens.char.push(char);
      console.log('文字保護: "' + match + '" -> __char_' + index + '__ (内容: "' + char + '")');
      return '__char_' + index + '__';
    });
  }

  protectInlineBlocks(text) {
    const brackets = [
      { open: '[', close: ']' },
      { open: '{', close: '}' },
      { open: '(', close: ')' }
    ];
    
    for (const bracket of brackets) {
      text = this.protectBracketPairs(text, bracket.open, bracket.close);
    }
    
    return text;
  }

  protectBracketPairs(text, openBracket, closeBracket) {
    let result = text;
    let changed;
    let iteration = 0;
    
    do {
      changed = false;
      iteration++;
      console.log('カッコ保護 ' + openBracket + closeBracket + ' - 反復 ' + iteration + ': ' + result);
      
      const escapedOpen = this.escapeRegex(openBracket);
      const escapedClose = this.escapeRegex(closeBracket);
      const regex = new RegExp(escapedOpen + '([^' + escapedOpen + escapedClose + ']*)' + escapedClose, 'g');
      
      result = result.replace(regex, (match, content) => {
        const index = this.protectedTokens.inline.length;
        this.protectedTokens.inline.push(content.trim());
        console.log('インライン保護: "' + match + '" -> __inline_' + index + '__ (内容: "' + content.trim() + '")');
        changed = true;
        return '__inline_' + index + '__';
      });
      
      if (iteration > 5) break;
    } while (changed);
    
    return result;
  }

  processEnclosures(text) {
    // 保護された絶対値を処理
    return text.replace(/__inline_(\d+)__/g, (match, index) => {
      const content = this.protectedTokens.inline[parseInt(index)];
      if (content && content.startsWith('|_| ')) {
        const innerExpr = content.substring(4); // '|_| 'を除去
        return '([|_|] ' + innerExpr + ')';
      }
      return match;
    });
  }

  transformByPriority(text, priority) {
    if (!this.operatorPriority[priority]) {
      return text;
    }
    
    if (this.isFullyTransformed(text)) {
      return text;
    }
    
    for (const operator of this.operatorPriority[priority]) {
      const newText = this.transformOperator(text, operator);
      if (newText !== text) {
        // 無限ループ防止：同じ変換を繰り返さない
        if (this.isInfiniteLoop(text, newText, operator)) {
          continue;
        }
        return newText;
      }
    }
    
    return text;
  }
  
  isInfiniteLoop(oldText, newText, operator) {
    // 前置演算子で同じパターンが既に変換済みかチェック
    if (operator.type === 'prefix') {
      return newText.includes('[' + operator.symbol + '_]') && 
             oldText.includes('[' + operator.symbol + '_]');
    }
    // 後置演算子の無限ループもチェック
    if (operator.type === 'postfix') {
      return newText.includes('[_' + operator.symbol + ']') && 
             oldText.includes('[_' + operator.symbol + ']');
    }
    return false;
  }
  
  isFullyTransformed(text) {
    // より厳密な変換完了判定
    const trimmed = text.trim();
    
    // 保護トークンのみの場合は完了
    if (/^__\w+_\d+__$/.test(trimmed)) {
      return true;
    }
    
    // 完全に変換された式の形式チェック
    if (trimmed.startsWith('([') && trimmed.endsWith(')')) {
      // 複数式の検出
      if (this.hasMultipleExpressions(trimmed)) {
        return false;
      }
      // 未処理演算子の検出
      return !this.hasUnprocessedOperators(trimmed);
    }
    
    // 単純なリテラルや識別子は完了
    if (/^[A-Za-z_][A-Za-z0-9_]*$/.test(trimmed) || 
        /^-?\d+(\.\d+)?$/.test(trimmed) ||
        /^0[xob][A-Fa-f0-9]+$/.test(trimmed)) {
      return true;
    }
    
    return false;
  }

  hasMultipleExpressions(text) {
    let depth = 0;
    let inBracket = false;
    
    for (let i = 0; i < text.length; i++) {
      const char = text[i];
      if (char === '(' && !inBracket) depth++;
      if (char === ')' && !inBracket) depth--;
      if (char === '[') inBracket = true;
      if (char === ']') inBracket = false;
      
      if (depth === 0 && i < text.length - 1) {
        const remaining = text.substring(i + 1).trim();
        if (remaining.length > 0) {
          console.log('      複数式検出: "' + remaining + '"');
          return true;
        }
      }
    }
    return false;
  }

  hasUnprocessedOperators(text) {
    // より包括的な未処理演算子検出
    const operatorPatterns = [
      ' \\+ ', ' - ', ' \\* ', ' / ', ' % ', ' \\^ ',
      ' = ', ' < ', ' > ', ' <= ', ' >= ', ' != ',
      ' & ', ' \\| ', ' ; ', ' : ', ' \\? ',
      ' \\\' ', ' @ ', '\\$', '!', '~'
    ];
    
    for (const pattern of operatorPatterns) {
      const regex = new RegExp(pattern);
      if (regex.test(text)) {
        // 既に変換済みでないかチェック
        const symbol = pattern.replace(/[\s\\]/g, '');
        if (!text.includes('[' + symbol + ']') && 
            !text.includes('[' + symbol + '_]') && 
            !text.includes('[_' + symbol + ']')) {
          console.log('      未処理演算子発見: ' + symbol + ' in "' + text + '"');
          return true;
        }
      }
    }
    return false;
  }

  transformOperator(text, operator) {
    if (text.startsWith('([') && text.endsWith(')')) {
      return text;
    }
    
    switch (operator.type) {
      case 'infix':
        return this.transformInfixOperator(text, operator);
      case 'infix_right':
        return this.transformInfixRightOperator(text, operator);
      case 'prefix':
        return this.transformPrefixOperator(text, operator);
      case 'postfix':
        return this.transformPostfixOperator(text, operator);
      default:
        return text;
    }
  }

  transformInfixOperator(text, operator) {
    const symbol = this.escapeRegex(operator.symbol);
    const operandPattern = '([\\w\\d_]+(?:\\.[\\d]+)?|__\\w+_\\d+__|\\([^()]*\\)|\\([^()]*\\([^()]*\\)[^()]*\\))';
    const pattern = operandPattern + '\\s+' + symbol + '\\s+' + operandPattern;
    const regex = new RegExp(pattern);
    
    const match = text.match(regex);
    if (match) {
      const fullMatch = match[0];
      const left = match[1];
      const right = match[2];
      const replacement = '([' + operator.symbol + '] ' + left + ' ' + right + ')';
      
      console.log('    中置変換: "' + fullMatch + '" → "' + replacement + '"');
      return text.replace(fullMatch, replacement);
    }
    
    return text;
  }

  transformInfixRightOperator(text, operator) {
    if (operator.symbol === '?') {
      return this.transformLambdaOperator(text);
    }
    
    const symbol = this.escapeRegex(operator.symbol);
    const operandPattern = '([\\w\\d_]+(?:\\.[\\d]+)?|__\\w+_\\d+__|\\([^()]*\\)|\\([^()]*\\([^()]*\\)[^()]*\\))';
    const pattern = operandPattern + '\\s+' + symbol + '\\s+' + operandPattern;
    const regex = new RegExp(pattern);
    
    const match = text.match(regex);
    if (match) {
      const fullMatch = match[0];
      const left = match[1];
      const right = match[2];
      const replacement = '([' + operator.symbol + '] ' + left + ' ' + right + ')';
      
      console.log('    右結合変換: "' + fullMatch + '" → "' + replacement + '"');
      return text.replace(fullMatch, replacement);
    }
    
    return text;
  }

  transformLambdaOperator(text) {
    if (text.includes(' : ') && text.includes(' ? ')) {
      const colonIndex = text.lastIndexOf(' : ');
      const questionIndex = text.lastIndexOf(' ? ');
      
      if (colonIndex < questionIndex) {
        const beforeQuestion = text.substring(0, questionIndex).trim();
        const body = text.substring(questionIndex + 3).trim();
        
        const definitionPart = beforeQuestion.substring(colonIndex + 3).trim();
        if (definitionPart) {
          const wrappedParams = this.wrapMultipleTokens(definitionPart);
          const beforeColon = text.substring(0, colonIndex).trim();
          const replacement = beforeColon + ' : ([?] ' + wrappedParams + ' ' + body + ')';
          
          console.log('    ラムダ変換(定義内): "' + text + '" → "' + replacement + '"');
          return replacement;
        }
      }
    } else if (text.includes(' ? ')) {
      const questionIndex = text.indexOf(' ? ');
      const params = text.substring(0, questionIndex).trim();
      const body = text.substring(questionIndex + 3).trim();
      
      if (params && body) {
        const wrappedParams = this.wrapMultipleTokens(params);
        const replacement = '([?] ' + wrappedParams + ' ' + body + ')';
        
        console.log('    ラムダ変換(単純): "' + text + '" → "' + replacement + '"');
        return replacement;
      }
    }
    
    return text;
  }

  transformPrefixOperator(text, operator) {
    const symbol = this.escapeRegex(operator.symbol);
    const operandPattern = '([\\w\\d_]+|__\\w+_\\d+__)';
    const regex = new RegExp(symbol + operandPattern);
    
    const match = text.match(regex);
    if (match) {
      const fullMatch = match[0];
      const operand = match[1];
      const replacement = '([' + operator.symbol + '_] ' + operand + ')';
      
      console.log('    前置変換: "' + fullMatch + '" → "' + replacement + '"');
      return text.replace(fullMatch, replacement);
    }
    
    return text;
  }

  transformPostfixOperator(text, operator) {
    const symbol = this.escapeRegex(operator.symbol);
    
    if (operator.symbol === '!' && text.includes('[!_]')) {
      const operandPattern = '([\\w\\d_]+|__\\w+_\\d+__)';
      const regex = new RegExp(operandPattern + symbol + '(?!_])');
      
      const match = text.match(regex);
      if (match) {
        const fullMatch = match[0];
        const operand = match[1];
        const replacement = '([_' + operator.symbol + '] ' + operand + ')';
        
        console.log('    後置変換: "' + fullMatch + '" → "' + replacement + '"');
        return text.replace(fullMatch, replacement);
      }
    } else {
      const operandPattern = '([\\w\\d_]+|__\\w+_\\d+__)';
      const regex = new RegExp(operandPattern + symbol);
      
      const match = text.match(regex);
      if (match) {
        const fullMatch = match[0];
        const operand = match[1];
        const replacement = '([_' + operator.symbol + '] ' + operand + ')';
        
        console.log('    後置変換: "' + fullMatch + '" → "' + replacement + '"');
        return text.replace(fullMatch, replacement);
      }
    }
    
    return text;
  }

  wrapMultipleTokens(tokens) {
    const trimmed = tokens.trim();
    
    if (trimmed.startsWith('([') || 
        trimmed.match(/^__\w+_\d+__$/) || 
        !trimmed.includes(' ')) {
      return trimmed;
    }
    
    return '[' + trimmed + ']';
  }

  escapeRegex(str) {
    return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }

  restoreTokensRecursively(text) {
    return this.restoreTokens(text, true);
  }
  
  restoreTokens(text, recursive = false) {
    // 絶対値処理済みのトークンは復元しない（既に処理済み）
    let restored = text.replace(/__inline_(\d+)__/g, (match, index) => {
      const content = this.protectedTokens.inline[parseInt(index)];
      if (content && content.startsWith('|_| ')) {
        return match; // 絶対値は既に処理済みなので復元しない
      }
      if (content !== undefined) {
        if (recursive) {
          // 保護されたトークンも再帰的に構文解析
          const parsedContent = this.parseProtectedContent(content);
          return '[' + parsedContent + ']';
        } else {
          return '[' + content + ']';
        }
      }
      return match;
    });
    
    restored = restored.replace(/__string_(\d+)__/g, (match, index) => {
      const content = this.protectedTokens.string[parseInt(index)];
      return content !== undefined ? '`' + content + '`' : match;
    });
    
    restored = restored.replace(/__char_(\d+)__/g, (match, index) => {
      const content = this.protectedTokens.char[parseInt(index)];
      return content !== undefined ? '\\' + content : match;
    });
    
    return restored;
  }
  
  parseProtectedContent(content) {
    // 保護されたトークンの内部を段階的に解析
    let step = 0;
    let text = content;
    let previousText;
    
    do {
      previousText = text;
      for (let priority = 24; priority >= 1; priority--) {
        let priorityChanged = true;
        while (priorityChanged) {
          const newText = this.transformByPriority(text, priority);
          priorityChanged = (newText !== text);
          text = newText;
        }
      }
      step++;
    } while (text !== previousText && step < 10);
    
    return text;
  }
}

function runTests() {
  const parser = new SignParser();
  
  console.log('🧪 Sign言語構文解析器テスト（重複解消済み）\n');
  
/*
  const testCases = [
    'x : 42',
    'hello : `Hello World`',
    '2 + 3',
    '2 + 3 * 4',
    '1 + 2 * 3 + 4',
    'x & y',
    'a = b',
    '!x',
    '5!',
    '[+ 1]',
    'f : x ? x + 1',
    'add : x y ? x + y'
  ];


  const testCases = [
  // === 基本定義（優先順位2） ===
  'pi : 3.14159',                // 浮動小数点の定義
  // === エクスポート（優先順位1） ===
  '#x : 42',                     // エクスポート定義
  '#pi : 3.14',                  // エクスポートされた定数
];
*/
const testCases = [
  // === 基本リテラル ===
  '42',                          // 整数
  '-42',                         // 負の整数
  '3.14',                        // 浮動小数点
  '-3.14',                       // 負の浮動小数点
  '0xFF00',                      // 16進数
  '0o777',                       // 8進数
  '0b1010',                      // 2進数
  '`hello`',                     // 文字列
  '`hello world`',               // スペースを含む文字列
  '\\n',                         // 文字リテラル
  '_',                           // Unit

  // === 基本定義（優先順位2） ===
  'x : 42',                      // 基本定義
  'name : `Alice`',              // 文字列の定義
  'pi : 3.14159',                // 浮動小数点の定義
  
  // === エクスポート（優先順位1） ===
  '#x : 42',                     // エクスポート定義
  '#pi : 3.14',                  // エクスポートされた定数

  // === 出力（優先順位3） ===
  '0x1000 # data',               // 出力演算
  'port # value',                // 出力演算

  // === ラムダ構築（優先順位7） ===
  'x ? x + 1',                   // 単一引数ラムダ
  'x y ? x + y',                 // 複数引数ラムダ
  'f : x ? x * 2',               // ラムダの定義
  'add : x y ? x + y',           // 複数引数ラムダの定義

  // === 積演算（優先順位8） ===
  'a , b',                       // 積演算
  '1 , 2 , 3',                   // 複数の積
  '[1, 2, 3]',                   // リスト内の積

  // === 範囲構築（優先順位9） ===
  '1 ~ 10',                      // 範囲
  'a ~ z',                       // 文字範囲

  // === 連続リスト構築（優先順位10） ===
  '~x',                          // 連続リスト前置

  // === 論理演算（優先順位11-13） ===
  'a ; b',                       // XOR
  'a | b',                       // OR
  'a & b',                       // AND
  '!x',                          // NOT
  'a & b | c',                   // 複合論理演算

  // === 比較演算（優先順位14） ===
  'a < b',                       // 未満
  'a <= b',                      // 以下
  'a = b',                       // 等価
  'a >= b',                      // 以上
  'a > b',                       // より大きい
  'a != b',                      // 非等価
  '1 < x < 10',                  // 比較チェーン
  '0 <= x <= 100',               // 範囲チェック

  // === 算術演算（優先順位15-17） ===
  'a + b',                       // 加算
  'a - b',                       // 減算
  'a * b',                       // 乗算
  'a / b',                       // 除算
  'a % b',                       // 剰余
  'a ^ b',                       // 冪乗
  '2 + 3 * 4',                   // 優先順位テスト
  '2 * 3 + 4',                   // 優先順位テスト
  '1 + 2 * 3 + 4',               // 複合算術演算
  '2 ^ 3 ^ 4',                   // 右結合テスト
  
  // === 階乗（優先順位18） ===
  '5!',                          // 階乗
  'n!',                          // 変数の階乗

  // === 絶対値（優先順位19） ===
  '|x|',                         // 絶対値
  '|x + y|',                     // 式の絶対値

  // === 展開（優先順位20） ===
  'list~',                       // 展開後置

  // === アドレス取得（優先順位21） ===
  '$x',                          // アドレス取得

  // === get演算（優先順位22） ===
  "obj ' key",                   // get演算
  'key @ obj',                   // get演算（右結合）

  // === input演算（優先順位23） ===
  '@0x8000',                     // 入力演算

  // === import演算（優先順位24） ===
  'lib@',                        // インポート

  // === ブロック構築 ===
  '[x + 1]',                     // 角括弧ブロック
  '{x + 1}',                     // 波括弧ブロック
  '(x + 1)',                     // 丸括弧ブロック

  // === 複合構造 ===
  '[+ 1]',                       // 部分適用
  '[* 2,]',                      // マップ演算子
  '[+]',                         // フォールド演算子
  'f : [x ? x * 2]',             // 関数リテラルの定義
  
  // === 複雑な構造 ===
  'map : f x ~y ? @f x , map f y~',  // 再帰関数定義
  'result : process validate input',  // 関数合成
  '#output : transform process input', // エクスポートされた処理
  
  // === エラーケース・エッジケース ===
  'f : x y z ? x * y + z',       // 3引数ラムダ
  'nested : [x ? [y ? x + y]]',  // ネストしたラムダ
  'chain : a + b * c - d / e',   // 長い算術チェーン
  'logic : !a & b | c ; d',      // 論理演算チェーン
  'compare : 1 <= x = y < 100',  // 複雑な比較チェーン
  
  // === 実用的なパターン ===
  'increment : [+ 1]',           // インクリメント関数
  'double : [* 2]',              // 倍数関数
  'isPositive : [> 0]',          // 述語関数
  'compose : f g x ? f (g x)',   // 関数合成
  'factorial : n ? n = 0 : 1 | n * factorial (n - 1)', // 条件付きラムダ（ブロック構文なし版）
  
  // === Sign言語特有の構造 ===
  'data : name : `John` age : 30',                    // 辞書型構造
  'process : input | validate | transform | output', // パイプライン
  'config : debug : true port : 8080',               // 設定オブジェクト
  
  // === 数値リテラル特殊形式 ===
  'addr : 0x8000',               // アドレス型16進数
  'mask : 0b11110000',           // ビット操作用2進数
  'perm : 0o755',                // パーミッション8進数
  
  // === 文字・文字列操作 ===
  'space : \\ ',                 // スペース文字
  'newline : \\n',               // 改行文字
  'greeting : `Hello` \\ ` ` \\ `World`', // 文字列連結
  
  // === 高階関数パターン ===
  'curry : f x y ? f (x, y)',    // カリー化
  'partial : f a ? x ? f a x',   // 部分適用
  'flip : f x y ? f y x',        // 引数順序反転
  
  // === メモリ・IO操作 ===
  'read : @$buffer',             // メモリ読み取り
  'write : $buffer # data',      // メモリ書き込み
  'stream : @0xFF00',            // ハードウェア入力
  'output : 0xFF01 # result',    // ハードウェア出力
];


  testCases.forEach((testCase, index) => {
    console.log('\n' + '='.repeat(60));
    console.log('テストケース ' + (index + 1) + ': ' + testCase);
    console.log('='.repeat(60));
    
    try {
      const result = parser.parse(testCase);
      console.log('✅ テストケース: ' + testCase);
      console.log('✅ 最終結果: ' + result);
    } catch (error) {
      console.log('❌ エラー: ' + error.message);
    }
    
    parser.protectedTokens = {
      inline: [],
      block: [],
      string: [],
      char: []
    };
  });
}

runTests();