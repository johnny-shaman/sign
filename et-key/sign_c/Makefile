# Makefile
# Sign言語コンパイラのビルド設定
#
# 機能:
# - コンパイラのビルドと構築ルールの定義
# - 適切なコンパイルオプションの設定
# - クリーンアップルールの提供
#
# 使い方:
#   make        - コンパイラをビルド
#   make clean  - 生成ファイルを削除
#
# プロジェクト構造:
# - sign_c/     (トップディレクトリ)
#   - src/      (ソースコード)
#   - examples/ (サンプルコード)
#
# CreateBy: Claude3.7Sonnet
# ver_20250506_1

CC = gcc
CFLAGS = -Wall -g -I./src -fexec-charset=UTF-8 -DYYDEBUG

# 実行ファイル名
TARGET = sign_c

# ソースディレクトリとオブジェクトディレクトリ
SRC_DIR = ./src
OBJ_DIR = ./obj

# 自動生成されるフレックス・バイソンファイル
BISON_OUT = $(SRC_DIR)/parser.tab.c
BISON_HDR = $(SRC_DIR)/parser.tab.h
FLEX_OUT = $(SRC_DIR)/lex.yy.c

# ソースとオブジェクトファイル
SOURCES = $(SRC_DIR)/ast.c $(SRC_DIR)/codegen.c $(SRC_DIR)/main.c
GENERATED_SOURCES = $(BISON_OUT) $(BISON_HDR) $(FLEX_OUT)
OBJECTS = $(OBJ_DIR)/ast.o $(OBJ_DIR)/codegen.o $(OBJ_DIR)/main.o $(OBJ_DIR)/parser.tab.o $(OBJ_DIR)/lex.yy.o

all: $(TARGET)

# ディレクトリ作成
$(OBJ_DIR):
	mkdir -p $(OBJ_DIR)

# フレックスとバイソンの実行
$(BISON_OUT) $(BISON_HDR): $(SRC_DIR)/parser.y
	bison -d -o $(BISON_OUT) $(SRC_DIR)/parser.y

$(FLEX_OUT): $(SRC_DIR)/lexer.l $(BISON_HDR)
	flex -o $(FLEX_OUT) $(SRC_DIR)/lexer.l

# オブジェクトファイルのコンパイル
$(OBJ_DIR)/%.o: $(SRC_DIR)/%.c | $(OBJ_DIR)
	$(CC) $(CFLAGS) -c $< -o $@

$(OBJ_DIR)/parser.tab.o: $(BISON_OUT) | $(OBJ_DIR)
	$(CC) $(CFLAGS) -c $< -o $@

$(OBJ_DIR)/lex.yy.o: $(FLEX_OUT) | $(OBJ_DIR)
	$(CC) $(CFLAGS) -c $< -o $@

# 最終的な実行ファイルのリンク
$(TARGET): $(OBJECTS)
	$(CC) $(CFLAGS) -o $@ $^

clean:
	rm -rf $(OBJ_DIR) $(GENERATED_SOURCES) $(TARGET)

.PHONY: all clean