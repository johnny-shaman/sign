/*
 * runtime.c
 * Sign言語のランタイムライブラリ実装
 * 
 * CreateBy: Claude3.7Sonnet
 * ver_20250506_1
 */

 #include "runtime.h"

 /* リスト作成 */
 SignList* list_create() {
     SignList* list = (SignList*)malloc(sizeof(SignList));
     if (!list) {
         fprintf(stderr, "メモリ確保エラー\n");
         exit(1);
     }
     
     list->capacity = 10;
     list->size = 0;
     list->items = (any*)malloc(list->capacity * sizeof(any));
     
     if (!list->items) {
         fprintf(stderr, "メモリ確保エラー\n");
         free(list);
         exit(1);
     }
     
     return list;
 }
 
 /* リストに要素を追加 */
 void list_append(SignList* list, any item) {
     if (list->size >= list->capacity) {
         list->capacity *= 2;
         list->items = (any*)realloc(list->items, list->capacity * sizeof(any));
         
         if (!list->items) {
             fprintf(stderr, "メモリ再確保エラー\n");
             exit(1);
         }
     }
     
     list->items[list->size++] = item;
 }
 
 /* リストの結合 */
 SignList* list_concat(SignList* list1, SignList* list2) {
     SignList* result = list_create();
     
     /* list1の各要素をコピー */
     for (int i = 0; i < list1->size; i++) {
         list_append(result, list1->items[i]);
     }
     
     /* list2の各要素をコピー */
     for (int i = 0; i < list2->size; i++) {
         list_append(result, list2->items[i]);
     }
     
     return result;
 }
 
 /* リストから要素を取得 */
 any list_get(SignList* list, int index) {
     if (index < 0 || index >= list->size) {
         return NULL; /* Signの単位元に相当 */
     }
     
     return list->items[index];
 }
 
 /* リストの解放 */
 void list_free(SignList* list) {
     if (list) {
         if (list->items) {
             free(list->items);
         }
         free(list);
     }
 }
 
 /* 標準出力に文字列を表示 */
 void sign_print(string s) {
     printf("%s\n", s);
 }