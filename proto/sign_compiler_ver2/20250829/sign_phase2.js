// Sign言語記法変換器（フェーズ2）- 段階的再帰処理による記法変換
// 
// 【実装範囲】
// 初期実装では主要演算子レベルのみ実装:
// - 優先順位16: 乗除演算 (*, /, %)
// - 優先順位15: 加減演算 (+, -)  
// - 優先順位14: 比較演算 (<, <=, =, >=, >, !=)
// - 優先順位12-11: 論理演算 (&, |, ;)
// - 優先順位2:  定義演算 (:)
//
// 【未実装演算子レベル】
// - 優先順位25: ブロック制御 (フェーズ1で保護済み)
// - 優先順位24-17: import(@後置), input(@前置), get(', @中置), address($), expand(~後置)
// - 優先順位13: 論理否定 (!前置)
// - 優先順位18: 階乗 (!後置)  
// - 優先順位20-19: 絶対値, expand(~後置)
// - 優先順位10-3: ラムダ(?), 積(,), 範囲(~中置), 連続(~前置), 余積( )
// - 優先順位1:  エクスポート (#前置)
//
// 【設計方針】
// - 方式A: 設計書準拠の段階的再帰処理
// - シンプルなテキスト置換による記法変換
// - 構文エラーは意味解析フェーズで検出
// - プレースホルダー復元は演算子変換後

class SignPhase2 {
    constructor(phase1Result) {
        this.source = phase1Result.converted;
        this.protectedItems = phase1Result.protectedItems;
        this.transformationSteps = 0;
        this.operatorCount = 0;

        // 主要演算子の定義（優先順位順）
        this.operators = {
            16: [
                { symbol: '*', type: 'infix' },
                { symbol: '/', type: 'infix' },
                { symbol: '%', type: 'infix' }
            ],
            15: [
                { symbol: '+', type: 'infix' },
                { symbol: '-', type: 'infix' }
            ],
            14: [
                { symbol: '<=', type: 'infix' },  // <= を = より先に処理
                { symbol: '>=', type: 'infix' },  // >= を > より先に処理  
                { symbol: '!=', type: 'infix' },  // != を = より先に処理
                { symbol: '<', type: 'infix' },
                { symbol: '>', type: 'infix' },
                { symbol: '=', type: 'infix' }
            ],
            13: [
                { symbol: '!', type: 'prefix' }   // not (論理否定)
            ],
            12: [
                { symbol: '&', type: 'infix' }    // and (論理積)
            ],
            11: [
                { symbol: '|', type: 'infix' },   // or (論理和)
                { symbol: ';', type: 'infix' }    // xor (排他的論理和)
            ],
            2: [
                { symbol: ':', type: 'infix' }
            ]
        };
    }

    /**
     * メイン変換処理
     */
    convert() {
        let result = this.source;
        let iteration = 0;
        let changed = true;

        console.log('🔄 フェーズ2開始: 記法変換');
        console.log('初期状態:');
        console.log(result);

        while (changed && iteration < 100) { // 無限ループ防止
            const oldResult = result;
            iteration++;

            console.log(`\n--- 反復 ${iteration} ---`);

            // 1. 演算子変換（優先順位 16→1）
            result = this.processAllOperators(result);

            // 2. 1段階内側を展開
            result = this.expandOnePlaceholderLevel(result);

            // 3. 変化チェック
            changed = (result !== oldResult);
            console.log(`変更あり: ${changed}`);
            if (changed) {
                console.log('現在状態:');
                console.log(result);
            }
        }

        console.log('\n✅ フェーズ2完了');
        console.log(`総反復回数: ${iteration}`);
        console.log(`変換ステップ数: ${this.transformationSteps}`);
        console.log(`演算子処理数: ${this.operatorCount}`);

        return {
            converted: result,
            iterations: iteration,
            transformationSteps: this.transformationSteps
        };
    }

    /**
     * 全演算子の優先順位処理
     */
    processAllOperators(source) {
        let result = source;

        // 低優先順位から高優先順位へ（1→16）
        const priorities = Object.keys(this.operators).sort((a, b) => a - b);

        for (const priority of priorities) {
            console.log(`  優先順位${priority}処理中...`);
            result = this.processOperatorsByPriority(result, parseInt(priority));
        }

        return result;
    }

    /**
     * 指定優先順位の演算子処理
     */
    processOperatorsByPriority(source, priority) {
        let result = source;
        const operators = this.operators[priority] || [];

        for (const { symbol, type } of operators) {
            const oldResult = result;
            result = this.transformOperator(result, { symbol, type });

            if (result !== oldResult) {
                this.transformationSteps++;
                console.log(`    ${symbol} 変換: ${this.countMatches(oldResult, result)}箇所`);
            }
        }

        return result;
    }

    /**
     * 演算子変換処理
     */
    transformOperator(source, operator) {
        const { symbol, type } = operator;

        switch (type) {
            case 'infix':
                return this.transformInfixOperator(source, symbol);
            case 'prefix':
                return this.transformPrefixOperator(source, symbol);
            case 'postfix':
                return this.transformPostfixOperator(source, symbol);
            default:
                console.warn(`未対応の演算子タイプ: ${type}`);
                return source;
        }
    }

    /**
     * 中置演算子変換: a op b → ([op] a b)
     */
    transformInfixOperator(source, symbol) {
        // エスケープが必要な記号を処理
        const escapedSymbol = symbol.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

        // 中置演算子のパターン: 識別子/数値/プレースホルダー 演算子 識別子/数値/プレースホルダー
        // 数値は既に保護済みのため、単純なパターンで処理可能
        const pattern = new RegExp(
            `(\\w+|[A-Z]+_\\d+)\\s+${escapedSymbol}\\s+(\\w+|[A-Z]+_\\d+)`,
            'g'
        );

        return source.replace(pattern, (match, left, right) => {
            this.operatorCount++;
            return `([${symbol}] ${left} ${right})`;
        });
    }

    /**
     * 前置演算子変換: op a → ([op_] a)
     */
    transformPrefixOperator(source, symbol) {
        const escapedSymbol = symbol.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

        // 前置演算子のパターン: 行頭の演算子
        const pattern = new RegExp(
            `^${escapedSymbol}(\\w+|[A-Z]+_\\d+)`,
            'gm'
        );

        return source.replace(pattern, (match, operand) => {
            this.operatorCount++;
            return `([${symbol}_] ${operand})`;
        });
    }

    /**
     * 後置演算子変換: a op → ([_op] a)
     */
    transformPostfixOperator(source, symbol) {
        const escapedSymbol = symbol.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

        // 後置演算子のパターン
        const pattern = new RegExp(
            `(\\w+|[A-Z]+_\\d+)${escapedSymbol}`,
            'g'
        );

        return source.replace(pattern, (match, operand) => {
            this.operatorCount++;
            return `([_${symbol}] ${operand})`;
        });
    }

    /**
     * 1段階プレースホルダー展開
     */
    expandOnePlaceholderLevel(source) {
        let result = source;
        let expanded = false;

        // 最も浅いネストレベルのプレースホルダーを1つ展開
        for (const item of this.protectedItems) {
            const placeholderRegex = new RegExp(`\\b${item.placeholder}\\b`);

            if (result.includes(item.placeholder)) {
                // 特殊な復元処理
                const restoredContent = this.restoreProtectedContent(item);
                result = result.replace(placeholderRegex, restoredContent);
                expanded = true;

                console.log(`  展開: ${item.placeholder} → ${item.type}`);
                break; // 1個だけ展開
            }
        }

        return result;
    }

    /**
     * 保護されたコンテンツの復元
     */
    restoreProtectedContent(item) {
        switch (item.type) {
            case 'string':
                return `\`${item.content}\``;

            case 'character':
                return `\\${item.content}`;

            case 'number':
                return item.content;

            case 'inline_block':
                // ブロックの種類に応じて復元
                const brackets = item.brackets || '()';
                const open = brackets[0];
                const close = brackets[1];
                return `${open}${item.content}${close}`;

            case 'indent_block':
                // インデントブロックをインラインブロック形式で復元
                return `{${item.content.replace(/\n\t*/g, ' ')}}`;

            case 'absolute_value':
                return `([|_|] ${item.content})`;

            default:
                console.warn(`未対応の保護タイプ: ${item.type}`);
                return item.content;
        }
    }

    /**
     * マッチ数カウント（デバッグ用）
     */
    countMatches(oldStr, newStr) {
        // 簡易的な変更箇所カウント
        const oldLines = oldStr.split('\n').length;
        const newLines = newStr.split('\n').length;
        return Math.abs(newLines - oldLines) || 1;
    }

    /**
     * デバッグ情報表示
     */
    debugPrint() {
        console.log('\n🔧 フェーズ2デバッグ情報:');
        console.log(`変換ステップ数: ${this.transformationSteps}`);
        console.log(`演算子処理数: ${this.operatorCount}`);

        console.log('\n実装済み演算子:');
        Object.entries(this.operators).forEach(([priority, ops]) => {
            console.log(`  優先順位${priority}: ${ops.map(op => op.symbol).join(', ')}`);
        });

        console.log('\n保護アイテム数:');
        const typeCounts = {};
        this.protectedItems.forEach(item => {
            typeCounts[item.type] = (typeCounts[item.type] || 0) + 1;
        });
        Object.entries(typeCounts).forEach(([type, count]) => {
            console.log(`  ${type}: ${count}個`);
        });
    }

    /**
     * 統計情報取得
     */
    getTransformationSteps() {
        return this.transformationSteps;
    }

    getOperatorCount() {
        return this.operatorCount;
    }
}

// テスト実行
if (require.main === module) {
    const SignPhase1 = require('./sign_phase1');
    const fs = require('fs');

    try {
        // フェーズ1の結果を取得
        const testCode = fs.readFileSync('testcode.sn', 'utf8');
        const phase1 = new SignPhase1();
        const phase1Result = phase1.convert(testCode);

        console.log('\n' + '='.repeat(60));
        console.log('フェーズ2テスト開始');
        console.log('='.repeat(60));

        // フェーズ2実行
        const phase2 = new SignPhase2(phase1Result);
        const phase2Result = phase2.convert();

        console.log('\n最終結果:');
        console.log('─'.repeat(40));
        console.log(phase2Result.converted);

        // デバッグ情報表示
        phase2.debugPrint();

    } catch (error) {
        console.error('❌ テストエラー:', error.message);

        // 簡単なテストケース
        const simpleTest = {
            converted: 'x : y + z * 2\nresult : a < b\n#exported : value',
            protectedItems: []
        };

        console.log('\n簡易テスト実行:');
        const phase2 = new SignPhase2(simpleTest);
        const result = phase2.convert();

        console.log('結果:', result.converted);
    }
}

module.exports = SignPhase2;