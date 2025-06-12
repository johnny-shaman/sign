# Sign Language Operator Symbol Table (Priority Order)

## Basic Principles
- Expression using only operators without reserved words
- Alignment between natural meaning of symbols and operational meaning
- Arranged from lowest priority (evaluated later) to highest priority

## Complete Operator List

| Priority | Symbol | Position | Function | Natural Meaning | Operational Semantics |
|----------|--------|----------|----------|-----------------|---------------------|
| 1 | `#` | prefix | export | Hashtag (public/discoverable) | Make name discoverable from outside |
| 2 | `:` | infix | define | That is (identification) | Bind left-hand name to right-hand value |
| 3 | `#` | infix | output | Hashtag (association) | Associate data with address |
| 4 | ` ` | infix | construct | Coproduct (concatenation) | Function application |
| 5 | ` ` | infix | push | Coproduct (concatenation) | Add to list |
| 6 | ` ` | infix | construct | Coproduct (concatenation) | Left-associative list construction |
| 7 | ` ` | infix | compose | Coproduct (concatenation) | Left-associative function composition |
| 7 | ` ` | infix | concat | Coproduct (concatenation) | List concatenation |
| 8 | `?` | infix | lambda | Question (what to do?) | Function definition |
| 9 | `,` | infix | product | Product (structural assembly) | List construction |
| 10 | `~` | infix | range | Around (range vicinity) | Range list construction |
| 11 | `~` | prefix | continuous | Around (entire vicinity) | Continuous list construction |
| 12 | `;` | infix | xor | Exclusive relationship | Exclusive logical OR |
| 12 | `\|` | infix | or | Or (passage) | Logical OR (short-circuit evaluation) |
| 13 | `&` | infix | and | And (connection) | Logical AND (short-circuit evaluation) |
| 14 | `!` | prefix | not | Negation | Logical negation |
| 15 | `<` | infix | less | Less than | Comparison operation |
| 15 | `<=` | infix | less_equal | Less than or equal | Comparison operation |
| 15 | `=` | infix | equal | Equal | Comparison operation |
| 15 | `==` | infix | equal | Equal | Comparison operation |
| 15 | `>=` | infix | more_equal | Greater than or equal | Comparison operation |
| 15 | `>` | infix | more | Greater than | Comparison operation |
| 15 | `!=` | infix | not_equal | Not equal | Comparison operation |
| 16 | `+` | infix | add | Addition | Arithmetic operation |
| 16 | `-` | infix | sub | Subtraction | Arithmetic operation |
| 17 | `*` | infix | mul | Multiplication | Arithmetic operation |
| 17 | `/` | infix | div | Division | Arithmetic operation |
| 17 | `%` | infix | mod | Modulo | Arithmetic operation |
| 18 | `^` | infix | pow | Exponentiation | Exponential operation |
| 19 | `!` | postfix | factorial | Factorial | Factorial operation |
| 20 | `\|...\|` | enclosure | abs | Absolute value | Absolute value operation |
| 21 | `~` | postfix | expand | Around (expand to surroundings) | Expansion |
| 22 | `$` | prefix | address | Money (abstraction of value) | Address acquisition |
| 23 | `'` | infix | get | Possessive ('s with s omitted) | Get value from structure |
| 23 | `@` | infix | get | At (at ~) | Get value from structure |
| 24 | `@` | prefix | input | At (at ~) | Get data from address |
| 25 | `@` | postfix | import | At (from ~) | Get from file |
| 26 | `(...)` | enclosure | block | Block | Inline block construction |
| 26 | `{...}` | enclosure | block | Block | Inline block construction |
| 26 | `[...]` | enclosure | block | Block | Inline block construction |
| 26 | `\t` | prefix | indent | Indent | Indented block construction |

※Conditional branching is only represented by match_case expressions using function block syntax.

## Special Symbols

| Symbol | Function | Natural Meaning | Operational Semantics |
|--------|----------|-----------------|---------------------|
| `_` | unit | Visible no-value (explicit empty) | Empty list/identity morphism/unit element |

## Design Philosophy
- **Symbols understandable by everyone**: Prioritize intuitive understanding over mathematical rigor
- **Correspondence with natural language**: Programs can be read as sentences
- **Elimination of reserved words**: Avoid ambiguity of word meanings, emphasize clarity of symbols
- **Function as meta-language**: Any language paradigm can be implemented as functions