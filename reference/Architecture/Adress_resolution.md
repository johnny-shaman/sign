# Sign言語：階層的アドレス解決チェーン実装

## 1. 基本概念

Sign言語のマルチコアアーキテクチャでは、各コアが「知らないアドレス」に遭遇した場合、階層的なチェーンを通じて適切なコアに処理を委譲します。

- **出力（書き込み）**: ボトムアップ（演算コア → スタック → メモリ → IO）
- **入力（読み込み）**: トップダウン（IO → メモリ → スタック → 演算コア）

## 2. 出力処理チェーン（ボトムアップ）

### 2.1 演算コア（最初の処理者）

```sign
# 演算コアでの出力処理
compute_core_output : addr data ?
    # 自分の管轄範囲かチェック
    addr >= 0x00000000 & addr <= 0x0FFFFFFF : 
        # 直接処理可能
        addr # data
        data  # 成功時は値を返す
    
    # 知らないアドレスなら次の階層に委譲
    stack_core_output addr data

# 使用例
result : compute_core_output 0x25000000 `hello`
# 0x25xxxxxx は演算コアの管轄外 → 自動的にチェーンが開始
```

### 2.2 スタック管理コア

```sign
# スタック管理コアでの出力処理
stack_core_output : addr data ?
    # 自分の管轄範囲かチェック
    addr >= 0x10000000 & addr <= 0x1FFFFFFF :
        # 直接処理可能
        addr # data
        data  # 成功時は値を返す
    
    # 知らないアドレスなら次の階層に委譲
    memory_core_output addr data

# コールスタックやデータスタックへの書き込みを処理
stack_write_example : ?
    call_frame : 0x10FF0000
    data_frame : 0x18000000
    
    call_frame # function_info   # スタックコアが直接処理
    data_frame # arguments       # スタックコアが直接処理
```

### 2.3 メモリ管理コア

```sign
# メモリ管理コアでの出力処理
memory_core_output : addr data ?
    # 自分の管轄範囲かチェック
    addr >= 0x20000000 & addr <= 0x3FFFFFFF :
        # 直接処理可能
        addr # data
        data  # 成功時は値を返す
    
    # 知らないアドレスなら最終階層に委譲
    io_core_output addr data

# ヒープや共有メモリへの書き込みを処理
memory_write_example : ?
    heap_ptr : 0x20001000
    shared_mem : 0x30000000
    
    heap_ptr # allocated_data    # メモリコアが直接処理
    shared_mem # inter_core_data # メモリコアが直接処理
```

### 2.4 IO管理コア（最終責任者）

```sign
# IO管理コア（チェーンの終端）
io_core_output : addr data ?
    # 自分の管轄範囲かチェック
    addr >= 0x40000000 & addr <= 0x4FFFFFFF :
        # 直接処理可能
        addr # data
        data  # 成功時は値を返す
    
    # 誰も知らないアドレス → 安全な失敗
    _  # Unit を返す（例外ではなく）

# 周辺機器への書き込みを処理
io_write_example : ?
    uart_out : 0x40000000
    gpio_out : 0x40010000
    
    uart_out # `Hello World`     # IOコアが直接処理
    gpio_out # 0b11110000        # IOコアが直接処理
```

## 3. 入力処理チェーン（トップダウン）

### 3.1 IO管理コア（最初の処理者）

```sign
# IO管理コアでの入力処理
io_core_input : addr ?
    # 自分の管轄範囲かチェック
    addr >= 0x40000000 & addr <= 0x4FFFFFFF :
        # 直接読み取り可能
        @addr
    
    # 知らないアドレスなら次の階層に委譲
    memory_core_input addr

# 周辺機器からの読み取りを処理
io_read_example : ?
    uart_in : @0x40000000       # IOコアが直接処理
    gpio_in : @0x40010000       # IOコアが直接処理
    
    uart_in
```

### 3.2 メモリ管理コア

```sign
# メモリ管理コアでの入力処理
memory_core_input : addr ?
    # 自分の管轄範囲かチェック
    addr >= 0x20000000 & addr <= 0x3FFFFFFF :
        # 直接読み取り可能
        @addr
    
    # 知らないアドレスなら次の階層に委譲
    stack_core_input addr

# ヒープや共有メモリからの読み取りを処理
memory_read_example : ?
    heap_data : @0x20001000     # メモリコアが直接処理
    shared_data : @0x30000000   # メモリコアが直接処理
    
    heap_data
```

### 3.3 スタック管理コア

```sign
# スタック管理コアでの入力処理
stack_core_input : addr ?
    # 自分の管轄範囲かチェック
    addr >= 0x10000000 & addr <= 0x1FFFFFFF :
        # 直接読み取り可能
        @addr
    
    # 知らないアドレスなら最終階層に委譲
    compute_core_input addr

# スタック領域からの読み取りを処理
stack_read_example : ?
    call_info : @0x10FF0000     # スタックコアが直接処理
    stack_args : @0x18000000    # スタックコアが直接処理
    
    call_info
```

### 3.4 演算コア（最終責任者）

```sign
# 演算コア（チェーンの終端）
compute_core_input : addr ?
    # 自分の管轄範囲かチェック
    addr >= 0x00000000 & addr <= 0x0FFFFFFF :
        # 直接読み取り可能
        @addr
    
    # 誰も知らないアドレス → 安全な失敗
    _  # Unit を返す（例外ではなく）

# ワーキング領域からの読み取りを処理
compute_read_example : ?
    work_data : @0x00001000     # 演算コアが直接処理
    simd_data : @0x00002000     # 演算コアが直接処理
    
    work_data
```

## 4. 統合されたアドレス操作

### 4.1 透過的なアドレスアクセス

```sign
# プログラマが実際に書くコード
simple_program : ?
    # 様々なアドレス空間への読み書きが混在
    input_data : @0x40000000      # IO領域（自動的にチェーン開始）
    @0x20001000 # input_data      # メモリ領域（自動的にチェーン開始）
    processed : @0x20001000 * 2   # メモリから読み取り → 演算
    0x40010000 # processed        # IO領域への出力（自動的にチェーン開始）

# プログラマには見えない内部処理：
# 1. @0x40000000: 演算コア → スタック → メモリ → IO（IO領域なので処理）
# 2. 0x20001000 # input_data: 演算コア → スタック → メモリ（メモリ領域なので処理）
# 3. @0x20001000: 演算コア → スタック → メモリ（メモリ領域なので処理）
# 4. 0x40010000 # processed: 演算コア → スタック → メモリ → IO（IO領域なので処理）
```

### 4.2 エラー処理の統合

```sign
# 安全なアドレスアクセス
safe_access_example : ?
    # 存在しないアドレス空間へのアクセス
    result1 : @0x80000000  # 誰も知らない → Unit(_)が返る
    result2 : 0x90000000 # `data`  # 誰も知らない → Unit(_)が返る
    
    # Sign言語らしい安全な処理
    result1 = _ : `読み取り失敗`
                 `読み取り成功: ` result1
    
    result2 = _ : `書き込み失敗`
                 `書き込み成功`
```

## 5. ハードウェア実装の考慮

### 5.1 コア間通信インターフェース

```sign
# 各コアが実装すべき標準インターフェース
core_interface : core_id ?
    # 入力処理メソッド
    handle_input_request : addr ? 
        in_my_address_range addr : direct_read addr
        forward_to_next_core addr
    
    # 出力処理メソッド
    handle_output_request : addr data ?
        in_my_address_range addr : direct_write addr data
        forward_to_next_core addr data
    
    # アドレス範囲チェック
    in_my_address_range : addr ?
        addr >= my_addr_start & addr <= my_addr_end
```

### 5.2 ハードウェア最適化

```sign
# ハードウェアレベルでの最適化
hardware_optimization : ?
    # 1. 管轄範囲チェックは専用ハードウェアで高速化
    # 2. コア間メッセージパッシングは専用バスで実装
    # 3. チェーンの途中結果はキャッシュして効率化
    
    address_range_checker : addr core_id ?
        # 1クロックでのアドレス範囲判定
        hardware_range_check addr core_id
    
    inter_core_bus : source_core target_core message ?
        # 専用バスでの高速メッセージ転送
        hardware_message_transfer source_core target_core message
```

## 6. パフォーマンス特性

### 6.1 最良ケース
```sign
# 直接アクセス可能な場合：1クロック
direct_access : 0x00001000 # data  # 演算コアの管轄内
```

### 6.2 最悪ケース
```sign
# 全チェーンを辿る場合：4クロック
full_chain_access : 0x40000000 # data  # 演算 → スタック → メモリ → IO
```

### 6.3 エラーケース
```sign
# 無効アドレスの場合：4クロック + Unit返却
invalid_access : 0x80000000 # data  # 全チェーンを辿って最終的にUnit
```

## 7. Sign言語の哲学との完全な調和

この階層的アドレス解決チェーンは、Sign言語の核となる設計哲学を完璧に体現しています：

1. **見えない強さ**: プログラマはコア間の複雑な処理を意識しない
2. **安全性**: 例外ではなくUnit値による安全な失敗
3. **一貫性**: すべてのアドレスアクセスが同じパターンで処理
4. **効率性**: 余計な検索や解析を排除した最小限の処理
5. **自然さ**: データフローの方向と階層構造が論理的に一致

この設計により、Sign言語は真の意味での「Zero Cost Domain Abstraction」を実現し、プログラマーに見えない強力で安全な並列処理環境を提供します。
