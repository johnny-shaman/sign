#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include "codegen.h"
#include "ast.h"

/* 前方宣言 */
static void generateNodeCode(ASTNode *node, FILE *output, int indent);
static void generateInfixOpNode(ASTNode *node, FILE *output, int indent);

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

    /* シンプルな文字列型の定義 */
    fprintf(output, "typedef char* string;\n\n");

    /* print関数を定義 */
    fprintf(output, "void print(string s) {\n");
    fprintf(output, "    printf(\"%%s\\n\", s);\n");
    fprintf(output, "}\n\n");
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