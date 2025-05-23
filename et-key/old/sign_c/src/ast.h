/**
 * ast.h
 * Sign言語の抽象構文木(AST)定義
 *
 * 機能:
 * - ASTノード構造体の定義
 * - ASTノードタイプの列挙
 * - ASTノード作成・操作関数のプロトタイプ宣言
 *
 * CreateBy: Claude3.7Sonnet
 * ver_20250506_1
 */

#ifndef AST_H
#define AST_H

/* ASTノードタイプの列挙型 */
typedef enum
{
    AST_STATEMENTS,  /* 文のリスト */
    AST_DEFINE,      /* 変数/関数定義 (x : expr) */
    AST_EXPORT,      /* エクスポート定義 (#x : expr) */
    AST_IDENTIFIER,  /* 識別子 */
    AST_STRING,      /* 文字列リテラル */
    AST_NUMBER,      /* 数値リテラル */
    AST_HEX_NUMBER,  /* 16進数リテラル */
    AST_OCT_NUMBER,  /* 8進数リテラル */
    AST_BIN_NUMBER,  /* 2進数リテラル */
    AST_CHAR,        /* 文字リテラル */
    AST_LAMBDA,      /* ラムダ式 (params ? body) */
    AST_APPLICATION, /* 関数適用 (func arg) */
    AST_LIST,        /* リスト (a, b, c) */
    AST_BLOCK,       /* ブロック (カッコまたはインデント) */
    AST_CONDITIONAL, /* 条件分岐 (cond : expr) */
    AST_UNIT,        /* 単位元 (_) */
    AST_PREFIX_OP,   /* 前置演算子 (!x, ~x, など) */
    AST_INFIX_OP,    /* 中置演算子 (x + y, x : y, など) */
    AST_POSTFIX_OP,  /* 後置演算子 (x!, x~, など) */
    AST_IMPORT,      /* インポート (x@) */
    AST_INPUT        /* 入力 (@x) */
} ASTNodeType;

/* 演算子タイプの列挙型 */
typedef enum
{
    /* 定義、出力域 */
    OP_DEFINE, /* : */
    OP_OUTPUT, /* # */

    /* 構築域 */
    OP_COPRODUCT, /* (空白) */
    OP_LAMBDA,    /* ? */
    OP_PRODUCT,   /* , */
    OP_RANGE,     /* ~ (中置) */
    OP_REST_ARGS, /* ~ (前置) */

    /* 論理域 */
    OP_OR,  /* | */
    OP_XOR, /* ; */
    OP_AND, /* & */
    OP_NOT, /* ! (前置) */

    /* 比較演算域 */
    OP_LESS,       /* < */
    OP_LESS_EQUAL, /* <= */
    OP_EQUAL,      /* = */
    OP_MORE_EQUAL, /* >= */
    OP_MORE,       /* > */
    OP_NOT_EQUAL,  /* != */

    /* 算術演算域 */
    OP_ADD,       /* + */
    OP_SUB,       /* - */
    OP_MUL,       /* * */
    OP_DIV,       /* / */
    OP_MOD,       /* % */
    OP_POW,       /* ^ */
    OP_FACTORIAL, /* ! (後置) */

    /* 解決評価域 */
    OP_EXPAND,    /* ~ (後置) */
    OP_GET_ADDR,  /* $ */
    OP_GET,       /* ' */
    OP_GET_RIGHT, /* @ (中置) */

    /* Import/Input域 */
    OP_IMPORT, /* @ (後置) */
    OP_INPUT,  /* @ (前置) */

    /* Export域 */
    OP_EXPORT /* # (前置) */
} OperatorType;

/* ASTノード構造体 */
typedef struct ASTNode
{
    ASTNodeType type;

    /* 演算子の型をunionの外に移動 */
    OperatorType op_type;
    int indent_level;

    /* 子ノードもunionの外に移動 */
    struct ASTNode *left;
    struct ASTNode *right;

    union
    {
        char *string;   /* 文字列値 (識別子、文字列リテラル) */
        double number;  /* 数値 (整数、浮動小数点) */
        char character; /* 文字値 */
    } data;

    struct ASTNode *next; /* 同じレベルの次のノード */
    int line;             /* ソースコード上の行番号 */
    int column;           /* ソースコード上の列番号 */
} ASTNode;

/* AST関連の関数プロトタイプ */
ASTNode *createNode(ASTNodeType type, ASTNode *left, ASTNode *right);
ASTNode *createIdentifierNode(char *name);
ASTNode *createStringNode(char *value);
ASTNode *createNumberNode(double value);
ASTNode *createHexNumberNode(char *hex_str);
ASTNode *createOctNumberNode(char *oct_str);
ASTNode *createBinNumberNode(char *bin_str);
ASTNode *createCharNode(char value);
ASTNode *createUnitNode(void);
ASTNode *createDefineNode(ASTNode *name, ASTNode *value);
ASTNode *createExportNode(ASTNode *name, ASTNode *value);
ASTNode *createLambdaNode(ASTNode *param, ASTNode *body);
ASTNode *createApplicationNode(ASTNode *func, ASTNode *arg);
ASTNode *createListNode(ASTNode *first, ASTNode *rest);
ASTNode *createBlockNode(ASTNode *content, int indent_level);
ASTNode *createConditionalNode(ASTNode *condition, ASTNode *body);
ASTNode *createPrefixOpNode(OperatorType op, ASTNode *operand);
ASTNode *createInfixOpNode(OperatorType op, ASTNode *left, ASTNode *right);
ASTNode *createPostfixOpNode(OperatorType op, ASTNode *operand);
ASTNode *createImportNode(ASTNode *module);
ASTNode *createInputNode(ASTNode *address);
ASTNode *appendNode(ASTNode *list, ASTNode *node);
void freeAST(ASTNode *node);
void printAST(ASTNode *node, int indent);
void setNodeLocation(ASTNode *node, int line, int column);

#endif /* AST_H */