# Sign Language Type System

## 1. The Essence of "Invisible Strong Static Typing"

Sign language realizes the seemingly contradictory characteristic of being "strongly statically typed yet typeless." This is an innovative approach in language design:

- **Strong static typing aspect**: All values have clear types, and type mismatches are detected at compile time
- **Typeless aspect**: Programmers do not need to explicitly declare types and can code without being conscious of types

This duality is realized through a "list-based unified data model." Since all computational objects are unified under the concept of lists, the existence of types is not made apparent on the surface.

## 2. List-Based Unified Data Model

Sign language's type system is built around the unified concept of lists:

- **Strings** = List of characters ("lists of characters are treated as strings")
- **Boolean evaluation** = Pattern matching of values ("empty lists and unexecuted lambda terms are false")
- **Functions** = List of operations, or functionalization of operators
- **Collections** = List of values, or list of key-value pairs

This consistent approach minimizes special case handling and makes the language easier to learn and understand.

## 3. Numeric Literals and Hardware Type Correspondence

Numeric literals in Sign language function not just as values, but as types corresponding to hardware operations:

- **0x** (hexadecimal): Architecture address type, dedicated to memory access
- **0o** (octal): Special type for mainframe compatibility
- **0b** (binary): Register direct manipulation type (e.g., `0b0000` is 4-bit CPU register reset... for OS description purposes)
- **Regular numbers**: Numeric type that can be optimally delegated to FPU, SIMD, etc.

This distinction enables safe and intuitive expression of low-level hardware operations without type declarations.

## 4. Value Return Characteristics of Comparison Operations

Comparison operations in Sign language have the characteristic of returning concrete values rather than just boolean values.

### 4.1 Basic Principle

- When a comparison condition evaluates to `true`, the comparison operation returns **the value of the variable term**
  - Usually the value of the right side (especially variables) is returned
  - When the right side is a constant literal, the variable value on the left side is returned
  - Essentially, it returns the variable that is "meaningful as a value" in the comparison
- When a comparison condition evaluates to `false`, the comparison operation returns **Unit (`_`)**
- This mechanism allows conditional branching to be treated directly as values without boolean conversion

### 4.2 Evaluation Order and Variable Value Return in Polynomial Comparisons

Polynomials containing comparison operations are evaluated sequentially from left to right, with the result of each comparison becoming the input for the next comparison:

```
3 < x = y < 20
```

This expression is equivalent to:

```
[[3 < x & x] = y & y] < 20 & y
```

Evaluation process:
1. If `3 < x` is `true`, **the value of variable x** is returned and becomes the left side of the next comparison
2. If `x = y` is `true`, **the value of variable y** is returned and becomes the left side of the next comparison
3. If `y < 20` is `true`, the final result is **the value of variable y**
4. If any condition is `false`, `_` (Unit) is returned at that point, and subsequent evaluations are short-circuited

### 4.3 Practical Examples

This characteristic allows conditional branching to be described concisely and expressively:

```sign
getValue : x ?
` If x < 0 is true, the value of x itself is returned and used for -x calculation
	x < 0 : -x
` If x > 100 is true, the value of x itself is returned, then ignored and 100 is returned
	x > 100 : 100
` Default returns x itself
	x

inRange : x ?
` If 0 <= x and x <= 100, return x itself
	0 <= x <= 100 & x
` Otherwise return Unit (_)
```

## 5. Left-Side Priority Rule for Type Conversion

When types differ in binary operations, Sign language always converts the right side to match **the type of the left side**.

### 5.1 Basic Principle

- When the left and right sides of a binary operation have different types, the right side is converted to the type of the left side
- If conversion is not possible, a compile error occurs
- Type matching is verified at compile time as part of "invisible strong static typing"

### 5.2 Type Conversion Examples

```sign
` Result: `123456` (evaluated as string concatenation)
`123` + 456

` Result: 579 (evaluated as numeric addition, "456" converted to numeric 456)
123 + `456`
```

### 5.3 Theoretical Foundation of Operations

Sign language's type system basically adopts the type of the left side when operations involve different types.
This provides convenient functionality such as natural type conversion when you want to concatenate numbers as digits within strings.
This is because there is the concept that the right side of a binary operation acts as an object that applies to the verb when considering the operation as a verb.

## 6. Relationship Between Identifiers and Types

Identifiers in Sign language have characteristics different from traditional type systems. The identifier names themselves function as type names, enabling flexible type expression.
This design allows natural expression of type information through identifiers without explicit type declarations.

## 7. Safe Design of Division Processing

### 7.1 Constraint Removal in Division Operators

Sign language adopts an innovative approach to avoid traditional "division by zero errors" in division processing:

- In division operations of the form `a / b`, the result should be a floating-point type with the best precision available on that architecture
- When the denominator is 0, it is treated as division by the smallest representable value on that architecture
- This specification is based on the zero element in differentiable space and the assumption that a true physical vacuum does not exist
- In most cases, the above is expected to result in register overflow

### 7.2 Philosophy of Safety

Programmers are protected from potential runtime errors while using intuitive mathematical notation.

By extending Sign language's philosophy that "syntax guarantees types," the powerful characteristic that "syntax also guarantees safety" can be realized.

## 8. Type Safety and Hardware Optimization

Sign language's type system balances both safety and efficiency:

Compile-time type verification: Strong static typing prevents runtime errors
Type information-based optimization: The compiler uses type information to select appropriate processing

This design allows programmers to write safe and efficient code without being conscious of types.

## 9. Innovative Approach to Language Design

Sign language walks the opposite path from conventional language design:

- **Conventional languages**: Abstract computer operations and add complex safety mechanisms
- **Sign language**: Abstract the language itself and make computer operations intuitively expressible

The type system also reflects this philosophy, taking the innovative approach of "achieving simplicity by not showing types while maintaining powerful type safety behind the scenes."