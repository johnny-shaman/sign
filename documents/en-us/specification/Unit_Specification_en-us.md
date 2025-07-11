# Unit (`_`) Specification in Sign Language

## 1. Introduction

The Unit value (`_`) in Sign language is a core concept in the language design and possesses mathematically consistent characteristics. This document provides a comprehensive explanation from the theoretical foundations of Unit to implementation details.

## 2. Mathematical Foundations of Unit

### 2.1 Basic Properties

- **Properties as a value**: `_ = []` (equivalent to empty list)
- **Left identity element**: `_ X = X` (applying Unit from the left returns the argument as-is)
- **Function identity element**: `F _ = F` (in the categories of arithmetic and logic, passing Unit as an argument returns the function itself)
- **Duality**: It is both a value and a function simultaneously
- **Logical evaluation**: `_` evaluates to false
- **Address**: `$_ = _` (Unit's address value is Unit)
- **Input**: `@_ = _` (absorbing element behavior)
- **Output**: `$_ # X` behaves like file movement to /dev/null

### 2.2 Category Theory Background

In category theory, Unit has the role of identity morphism and natural transformation:

- **Identity morphism**: Functions as `_ : X → X`
- **Natural transformation**: Neutral transformation in function composition
- **Partial application transformer**: Unit position signifies order transformation

## 3. Complete Specification of Unit Operations

### 3.1 Interaction Between Logical Operators and Unit

Logical operators are based on short-circuit evaluation, and their interaction with Unit is defined as follows:

#### 3.1.1 Logical AND (`&`)

```
` If Unit is on the left, Unit(`_`) (short-circuit evaluation)
_ & X
`→ _

` If Unit is on the right, Unit(`_`) (evaluates up to the right side)
X & _
`→ _

` If the left side is true, return the value of the right side
true_value & X
`→ X
```

#### 3.1.2 Logical OR (`|`)

```
` If Unit is on the left, evaluate the right side
_ | X
`→ X

` If the left side is true, return the left side (short-circuit evaluation)
X | _
`→ X

` If the left side is false, evaluate the right side
false_value | X
`→ X
```

#### 3.1.3 Exclusive OR (`;`)

```
` Exclusive OR with Unit is always the other value
_ ; X
`→ X

` Exclusive OR with Unit is always the other value
X ; _
`→ X
```

#### 3.1.4 Negation (`!`)

```
` Negation of Unit (treated as false) returns a non-Unit value (treated as true)
!_
```

### 3.2 Interaction Between Arithmetic/Comparison Operators and Unit

Interaction with operators other than Unit returns partially applied lambda expressions:

#### 3.2.1 Arithmetic Operators (`+`, `-`, `*`, `/`, `%`, `^`)

```
`Returns a lambda "add X when Unit is replaced"
_ + X
` →[y ? y + X]

`Returns a lambda "add to X when Unit is replaced"
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
`Returns a lambda "compare with < X when Unit is replaced"
_ < X
` → [y ? y < X]  

`Returns a lambda "compare X < when Unit is replaced"
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
` Unit behaves as a left identity element
_ X
` → X

` Applying Unit to a function returns the function itself
F _
` → F
```

## 4. Optimal Implementation on ARM64

### 4.1 Representation of Unit Values

- **Dedicated use of xZR**: Use xZR as the Unit representation register (always holds zero)
- **Callee-saved**: Maintain consistency across functions

### 4.2 Empty Stack Processing Using Conditional Instructions

```assembly
// Efficient empty stack POP using conditional instructions
cmp sp, xZR              // Stack boundary check
csel x0, xZR, x0, eq     // Unit if empty, stack value otherwise
cbnz sp, .pop_value      // Branch only when actual POP operation is needed
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
csel x16, x30, x9, eq    // x30 (link register) if NULL, function pointer otherwise
blr x16                  // Conditional call (essentially NOP if NULL)
```

### 4.4 Implementation of Partial Application and Order Transformation

```assembly
// Compilation result of myFunc _ 4 (order transformation)
// 1. Capture fixed arguments
mov w8, #4               // Load fixed argument (4)
str w8, [x28]            // Save to closure environment

// 2. Generate transformed function
adr x9, .Ltransformed    // Address of transformed function
mov x0, x9               // Set function pointer as return value
ret

// 3. Implementation of transformed function
.Ltransformed:
ldr w1, [x28]            // Get fixed argument (4)
mov w9, w0               // Save newly given argument
mov w0, w9               // Set as first argument (order transformation)
bl myFunc                // Call original function
ret
```

### 4.5 Optimization Benefits of Conditional Instructions

1. **Avoiding branch prediction misses**: Prevents pipeline stalls
2. **Reduced instruction count**: More efficient execution paths
3. **Instruction-level parallelism**: Can execute in parallel with other instructions
4. **Efficiency on modern processors**: High performance on latest ARM64 processors

### 4.6 Optimization Patterns

- **Conditional Select (CSEL)**: Optimal for Unit/value selection
- **Conditional Increment (CINC)**: Counter operation optimization
- **Conditional Set (CSET)**: Flag-based computation optimization
- **Conditional Data Processing (CCMP)**: Efficient processing of compound conditions

## 5. Practical Examples and Applications

### 5.1 Conditional Branching Using Unit

```sign
` Return x if x is positive, otherwise return Unit
isPositive : x ? x > 0

` Usage example
` "negative or zero" is returned
result : isPositive -5 | `negative or zero`

` 10 is returned
result : isPositive 10 | `negative or zero`
```

### 5.2 Partial Application Using Unit

```sign
add : x y ? x + y
` Lambda waiting for something to be put into y
addSomething : add _

` Usage example
` Result is a function that "adds 5"
addFive : addSomething 5
` Result is 8
addFive 3
```

### 5.3 Argument Order Transformation

```sign
` Example of order transformation through partial application
myFunc : x y z ? x * y + z

` Transform argument order by specifying _ at the 2nd argument position
partialFunc : myFunc _ 4 7  `Fix y=4, z=7

` When called: partialFunc 3 is equivalent to myFunc 3 4 7
result : partialFunc 3  `Result is 3 * 4 + 7 = 19
```

## 6. Handling Unevaluated Lambdas

### 6.1 Evaluation in Logical Context

- Unexecuted lambda terms are evaluated as false
- In other contexts, they are treated as normal lambdas

### 6.2 Function Existence Check

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

1. **Consistency**: Unit is a consistent way to express "no value yet" or "invalid value"
2. **Natural short-circuit evaluation**: Provides semantically correct short-circuit evaluation in logical operations
3. **Extension of partial application**: Extends the partial application mechanism by returning lambdas even for arithmetic and comparison operators
4. **Error avoidance**: Enables flexible programming by returning Unit or lambdas rather than generating runtime errors

## 9. Integration of Theory and Implementation

Sign language's Unit design beautifully integrates deep mathematical foundations with efficient implementation:

- **Category theory foundation**: Unit concept functions as identity morphism and natural transformation
- **Functional paradigm**: Partial application and composition are naturally expressed
- **Exception-free design**: All operations have mathematically consistent results
- **Execution efficiency**: Generates highly efficient code while maintaining theoretical beauty

Sign language, centered on the concepts of "invisible strong typing" and "Unit," achieves both theoretical purity and practical efficiency. In particular, by leveraging ARM64 architecture's conditional instructions, the core functionality of Unit processing in Sign language can be maximally optimized.

Through this implementation approach, Sign language holds great potential as a language that is not only theoretically beautiful but also operates with high efficiency in actual computational environments.