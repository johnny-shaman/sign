%{
/**
 * parser.y
 * Sign言語の構文解析器定義
 * 
 * 機能:
 * - Sign言語の文法規則
 * - 抽象構文木(AST)の構築
 * - 演算子の優先順位と結合性の設定
 * 
 * CreateBy: Claude3.7Sonnet
 * ver_20250506_1
 */

#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include "ast.h"

extern int yydebug;  /* parser.y の先頭近くに追加 */
extern int line_num;
extern int column;
extern int yylex();
extern int yyparse();
extern FILE* yyin;
void yyerror(const char* s);
ASTNode* root = NULL;  /* 構文木のルート */

/* 字句解析器の初期化関数 (lexer.lで定義) */
extern void init_lexer(void);
%}

/* 位置情報の追跡 */
%locations

%union {
    double number;
    char* string;
    char character;
    struct ASTNode* node;
}

/* トークン定義 */
%token <number> INTEGER FLOAT
%token <string> IDENTIFIER STRING HEX_NUMBER OCT_NUMBER BIN_NUMBER
%token <character> CHARACTER
%token NEWLINE INDENT DEDENT
%token DEFINE LAMBDA COMMA
%token PLUS MINUS TIMES DIVIDE MOD POW
%token LT LE EQ GE GT NE
%token AND OR XOR
%token EXCLAMATION HASH TILDE AT QUOTE DOLLAR UNIT
%token LPAREN RPAREN LBRACKET RBRACKET LBRACE RBRACE
%token APPLY    /* 優先順位の解決ための補助トークン */

/* 非終端記号の型 */
%type <node> program statements statement expression
%type <node> definition export lambda_def
%type <node> list_literal block indent_block
%type <node> literal identifier string_literal number_literal hex_number octal_number binary_number character_literal
%type <node> application conditional unit_literal
%type <node> prefix_op infix_op postfix_op

/* 演算子の優先順位と結合性 */
/* Sign言語仕様に基づいて、優先順位の低いものから高いものへ順に定義 */
%right DEFINE                 /* 定義 */
%left COMMA                   /* 積 */
%left OR XOR                  /* 論理和 */
%left AND                     /* 論理積 */
%left LT LE EQ GE GT NE       /* 比較演算 */
%left PLUS MINUS              /* 加減算 */
%left TIMES DIVIDE MOD        /* 乗除算 */
%right POW                    /* 冪乗 */
%left TILDE AT QUOTE          /* 範囲, 取得 */
%right LAMBDA                 /* ラムダ構築 */
%right HASH                   /* エクスポート, 出力 */
%right DOLLAR                 /* アドレス取得 */
%nonassoc EXCLAMATION         /* 前置の否定 */
%left APPLY                  /* 関数適用 (仮想トークン) */

%%
program
    : statements
        { 
            root = createNode(AST_STATEMENTS, $1, NULL);
            setNodeLocation(root, @1.first_line, @1.first_column);
        }
    ;

statements
    : statement
        { 
            $$ = $1; 
        }
    | statements statement
        { 
            $$ = appendNode($1, $2); 
        }
    ;

statement
    : expression NEWLINE
        { 
            $$ = $1; 
        }
    | definition NEWLINE
        { 
            $$ = $1; 
        }
    | export NEWLINE
        { 
            $$ = $1; 
        }
    | NEWLINE
        { 
            $$ = NULL; /* 空行は無視 */ 
        }
    | definition  /* 末尾の改行なしに対応 */
        { 
            $$ = $1;
        }
    | expression  /* 末尾の改行なしに対応 */
        { 
            $$ = $1;
        }
    | export      /* 末尾の改行なしに対応 */
        { 
            $$ = $1;
        }
    ;

definition
    : identifier DEFINE expression
        { 
            $$ = createDefineNode($1, $3);
            setNodeLocation($$, @1.first_line, @1.first_column);
        }
    ;

export
    : HASH identifier DEFINE expression
        { 
            $$ = createExportNode($2, $4);
            setNodeLocation($$, @1.first_line, @1.first_column);
        }
    ;

expression
    : literal
        { 
            $$ = $1; 
        }
    | application
        { 
            $$ = $1; 
        }
    | lambda_def
        { 
            $$ = $1; 
        }
    | prefix_op
        { 
            $$ = $1; 
        }
    | infix_op
        { 
            $$ = $1; 
        }
    | postfix_op
        { 
            $$ = $1; 
        }
    | conditional
        { 
            $$ = $1; 
        }
    | block
        { 
            $$ = $1; 
        }
    | LPAREN expression RPAREN
        { 
            $$ = $2; 
        }
    ;

literal
    : number_literal
        { 
            $$ = $1; 
        }
    | hex_number
        { 
            $$ = $1; 
        }
    | octal_number
        { 
            $$ = $1; 
        }
    | binary_number
        { 
            $$ = $1; 
        }
    | string_literal
        { 
            $$ = $1; 
        }
    | character_literal
        { 
            $$ = $1; 
        }
    | identifier
        { 
            $$ = $1; 
        }
    | unit_literal
        { 
            $$ = $1; 
        }
    | list_literal
        { 
            $$ = $1; 
        }
    ;

lambda_def
    : expression LAMBDA expression
        { 
            $$ = createLambdaNode($1, $3);
            setNodeLocation($$, @1.first_line, @1.first_column);
        }
    ;

application
    : expression expression %prec APPLY
        { 
            $$ = createApplicationNode($1, $2);
            setNodeLocation($$, @1.first_line, @1.first_column);
        }
    ;

prefix_op
    : EXCLAMATION expression
        { 
            $$ = createPrefixOpNode(OP_NOT, $2);
            setNodeLocation($$, @1.first_line, @1.first_column);
        }
    | TILDE expression
        { 
            $$ = createPrefixOpNode(OP_REST_ARGS, $2);
            setNodeLocation($$, @1.first_line, @1.first_column);
        }
    | DOLLAR expression
        { 
            $$ = createPrefixOpNode(OP_GET_ADDR, $2);
            setNodeLocation($$, @1.first_line, @1.first_column);
        }
    | AT expression
        { 
            $$ = createPrefixOpNode(OP_INPUT, $2);
            setNodeLocation($$, @1.first_line, @1.first_column);
        }
    ;

infix_op
    : expression PLUS expression
        { 
            ASTNode *left = $1;
            ASTNode *right = $3;
            
            fprintf(stderr, "PLUS演算子ルール実行: left=%p, right=%p\n", 
                    (void *)left, (void *)right);
                
            $$ = createInfixOpNode(OP_ADD, left, right);
            setNodeLocation($$, @2.first_line, @2.first_column);
            
            // 作成後のチェック
            fprintf(stderr, "PLUS演算子ノード作成後: node=%p, node->left=%p, node->right=%p\n", 
                    (void *)$$, (void *)$$->left, (void *)$$->right);
        }
    | expression MINUS expression
        { 
            $$ = createInfixOpNode(OP_SUB, $1, $3);
            setNodeLocation($$, @2.first_line, @2.first_column);
            printf("演算子 - を処理: %d:%d\n", @2.first_line, @2.first_column); /* デバッグ出力 */
        }
    | expression TIMES expression
        { 
            $$ = createInfixOpNode(OP_MUL, $1, $3);
            setNodeLocation($$, @2.first_line, @2.first_column);
        }
    | expression DIVIDE expression
        { 
            $$ = createInfixOpNode(OP_DIV, $1, $3);
            setNodeLocation($$, @2.first_line, @2.first_column);
        }
    | expression MOD expression
        { 
            $$ = createInfixOpNode(OP_MOD, $1, $3);
            setNodeLocation($$, @2.first_line, @2.first_column);
        }
    | expression POW expression
        { 
            $$ = createInfixOpNode(OP_POW, $1, $3);
            setNodeLocation($$, @2.first_line, @2.first_column);
        }
    | expression LT expression
        { 
            $$ = createInfixOpNode(OP_LESS, $1, $3);
            setNodeLocation($$, @2.first_line, @2.first_column);
        }
    | expression LE expression
        { 
            $$ = createInfixOpNode(OP_LESS_EQUAL, $1, $3);
            setNodeLocation($$, @2.first_line, @2.first_column);
        }
    | expression EQ expression
        { 
            $$ = createInfixOpNode(OP_EQUAL, $1, $3);
            setNodeLocation($$, @2.first_line, @2.first_column);
        }
    | expression GE expression
        { 
            $$ = createInfixOpNode(OP_MORE_EQUAL, $1, $3);
            setNodeLocation($$, @2.first_line, @2.first_column);
        }
    | expression GT expression
        { 
            $$ = createInfixOpNode(OP_MORE, $1, $3);
            setNodeLocation($$, @2.first_line, @2.first_column);
        }
    | expression NE expression
        { 
            $$ = createInfixOpNode(OP_NOT_EQUAL, $1, $3);
            setNodeLocation($$, @2.first_line, @2.first_column);
        }
    | expression AND expression
        { 
            $$ = createInfixOpNode(OP_AND, $1, $3);
            setNodeLocation($$, @2.first_line, @2.first_column);
        }
    | expression OR expression
        { 
            $$ = createInfixOpNode(OP_OR, $1, $3);
            setNodeLocation($$, @2.first_line, @2.first_column);
        }
| expression XOR expression
        { 
            $$ = createInfixOpNode(OP_XOR, $1, $3);
            setNodeLocation($$, @2.first_line, @2.first_column);
        }
    | expression TILDE expression
        { 
            $$ = createInfixOpNode(OP_RANGE, $1, $3);
            setNodeLocation($$, @2.first_line, @2.first_column);
        }
    | expression QUOTE expression
        { 
            $$ = createInfixOpNode(OP_GET, $1, $3);
            setNodeLocation($$, @2.first_line, @2.first_column);
        }
    | expression AT expression
        { 
            $$ = createInfixOpNode(OP_GET_RIGHT, $1, $3);
            setNodeLocation($$, @2.first_line, @2.first_column);
        }
    ;

postfix_op
    : expression EXCLAMATION
        { 
            $$ = createPostfixOpNode(OP_FACTORIAL, $1);
            setNodeLocation($$, @2.first_line, @2.first_column);
        }
    | expression TILDE
        { 
            $$ = createPostfixOpNode(OP_EXPAND, $1);
            setNodeLocation($$, @2.first_line, @2.first_column);
        }
    | expression AT
        { 
            $$ = createPostfixOpNode(OP_IMPORT, $1);
            setNodeLocation($$, @2.first_line, @2.first_column);
        }
    ;

conditional
    : expression DEFINE expression
        { 
            $$ = createConditionalNode($1, $3);
            setNodeLocation($$, @2.first_line, @2.first_column);
        }
    ;

list_literal
    : expression COMMA expression
        { 
            $$ = createListNode($1, $3);
            setNodeLocation($$, @2.first_line, @2.first_column);
        }
    ;

block
    : LPAREN statements RPAREN
        { 
            $$ = createBlockNode($2, 0);
            setNodeLocation($$, @1.first_line, @1.first_column);
        }
    | LBRACKET statements RBRACKET
        { 
            $$ = createBlockNode($2, 0);
            setNodeLocation($$, @1.first_line, @1.first_column);
        }
    | LBRACE statements RBRACE
        { 
            $$ = createBlockNode($2, 0);
            setNodeLocation($$, @1.first_line, @1.first_column);
        }
    | indent_block
        { 
            $$ = $1; 
        }
    ;

indent_block
    : INDENT statements DEDENT
        { 
            $$ = createBlockNode($2, 1);
            setNodeLocation($$, @1.first_line, @1.first_column);
        }
    ;

identifier
    : IDENTIFIER
        { 
            $$ = createIdentifierNode($1);
            setNodeLocation($$, @1.first_line, @1.first_column);
        }
    ;

string_literal
    : STRING
        { 
            $$ = createStringNode($1);
            setNodeLocation($$, @1.first_line, @1.first_column);
        }
    ;

number_literal
    : INTEGER
        { 
            $$ = createNumberNode($1);
            setNodeLocation($$, @1.first_line, @1.first_column);
        }
    | FLOAT
        { 
            $$ = createNumberNode($1);
            setNodeLocation($$, @1.first_line, @1.first_column);
        }
    ;

hex_number
    : HEX_NUMBER
        { 
            $$ = createHexNumberNode($1);
            setNodeLocation($$, @1.first_line, @1.first_column);
        }
    ;

octal_number
    : OCT_NUMBER
        { 
            $$ = createOctNumberNode($1);
            setNodeLocation($$, @1.first_line, @1.first_column);
        }
    ;

binary_number
    : BIN_NUMBER
        { 
            $$ = createBinNumberNode($1);
            setNodeLocation($$, @1.first_line, @1.first_column);
        }
    ;

character_literal
    : CHARACTER
        { 
            $$ = createCharNode($1);
            setNodeLocation($$, @1.first_line, @1.first_column);
        }
    ;

unit_literal
    : UNIT
        { 
            $$ = createUnitNode();
            setNodeLocation($$, @1.first_line, @1.first_column);
        }
    ;
%%

void yyerror(const char* s) {
    fprintf(stderr, "パース中エラー (行 %d, 列 %d): %s\n", yylloc.first_line, yylloc.first_column, s);
    fprintf(stderr, "直前の位置情報: 行 %d〜%d, 列 %d〜%d\n", 
        yylloc.first_line, yylloc.last_line, 
        yylloc.first_column, yylloc.last_column);
}