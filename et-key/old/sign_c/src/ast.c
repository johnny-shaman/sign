/**
 * ast.c
 * Sign言語の抽象構文木(AST)操作の実装
 *
 * 機能:
 * - ASTノードの作成と管理
 * - ノードの情報表示と解放
 * - 構文木の構築と操作
 *
 * CreateBy: Claude3.7Sonnet
 * ver_20250506_1
 */

#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include "ast.h"

/* ASTノードを作成する */
ASTNode *createNode(ASTNodeType type, ASTNode *left, ASTNode *right)
{
    ASTNode *node = (ASTNode *)malloc(sizeof(ASTNode));
    if (!node)
    {
        fprintf(stderr, "メモリ確保エラー\n");
        exit(1);
    }

    memset(node, 0, sizeof(ASTNode)); // 構造体を0で初期化
    node->type = type;

    node->left = left;
    node->right = right;

    node->next = NULL;
    node->line = 0;
    node->column = 0;

    return node;
}

/* ノードの位置情報を設定する */
void setNodeLocation(ASTNode *node, int line, int column)
{
    if (node)
    {
        node->line = line;
        node->column = column;
    }
}

/* 識別子ノードを作成する */
ASTNode *createIdentifierNode(char *name)
{
    ASTNode *node = createNode(AST_IDENTIFIER, NULL, NULL);
    node->data.string = strdup(name);
    return node;
}

/* 文字列ノードを作成する */
ASTNode *createStringNode(char *value)
{
    ASTNode *node = createNode(AST_STRING, NULL, NULL);
    node->data.string = strdup(value);
    return node;
}

/* 数値ノードを作成する */
ASTNode *createNumberNode(double value)
{
    ASTNode *node = createNode(AST_NUMBER, NULL, NULL);
    node->data.number = value;
    return node;
}

/* 16進数ノードを作成する */
ASTNode *createHexNumberNode(char *hex_str)
{
    ASTNode *node = createNode(AST_HEX_NUMBER, NULL, NULL);
    node->data.string = strdup(hex_str);
    return node;
}

/* 8進数ノードを作成する */
ASTNode *createOctNumberNode(char *oct_str)
{
    ASTNode *node = createNode(AST_OCT_NUMBER, NULL, NULL);
    node->data.string = strdup(oct_str);
    return node;
}

/* 2進数ノードを作成する */
ASTNode *createBinNumberNode(char *bin_str)
{
    ASTNode *node = createNode(AST_BIN_NUMBER, NULL, NULL);
    node->data.string = strdup(bin_str);
    return node;
}

/* 文字ノードを作成する */
ASTNode *createCharNode(char value)
{
    ASTNode *node = createNode(AST_CHAR, NULL, NULL);
    node->data.character = value;
    return node;
}

/* 単位元ノードを作成する */
ASTNode *createUnitNode(void)
{
    return createNode(AST_UNIT, NULL, NULL);
}

/* 定義ノードを作成する */
ASTNode *createDefineNode(ASTNode *name, ASTNode *value)
{
    return createNode(AST_DEFINE, name, value);
}

/* エクスポートノードを作成する */
ASTNode *createExportNode(ASTNode *name, ASTNode *value)
{
    return createNode(AST_EXPORT, name, value);
}

/* ラムダノードを作成する */
ASTNode *createLambdaNode(ASTNode *param, ASTNode *body)
{
    return createNode(AST_LAMBDA, param, body);
}

/* 関数適用ノードを作成する */
ASTNode *createApplicationNode(ASTNode *func, ASTNode *arg)
{
    return createNode(AST_APPLICATION, func, arg);
}

/* リストノードを作成する */
ASTNode *createListNode(ASTNode *first, ASTNode *rest)
{
    return createNode(AST_LIST, first, rest);
}

/* ブロックノードを作成する */
ASTNode *createBlockNode(ASTNode *content, int indent_level)
{
    ASTNode *node = createNode(AST_BLOCK, content, NULL);
    node->indent_level = indent_level;
    return node;
}

/* 条件分岐ノードを作成する */
ASTNode *createConditionalNode(ASTNode *condition, ASTNode *body)
{
    return createNode(AST_CONDITIONAL, condition, body);
}

/* 前置演算子ノードを作成する */
ASTNode *createPrefixOpNode(OperatorType op, ASTNode *operand)
{
    ASTNode *node = createNode(AST_PREFIX_OP, operand, NULL);
    node->op_type = op;
    return node;
}

/* 中置演算子ノードを作成する */
ASTNode *createInfixOpNode(OperatorType op, ASTNode *left, ASTNode *right)
{
    // 入力の有効性チェック
    if (!left || (uintptr_t)left < 0x1000)
    {
        fprintf(stderr, "警告: 無効な左オペランド %p、ダミーノードを作成します\n", (void *)left);
        left = createNumberNode(0);
    }

    if (!right || (uintptr_t)right < 0x1000)
    {
        fprintf(stderr, "警告: 無効な右オペランド %p、ダミーノードを作成します\n", (void *)right);
        right = createNumberNode(0);
    }

    ASTNode *node = createNode(AST_INFIX_OP, left, right);

    node->op_type = op;
    return node;
}

/* 後置演算子ノードを作成する */
ASTNode *createPostfixOpNode(OperatorType op, ASTNode *operand)
{
    ASTNode *node = createNode(AST_POSTFIX_OP, operand, NULL);
    node->op_type = op;
    return node;
}

/* インポートノードを作成する */
ASTNode *createImportNode(ASTNode *module)
{
    return createNode(AST_IMPORT, module, NULL);
}

/* 入力ノードを作成する */
ASTNode *createInputNode(ASTNode *address)
{
    return createNode(AST_INPUT, address, NULL);
}

/* ノードをリストに追加する */
ASTNode *appendNode(ASTNode *list, ASTNode *node)
{
    if (!list)
        return node;
    if (!node)
        return list;

    ASTNode *current = list;
    while (current->next)
    {
        current = current->next;
    }
    current->next = node;

    return list;
}

/* ASTを解放する */
void freeAST(ASTNode *node)
{
    if (!node)
        return;

    /* まず子ノードを解放 */
    if (node->type == AST_STRING || node->type == AST_IDENTIFIER ||
        node->type == AST_HEX_NUMBER || node->type == AST_OCT_NUMBER ||
        node->type == AST_BIN_NUMBER)
    {
        free(node->data.string);
    }
    else if (node->type != AST_NUMBER && node->type != AST_CHAR &&
             node->type != AST_UNIT)
    {
        freeAST(node->left);
        freeAST(node->right);
    }

    /* 次のノードを解放 */
    ASTNode *next = node->next;

    /* 現在のノードを解放 */
    free(node);

    /* 次のノードをたどる */
    freeAST(next);
}

/* インデントを出力する */
static void printIndent(int indent)
{
    for (int i = 0; i < indent; i++)
    {
        printf("  ");
    }
}

/* 演算子の種類を文字列に変換する */
static const char *operatorTypeToString(OperatorType op)
{
    switch (op)
    {
    case OP_DEFINE:
        return "Define (:)";
    case OP_OUTPUT:
        return "Output (#)";
    case OP_COPRODUCT:
        return "Coproduct (space)";
    case OP_LAMBDA:
        return "Lambda (?)";
    case OP_PRODUCT:
        return "Product (,)";
    case OP_RANGE:
        return "Range (~)";
    case OP_REST_ARGS:
        return "Rest Args (~)";
    case OP_OR:
        return "Or (|)";
    case OP_XOR:
        return "Xor (;)";
    case OP_AND:
        return "And (&)";
    case OP_NOT:
        return "Not (!)";
    case OP_LESS:
        return "Less (<)";
    case OP_LESS_EQUAL:
        return "Less Equal (<=)";
    case OP_EQUAL:
        return "Equal (=)";
    case OP_MORE_EQUAL:
        return "More Equal (>=)";
    case OP_MORE:
        return "More (>)";
    case OP_NOT_EQUAL:
        return "Not Equal (!=)";
    case OP_ADD:
        return "Add (+)";
    case OP_SUB:
        return "Subtract (-)";
    case OP_MUL:
        return "Multiply (*)";
    case OP_DIV:
        return "Divide (/)";
    case OP_MOD:
        return "Modulo (%)";
    case OP_POW:
        return "Power (^)";
    case OP_FACTORIAL:
        return "Factorial (!)";
    case OP_EXPAND:
        return "Expand (~)";
    case OP_GET_ADDR:
        return "Get Address ($)";
    case OP_GET:
        return "Get (')";
    case OP_GET_RIGHT:
        return "Get Right (@)";
    case OP_IMPORT:
        return "Import (@)";
    case OP_INPUT:
        return "Input (@)";
    case OP_EXPORT:
        return "Export (#)";
    default:
        return "Unknown";
    }
}

/* ASTを表示する */
void printAST(ASTNode *node, int indent)
{
    if (!node)
        return;

    printIndent(indent);

    // 行と列の情報を出力
    printf("[%d:%d] ", node->line, node->column);

    // ノードのデバッグ情報
    if (node->type == AST_INFIX_OP)
    {
        printf("DEBUG: InfixOp node at %p, op=%d, left=%p, right=%p\n",
               (void *)node, node->op_type,
               (void *)node->left, (void *)node->right);

        // 子ノードが有効かチェック
        if (node->left == NULL)
        {
            printf("警告: 左オペランドがNULLです\n");
        }
        else if ((uintptr_t)node->left < 0x1000)
        {
            printf("警告: 左オペランドが不正なアドレスです: %p\n", (void *)node->left);
        }
    }

    // ノード間の関係をわかりやすく表示
    if (indent > 0)
    {
        printf("└─ ");
    }

    switch (node->type)
    {
    case AST_STATEMENTS:
        printf("Statements\n");
        if (node->left)
        {
            printAST(node->left, indent + 1);
        }
        break;

    case AST_DEFINE:
        printf("Define\n");
        printAST(node->left, indent + 1);
        printAST(node->right, indent + 1);
        break;

    case AST_EXPORT:
        printf("Export\n");
        printAST(node->left, indent + 1);
        printAST(node->right, indent + 1);
        break;

    case AST_IDENTIFIER:
        printf("Identifier: %s\n", node->data.string);
        break;

    case AST_STRING:
        printf("String: \"%s\"\n", node->data.string);
        break;

    case AST_NUMBER:
        printf("Number: %g\n", node->data.number);
        break;

    case AST_HEX_NUMBER:
        printf("Hex Number: %s\n", node->data.string);
        break;

    case AST_OCT_NUMBER:
        printf("Octal Number: %s\n", node->data.string);
        break;

    case AST_BIN_NUMBER:
        printf("Binary Number: %s\n", node->data.string);
        break;

    case AST_CHAR:
        printf("Character: '%c'\n", node->data.character);
        break;

    case AST_UNIT:
        printf("Unit (_)\n");
        break;

    case AST_LAMBDA:
        printf("Lambda\n");
        printAST(node->left, indent + 1);
        printAST(node->right, indent + 1);
        break;

    case AST_APPLICATION:
        printf("Application\n");
        printAST(node->left, indent + 1);
        printAST(node->right, indent + 1);
        break;

    case AST_LIST:
        printf("List\n");
        printAST(node->left, indent + 1);
        printAST(node->right, indent + 1);
        break;

    case AST_BLOCK:
        printf("Block (indent level: %d)\n", node->indent_level);
        printAST(node->left, indent + 1);
        break;

    case AST_CONDITIONAL:
        printf("Conditional\n");
        printIndent(indent + 1);
        printf("Condition:\n");
        printAST(node->left, indent + 2);
        printIndent(indent + 1);
        printf("Body:\n");
        printAST(node->right, indent + 2);
        break;

    case AST_PREFIX_OP:
        printf("Prefix Operator: %s\n", operatorTypeToString(node->op_type));
        printAST(node->left, indent + 1);
        break;

    case AST_INFIX_OP:
        printf("Infix Operator: %s\n", operatorTypeToString(node->op_type));
        printAST(node->left, indent + 1);
        printAST(node->right, indent + 1);
        break;

    case AST_POSTFIX_OP:
        printf("Postfix Operator: %s\n", operatorTypeToString(node->op_type));
        printAST(node->left, indent + 1);
        break;

    case AST_IMPORT:
        printf("Import\n");
        printAST(node->left, indent + 1);
        break;

    case AST_INPUT:
        printf("Input\n");
        printAST(node->left, indent + 1);
        break;

    default:
        printf("Unknown node type\n");
    }

    /* 同じレベルの次のノードを表示 */
    if (node->next)
    {
        printAST(node->next, indent);
    }
}