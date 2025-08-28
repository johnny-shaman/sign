// Sign言語コンパイラ - 統合実行環境
// フェーズ1→フェーズ2の連携実行とデバッグ出力

const fs = require('fs');
const SignPhase1 = require('./sign_phase1');
const SignPhase2 = require('./sign_phase2');

class SignCompiler {
    constructor() {
        this.verbose = true;  // 詳細ログ出力の制御
        this.results = {};    // 各フェーズの結果保存
    }

    /**
     * メイン実行処理
     */
    async compile(sourceFile) {
        try {
            console.log('🚀 Sign言語コンパイラ開始');
            console.log(`📁 入力ファイル: ${sourceFile}`);
            console.log('=' .repeat(60));

            // ソースコード読み込み
            const sourceCode = this.loadSource(sourceFile);
            
            // フェーズ1: トークン保護
            console.log('\n📦 フェーズ1: トークン保護開始');
            const phase1Result = this.executePhase1(sourceCode);
            
            // フェーズ2: 記法変換
            console.log('\n🔄 フェーズ2: 記法変換開始');
            const phase2Result = this.executePhase2(phase1Result);
            
            // 最終結果表示
            this.displayFinalResults();
            
            return {
                phase1: phase1Result,
                phase2: phase2Result
            };

        } catch (error) {
            console.error('❌ コンパイルエラー:', error.message);
            console.error('スタックトレース:', error.stack);
        }
    }

    /**
     * ソースコード読み込み
     */
    loadSource(sourceFile) {
        if (!fs.existsSync(sourceFile)) {
            throw new Error(`ソースファイルが見つかりません: ${sourceFile}`);
        }
        
        const sourceCode = fs.readFileSync(sourceFile, 'utf8');
        
        if (this.verbose) {
            console.log('📄 元のソースコード:');
            console.log('─'.repeat(40));
            console.log(sourceCode.substring(0, 200) + (sourceCode.length > 200 ? '...' : ''));
            console.log(`📊 全体サイズ: ${sourceCode.length}文字`);
        }
        
        return sourceCode;
    }

    /**
     * フェーズ1実行
     */
    executePhase1(sourceCode) {
        const converter1 = new SignPhase1();
        const result = converter1.convert(sourceCode);
        
        // 結果保存
        this.results.phase1 = {
            converter: converter1,
            result: result,
            stats: {
                protectedItems: result.protectedItems.length,
                stringCount: result.protectedItems.filter(item => item.type === 'string').length,
                charCount: result.protectedItems.filter(item => item.type === 'character').length,
                inlineCount: result.protectedItems.filter(item => item.type === 'inline_block').length,
                blockCount: result.protectedItems.filter(item => item.type === 'indent_block').length
            }
        };
        
        if (this.verbose) {
            console.log('✅ フェーズ1完了');
            console.log('📊 保護統計:');
            console.log(`   文字列: ${this.results.phase1.stats.stringCount}個`);
            console.log(`   文字: ${this.results.phase1.stats.charCount}個`);
            console.log(`   インライン: ${this.results.phase1.stats.inlineCount}個`);
            console.log(`   ブロック: ${this.results.phase1.stats.blockCount}個`);
            console.log(`   合計: ${this.results.phase1.stats.protectedItems}個`);
            
            console.log('\n🔍 保護後のコード:');
            console.log('─'.repeat(40));
            console.log(result.converted);
        }
        
        return result;
    }

    /**
     * フェーズ2実行
     */
    executePhase2(phase1Result) {
        const converter2 = new SignPhase2(phase1Result);
        const result = converter2.convert();
        
        // 結果保存
        this.results.phase2 = {
            converter: converter2,
            result: result,
            stats: {
                transformationSteps: converter2.getTransformationSteps?.() || 0,
                operatorCount: converter2.getOperatorCount?.() || 0
            }
        };
        
        if (this.verbose) {
            console.log('✅ フェーズ2完了');
            console.log('📊 変換統計:');
            console.log(`   変換ステップ数: ${this.results.phase2.stats.transformationSteps}`);
            console.log(`   演算子処理数: ${this.results.phase2.stats.operatorCount}`);
            
            console.log('\n🔍 変換後のコード:');
            console.log('─'.repeat(40));
            console.log(result.converted);
            
            // フェーズ2の詳細ログ表示
            if (converter2.debugPrint) {
                console.log('\n🔧 フェーズ2詳細ログ:');
                converter2.debugPrint();
            }
        }
        
        return result;
    }

    /**
     * 最終結果表示
     */
    displayFinalResults() {
        console.log('\n' + '='.repeat(60));
        console.log('🎉 コンパイル完了 - 最終結果サマリー');
        console.log('='.repeat(60));
        
        console.log('📦 フェーズ1 (トークン保護):');
        console.log(`   保護アイテム数: ${this.results.phase1.stats.protectedItems}`);
        console.log(`   変換後サイズ: ${this.results.phase1.result.converted.length}文字`);
        
        console.log('\n🔄 フェーズ2 (記法変換):');
        console.log(`   変換ステップ数: ${this.results.phase2.stats.transformationSteps}`);
        console.log(`   最終サイズ: ${this.results.phase2.result.converted.length}文字`);
        
        // 圧縮率計算
        const originalSize = this.results.phase1.result.converted.length;
        const finalSize = this.results.phase2.result.converted.length;
        const ratio = ((finalSize / originalSize) * 100).toFixed(1);
        console.log(`\n📏 サイズ変化: ${originalSize} → ${finalSize} (${ratio}%)`);
    }

    /**
     * デバッグモード切り替え
     */
    setVerbose(verbose) {
        this.verbose = verbose;
    }

    /**
     * 結果取得
     */
    getResults() {
        return this.results;
    }
}

// メイン実行関数
async function main() {
    const compiler = new SignCompiler();
    
    // コマンドライン引数処理
    const args = process.argv.slice(2);
    const sourceFile = args[0] || 'testcode.sn';
    const verbose = !args.includes('--quiet');
    
    compiler.setVerbose(verbose);
    
    console.log('🌟 Sign言語コンパイラ v0.2.0');
    console.log('フェーズ1 (トークン保護) + フェーズ2 (記法変換)');
    
    await compiler.compile(sourceFile);
}

// 直接実行時の処理
if (require.main === module) {
    main().catch(error => {
        console.error('❌ 実行エラー:', error.message);
        process.exit(1);
    });
}

module.exports = SignCompiler;