#include <stdio.h>
#include <stdlib.h>
#include <string.h>

/* Sign言語ランタイム */
#include "runtime.h"

int main() {
    double x = 10.000000;
    double y = 20.000000;
    double z = (x + y);
    string hello = "Hello";
    string world = "World";
    /* 未実装の定義タイプ */
    double dec = 123.450000;
    /* 未実装の定義タイプ */
    /* 未実装の定義タイプ */
    double sum = (x + y);
    double product = (x * y);
    double divide = (x / y);
    double modulo = (x % y);
    double power = (x ^ 2.000000);
    /* 未実装の定義タイプ */
    double is_valid = ((x ? 0.000000) ? (y ? 100.000000));
    /* 未実装の定義タイプ */
    double group_calc = ((x + y) * (z - 5.000000));
    double add = (/* 未サポートの左オペランド */ + b);
    double multiply = (/* 未サポートの左オペランド */ * b);
    double power_fn = (/* 未サポートの左オペランド */ ^ exp);
    double calc = ((/* 未サポートの左オペランド */ + (x - y)) + (x * y));
    /* 未実装の定義タイプ */
    /* 未実装の定義タイプ */
    /* 未実装の定義タイプ */
    SignList* list2;
    {
        SignList* temp_list = /* 注: 変換前にSignList* temp_list; の宣言が必要 */
list_create();
list_append(temp_list, );
list_append(temp_list, &(double){5.000000});
        list2 = temp_list;
    }
    /* 未実装の定義タイプ */
    return 0;
}
