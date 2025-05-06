/**
 * main.c
 * Sign言語トランスパイラのメインプログラム
 *
 * 機能:
 * - コマンドライン引数の処理
 * - ファイル入出力の管理
 * - パース処理と構文木構築
 * - コード生成の制御
 *
 * 使い方:
 *   ./sign_c 入力ファイル名.sign
 *
 * CreateBy: Claude3.7Sonnet
 * ver_20250506_1
 */

#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include "ast.h"
#include "codegen.h"

/* グローバル変数（parser.y で定義） */
extern FILE *yyin;
extern int yyparse();
extern ASTNode *root;
extern void init_lexer(void);
extern int yydebug; /* main.c の先頭近くに追加 */

int main(int argc, char **argv)
{
    /* コマンドライン引数のチェック */
    if (argc != 2)
    {
        fprintf(stderr, "使用法: %s ファイル名.sign\n", argv[0]);
        return 1;
    }

    /* 入力ファイルを開く */
    FILE *input = fopen(argv[1], "r");
    if (!input)
    {
        perror("入力ファイルを開けませんでした");
        return 1;
    }

    /* 出力ファイル名の生成 */
    char output_name[256];
    char *dot = strrchr(argv[1], '.');
    if (dot)
    {
        size_t base_len = dot - argv[1];
        strncpy(output_name, argv[1], base_len);
        output_name[base_len] = '\0';
        strcat(output_name, ".c");
    }
    else
    {
        snprintf(output_name, sizeof(output_name), "%s.c", argv[1]);
    }

    /* 出力ファイルを開く */
    FILE *output = fopen(output_name, "w");
    if (!output)
    {
        perror("出力ファイルを開けませんでした");
        fclose(input);
        return 1;
    }

    /* 字句解析器を初期化 */
    init_lexer();

    /* デバッグモードを有効にする */
    yydebug = 1;

    /* パースを実行 */
    yyin = input;
    printf("パース中...\n");
    if (yyparse() != 0)
    {
        fprintf(stderr, "構文解析に失敗しました\n");
        fclose(input);
        fclose(output);
        return 1;
    }

    /* ASTを表示（デバッグ用） */
    printf("抽象構文木:\n");
    printAST(root, 0);

    /* Cコードを生成 */
    printf("Cコードを生成中...\n");
    generateCCode(root, output);

    /* 後処理 */
    fclose(input);
    fclose(output);
    freeAST(root);

    printf("変換完了: %s\n", output_name);
    return 0;
}