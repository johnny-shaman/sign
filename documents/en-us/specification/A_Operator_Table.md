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
| 5 | ` ` | infix | compose | Coproduct (concatenation) | Left-associative function composition |
| 6 | ` ` | infix | push | Coproduct (concatenation) | Add to list |
| 6 | ` ` | infix | concat | Coproduct (concatenation) | List concatenation |
| 6 | ` ` | infix | construct | Coproduct (concatenation) | Left-associative list construction |
| 7 | `?` | infixR | lambda | Question (what to do?) | Function definition |
| 8 | `,` | infixR | product | Product (structural assembly) | List construction |
| 9 |  `~` | infix | range | Around (range vicinity) | Range list construction |
| 10 | `~` | prefix | continuous | Around (entire vicinity) | Continuous list construction |
| 11 | `;` | infix | xor | Exclusive relationship | Exclusive logical OR |
| 11 | `\|` | infix | or | Or (passage) | Logical OR (short-circuit evaluation) |
| 12 | `&` | infix | and | And (connection) | Logical AND (short-circuit evaluation) |
| 13 | `!` | prefix | not | Negation | Logical negation |
| 14 | `<` | infix | less | Less than | Comparison operation |
| 14 | `<=` | infix | less_equal | Less than or equal | Comparison operation |
| 14 | `=` | infix | equal | Equal | Comparison operation |
| 14 | `==` | infix | equal | Equal | Comparison operation |
| 14 | `>=` | infix | more_equal | Greater than or equal | Comparison operation |
| 14 | `>` | infix | more | Greater than | Comparison operation |
| 14 | `!=` | infix | not_equal | Not equal | Comparison operation |
| 15 | `+` | infix | add | Addition | Arithmetic operation |
| 15 | `-` | infix | sub | Subtraction | Arithmetic operation |
| 16 | `*` | infix | mul | Multiplication | Arithmetic operation |
| 16 | `/` | infix | div | Division | Arithmetic operation |
| 16 | `%` | infix | mod | Modulo | Arithmetic operation |
| 17 | `^` | infixR | pow | Exponentiation | Exponential operation |
| 18 | `!` | postfix | factorial | Factorial | Factorial operation |
| 19 | `\|...\|` | enclosure | abs | Absolute value | Absolute value operation |
| 20 | `~` | postfix | expand | Around (expand to surroundings) | Expansion |
| 21 | `$` | prefix | address | Money (abstraction of value) | Address acquisition |
| 22 | `'` | infix | get | Possessive ('s with s omitted) | Get value from structure |
| 22 | `@` | infixR | get | At (at ~) | Get value from structure |
| 23 | `@` | prefix | input | At (at ~) | Get data from address |
| 24 | `<<` | infix | shift Left | shift Left | Bit Shift to Left |
| 24 | `>>` | infix | shift right | shift right | Bit Shift to right |
| 25 | `\|\|` | infix | bit or | bit or | bit or |
| 26 | `;;` | infix | bit xor | bit xor | bit xor |
| 27 | `&&` | infix | bit and | bit and | bit and |
| 28 | `!!` | prefix | bit not | bit flip | bit not |
| 29 | `@` | postfix | import | At (from ~) | Get from file |
| 30 | `(...)` | enclosure | block | Block | Inline block construction |
| 30 | `{...}` | enclosure | block | Block | Inline block construction |
| 30 | `[...]` | enclosure | block | Block | Inline block construction |
| 30 | `\t` | prefix | indent | Indent | Indented block construction |

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
