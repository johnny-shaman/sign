# Sign Language Preprocessor Design: Syntax Candidates

## 1. Argument Name Standardization and Position-based Conversion

Sign language's preprocessor automatically converts user-written argument names to position-based standard identifiers (`_0`, `_1`, `_2`...). This unifies processing within the compiler and facilitates optimization.

```sign
`Original syntax
increment : n ? n + 1
add : x y ? x + y

L : x ? x
R : _ ~x ? x

map : f x ~y ? @f x , map y~
map $[* 2] 1 2 3 4 5

`After conversion
increment : _0 ? _0 + 1
add : _0 _1 ? _0 + _1

L : _0 ? _0
R : _0 ~_1 ? _1

map : _0 _1 ~_2 ? @_0 _1 , map _2~
map $[* 2] 1 2 3 4 5
```

This conversion realizes conflict avoidance of argument names and unification of compiler internal processing.

## 2. Partial Application and Argument Order Conversion

```
`Original syntax
twice : f ? f f
flip : f x y ? f y x
f : x y z ? x * y + z
g : f 2 _ 3

`After conversion
twice : _0 ? _0 _0
flip : _0 ? _1 _2 ? _0 _2 _1
f : _0 _1 _2 ? _0 * _1 + _2
g : _0 ? f 2 _0 3
```

## 3. Preprocessing Optimization Strategy Based on Memory Size and Usage Count (Postponed in Minimal Implementation!)

Sign language's preprocessor applies optimal conversion strategies based on memory size and usage count of defined literals:

| Classification | Usage Count = 1 | Usage Count > 1 |
|----------------|-----------------|-----------------|
| Small Literals (<32B) | Complete inline expansion | Complete inline expansion |
| Medium/Large Literals (≥32B) | Complete inline expansion | Table reference sharing |
| Recursive Functions (all sizes) | Table reference | Table reference |
| Export Definitions | Table reference | Table reference |

As shown in the table, a table showing identifiers and their locations is necessary.

Inline expansion means...

```
`Original syntax
add : [+]
add 2 3

`After conversion
[+] 2 3
```

## 4. Optimal Conversion of Comparison Operation Polynomials (Needed in Initial Phase, but Unnecessary in Optimization Phase?)

Sign language comparison polynomials have a special structure where each comparison result is used as input for the next comparison, rather than simple comparison chains:

### Basic Conversion Rules

```sign
`Original syntax
3 < x = y < 20

`After conversion
[[[3 < x & x] = y & y] < 20] & y
```

```sign
`Original syntax
1 <= x <= 100

`After conversion
[[1 <= x & x] <= 100] & x
```

## 5. Conditional Branching with Block Syntax (Match Case Support)

Conditional branching with Sign language block syntax is converted to short-circuit evaluation chains without temporary variables.

### 5.1 Basic Conversion Pattern

```
`Original syntax
func : x ?
	condition1 : result1
	condition2 : result2
	condition3 : result3
	default_result

`After conversion
func : _0 ?
	condition1 & result1 |
	condition2 & result2 |
	condition3 & result3 |
	default_result
```

### 5.2 Utilizing Sign Language's Short-circuit Evaluation Characteristics

- Comparison operations: Return variable value on true, Unit(`_`) on false
- `condition & result`: If condition is true, return `result`; if false, return `_`
- `_ | next_condition`: If left side is `_`, evaluate right side

### 5.3 Conversion Examples

#### Number Classification
```
`Original syntax
classify : n ?
	n = 0 : `zero`
	n > 0 : `positive`
	n < 0 : `negative`

`After conversion
classify : _0 ?
	_0 = 0 & `zero` |
	_0 > 0 & `positive` |
	_0 < 0 & `negative`
```

#### Range Check
```
`Original syntax
grade : score ?
	score >= 90 : `A`
	score >= 80 : `B`
	score >= 70 : `C`
	score >= 60 : `D`
	`F`

`After conversion
grade : _0 ?
	_0 >= 90 & `A` |
	_0 >= 80 & `B` |
	_0 >= 70 & `C` |
	_0 >= 60 & `D` |
	`F`
```

#### Conditional Branching with Multiple Arguments
```
`Original syntax
compare : x y ?
	x > y : `greater`
	x = y : `equal`
	x < y : `less`

`After conversion
compare : _0 _1 ?
	_0 > _1 & `greater` |
	_0 = _1 & `equal` |
	_0 < _1 & `less`
```

#### Complex Conditions
```
`Original syntax
access_check : user role ?
	user = `admin` : `full_access`
	role = `moderator` & user != `guest` : `moderate_access`
	user != _ : `basic_access`
	`no_access`

`After conversion
access_check : _0 _1 ?
	_0 = `admin` & `full_access` |
	_1 = `moderator` & _0 != `guest` & `moderate_access` |
	_0 != _ & `basic_access` |
	`no_access`
```

## 6. General Block Syntax List Conversion (Automatic Insertion of `,` at End of Blocks)

For pure list construction in block syntax, automatic insertion of `,` product operators at the end of each line is performed.

### 6.1 Basic Conversion Rules

In pure list construction blocks that don't contain conditional expressions (`:` operator), `,` is automatically inserted at the end of each line.

```sign
`Original syntax
buildData :
	readFile `data1.txt`
	processRaw input
	validateData processed
	saveResult final

`After conversion
buildData :
	(readFile `data1.txt`),
	(processRaw input),
	(validateData processed),
	(saveResult final)
```

### 6.2 Final Line Processing

`,` is not inserted for the last element of the list.

```sign
`Original syntax
simpleList :
	1 + 2
	3 * 4
	5 - 1

`After conversion
simpleList :
	[1 + 2],
	[3 * 4],
	[5 - 1]
```

### 6.3 Automatic Parenthesis Insertion

Complex expressions are automatically surrounded by parentheses to guarantee evaluation order.

```sign
`Original syntax
calculations :
	x + y * z
	func a b c
	simpleValue

`After conversion
calculations :
	[x + y * z],
	[func a b c],
	simpleValue
```

## 7. Clarification of Problematic Patterns vs Allowed Patterns

### 7.1 Allowed Patterns

#### Pattern A: Pure Conditional Branching
```sign
`✅ Valid: Block with only conditional branching
classify : x ?
	x < 0 : `negative`
	x = 0 : `zero`
	x > 0 : `positive`
```

#### Pattern B: Pure List Construction
```sign
`✅ Valid: Block with only general processing
processSteps :
	step1 data
	step2 result
	step3 final
```

#### Pattern C: Single Expression Evaluation
```sign
`✅ Valid: Single complex expression
complexCalc : x ?
	calculateSomethingComplex x y z w
```

### 7.2 Problematic Patterns (Anti-patterns)

#### Problematic Mixed Pattern
```sign
`❌ Problem: Conditional expressions and general processing mixed at same level
processData : x ?
	preProcess x
	x < 0 : `negative`
	transform x
	x > 100 : `large`
	finalize x
```

#### Correct Mixed Pattern
```sign
`✅ Valid: Mixing conditional expressions and general processing
`Original syntax
processData : x ?
	preProcess x
	x < 0 : `negative`
		transform x
	x > 100 : `large`
		finalize x

`After conversion
processData : x ?
	preProcess x,
	[x < 0 : `negative`
		transform x],
	[x > 100 : `large`
		finalize x]
```

By indenting the return value block that hangs from conditions one more level down, this becomes correct notation.

### 7.3 Judgment Criteria

- **Allowed**: Block contains only conditional expressions or only general processing
- **Problem**: Conditional expressions (`:` operator) and general processing mixed at the same level within a block
- **Conversion**: For general processing only, automatic list conversion by `,` insertion

This specification maintains Sign language's "invisible strength" and design purity.