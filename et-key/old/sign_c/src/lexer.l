%{
/**
 * lexer.l
 * Sign言語の字句解析器定義
 * 
 * 機能:
 * - トークンの認識と分類
 * - 特殊文字と演算子の処理
 * - インデントレベルの追跡
 * - 行番号と列番号の追跡
 * 
 * CreateBy: Claude3.7Sonnet
 * ver_20250506_1
 */

#include <stdio.h>
#include <string.h>
#include "parser.tab.h"  /* Bisonが生成するヘッダ */
#include "ast.h"

/* 現在の行と列の追跡 */
int line_num = 1;
int column = 1;

/* インデントの追跡 */
int indent_stack[100] = {0};  /* インデントスタック */
int indent_index = 0;         /* スタックのインデックス */
int current_indent = 0;       /* 現在のインデントレベル */
int pending_dedents = 0;      /* 処理待ちの脱インデント数 */
int process_indent(char* text); /* インデント処理関数のプロトタイプ */

/* 文字位置を更新 */
#define YY_USER_ACTION { \
    printf("Token: %s at line %d, column %d\n", yytext, line_num, column); \
    yylloc.first_line = yylloc.last_line = line_num; \
    yylloc.first_column = column; \
    column += yyleng; \
    yylloc.last_column = column - 1; \
}

/* 行の先頭かどうかのフラグ */
int at_line_start = 1;

/* インデントの計算と処理 */
int process_indent(char* text) {
    /* 行頭でない場合は何もしない */
    if (!at_line_start) return 0;  // 0を返すように修正
    
    /* インデントレベルの計算 */
    int spaces = 0;
    for (int i = 0; text[i] != '\0'; i++) {
        if (text[i] == '\t') {
            spaces += 4; /* タブは4スペース分とカウント */
        } else if (text[i] == ' ') {
            spaces++;
        }
    }
    
    /* インデントレベルの変化に応じたトークンを返す */
    if (spaces > current_indent) {
        /* インデント増加 */
        indent_stack[++indent_index] = spaces;
        current_indent = spaces;
        at_line_start = 0;
        return INDENT;
    } else if (spaces < current_indent) {
        /* インデント減少 */
        at_line_start = 0;
        
        /* 適切なレベルまで脱インデント */
        while (indent_index > 0 && spaces < indent_stack[indent_index]) {
            indent_index--;
            pending_dedents++;
        }
        
        /* 不正なインデントのチェック */
        if (spaces != indent_stack[indent_index]) {
            fprintf(stderr, "行 %d: 不正なインデントレベル\n", line_num);
        }
        
        current_indent = indent_stack[indent_index];
        
        /* 脱インデントトークンを返す */
        if (pending_dedents > 0) {
            pending_dedents--;
            return DEDENT;
        }
    }
    
    at_line_start = 0;
    return 0;  /* デフォルトでは何も返さない */
}

extern void yyerror(const char *msg);
%}

%option noyywrap
%option yylineno

/* 状態定義 */
%x COMMENT

%%
<INITIAL>{
    /* コメント処理 */
    ^`[^\n]*\n  { 
                   /* 行頭のバッククォートはコメント */ 
                   line_num++; 
                   column = 1;
                   at_line_start = 1;
                   return NEWLINE;
                 }
    
    /* インデント処理 */
    ^[ \t]+     { process_indent(yytext); }
    
    /* 改行処理 */
    \n          { 
                   line_num++; 
                   column = 1;
                   at_line_start = 1;
                   return NEWLINE; 
                 }
    
    /* スペースとタブを無視（行頭以外） */
    [ \t]+      { /* 無視 */ }
    
    /* 定義演算子 */
    ":"         { return DEFINE; }
    
    /* ラムダ演算子 */
    "?"         { return LAMBDA; }
    
    /* 積演算子 */
    ","         { return COMMA; }
    
    /* 算術演算子 */
    "+"         { return PLUS; }
    "-"         { return MINUS; }
    "*"         { return TIMES; }
    "/"         { return DIVIDE; }
    "%"         { return MOD; }
    "^"         { return POW; }
    
    /* 比較演算子 */
    "<"         { return LT; }
    "<="        { return LE; }
    "="         { return EQ; }
    ">="        { return GE; }
    ">"         { return GT; }
    "!="        { return NE; }
    
    /* 論理演算子 */
    "&"         { return AND; }
    "|"         { return OR; }
    ";"         { return XOR; }
    
    /* その他の特殊演算子 */
    "!"         { return EXCLAMATION; } /* 否定または階乗 */
    "#"         { return HASH; }        /* エクスポートまたは出力 */
    "~"         { return TILDE; }       /* 範囲、残余引数、展開 */
    "@"         { return AT; }          /* インポート、入力、取得 */
    "'"         { return QUOTE; }       /* 取得 */
    "$"         { return DOLLAR; }      /* アドレス取得 */
    
    /* 括弧 */
    "("         { return LPAREN; }
    ")"         { return RPAREN; }
    "["         { return LBRACKET; }
    "]"         { return RBRACKET; }
    "{"         { return LBRACE; }
    "}"         { return RBRACE; }
    
    /* リテラル */
    /* 単位元 */
    "_"         { return UNIT; }
    
    /* 数値リテラル */
    [0-9]+\.[0-9]+ { 
                     yylval.number = atof(yytext); 
                     return FLOAT; 
                   }
    [0-9]+      { 
                   yylval.number = atof(yytext); 
                   return INTEGER; 
                 }
    0x[0-9A-Fa-f]+ { 
                     yylval.string = strdup(yytext); 
                     return HEX_NUMBER; 
                   }
    0o[0-7]+    { 
                   yylval.string = strdup(yytext); 
                   return OCT_NUMBER; 
                 }
    0b[01]+     { 
                   yylval.string = strdup(yytext); 
                   return BIN_NUMBER; 
                 }
    
    /* 識別子 */
    [a-zA-Z_][a-zA-Z0-9_]* { 
                             yylval.string = strdup(yytext); 
                             return IDENTIFIER; 
                           }
    
    /* 文字リテラル */
    \\[^\n]     { 
                   yylval.character = yytext[1]; 
                   return CHARACTER; 
                 }
    
    /* 文字列リテラル */
    `[^`\n]*`   { 
                   yytext[yyleng-1] = '\0';  /* 終わりの ` を削除 */
                   yylval.string = strdup(yytext+1); /* 始まりの ` を削除 */
                   return STRING; 
                 }
    
    /* その他の文字 */
    .           { return yytext[0]; /* その他の文字はそのまま返す */ }
}

%%

/* 初期化関数 */
void init_lexer(void) {
    line_num = 1;
    column = 1;
    at_line_start = 1;
    indent_index = 0;
    indent_stack[0] = 0;
    current_indent = 0;
    pending_dedents = 0;
}