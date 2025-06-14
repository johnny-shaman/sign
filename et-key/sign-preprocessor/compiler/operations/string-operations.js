// operations/string-operations.js
// Sign言語 文字列演算モジュール

class StringOperations {
    constructor(compiler) {
        this.compiler = compiler;
    }

    // 文字列演算の判定
    isStringOperation(leftInfo, rightInfo) {
        return (leftInfo?.valueType === 'string') ||
            (rightInfo?.valueType === 'string');
    }

    // 文字列演算のメイン処理
    generateStringOperation(operator, leftReg, rightReg, leftInfo, rightInfo) {
        switch (operator) {
            case 'add':
                return this.generateStringConcat(leftReg, rightReg, leftInfo, rightInfo);
            case 'equal':
            case 'not_equal':
                return this.generateStringComparison(operator, leftReg, rightReg, leftInfo, rightInfo);
            default:
                throw new Error(`文字列演算子 ${operator} は未対応です`);
        }
    }

    // 静的文字列結合（コンパイル時最適化）
    generateStringConcat(leftReg, rightReg, leftInfo, rightInfo) {
        const resultReg = this.compiler.getNextDataReg();

        // 両方が文字列リテラルの場合 -> 静的結合
        if (this.isBothStringLiterals(leftInfo, rightInfo)) {
            return this.generateStaticConcat(leftReg, rightReg, resultReg, leftInfo, rightInfo);
        }

        // 片方が文字列リテラルの場合 -> 部分最適化
        if (this.isOneStringLiteral(leftInfo, rightInfo)) {
            return this.generatePartialStaticConcat(leftReg, rightReg, resultReg, leftInfo, rightInfo);
        }

        // 両方が動的文字列の場合 -> 将来実装
        throw new Error('動的文字列結合は Phase 2で実装予定です');
    }

    // 静的文字列結合（両方がリテラル）
    generateStaticConcat(leftReg, rightReg, resultReg, leftInfo, rightInfo) {
        // コンパイル時に文字列を結合
        const leftStr = leftInfo.value || '';
        const rightStr = rightInfo.value || '';
        const concatenatedString = leftStr + rightStr;
        const stringIndex = this.addToStringTable(concatenatedString);

        this.compiler.assembly.push(`# Static string concat: "${leftStr}" + "${rightStr}"`);
        this.compiler.assembly.push(`    adr ${resultReg}, string_${stringIndex} // "${concatenatedString}"`);

        // 結果をスタックに格納
        this.compiler.dataStack.push(resultReg);

        this.compiler.operandInfo.push({
            type: 'computed',
            valueType: 'string',
            value: concatenatedString
        });
        return resultReg;
    }

    // 部分静的結合（片方がリテラル）
    generatePartialStaticConcat(leftReg, rightReg, resultReg, leftInfo, rightInfo) {
        // Sign言語の型変換ルール: 左辺の型に合わせる
        if (leftInfo.valueType === 'string') {
            // 左が文字列 -> 右を文字列に変換して結合
            return this.generateStringifyAndConcat(leftReg, rightReg, resultReg, leftInfo, rightInfo, 'left');
        } else {
            // 右が文字列 -> 左を文字列に変換して結合  
            return this.generateStringifyAndConcat(leftReg, rightReg, resultReg, leftInfo, rightInfo, 'right');
        }
    }

    // 数値->文字列変換付き結合
    generateStringifyAndConcat(leftReg, rightReg, resultReg, leftInfo, rightInfo, stringSide) {
        this.compiler.assembly.push(`# Stringify and concat (${stringSide} side is string)`);
        if (stringSide === 'left') {
            // 左が文字列、右が数値
            if (rightInfo.valueType === 'integer' && rightInfo.type === 'literal') {
                // 右が数値リテラル -> コンパイル時変換
                const rightStr = rightInfo.value.toString();
                const concatenatedString = leftInfo.value + rightStr;
                const stringIndex = this.addToStringTable(concatenatedString);

                this.compiler.assembly.push(`    adr ${resultReg}, string_${stringIndex} // "${concatenatedString}"`);
            } else {
                throw new Error('動的数値->文字列変換は Phase 2で実装予定です');
            }
        } else {
            // 右が文字列、左が数値
            if (leftInfo.valueType === 'integer' && leftInfo.type === 'literal') {
                // 左が数値リテラル -> コンパイル時変換
                const leftStr = leftInfo.value.toString();
                const concatenatedString = leftStr + rightInfo.value;
                const stringIndex = this.addToStringTable(concatenatedString);

                this.compiler.assembly.push(`    adr ${resultReg}, string_${stringIndex} // "${concatenatedString}"`);
            } else {
                throw new Error('動的数値->文字列変換は Phase 2で実装予定です');
            }
        }

        // 結果をスタックに格納
        this.compiler.dataStack.push(resultReg);
        this.compiler.operandInfo.push({
            type: 'computed',
            valueType: 'string'
        });

        return resultReg;
    }

    // ヘルパーメソッド
    isBothStringLiterals(leftInfo, rightInfo) {
        return leftInfo?.valueType === 'string' && leftInfo?.type === 'literal' &&
            rightInfo?.valueType === 'string' && rightInfo?.type === 'literal';
    }

    isOneStringLiteral(leftInfo, rightInfo) {
        return (leftInfo?.valueType === 'string' && leftInfo?.type === 'literal') ||
            (rightInfo?.valueType === 'string' && rightInfo?.type === 'literal');
    }

    addToStringTable(str) {
        return this.compiler.addToStringTable(str);
    }
}

// エクスポート
if (typeof module !== 'undefined' && module.exports) {
    module.exports = StringOperations;
}