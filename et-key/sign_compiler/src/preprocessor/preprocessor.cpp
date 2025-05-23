// src/preprocessor/preprocessor.cpp
/**
 * Sign言語の基本的な前処理を行う実装
 *
 * 主な処理:
 * - 行頭バッククォートで始まるコメント行の除去
 * - 丸カッコ、波カッコを角カッコに統一
 * - 空行の削除と空白の正規化
 * - 文字列リテラル内の内容保護
 *
 * 将来追加:
 * - 未使用の計算式や定義
 * - IO操作のない入力/インポート
 * - その他意味のない記述
 * ※最小実装では「主な処理」に記載の内容以外は後回し
 *
 * CreateBy: Claude3.7Sonnet
 * ver_20250521_0
 */
#include "preprocessor/preprocessor.h"
#include "common/utils/string_utils.h"

namespace sign
{

    // メイン処理：全ての前処理を実行
    std::string normalizeSourceCode(const std::string &sourceCode)
    {
        // 現在はコメント削除のみ実装
        std::string processed = common::removeComments(sourceCode);

        // カッコの統一
        processed = common::unifyBrackets(processed);

        return processed;
    }

} // namespace sign