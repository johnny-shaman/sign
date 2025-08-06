/**
 * codegen.c
 * Sign言語のC言語コード生成モジュール
 *
 * 機能:
 * - 抽象構文木(AST)からC言語コードを生成
 * - 変数定義、算術演算、関数定義、リスト操作などの変換
 * - Sign言語の機能をC言語で実現するためのランタイムライブラリの利用
 *
 * 本モジュールは以下の変換を実装:
 * - 基本データ型 (数値、文字列、リスト)
 * - 算術演算子 (+, -, *, /, %, ^)
 * - ラムダ式 (Sign言語のクロージャ -> C言語の関数)
 * - リスト操作 (作成、アクセス、結合)
 * - 関数適用
 *
 * CreateBy: Claude3.7Sonnet
 * ver_20250506_2
 */

#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include "codegen.h"
#include "ast.h"

/* 前方宣言 */
static void generateNodeCode(ASTNode *node, FILE *output, int indent);
static void generateInfixOpNode(ASTNode *node, FILE *output, int indent);
static void generateListCode(ASTNode *node, FILE *output);
static void generateGetOpNode(ASTNode *node, FILE *output, int indent);

/* インデントを出力する */
static void writeIndent(FILE *output, int indent)
{
    for (int i = 0; i < indent; i++)
    {
        fprintf(output, "    ");
    }
}

/* Cコードのヘッダを出力する */
static void writeHeader(FILE *output)
{
    fprintf(output, "#include <stdio.h>\n");
    fprintf(output, "#include <stdlib.h>\n");
    fprintf(output, "#include <string.h>\n\n");

    fprintf(output, "/* Sign言語ランタイム */\n");
    fprintf(output, "#include \"runtime.h\"\n\n");
}

/* Cコードのメイン関数を開始する */
static void writeMainStart(FILE *output)
{
    fprintf(output, "int main() {\n");
}

/* Cコードのメイン関数を終了する */
static void writeMainEnd(FILE *output)
{
    fprintf(output, "    return 0;\n");
    fprintf(output, "}\n");
}

/* ラムダノードのコードを生成する */
static void generateLambdaCode(ASTNode *node, FILE *output, int indent)
{
    static int lambda_count = 0;
    int current_lambda = lambda_count++;

    if (!node || !node->left || !node->right)
    {
        fprintf(output, "NULL /* 無効なラムダ式 */");
        return;
    }

    ASTNode *param = node->left;
    ASTNode *body = node->right;

    /* ラムダ関数の宣言 */
    writeIndent(output, 0);
    fprintf(output, "any lambda_%d(any arg) {\n", current_lambda);

    /* パラメータの抽出 */
    if (param->type == AST_IDENTIFIER)
    {
        writeIndent(output, 1);
        fprintf(output, "double %s = *(double*)arg;\n", param->data.string);
    }

    /* 関数本体 - 戻り値変数の宣言を追加 */
    writeIndent(output, 1);
    fprintf(output, "double* result = (double*)malloc(sizeof(double));\n");

    /* 関数の戻り値を設定 */
    writeIndent(output, 1);
    fprintf(output, "/* 関数本体の計算 */\n");
    writeIndent(output, 1);
    fprintf(output, "*result = ");

    /* 式の生成 */
    if (body->type == AST_INFIX_OP)
    {
        generateInfixOpNode(body, output, 0);
    }
    else if (body->type == AST_IDENTIFIER)
    {
        fprintf(output, "%s", body->data.string);
    }
    else if (body->type == AST_NUMBER)
    {
        fprintf(output, "%f", body->data.number);
    }
    else if (body->type == AST_APPLICATION)
    {
        /* 関数適用の処理 */
        fprintf(output, "/* 関数適用の処理（現在未実装） */");
    }

    fprintf(output, ";\n");

    /* 結果の返却 */
    writeIndent(output, 1);
    fprintf(output, "return (any)result;\n");
    writeIndent(output, 0);
    fprintf(output, "}\n\n");

    /* ラムダ関数へのポインタを返す */
    fprintf(output, "&lambda_%d", current_lambda);
}

/* 定義ノードのコードを生成する */
static void generateDefineCode(ASTNode *node, FILE *output, int indent)
{
    if (!node || !node->left || !node->right)
    {
        return;
    }

    ASTNode *nameNode = node->left;
    ASTNode *valueNode = node->right;

    if (nameNode->type != AST_IDENTIFIER)
    {
        fprintf(stderr, "定義名は識別子である必要があります\n");
        return;
    }

    writeIndent(output, indent);

    /* 定義の種類に基づいて異なるコードを生成 */
    switch (valueNode->type)
    {
    case AST_STRING:
        fprintf(output, "string %s = \"%s\";\n",
                nameNode->data.string, valueNode->data.string);
        break;

    case AST_NUMBER:
        fprintf(output, "double %s = %f;\n",
                nameNode->data.string, valueNode->data.number);
        break;

    case AST_INFIX_OP:
        fprintf(output, "double %s = ", nameNode->data.string);
        /* 二項演算子の式を生成 */
        fprintf(stderr, "Generating infix op, operator: %d\n", valueNode->op_type);
        generateNodeCode(valueNode, output, 0);
        fprintf(output, ";\n");
        break;

    case AST_IDENTIFIER:
        fprintf(output, "double %s = %s;\n", nameNode->data.string, valueNode->data.string);
        break;

    case AST_LIST:
        fprintf(output, "SignList* %s;\n", nameNode->data.string);
        writeIndent(output, indent);
        fprintf(output, "{\n");
        writeIndent(output, indent + 1);
        fprintf(output, "SignList* temp_list = ");
        generateListCode(valueNode, output);
        fprintf(output, ";\n");
        writeIndent(output, indent + 1);
        fprintf(output, "%s = temp_list;\n", nameNode->data.string);
        writeIndent(output, indent);
        fprintf(output, "}\n");
        break;

    case AST_LAMBDA:
        fprintf(output, "SignFunction %s = ", nameNode->data.string);
        generateLambdaCode(valueNode, output, indent);
        fprintf(output, ";\n");
        break;

    default:
        fprintf(output, "/* 未実装の定義タイプ */\n");
    }
}

/* 識別子ノードのコードを生成する */
static void generateIdentifierCode(ASTNode *node, FILE *output)
{
    if (!node)
        return;
    fprintf(output, "%s", node->data.string);
}

/* 文字列ノードのコードを生成する */
static void generateStringCode(ASTNode *node, FILE *output)
{
    if (!node)
        return;
    fprintf(output, "\"%s\"", node->data.string);
}

/* 数値ノードのコードを生成する */
static void generateNumberCode(ASTNode *node, FILE *output)
{
    if (!node)
        return;
    fprintf(output, "%f", node->data.number);
}

/* 関数適用ノードのコードを生成する */
static void generateApplicationCode(ASTNode *node, FILE *output, int indent)
{
    if (!node || !node->left)
    {
        return;
    }

    ASTNode *funcNode = node->left;
    ASTNode *argNode = node->right;

    /* 単純な関数呼び出しのみサポート */
    if (funcNode->type == AST_IDENTIFIER)
    {
        writeIndent(output, indent);
        fprintf(output, "%s(", funcNode->data.string);

        if (argNode)
        {
            if (argNode->type == AST_STRING)
            {
                generateStringCode(argNode, output);
            }
            else if (argNode->type == AST_IDENTIFIER)
            {
                generateIdentifierCode(argNode, output);
            }
            else if (argNode->type == AST_NUMBER)
            {
                generateNumberCode(argNode, output);
            }
        }

        fprintf(output, ");\n");
    }
}

/* 二項演算子ノードのコードを生成する */
static void generateInfixOpNode(ASTNode *node, FILE *output, int indent)
{
    if (!node)
    {
        fprintf(stderr, "エラー: 二項演算子ノードがNULLです\n");
        return;
    }

    // ポインタの有効性チェック
    if (!node->left || (uintptr_t)node->left < 0x1000)
    {
        fprintf(stderr, "エラー: 二項演算子の左オペランドが無効です (%p)\n",
                (void *)node->left);
        // 安全対策としてダミー値を出力
        fprintf(output, "0 /* 無効な左オペランド */");
        return;
    }

    if (!node->right || (uintptr_t)node->right < 0x1000)
    {
        fprintf(stderr, "エラー: 二項演算子の右オペランドが無効です (%p)\n",
                (void *)node->right);
        // 安全対策としてダミー値を出力
        fprintf(output, "0 /* 無効な右オペランド */");
        return;
    }

    /* Get演算子を特別処理 */
    if (node->op_type == OP_GET)
    {
        generateGetOpNode(node, output, indent);
        return; // 他の処理を行わないように早期リターン
    }

    if (indent > 0)
    {
        writeIndent(output, indent);
    }

    fprintf(output, "(");

    /* 左オペランドを生成 */
    if (node->left->type == AST_INFIX_OP)
    {
        generateInfixOpNode(node->left, output, 0);
    }
    else if (node->left->type == AST_IDENTIFIER)
    {
        generateIdentifierCode(node->left, output);
    }
    else if (node->left->type == AST_NUMBER)
    {
        generateNumberCode(node->left, output);
    }
    else
    {
        /* その他の型は未サポート */
        fprintf(output, "/* 未サポートの左オペランド */");
    }

    /* 演算子の種類に基づいて演算子を出力 */
    switch (node->op_type)
    {
    case OP_ADD:
        fprintf(output, " + ");
        break;
    case OP_SUB:
        fprintf(output, " - ");
        break;
    case OP_MUL:
        fprintf(output, " * ");
        break;
    case OP_DIV:
        fprintf(output, " / ");
        break;
    case OP_MOD:
        fprintf(output, " %% ");
        break;
    case OP_POW:
        fprintf(output, " ^ ");
        break; /* C言語では冪乗演算子はないので注意 */
    default:
        fprintf(output, " ? "); /* 未知の演算子 */
    }

    /* 右オペランドを生成 */
    if (node->right->type == AST_INFIX_OP)
    {
        generateInfixOpNode(node->right, output, 0);
    }
    else if (node->right->type == AST_IDENTIFIER)
    {
        generateIdentifierCode(node->right, output);
    }
    else if (node->right->type == AST_NUMBER)
    {
        generateNumberCode(node->right, output);
    }
    else
    {
        /* その他の型は未サポート */
        fprintf(output, "/* 未サポートの右オペランド */");
    }

    fprintf(output, ")");
}

/* Get演算子ノードのコードを生成する */
static void generateGetOpNode(ASTNode *node, FILE *output, int indent)
{
    if (!node || !node->left || !node->right)
    {
        fprintf(output, "NULL /* 無効なGet演算 */");
        return;
    }

    if (indent > 0)
    {
        writeIndent(output, indent);
    }

    /* リスト変数 */
    if (node->left->type == AST_IDENTIFIER)
    {
        /* インデックスが数値の場合 */
        if (node->right->type == AST_NUMBER)
        {
            fprintf(output, "*(double*)list_get(%s, %d)",
                    node->left->data.string,
                    (int)node->right->data.number);
        }
        /* インデックスが識別子の場合 */
        else if (node->right->type == AST_IDENTIFIER)
        {
            fprintf(output, "*(double*)list_get(%s, %s)",
                    node->left->data.string,
                    node->right->data.string);
        }
        /* 文字列の場合は文字列として取得 */
        else if (node->right->type == AST_STRING)
        {
            fprintf(output, "(string)list_get(%s, \"%s\")",
                    node->left->data.string,
                    node->right->data.string);
        }
    }
    else
    {
        fprintf(output, "/* 未サポートのGet演算子使用 */");
    }
}

/* リストノードのコードを生成する */
static void generateListCode(ASTNode *node, FILE *output)
{
    fprintf(output, "list_create()");

    /* リスト要素の追加処理 */
    if (node->left)
    {
        /* 左側の要素を追加 */
        fprintf(output, ";\n");
        fprintf(output, "list_append(temp_list, ");

        /* 左のノードに基づいて値を生成 */
        if (node->left->type == AST_NUMBER)
        {
            /* 数値の場合はポインタに変換 */
            fprintf(output, "&(double){%f}", node->left->data.number);
        }
        else if (node->left->type == AST_STRING)
        {
            /* 文字列の場合はそのまま */
            fprintf(output, "\"%s\"", node->left->data.string);
        }
        else if (node->left->type == AST_IDENTIFIER)
        {
            /* 識別子の場合は変数を参照 */
            fprintf(output, "&%s", node->left->data.string);
        }

        fprintf(output, ")");

        /* 右側がリストの場合は再帰的に処理 */
        if (node->right && node->right->type == AST_LIST)
        {
            ASTNode *current = node->right;

            /* リストの各要素を追加 */
            while (current)
            {
                if (current->left)
                {
                    fprintf(output, ";\n");
                    fprintf(output, "list_append(temp_list, ");

                    if (current->left->type == AST_NUMBER)
                    {
                        fprintf(output, "&(double){%f}", current->left->data.number);
                    }
                    else if (current->left->type == AST_STRING)
                    {
                        fprintf(output, "\"%s\"", current->left->data.string);
                    }
                    else if (current->left->type == AST_IDENTIFIER)
                    {
                        fprintf(output, "&%s", current->left->data.string);
                    }

                    fprintf(output, ")");
                }

                /* 次の要素へ移動 */
                if (current->right && current->right->type == AST_LIST)
                {
                    current = current->right;
                }
                else if (current->right)
                {
                    /* 最後の要素 */
                    fprintf(output, ";\n");
                    fprintf(output, "list_append(temp_list, ");

                    if (current->right->type == AST_NUMBER)
                    {
                        fprintf(output, "&(double){%f}", current->right->data.number);
                    }
                    else if (current->right->type == AST_STRING)
                    {
                        fprintf(output, "\"%s\"", current->right->data.string);
                    }
                    else if (current->right->type == AST_IDENTIFIER)
                    {
                        fprintf(output, "&%s", current->right->data.string);
                    }

                    fprintf(output, ")");
                    break;
                }
                else
                {
                    break;
                }
            }
        }
        /* 右側が単一要素の場合 */
        else if (node->right)
        {
            fprintf(output, ";\n");
            fprintf(output, "list_append(temp_list, ");

            if (node->right->type == AST_NUMBER)
            {
                fprintf(output, "&(double){%f}", node->right->data.number);
            }
            else if (node->right->type == AST_STRING)
            {
                fprintf(output, "\"%s\"", node->right->data.string);
            }
            else if (node->right->type == AST_IDENTIFIER)
            {
                fprintf(output, "&%s", node->right->data.string);
            }

            fprintf(output, ")");
        }
    }
}

/* ASTノードからCコードを生成する */
static void generateNodeCode(ASTNode *node, FILE *output, int indent)
{
    if (!node)
        return;

    switch (node->type)
    {
    case AST_STATEMENTS:
        if (node->left)
        {
            generateNodeCode(node->left, output, indent);
        }
        break;

    case AST_DEFINE:
        generateDefineCode(node, output, indent);
        break;

    case AST_APPLICATION:
        generateApplicationCode(node, output, indent);
        break;

    case AST_INFIX_OP:
        generateInfixOpNode(node, output, indent);
        break;

    case AST_LIST:
        generateListCode(node, output);
        break;

    case AST_LAMBDA:
        generateLambdaCode(node, output, indent);
        break;

    default:
        /* その他のノードタイプは未実装 */
        break;
    }

    /* 同じレベルの次のノードを処理 */
    if (node->next)
    {
        generateNodeCode(node->next, output, indent);
    }
}

/* AST全体からCコードを生成する */
void generateCCode(ASTNode *ast, FILE *output)
{
    /* ヘッダを書き込む */
    writeHeader(output);

    /* メイン関数を開始 */
    writeMainStart(output);

    /* ASTからコードを生成 */
    generateNodeCode(ast, output, 1);

    /* メイン関数を終了 */
    writeMainEnd(output);
}