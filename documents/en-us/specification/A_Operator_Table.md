# Sign Language Operator Symbol Table (Priority Order)

## Basic Principles
- Prefix operators must be placed immediately before the target value (must not be separated from the target value by spaces)
- Postfix operators must be placed immediately after the target value (must not be separated from the target value by spaces)
- Infix operators must be placed between target values and separated by spaces
- Expression using only operators without reserved words
- Alignment between natural meaning of symbols and operational meaning
- Arranged from lowest priority (evaluated later) to highest priority
- Coproduct operators can be considered as simple delimiters, and all spaces can be regarded as coproduct operators
- The reason spaces can be regarded as delimiters is that the priority with product operators can be appropriately determined in subsequent processing
- Line breaks can also be considered as operators, in which case their function has the meaning of evaluation on a line-by-line basis
- The meaning of line breaks can be replaced with either `|`, `,`, or ` ` (space)

## Complete Operator List

| Priority | Symbol | Position | Function | Natural Meaning | Operational Semantics |
|----------|--------|----------|----------|-----------------|---------------------|
| 1 | `#` | prefix | export | Hashtag (public/discoverable) | Make name discoverable from outside |
| 2 | `:` | infixR | define | That is (identification) | Bind left-hand name to right-hand value |
| 3 | `#` | infix | output | Hashtag (association) | Associate data with address |
| 4 | ` ` | infix | apply | Coproduct (concatenation) | Function application |
| 4 | `,` | infixR | product | Product (structural assembly) | List construction |
| 5 | ` ` | infix | compose | Coproduct (concatenation) | Left-associative function composition |
| 6 | ` ` | infix | push | Coproduct (concatenation) | Add to list |
| 6 | ` ` | infix | concat | Coproduct (concatenation) | List concatenation |
| 6 | ` ` | infix | construct | Coproduct (concatenation) | Left-associative list construction |
| 7 | `?` | infixR | lambda | Question (what to do?) | Function definition |
| 8 | `~` | infix | range | Around (range vicinity) | Range list construction |
| 8 | `~+` | infix | range | Around (range vicinity) | Arithmetic progression specification |
| 8 | `~-` | infix | range | Around (range vicinity) | Descending arithmetic progression specification |
| 8 | `~*` | infix | range | Around (range vicinity) | Geometric progression specification |
| 8 | `~/` | infix | range | Around (range vicinity) | Exponential progression specification |
| 8 | `~^` | infix | range | Around (range vicinity) | Range list construction |
| 9 | `~` | prefix | continuous | Around (entire vicinity) | Continuous list construction |
| 10 | `;` | infix | xor | Exclusive relationship | Exclusive logical OR |
| 10 | `\|` | infix | or | Or (passage) | Logical OR (short-circuit evaluation) |
| 11 | `&` | infix | and | And (connection) | Logical AND (short-circuit evaluation) |
| 12 | `!` | prefix | not | Negation | Logical negation |
| 13 | `<` | infix | less | Less than | Comparison operation |
| 13 | `<=` | infix | less_equal | Less than or equal | Comparison operation |
| 13 | `=` | infix | equal | Equal | Comparison operation |
| 13 | `==` | infix | equal | Equal | Comparison operation |
| 13 | `>=` | infix | more_equal | Greater than or equal | Comparison operation |
| 13 | `>` | infix | more | Greater than | Comparison operation |
| 13 | `!=` | infix | not_equal | Not equal | Comparison operation |
| 14 | `+` | infix | add | Addition | Arithmetic operation |
| 14 | `-` | infix | sub | Subtraction | Arithmetic operation |
| 15 | `*` | infix | mul | Multiplication | Arithmetic operation |
| 15 | `/` | infix | div | Division | Arithmetic operation |
| 15 | `%` | infix | mod | Modulo | Arithmetic operation |
| 16 | `^` | infixR | pow | Exponentiation | Exponential operation |
| 17 | `!` | postfix | factorial | Factorial | Factorial operation |
| 18 | `\|...\|` | enclosure | abs | Absolute value | Absolute value operation |
| 19 | `~` | postfix | expand | Around (expand to surroundings) | Expansion |
| 20 | `$` | prefix | address | Money (abstraction of value) | Address acquisition |
| 21 | `'` | infix | get | Possessive ('s with s omitted) | Get value from structure |
| 21 | `@` | infixR | get | At (at ~) | Get value from structure |
| 22 | `@` | prefix | input | At (at ~) | Get data from address |
| 23 | `<<` | infix | shift Left | shift Left | Bit Shift to Left |
| 23 | `>>` | infix | shift right | shift right | Bit Shift to right |
| 24 | `\|\|` | infix | bit or | bit or | bit or |
| 25 | `;;` | infix | bit xor | bit xor | bit xor |
| 26 | `&&` | infix | bit and | bit and | bit and |
| 27 | `!!` | prefix | bit not | bit flip | bit not |
| 28 | `@` | postfix | import | At (from ~) | Get from file |
| 29 | `(...)` | enclosure | block | Block | Inline block construction |
| 29 | `{...}` | enclosure | block | Block | Inline block construction |
| 29 | `[...]` | enclosure | block | Block | Inline block construction |
| 29 | `\t` | prefix | indent | Indent | Indented block construction |

※Conditional branching is only represented by match_case expressions using function block syntax.
※When you want to perform function composition with right associativity, use parentheses to make it explicit.


## Special Symbols

| Symbol | Function | Natural Meaning | Operational Semantics |
|--------|----------|-----------------|---------------------|
| `_` | unit | Visible no-value (explicit empty) | Empty list/identity morphism/unit element |

## Design Philosophy
- **Symbols understandable by everyone**: Prioritize intuitive understanding over mathematical rigor
- **Correspondence with natural language**: Programs can be read as sentences
- **Elimination of reserved words**: Avoid ambiguity of word meanings, emphasize clarity of symbols
- **Function as meta-language**: Any language paradigm can be implemented as functions
