# Sign Language Unit (`_`) Specification

## 1. Introduction

The Unit value (`_`) in Sign language is a core concept that forms the foundation of the language design, possessing mathematically consistent properties. This document provides comprehensive coverage from theoretical foundations to implementation details of Unit.

## 2. Mathematical Foundations of Unit

### 2.1 Basic Properties

- **Value property**: `_ = []` (equivalent to empty list)
- **Left identity**: `_ X = X` (applying Unit from the left returns the argument unchanged)
- **Function identity**: `F _ = F` (in arithmetic and logical categories, passing Unit as an argument returns the function itself)
- **Duality**: Functions as both a value and a function simultaneously
- **Logical evaluation**: `_` evaluates to false
- **Address**: `$_ = 0x0` (Unit's address value is 0)
- **Input**: `@_ = _` (absorbing element behavior)
- **Output**: `$_ # X` behaves like file movement to /dev/null

### 2.2 Category-Theoretic Background

In category theory, Unit plays the role of identity morphism and natural transformation:

- **Identity morphism**: Functions as `_ : X → X`
- **Natural transformation**: Neutral transformation in function composition
- **Partial application transformer**: Unit position indicates order transformation

## 3. Complete Specification of Unit Operations

### 3.1 Interaction Between Logical Operators and Unit

Logical operators are based on short-circuit evaluation, and their interaction with Unit is defined as follows:

#### 3.1.1 Logical AND (`&`)

```
` If Unit is the left operand, return Unit (_) (short-circuit evaluation)
_ & X
`→ _

` If Unit is the right operand, return Unit (_) (evaluate up to right operand)
X & _
`→ _

` If left operand is true, return the value of the right operand
true_value & X
`→ X
```

#### 3.1.2 Logical OR (`|`)

```
` If Unit is the left operand, evaluate the right operand
_ | X
`→ X

` If left operand is true, return the left operand (short-circuit evaluation)
X | _
`→ X

` If left operand is false, evaluate the right operand
false_value | X
`→ X
```

#### 3.1.3 Exclusive OR (`;`)

```
` Exclusive OR with Unit always returns the other value
_ ; X
`→ X

` Exclusive OR with Unit always returns the other value
X ; _
`→ X
```

#### 3.1.4 Negation (`!`)

```
` Negation of Unit (treated as false) returns a non-Unit value (treated as true)
!_
```

### 3.2 Interaction Between Arithmetic/Comparison Operators and Unit

In interactions with operators other than Unit, partially applied lambda expressions are returned:

#### 3.2.1 Arithmetic Operators (`+`, `-`, `*`, `/`, `%`, `^`)

```
` "If Unit is replaced, add X" lambda is returned
_ + X
` →[y ? y + X]

` "If Unit is replaced, add to X" lambda is returned
X + _
` →[y ? X + y]
```

Similarly:
```
_ - X
` → [y ? y - X]
X - _
` → [y ? X - y]
_ * X
` → [y ? y * X]
X * _
` → [y ? X * y]
_ / X
` → [y ? y / X]
X / _
` → [y ? X / y]
_ % X
` → [y ? y % X]
X % _
` → [y ? X % y]
_ ^ X
` → [y ? y ^ X]
X ^ _
` → [y ? X ^ y]
```

#### 3.2.2 Comparison Operators (`<`, `<=`, `=`, `>=`, `>`, `!=`)

```
` "If Unit is replaced, compare with <X" lambda is returned
_ < X
` → [y ? y < X]  

` "If Unit is replaced, compare X<" lambda is returned
X < _
` → [y ? X < y]
```

Similarly:
```
_ <= X
` → [y ? y <= X]
X <= _
` → [y ? X <= y]
_ = X
` → [y ? y = X]
X = _
` → [y ? X = y]
_ >= X
` → [y ? y >= X]
X >= _
` → [y ? X >= y]
_ > X
` → [y ? y > X]
X > _
` → [y ? X > y]
_ != X
` → [y ? y != X]
X != _
` → [y ? X != y]
```

### 3.3 Interaction Between Function Application and Unit

```
` Unit behaves as left identity
_ X
` → X

` Applying Unit to a function returns the function itself
F _
` → F
```

## 4. Optimal Implementation on ARM64

### 4.1 Unit Value Representation

- **Dedicated xZR usage**: Use xZR as Unit representation register (always holds zero)
- **Callee-saved**: Maintain consistency across functions

### 4.2 Empty Stack Processing Using Conditional Instructions

```assembly
// Efficient empty stack POP using conditional instructions
cmp sp, xZR              // Check stack boundary
csel x0, xZR, x0, eq     // If empty, Unit; otherwise stack value
cbnz sp, .pop_value      // Branch only if actual POP operation is needed
.continue:
// Continue processing

.pop_value:
ldr x0, [sp], #8         // Actual POP operation
b .continue
```

### 4.3 Efficient Processing of Unit Functions (Empty Function Pointers)

```assembly
// Function pointer processing using conditional instructions
cmp x9, #0               // Check if function pointer is NULL
csel x16, x30, x9, eq    // If NULL, x30 (link register); otherwise function pointer
blr x16                  // Conditional call (essentially NOP if NULL)
```

### 4.4 Implementation of Partial Application and Order Transformation

```assembly
// Compilation result of myFunc _ 4 (order transformation)
// 1. Capture fixed argument
mov w8, #4               // Load fixed argument (4)
str w8, [x28]            // Save to closure environment

// 2. Generate transformed function
adr x9, .Ltransformed    // Address of transformed function
mov x0, x9               // Set function pointer as return value
ret

// 3. Implementation of transformed function
.Ltransformed:
ldr w1, [x28]            // Get fixed argument (4)
mov w9, w0               // Save newly provided argument
mov w0, w9               // Set as first argument (order transformation)
bl myFunc                // Call original function
ret
```

### 4.5 Optimization Benefits of Conditional Instructions

1. **Avoiding branch misprediction**: Prevents pipeline stalls
2. **Instruction count reduction**: More efficient execution paths
3. **Instruction-level parallelism**: Can execute in parallel with other instructions
4. **Efficiency on modern processors**: High performance on latest ARM64 processors

### 4.6 Optimization Patterns

- **Conditional selection (CSEL)**: Optimal for Unit/value selection
- **Conditional increment (CINC)**: Counter operation optimization
- **Conditional set (CSET)**: Flag-based computation optimization
- **Conditional data processing (CCMP)**: Efficient handling of compound conditions

## 5. Practical Examples and Applications

### 5.1 Conditional Branching Using Unit

```sign
` Return x if x is positive, otherwise return Unit
isPositive : x ? x > 0

` Usage examples
` Returns "negative or zero"
result : isPositive -5 | `negative or zero`

` Returns 10
result : isPositive 10 | `negative or zero`
```

### 5.2 Partial Application Using Unit

```sign
add : x y ? x + y
` Lambda that waits for something to be input to y
addSomething : add _

` Usage examples
` Result is "add 5" function
addFive : addSomething 5
` Result is 8
addFive 3
```

### 5.3 Argument Order Transformation

```sign
` Example of order transformation through partial application
myFunc : x y z ? x * y + z

` Specifying _ in the 2nd argument position transforms argument order
partialFunc : myFunc _ 4 7  `Fix y=4, z=7

` On call: partialFunc 3 is equivalent to myFunc 3 4 7
result : partialFunc 3  `Result is 3 * 4 + 7 = 19
```

## 6. Handling Unevaluated Lambdas

### 6.1 Evaluation in Logical Context

- Unexecuted lambda terms evaluate to false
- In other contexts, they are treated as normal lambdas

### 6.2 Function Existence Checking

```sign
` Existence check using address operator
$func & `exists` | `does not exist`
```

### 6.3 Type Checking

```sign
` Function determination through type checking
"f" = "?" & `is a function` | `is not a function`
```

## 7. Compiler Static Optimization Strategies

1. **Flow analysis**: Static tracking of stack state and function pointer state
2. **Redundant check elimination**: Remove checks when state is statically known
3. **Inlining**: Inline expansion of small functions or Unit functions
4. **Loop optimization**: Loop conversion of recursive functions
5. **Register allocation**: Efficient management of Unit-dedicated and general registers

## 8. Design Principles

The Unit operation design in Sign language is based on the following principles:

1. **Consistency**: Unit provides a consistent way to represent "no value yet" or "invalid value"
2. **Natural short-circuit evaluation**: Provides semantically correct short-circuit evaluation in logical operations
3. **Partial application extension**: Extends the partial application mechanism by returning lambdas even for arithmetic and comparison operators
4. **Error avoidance**: Enables flexible programming by returning Unit or lambdas rather than generating runtime errors

## 9. Integration of Theory and Implementation

The Unit design in Sign language brilliantly integrates deep mathematical foundations with efficient implementation:

- **Category-theoretic foundation**: Unit concept functions as identity morphism and natural transformation
- **Functional paradigm**: Partial application and composition are naturally expressed
- **Exception-free design**: All operations have mathematically consistent results
- **Execution efficiency**: Maintains theoretical beauty while enabling highly efficient code generation

Sign language achieves both theoretical purity and practical efficiency through the concepts of "invisible strong typing" and "Unit". By leveraging ARM64 architecture's conditional instructions, Unit processing—a core feature of Sign language—can be maximally optimized.

This implementation approach gives Sign language tremendous potential as a language that is not only theoretically beautiful but also operates with high efficiency in actual computing environments.