# Sign Language Compiler - Generated AArch64 Assembly
# Phase 2-1: Unit値処理 + FunctionApplication実装
.text
.global _start

print:
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
    adr x10, string_0
# push string literal "\n"
    adr x11, string_1
# Static string concat: "hello" + "\n"
    adr x10, string_2 // "hello\n"
# 関数呼び出し: print (引数1個)
# argument 0: x10 -> x0
    mov x0, x10
# call function
    bl print
# store return value
    mov x10, x0
    mov x8, #93               // exit syscall
    mov x0, #0                // exit status
    svc #0                    // system call

.data
# String table
string_0:
    .asciz "hello"
string_1:
    .asciz "\n"
string_2:
    .asciz "hello\n"
