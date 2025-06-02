# Sign Language Compiler - Generated AArch64 Assembly
# Phase 2-1: Unit値処理 + FunctionApplication実装
.text
.global _start

divide_test:
# load parameter _0
    mov x8, x0
# load parameter _1
    mov x9, x1
# Check for division by zero
    cmp x9, #0
# Use minimum value if zero
    csel x9, x29, x9, eq
# x8 / x9 (safe)
    sdiv x8, x8, x9
# set return value
    mov x0, x8
    ret

multi_op:
# load parameter _0
    mov x8, x0
# load parameter _1
    mov x9, x1
# x8 + x9
    add x8, x8, x9
# load parameter _0
    mov x9, x0
# load parameter _2
    mov x10, x2
# x9 * x10
    mul x9, x9, x10
# x8 - x9
    sub x8, x8, x9
# set return value
    mov x0, x8
    ret

return_unit:
# Unit値をプッシュ (xzr使用)
# set return value
    mov x0, xzr
    ret

identity_unit:
# load parameter _0
    mov x8, x0
# set return value
    mov x0, x8
    ret

mixed_test:
# load parameter _0
    mov x8, x0
# set return value
    mov x0, x8
    ret

test1:
# 関数参照: return_unit (引数なし関数呼び出し)
    bl return_unit
# store function result
    mov x8, x0
# set return value
    mov x0, x8
    ret

test2:
# push literal 42
    mov x8, #42
# 関数呼び出し: identity_unit (引数1個)
# argument 0: x8 -> x0
    mov x0, x8
# call function
    bl identity_unit
# store return value
    mov x8, x0
# set return value
    mov x0, x8
    ret

test3:
# Unit値をプッシュ (xzr使用)
# 関数呼び出し: identity_unit (引数1個)
# argument 0: xzr -> x0
    mov x0, xzr
# call function
    bl identity_unit
# store return value
    mov x8, x0
# set return value
    mov x0, x8
    ret

test5:
# push literal 10
    mov x8, #10
# Unit値をプッシュ (xzr使用)
# 関数呼び出し: mixed_test (引数2個)
# argument 0: x8 -> x0
    mov x0, x8
# argument 1: xzr -> x1
    mov x1, xzr
# call function
    bl mixed_test
# store return value
    mov x8, x0
# set return value
    mov x0, x8
    ret

test6:
# Unit値をプッシュ (xzr使用)
# push literal 20
    mov x9, #20
# 関数呼び出し: mixed_test (引数2個)
# argument 0: xzr -> x0
    mov x0, xzr
# argument 1: x9 -> x1
    mov x1, x9
# call function
    bl mixed_test
# store return value
    mov x8, x0
# set return value
    mov x0, x8
    ret

_start:
# Main entry point
    mov x8, #93
# exit syscall
    mov x0, #0
# exit status
    svc #0
# system call