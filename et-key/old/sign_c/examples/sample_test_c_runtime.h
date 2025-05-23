/*
 * runtime.h
 * Sign言語のランタイムライブラリ
 * 
 * 機能:
 * - リスト操作のためのデータ構造と関数
 * - ラムダ式を実現するための関数型
 * - Sign言語の基本操作をC言語で実現するヘルパー関数
 * 
 * CreateBy: Claude3.7Sonnet
 * ver_20250506_1
 */

 #ifndef RUNTIME_H
 #define RUNTIME_H
 
 #include <stdio.h>
 #include <stdlib.h>
 #include <string.h>
 
 /* 基本型の定義 */
 typedef char* string;
 typedef void* any;
 
 /* リスト構造の定義 */
 typedef struct SignList {
     any *items;
     int size;
     int capacity;
 } SignList;
 
 /* リスト操作関数 */
 SignList* list_create();
 void list_append(SignList* list, any item);
 SignList* list_concat(SignList* list1, SignList* list2);
 any list_get(SignList* list, int index);
 void list_free(SignList* list);
 
 /* 関数型の定義 */
 typedef any (*SignFunction)(any);
 
 /* 基本的なI/O関数 */
 void sign_print(string s);
 
 #endif /* RUNTIME_H */