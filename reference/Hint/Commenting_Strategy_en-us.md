# Sign Language Commenting Rules

## Basic Principle

Sign language adopts a unique principle: "All literals that are not evaluated or whose results are not used are comments."

## Syntax Patterns That Become Comments

### 1. String Literals Starting from Line Beginning
```sign
`This is a valid comment`

`Multi-line
`comments require ` at the beginning of each line

`The closing ` at line end is optional
```

### 2. Isolated Literals (Not Used Within Statements)
```sign
`When numeric literals are isolated
42

`Even if defined, becomes comment if not used
variable_name

`Unused function definitions are also comments
[x ? x * 2]

`Expressions whose results are not used are also comments
x + y
```

### 3. Non-IO Expressions
```sign
`Defined but not exported with #
calc : x * 2

`Calculated but not output
result : some_function arg
`The above is actually a definition statement, so can be referenced later by the identifier 'result'
`However, it's not visible externally unless exported with #
```

## Syntax Patterns That Do NOT Become Comments

### 1. Definition Statements (Contains : operator)
```sign
`This is a definition statement (not a comment)
x : 42

`This is also a definition statement
func : x ? x * 2
```

### 2. Export Statements (Contains # operator)
```sign
`Executed because it's exported
#result : calculation

`Executed because it's output
output_port # data
```

### 3. Indented String Literals
```sign
func : x ?
	`This is not a comment (error due to indentation)`
	`This is an error (string not closed)
```

## Clarification of Judgment Criteria

| Syntax Pattern | Position | Judgment | Reason |
|----------------|----------|----------|---------|
| `string` | Line beginning | Comment | String literal is isolated |
| `string` | Within indent | Error | Isolated literal in block |
| `string | Line beginning (unclosed) | Comment | Treated as string until line end |
| `string | Within indent (unclosed) | Error | Syntax error |
| Number/identifier | Line beginning (isolated) | Comment | Unused literal |
| x : expression | Line beginning | Definition statement | Definition referenceable later |
| #x : expression | Line beginning | Export | Referenceable externally |

## IO Determinism Details

The principle "Code that is not IO'd is a comment" is determined through the following hierarchy:

1. **Immediate IO**: Output/export via `#` operator
2. **Indirect IO**: Called from functions that are IO'd
3. **Definition only**: Defined but not used
4. **Isolated**: Neither defined nor used → **Comment**

This mechanism naturally achieves self-documenting code and optimal resource utilization.