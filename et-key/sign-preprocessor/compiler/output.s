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

status:
# ComparisonChain complete
# ComparisonChain complete
# load parameter _0
    mov x8, x0
# push string literal "admin"
    adr x9, string_4
# x8 equal x9 (文字列比較)
    cmp x8, x9
    csel x8, x8, xzr, eq
# result: equal ? x8 : Unit
# push string literal "full_access"
    adr x9, string_5
# x8 & x9 (Sign短絡評価and)
    cmp x8, xzr
    csel x8, x9, x8, ne
# result: x8!=Unit ? x9 : x8
# load parameter _0
    mov x9, x0
# push string literal "user"
    adr x10, string_6
# x9 equal x10 (文字列比較)
    cmp x9, x10
    csel x9, x9, xzr, eq
# result: equal ? x9 : Unit
# x8 | x9 (Sign短絡評価or)
    cmp x8, xzr
    csel x8, x8, x9, ne
# result: x8!=Unit ? x8 : x9
# push string literal "basic_access"
    adr x9, string_7
# x8 & x9 (Sign短絡評価and)
    cmp x8, xzr
    csel x8, x9, x8, ne
# result: x8!=Unit ? x9 : x8
# push string literal "no_access"
    adr x9, string_8
# x8 | x9 (Sign短絡評価or)
    cmp x8, xzr
    csel x8, x8, x9, ne
# result: x8!=Unit ? x8 : x9
# set return value
    mov x0, x8
    ret

show_message:
# push literal 1
    mov x8, #1
# load parameter _0
    mov x9, x0
// output operation: x8 # x9
// variable output (assume string): _0
    mov x0, x8         // file descriptor
    mov x1, x9           // string address
    mov x2, #0                    // length counter
strlen_loop_0:
    ldrb w3, [x1, x2]            // load byte
    cmp w3, #0                    // check null terminator
    beq strlen_done_0    // if null, done
    add x2, x2, #1                // increment counter
    b strlen_loop_0      // continue
strlen_done_0:
    mov x8, #64                   // write syscall
    svc #0                        // system call
    csel x8, x0, xzr, ge // success: bytes written, fail: Unit
# set return value
    mov x0, x8
    ret

_start:
# Main entry point
# Top-level function application
# push literal 1
    mov x9, #1
# load parameter _0
    mov x10, x0
// output operation: x9 # x10
// variable output (assume string): _0
    mov x0, x9         // file descriptor
    mov x1, x10           // string address
    mov x2, #0                    // length counter
strlen_loop_1:
    ldrb w3, [x1, x2]            // load byte
    cmp w3, #0                    // check null terminator
    beq strlen_done_1    // if null, done
    add x2, x2, #1                // increment counter
    b strlen_loop_1      // continue
strlen_done_1:
    mov x8, #64                   // write syscall
    svc #0                        // system call
    csel x9, x0, xzr, ge // success: bytes written, fail: Unit
# push string literal "hello"
    adr x10, string_9
# 関数呼び出し: show_message (引数1個)
# argument 0: x10 -> x0
    mov x0, x10
# call function
    bl show_message
# store return value
    mov x10, x0

# Immediate execution - OutputStatement
# push literal 1
    mov x8, #1
# push string literal " wold!\n"
    adr x9, string_10
// output operation: x8 # x9
// string output: " wold!\n"
    mov x0, x8         // file descriptor
    mov x1, x9           // string address
    mov x2, #8 // string length
    mov x8, #64                   // write syscall
    svc #0                        // system call
    csel x8, x0, xzr, ge // success: bytes written, fail: Unit

    mov x8, #93               // exit syscall
    mov x0, #0                // exit status
    svc #0                    // system call

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
string_4:
    .asciz "admin"
string_5:
    .asciz "full_access"
string_6:
    .asciz "user"
string_7:
    .asciz "basic_access"
string_8:
    .asciz "no_access"
string_9:
    .asciz "hello"
string_10:
    .asciz " wold!\n"
