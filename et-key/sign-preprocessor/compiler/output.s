# Sign Language Compiler - Generated AArch64 Assembly
# Phase 2-1: Unit値処理 + FunctionApplication実装
.text
.global _start

grade:
# ComparisonChain complete
# ComparisonChain complete
# ComparisonChain complete
# load parameter _0
    mov x8, x0
# push literal 90
    mov x9, #90
# x8 more_equal x9 (Sign比較演算)
    cmp x8, x9
    csel x8, x8, xzr, ge
# result: ge ? x8 : Unit
# push string literal "A"
    adr x9, string_0
# x8 & x9 (Sign短絡評価and)
    cmp x8, xzr
    csel x8, x9, x8, ne
# result: x8!=Unit ? x9 : x8
# push literal 80
    mov x9, #80
# load parameter _0
    mov x10, x0
# x9 less_equal x10 (Sign比較演算)
    cmp x9, x10
    csel x9, x10, xzr, le
# result: le ? x10 : Unit
# x8 | x9 (Sign短絡評価or)
    cmp x8, xzr
    csel x8, x8, x9, ne
# result: x8!=Unit ? x8 : x9
# push string literal "B"
    adr x9, string_1
# x8 & x9 (Sign短絡評価and)
    cmp x8, xzr
    csel x8, x9, x8, ne
# result: x8!=Unit ? x9 : x8
# load parameter _0
    mov x9, x0
# push literal 70
    mov x10, #70
# x9 more_equal x10 (Sign比較演算)
    cmp x9, x10
    csel x9, x9, xzr, ge
# result: ge ? x9 : Unit
# x8 | x9 (Sign短絡評価or)
    cmp x8, xzr
    csel x8, x8, x9, ne
# result: x8!=Unit ? x8 : x9
# push string literal "C"
    adr x9, string_2
# x8 & x9 (Sign短絡評価and)
    cmp x8, xzr
    csel x8, x9, x8, ne
# result: x8!=Unit ? x9 : x8
# push string literal "F"
    adr x9, string_3
# x8 | x9 (Sign短絡評価or)
    cmp x8, xzr
    csel x8, x8, x9, ne
# result: x8!=Unit ? x8 : x9
# set return value
    mov x0, x8
    ret


.data
# String table
string_0:
    .asciz "A"
string_1:
    .asciz "B"
string_2:
    .asciz "C"
string_3:
    .asciz "F"

_start:
# Main entry point
    mov x8, #93
# exit syscall
    mov x0, #0
# exit status
    svc #0
# system call