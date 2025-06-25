// Sign I/Oライブラリ対応ARM64アセンブリ（完全一対一対応版）
.text
.global _start

// === ファイルスコープでの定数・状態管理（Sign対応） ===
.section .data
// BUFFER_SIZE : 4096
BUFFER_SIZE:
    .quad 4096

// AT_FDCWD : 0xFFFFFFFF9C
AT_FDCWD:
    .quad 0xFFFFFFFF9C

// STDIN : 0, STDOUT : 1, STDERR : 2
STDIN:  .quad 0
STDOUT: .quad 1
STDERR: .quad 2

// 共有状態（ファイルスコープ変数）
// fd_storage : 0
fd_storage:
    .quad 0

// size_storage : 0
size_storage:
    .quad 0

// buffer_storage : alloc_buffer BUFFER_SIZE
buffer_storage:
    .quad 0    // 実際のアドレスは実行時に設定

.section .bss
// 4KB buffer allocation
file_buffer:
    .space 4096

.text

// === 基本I/O操作（アセンブリ対応、エラー値込み） ===

// open_file : filename ? `コンパイラがopenat システムコールに変換`
open_file:
    // Sign: syscall openat AT_FDCWD filename O_RDONLY 0 _ _
    mov x8, #56                 // sys_openat
    ldr x1, =AT_FDCWD
    ldr x1, [x1]               // AT_FDCWD = -100
    mov x0, x1                 // dirfd = AT_FDCWD
    mov x1, x0                 // pathname (引数のfilename)
    mov x2, #0                 // O_RDONLY
    mov x3, #0                 // mode
    svc #0
    ret

// close_file : fd ? `コンパイラがclose システムコールに変換`
close_file:
    // Sign: syscall close fd _ _ _ _ _
    mov x8, #57                // sys_close
    // x0にはすでにfdが入っている
    svc #0
    ret

// read_data : fd addr size ? `コンパイラがread システムコールに変換`
read_data:
    // Sign: syscall read fd addr size _ _ _
    mov x8, #63                // sys_read
    // x0=fd, x1=addr, x2=size は既に設定済み
    svc #0
    ret

// write_data : fd addr size ? `コンパイラがwrite システムコールに変換`
write_data:
    // Sign: syscall write fd addr size _ _ _
    mov x8, #64                // sys_write
    // x0=fd, x1=addr, x2=size は既に設定済み
    svc #0
    ret

// === メモリ管理（アドレス直接操作） ===
// alloc_buffer : size ? @0x1F - size & 0x1F # [@0x1F - size] & [@0x1F - size]
alloc_buffer:
    // Sign: @0x1F (SPレジスタの値を取得)
    mov x1, sp                 // current_sp = SP
    
    // Sign: @0x1F - size
    sub x2, x1, x0             // new_sp = current_sp - size
    
    // Sign: 0x1F # [@0x1F - size] (SPレジスタを更新)
    mov sp, x2                 // SP = new_sp
    
    // Sign: [@0x1F - size] (新しいバッファアドレスを返す)
    mov x0, x2                 // return new_sp
    ret

// === エラーチェック（比較演算の特性活用） ===
// is_valid : [>= 0]
is_valid:
    // Sign言語の比較演算：真なら値、偽なら_ (0) を返す
    cmp x0, #0
    csel x0, x0, xzr, ge       // x0 >= 0 なら x0、そうでなければ 0(Unit)
    ret

// === 安全操作（ポイントフリー記法） ===
// safe_open : filename ? [ open_file filename ] [>= 0]
safe_open:
    stp x29, x30, [sp, #-16]!
    mov x29, sp
    
    // [ open_file filename ]
    bl open_file               // fd = open_file(filename)
    
    // [>= 0] (is_valid)
    bl is_valid                // valid_fd = is_valid(fd)
    
    ldp x29, x30, [sp], #16
    ret

// safe_read : fd addr size ? [ read_data fd addr size ] [>= 0]
safe_read:
    stp x29, x30, [sp, #-16]!
    mov x29, sp
    
    // [ read_data fd addr size ]
    bl read_data               // bytes = read_data(fd, addr, size)
    
    // [>= 0] (is_valid)
    bl is_valid                // valid_bytes = is_valid(bytes)
    
    ldp x29, x30, [sp], #16
    ret

// safe_write : fd addr size ? [ write_data fd addr size ] [>= 0]
safe_write:
    stp x29, x30, [sp, #-16]!
    mov x29, sp
    
    // [ write_data fd addr size ]
    bl write_data              // bytes = write_data(fd, addr, size)
    
    // [>= 0] (is_valid)
    bl is_valid                // valid_bytes = is_valid(bytes)
    
    ldp x29, x30, [sp], #16
    ret

// safe_close : fd ? [ close_file fd ] [>= 0]
safe_close:
    stp x29, x30, [sp, #-16]!
    mov x29, sp
    
    // [ close_file fd ]
    bl close_file              // result = close_file(fd)
    
    // [>= 0] (is_valid)
    bl is_valid                // valid_result = is_valid(result)
    
    ldp x29, x30, [sp], #16
    ret

// === Sign言語のリスト構造実装 ===
// リスト: [要素0, 要素1, 要素2, 要素3] をメモリ上に構築
create_list_4:
    // x0-x3: 4つの要素
    // 戻り値: リストのアドレス
    stp x29, x30, [sp, #-48]!
    mov x29, sp
    
    // 4要素分のメモリを確保 (32バイト)
    mov x4, #32
    bl alloc_buffer            // list_addr = alloc_buffer(32)
    
    // 要素を順次格納
    str x0, [x0, #0]           // list[0] = 要素0
    str x1, [x0, #8]           // list[1] = 要素1
    str x2, [x0, #16]          // list[2] = 要素2
    str x3, [x0, #24]          // list[3] = 要素3
    
    ldp x29, x30, [sp], #48
    ret

// get演算子の実装: list ' index
list_get:
    // x0: リストアドレス, x1: インデックス
    lsl x1, x1, #3             // index * 8 (8バイトオフセット)
    add x0, x0, x1             // list + offset
    ldr x0, [x0]               // リストの要素を取得
    ret

// === ファイル読み込み（積演算子による段階別処理） ===
// read_file : filename ?
//     $fd_storage # [ safe_open filename ],
//     $size_storage # [ safe_read @$fd_storage buffer_storage BUFFER_SIZE ],
//     safe_close @$fd_storage,
//     buffer_storage
read_file:
    stp x29, x30, [sp, #-32]!
    mov x29, sp
    stp x19, x20, [sp, #16]    // 保存レジスタ
    
    mov x19, x0                // filename を保存
    
    // 1. $fd_storage # [ safe_open filename ]
    mov x0, x19                // filename
    bl safe_open               // fd = safe_open(filename)
    ldr x1, =fd_storage
    str x0, [x1]               // fd_storage = fd
    mov x20, x0                // fd を x20 に保存
    
    // 2. $size_storage # [ safe_read @$fd_storage buffer_storage BUFFER_SIZE ]
    mov x0, x20                // fd
    ldr x1, =file_buffer       // buffer_addr
    ldr x2, =BUFFER_SIZE
    ldr x2, [x2]               // buffer_size
    bl safe_read               // size = safe_read(fd, buffer, size)
    ldr x1, =size_storage
    str x0, [x1]               // size_storage = size
    mov x21, x0                // size を x21 に保存
    
    // 3. safe_close @$fd_storage
    mov x0, x20                // fd
    bl safe_close              // close_result = safe_close(fd)
    mov x22, x0                // close_result を x22 に保存
    
    // 4. リスト構築: [fd, size, close_result, buffer_addr]
    mov x0, x20                // fd
    mov x1, x21                // size
    mov x2, x22                // close_result
    ldr x3, =file_buffer       // buffer_addr
    bl create_list_4           // list = create_list_4(fd, size, close_result, buffer)
    
    ldp x19, x20, [sp, #16]
    ldp x29, x30, [sp], #32
    ret

// === ファイル書き込み（積演算子による段階別処理） ===
// write_file : filename data_addr data_size ?
//     $fd_storage # [ safe_open filename ],
//     $size_storage # [ safe_write @$fd_storage data_addr data_size ],
//     safe_close @$fd_storage,
//     @$size_storage
write_file:
    stp x29, x30, [sp, #-48]!
    mov x29, sp
    stp x19, x20, [sp, #16]
    stp x21, x22, [sp, #32]    // 保存レジスタ
    
    mov x19, x0                // filename
    mov x20, x1                // data_addr
    mov x21, x2                // data_size
    
    // 1. $fd_storage # [ safe_open filename ]
    mov x0, x19
    bl safe_open
    ldr x1, =fd_storage
    str x0, [x1]
    mov x22, x0                // fd
    
    // 2. $size_storage # [ safe_write @$fd_storage data_addr data_size ]
    mov x0, x22                // fd
    mov x1, x20                // data_addr
    mov x2, x21                // data_size
    bl safe_write
    ldr x1, =size_storage
    str x0, [x1]
    mov x23, x0                // written_size
    
    // 3. safe_close @$fd_storage
    mov x0, x22
    bl safe_close
    mov x24, x0                // close_result
    
    // 4. リスト構築とsize_storageの取得
    mov x0, x22                // fd
    mov x1, x23                // written_size
    mov x2, x24                // close_result
    mov x3, x23                // @$size_storage (最終結果)
    bl create_list_4
    
    ldp x21, x22, [sp, #32]
    ldp x19, x20, [sp, #16]
    ldp x29, x30, [sp], #48
    ret

// === 論理積演算の実装（エラーハンドリング用） ===
// Sign言語の & 演算子：左辺が真なら右辺、偽なら_
logical_and:
    // x0: 左辺, x1: 右辺
    cmp x0, #0                 // 左辺が0(Unit)かチェック
    csel x0, x1, x0, ne        // 左辺が非0なら右辺、そうでなければ左辺(Unit)
    ret

// === エラーハンドリング付きラッパー関数 ===
// safe_read_file : filename ?
//     [&] [[[read_file filename] '],] 0 1 2 3
//      | `読み込み失敗`
safe_read_file:
    stp x29, x30, [sp, #-32]!
    mov x29, sp
    stp x19, x20, [sp, #16]
    
    mov x19, x0                // filename
    
    // read_file filename
    bl read_file               // list = read_file(filename)
    mov x20, x0                // list を保存
    
    // 各要素をチェック: list'0 & list'1 & list'2 & list'3
    mov x0, x20
    mov x1, #0
    bl list_get                // elem0 = list'0
    mov x1, x0
    
    mov x0, x20
    mov x1, #1
    bl list_get                // elem1 = list'1
    bl logical_and             // elem0 & elem1
    mov x1, x0
    
    mov x0, x20
    mov x1, #2
    bl list_get                // elem2 = list'2
    bl logical_and             // (elem0 & elem1) & elem2
    mov x1, x0
    
    mov x0, x20
    mov x1, #3
    bl list_get                // elem3 = list'3
    bl logical_and             // ((elem0 & elem1) & elem2) & elem3
    
    // 結果チェック：成功なら最終要素、失敗ならエラーメッセージ
    cmp x0, #0
    b.eq .read_error
    
    // 成功：最終要素（バッファアドレス）を返す
    mov x0, x20
    mov x1, #3
    bl list_get
    b .read_end
    
.read_error:
    // 失敗：エラーメッセージのアドレスを返す
    ldr x0, =read_error_msg
    
.read_end:
    ldp x19, x20, [sp, #16]
    ldp x29, x30, [sp], #32
    ret

// === 実用例とテストデータ ===
.section .data
// hello_message : `Hello, Sign Language!\n`
hello_message:
    .ascii "Hello, Sign Language!\n"
hello_message_end:

// message_size : 21
message_size:
    .quad hello_message_end - hello_message

// test_filename : `test.txt`
test_filename:
    .asciz "test.txt"

// エラーメッセージ
read_error_msg:
    .asciz "読み込み失敗"
write_error_msg:
    .asciz "書き込み失敗"

// === システム終了 ===
exit_success:
    mov x8, #93                // sys_exit
    mov x0, #0                 // status = 0
    svc #0

exit_error:
    mov x8, #93                // sys_exit
    mov x1, #1                 // status = 1
    svc #0

// === メイン関数（使用例実行） ===
_start:
    // 基本的な使用例
    ldr x0, =test_filename
    ldr x1, =hello_message
    ldr x2, =message_size
    ldr x2, [x2]
    bl write_file              // write_result = write_file(...)
    
    ldr x0, =test_filename
    bl read_file               // read_result = read_file(...)
    
    // 正常終了
    bl exit_success

.section .note.GNU-stack,"",%progbits