# Sign Language Reference 

# Introduction []({#introduction})

Thank you for your interest in the Sign programming language.
Originally, mathematics is a language, but not everyone understands it. Therefore, I thought of a way to express it in a form that everyone can understand more easily. That's the essence of it.

Mathematics has many symbols. Of course, programming languages do too.
But before that, what about natural languages?
Is it possible to mathematically redefine these symbols of natural languages?

Sign was born from this idea.

Originally, programming is an art. Therefore, it must be enjoyable.
Would you like to help end the era where engineers suffer in the shadows?

I hope that together we can grow with Sign, a language that helps us think better and work better.

Thank you for your continued support of Sign, a compact, expressive, predictable, and readable programming language.

Shinichi Okazaki

# Prerequisites []({#prerequisites})

* Identity element: A value that, when operated with any number, leaves that number unchanged
* Left identity: When a calculation from the left is considered correct
* Right identity: When a calculation from the right is considered correct
* Product: Stacking several values (constructing a list)
* Coproduct: Integrating or applying
* Duality: Representing inverse calculations or operations, such as + and -; product and coproduct are also dual
* Literal: A set of values that can be targeted
* Function: Something that describes change (same meaning as a verb)
* Prefix operator: An operator placed before a literal
  (Example): !5
* Infix operator: An operator placed between literals
  (Example): 1 + 2
* Postfix operator: An operator placed after a literal
  (Example): 5!
* Polynomial: An expression using multiple operators
  (Example): 1 + 2 * 3
* Binary operation: An expression represented by a single infix operator
  (Example): 1 + 2
* Operation set: Particularly, a set of binary operations as explained in examples
  (Example): (1 + 2) * (3 + 4)
* Scope: Necessary to hierarchically organize state changes during operations and prevent mutual interference
          Especially important for security

# Language Features []({#language-features})

Sign is a language with conventions different from existing languages.
The following summarizes its features:

* The meaning of parentheses is the same regardless of their type
* There are no reserved words used for control
* There are no control statements; all calculations always return an answer
* Block syntax is formed by indentation using tab characters
* Spaces are considered as operators, but in implementation, they can be treated as delimiters for literals
* Infix operators generally require spaces before and after them, but when an expression can be interpreted as an infix operator, spaces are automatically inserted
* Prefix and postfix operators must not have spaces between them and their target literals
* Lines with only literals without meaning are never executed
* Code files have local scope, and scopes are not contaminated unless import or export is used
* 0, empty lists, and unexecuted lambda terms are false. Everything else is true, so the boolean type is never explicitly specified
* All logical operations are short-circuit evaluated
* Bit operations exist for optimization. Therefore, there are no operators or functions that directly represent bit operations
* Lists of arguments passed to functions are lists
* All objects to be calculated are lists
* The Sign source code itself is also a list

# Comments []({#comments})

Sign does not execute lines with meaningless literals alone.
This means that string literals starting from the beginning of a line become comments.
Since it's obvious that it starts with \` at the beginning of a line, it is treated as a comment even if the string is not closed.

(Example)
```javascript
`This is a comment`
`This is a comment

	`This is not a comment`
	`This is an error
```

# Literals []({#literals})

Literals are as follows:

* Numbers
  * Unsigned integers
  * Signed integers
  * Floating-point numbers
  * Hexadecimal numbers
  * Octal numbers
  * Binary numbers
* Characters
* Strings
* Lists
* Functions
* Dictionary types
* Identifiers
* Unit

## Numbers []({#numbers})

Numbers are almost the same as in other languages. However, there is a philosophy that arithmetic should be perceived as floating-point operations.
Other integer values and n-base numbers should be limited to system handling only.
Each format is as follows:

* Unsigned integers
  57

* Signed integers
  \-57
  57

* Floating-point numbers
  3537.45468
  0.357
  187.0235
  \-0.00357
  \-187.0235

* Hexadecimal numbers
  0xAF8534

* Octal numbers
  0o3574

* Binary numbers
  0b00101001

## Characters []({#characters})

For characters, Sign takes a unique approach:

* Any single character immediately following `\` is always treated as a character. All symbols (including newlines) follow this rule
* If `\` exists within a string literal, `\` becomes a single character `\` in the string

## Strings []({#strings})

Sign's behavior regarding strings is as follows:

* A string enclosed in \` is a string

  (Example)
  ```javascript
  `Hello World`
  ```
* Cannot contain newlines
* Can include \\

  (Example)
  ```javascript
  `Sign strings can include \`
  ```

## Lists []({#lists})

A list is, in principle, literals separated by commas.

* For literals other than functions, they can also be separated by spaces
* Lists are, in principle, tuple lists
* A list of characters is treated as a string
* `_` is the same as an empty list
* The comma `,` used as a separator is an operator that creates a product

## Functions []({#functions})

The ways to express functions are as follows (see separate section for examples of function usage):

* Functions are, in principle, defined with the `?` operator (lambda constructor)
  In this case, the left side is the argument list, and the right side contains the instruction group
  (Example)
    ```javascript
    x y ? x + y
    ```
* All operators are functions, so they can be used as functions by enclosing them in parentheses
  (Example)
  ```javascript
  [+]
  ```
* A partially applied function is also a function
  (Example)
  ```javascript
  [+ 1]
  ```

## Dictionary Type []({#dictionary-type})

The behavior of associative arrays is just a collection of normal data structures. Details are as follows:

* Written in the form "key : value"
* Hierarchized by tab characters
* The key is an identifier, character, or string
* Any literal can be used as a value

## Identifiers []({#identifiers})

Since there are no reserved words in this language, any word can be used as an identifier. Details are as follows:

* `_` alone cannot be an identifier
* Symbols in general cannot be identifiers
* Cannot start with a number
* Can start with `_`
* Can include all alphanumeric characters
* All characters outside the ASCII code range can be used

## Unit []({#unit})

The identity element for lists and functions.
Normally used in the sense of Null, and also used in the sense of false. Details are as follows:

* Represented by the single character `_`
* When only `_` is evaluated, it naturally returns `_`
* `_` stands as a symbol of the identity law, so it returns the first argument

# Operators []({#operators})

Operators are of the following types, and since explaining from the lower priority areas is considered to speak of derivation by basic functions, they are explained in order from the low priority areas.
However, the grandchild level in the bullet points has the same operator precedence.
Infix operators are principally left identities and need spaces at both ends. (Those that should be noted as right identities have a * mark at the back.)
However, most operators can be properly inserted with spaces through input completion. (Those where input completion space insertion does not work have an ✕ mark at the back.)

* Export area
  * `#`	(export prefix operator)

* Definition, output area
  * `:`	(define infix operator *)　
  * `#`	(output infix operator *)
  

* Construction area
  * ` `	(coproduct infix operator)
  * `?`	(lambda construction infix operator *)
  * `,`	(product infix operator *)
  * `~`	(range list construction infix operator)
  * `~`	(rest argument list construction prefix operator)

* Logical area
  * Logical OR
    * `;`	(xor infix operator)
    * `|`	(or infix operator ✕)
  * Logical AND
    * `&`	(and infix operator)
  * Negation
    * `!`	(not prefix operator)

* Comparison operation area
  * Comparison operators have no precedence
    * `<`	(less infix operator)
    * `<=`	(less equal infix operator)
    * `=`	(equal infix operator)
    * `>=`	(more equal infix operator)
    * `>`	(more infix operator)
    * `!=`	(not equal infix operator)

* Arithmetic operation area
  * Absolute value	(About absolute value notation)
  * Addition and subtraction
    * `+`	(addition infix operator)
    * `-`	(subtraction infix operator ✕)

  * Multiplication and division
    * `*`	(multiplication infix operator)
    * `/`	(division infix operator)
    * `%`	(modulus infix operator)

  * Exponentiation
    * `^`	(power infix operator *)

  * Factorial
    * `!`	(factorial postfix operator)

* Resolution evaluation area
  * `~`	(expansion postfix operator)
  * `$`	(address acquisition prefix operator)
  * `'`	(get infix operator)
  * `@`	(get infix operator *)
  * `
  `	(evaluation postfix operator)

* Import area
  * `@`	(import postfix operator)

* Input area
  * `@`	(input prefix operator)

* Block control
  * Indent block
    * `	`	(block construction prefix operator)
  * Inline block construction
    * (Inline block start prefix operator)
      * `[`
      * `{`
      * `(`
    * (Inline block end postfix operator)
      * `]`
      * `}`
      * `)`


## `#`	(export prefix operator) []({#　-#(export-prefix-operator)})

(Example with define)
```javascript
#hello : `hello`
```

## `:`	(define infix operator *) []({#　:-(define-infix-operator-*)})

The reason define has the lowest priority in this language is that it is used to define other functions or operations under different names.
It's possible to nest as syntax, in which case it becomes a dictionary type.
Define always takes the following form, so it can be regarded as similar to an assignment operator in regular languages:

`[Identifier] : [Expression]`

(Example)
```javascript
nop : _
yep : !_

calc :
	additive :
		add : \+
		sub : \-
	multiply :
		mul : \*
		div : /
		mod : %
```

## `#`	(output infix operator) []({#　#-(output-infix-operator)})

It's possible to get specific IO addresses or memory addresses. The type is as follows:

`[Identifier or hexadecimal] # expression`

(Recursive function defining a print function using an address for a system call)
```javascript
#print : s ~t ?
	0x40 # s
	print t~
```

## ` `	(coproduct infix operator) []({#　-(coproduct-infix-operator)})

The act of separating tokens with spaces represents an operation.
However, it's more rational for the system to understand coproduct as a simple token delimiter.
In this language, it's important to remember that coproduct and product form clean pairs.
Multiple spaces have the same meaning as a single space.
The operator takes the following types, and their behaviors are listed below:

`[Non-function] [Expression]`

`[Identifier → Non-function] [Expression]`

* Anything that's not a function is made into a list
* Combines strings or tuple lists
* Dictionary type combination is also possible, but be careful about value overwriting
* Note that the coproduct of function application has higher operator precedence

(Example)
```javascript
1 2 3 = 1,2,3
1,2,3 4,5,6 = 1,2,3,4,5,6
`hello` \  `world!` = `hello world!`

sign : `Sign!`
hello : `Hello ` 
hello sign = `Hello Sign!`
```
`[Function] [Expression]`

`[Identifier → Function] [Expression]`

* Represents function application
* Functions are composed in the same order (left identity)
* When it's necessary to explicitly specify the enumeration of arguments to be passed to the argument list, use the `,` infix operator

(Example)
```javascript
[+ 2] [* 5] 4 = 30
[+] [* 2] 1 2 3 4 = 20
[* 2,] [+] 1 2 3 4 = 20
```

## `?`	(lambda construction infix operator *) []({#　?-(lambda-construction-infix-operator-*)})

`?` defines a lambda (anonymous function).
This functionality is a core feature of Sign, so I'd like to explain it with abundant concrete examples.
The reason is that loops and conditional branches are implemented using lambdas.

1. ### Function definition method using the ? mark    This method is represented by the following type:

   ### [Argument list] ? [Expression] 

   * (Example 1: When defining with a name)
     ```javascript
     exp2fn : x y ? (x + y) ^ 2
     ```

   * (Example 2: When nameless, it needs to be enclosed in parentheses)
     ```javascript
     [x y ? (x + y) ^ 2]
     ```

   * (Example 3: When wanting to define a function that branches conditions)
     ```javascript
     ABS : x ?
     	x >= 0 : x
     	x < 0 : -x
     ```

   * (Example 4: Conditional branching can also be defined without a name)
     ```javascript
     [x ?
     	x >= 0 : x
     	x < 0 : -x
     ]
     ```

   * (Example 5: Example of recursion, describing a function that reverses a list using recursion)
     ```javascript
     reverse : x ~y ? reverse y~, x
     ```

   * (Example 6: Example of using recursion and conditional branching simultaneously)
     ```javascript
     collatz : x ?
     	x = 1 : `OK`
     	x % 2 = 0 : collatz x / 2
     	x % 2 = 1 : collatz 3 * x + 1
     ```

2. ### Description by point-free style    This method provides a way to treat operators directly as functions, but note that the operator precedence is lost because function application is inserted!    The type is as follows:

   `[[Operator]] [Expression]`

   * Point-free postfix operators are expressed by placing `_` before the operator
     (Example)
     ```javascript
     [!] 5 = !5
     [_!] 5 = 5!
     ```

   * Partially applied operators also correspond to such notations
     The type is as follows:

     
     `[[Infix operator] [Non-function]] [Expression]`

     `[[Non-function][Infix operator]] [Expression]`

   * (Example 1: Example of partially applied operator, the answer is 20)
     ```javascript
     [7 -] [* 5] 3
     ```

   * (Example 2: Example of omitting parentheses with block syntax)
     ```javascript
     [
     	7 -
     	* 5
     ] 3
     ```

3. ### Lambda provides natural transformation for lists
    This method can be established by thinking of the rough image of text replacement of the `,` product operator with the lambda expression in parentheses 

   * (Example 1: Left fold, answer is 10)
     ```javascript
     [+] 1 2 3 4
     ```

   * (Example 2: Map is followed by the `,` operator, answer is 2 4 6 8)
     ```javascript
     [* 2,] 1 2 3 4
     ```

4. ### Higher order function Usage
    (Example)
    ```javascript
    map : f x ~y ? @f x, map $f y~
    map $[+ 2] 1 2 3 4
    ```

## `,`	(product infix operator *) []({#　,-(product-infix-operator-*)})

`,` is an operator representing a product and is used to define lists.
When separating non-functions with spaces, product and coproduct uniquely correspond.
Therefore, the evaluation result becomes list construction.
The product operator takes the following type:

`[Literal] , [Expression]`

Thus, even functions can be directly added to the argument list by separating them with `,` if not used immediately.

(Example)
```javascript
1 , 2 , 3
F [* 2] , 1 , 2 , 3
```

## `~`	(range list construction infix operator) []({#　~-(range-list-construction-infix-operator)})

Note that `~` has different meanings as prefix, postfix, and infix!

The `~` infix operator can abstractly handle ranges, such as range specification. The type is as follows:

`[Character] ~ [Character]`
`[Number] ~ [Number]`

Be careful as the range list construction operator has low precedence.
It's also easy to use when getting a specific range from a list.

(Example)
```javascript
[1 ~ 10]
[* 2,] [1 ~ 10] ' [3 ~ 5] = 8 , 10 , 12
[\a ~ \z]
```

## `~`	(rest argument list construction prefix operator) []({#　~　(rest-argument-list-construction-prefix-operator)})

Note that `~` has different meanings as prefix, postfix, and infix!

The `~` prefix operator can be thought of as "enclosing the rest of the argument list in a list at one scope up."

The type is as follows:

`~[Identifier] ? [Expression]`

(Example 1: Function that returns the rest as a list except for the beginning)
```javascript
tail : x ~y ? y
```
(Example 2: Writing a function that returns the length of a list, using the \~ postfix operator)
```javascript
length : [x y ~z ?
y = _ : x
	length x + 1, z~
] 0
```

## `;`	(xor infix operator) []({#　;　(xor-infix-operator)})

From here, we'll explain the operators for specific operational operations.

`;` is an infix operator for exclusive logical OR.
In Sign, since numeric 0 or an empty list is false, there is no explicit boolean.
This operator is purely for logical operations.
All logical operations are short-circuit evaluated.

## `|`	(or infix operator) []({#　|　(or-infix-operator)})

`|` is an infix operator for logical OR.
This operator is purely for logical operations.
All logical operations are short-circuit evaluated.

## `&`	(and infix operator) []({#　&　(and-infix-operator)})

`&` is an infix operator for logical AND.
This operator is purely for logical operations.
All logical operations are short-circuit evaluated.

## `!`	(not prefix operator) []({#　!　(not-prefix-operator)})

`!` is a prefix operator for negation.
Note that the `!` postfix operator is factorial.
This operator is purely for logical operations.
All logical operations are short-circuit evaluated.

## `<`	(less infix operator) []({#　<-(less-infix-operator)})

From here, we'll explain comparison operators.
In Sign, it's possible to write polynomials of all comparison operators.
The reason is that comparison operations of each term return an explicit value of either Unit or a solution.
The following terms will return a lambda term, but the lambda term itself is defined as false.
If you want to ask whether a lambda term is a valid function or not, you would need to acquire a valid address with the $ prefix operator.
The details of $ are not public in the current specification.

Less is true if the left is smaller.

(Example: The top and bottom have the same meaning)
```javascript
[x y ? 3 < x = y < 20]
[x y ? [[[3 < x & x] = y & y] < 20 & y]]
```

## `<=`	(less equal infix operator) []({#　<=　(less-equal-infix-operator)})

Less equal is true if the left is less than or equal to the right.

## `=`	(equal infix operator) []({#　=　(equal-infix-operator)})

Equal is true if the left and right are equal.
Equal can also compare lists or strings.

## `>=`	(more equal infix operator) []({#　>=　(more-equal-infix-operator)})

More equal is true if the left is greater than or equal to the right.

## `>`	(more infix operator) []({#　>　(more-infix-operator)})

More is true if the left is larger.

## `!=`	(not equal infix operator) []({#　!=　(not-equal-infix-operator)})

Not equal is true if the left and right are not equal.
Not equal can also compare lists or strings.

## Absolute value (About absolute value notation) []({#　about-absolute-value-notation})

From here, we'll explain arithmetic operators.
In Sign, absolute value is expressed by an expression enclosed in `|` and has computational rules as an absolute value block.
In this case, the distinction from the or operator is determined as an or operator when there are spaces on both sides of the symbol.
(Example)
```
||x + y| - 5|
```

## `+`	(addition infix operator) []({#　+-(addition-infix-operator)})

Addition... that is, an operator that performs general addition.

## `-`	(subtraction infix operator) []({#　--(subtraction-infix-operator)})

Subtraction... that is, an operator that performs general subtraction.

## `*`	(multiplication infix operator) []({#　*-(multiplication-infix-operator)})

Multiplication... that is, an operator that performs general multiplication.

## `/`	(division infix operator) []({#　/-(division-infix-operator)})

Division... that is, an operator that performs general division.

## `%`	(modulus infix operator) []({#　%-(modulus-infix-operator)})

Modulus... that is, an operator that calculates only the remainder.

## `^`	(power infix operator *) []({#　^-(power-infix-operator-*)})

Power... that is, an operator that performs exponentiation.
If the right side is written in division, it's possible to calculate the nth root.
If the right side becomes a negative number, it becomes a series of divisions.

## `!`	(factorial postfix operator) []({#　!-(factorial-postfix-operator)})

Factorial is a postfix operator.
It's simply realized as syntactic sugar.

(Example: The answer is 120 in each case)
```javascript
5!
[*] [1 ~ 5]
1 * 2 * 3 * 4 * 5
```
## `~`	(expansion postfix operator) []({#　~-(expansion-postfix-operator)})

Note that `~` has different meanings as prefix, postfix, and infix!

The `~` postfix operator can be thought of as "expanding the target list into one scope down." The type is as follows:

[List or Dictionary type or String]\~
[Identifier → List or Dictionary type or String]\~

(Example 1: When used to pass arguments)
```javascript
a : 1 2 3 4 5
f : x y z ? z

f a~
```

(Example 2: Expansion of rest argument list)
```javascript
a : 1 2 3 4 5
reverse : x ~y ? reverse y~, x

reverse a~
```

(Example 3: Used with import)
```javascript
IO@~
say `hello!`
```

## `$`	(address acquisition prefix operator) []({#　$　(address-acquisition-prefix-operator)})
Returns the address that holds the value of an identifier.
The type is as follows:

`$[Identifier]`

By combining with the `@` prefix operator or the `#` infix operator, it enables pointers (register indirect addressing).
Example
```
i : `hello`
@$i = i
@$i = `hello`

`So @$ is ID (equivalent to doing nothing, but @$ can also be said to be a self-functor for the inclusion value)
@$ = _

`Dangerous overwrite (memory release)
$i # _

`Safe memory release
i : _

`Reverse operation is unsolvable since i is not hex
@i = _
$@i = _
```
```
a : 0x8000
a # 0xF000

`Double pointer established
@a # `hello`

`Operation verification
$@a = 0xF000
@$a = 0x8000
@$a  = a

`Verification of double pointer establishment (the order of operators follows the adjoint functor theorem)
@@$a = @a
@$@a = @a
```

## `'`	(get infix operator) []({#　'-(get-infix-operator)})

The `'` infix operator obtains a specific value from the target. If there is no corresponding value, it returns Unit.
By adding the `:` infix operator afterwards, it's possible to rewrite the target value.
The type is as follows:

`[Dictionary type or List or String] ' [Identifier or String or Number]`
`[Identifier → Dictionary type or List or String] ' [Identifier or String or Number]`

(Example 1: When not changing)
```javascript
car :
	brand : `Foo`, `Bar`, `Baz`

car ' brand ' 0
```
(Example 2: When changing)
```javascript
car :
	brand : `foo`, `Bar`, `Baz`

car ' brand ' 0 : `Foo`
```

## `@`	(get infix operator *) []({#　@(get-infix-operator-*)})

The `@` infix operator obtains a specific value from the target, so it's the right identity version of `'`.
The reason why both right and left identities exist is for the unification of import-time notation.
If there is no corresponding value, it returns Unit.
The type is as follows:

`[Identifier or String or Number] @ [Dictionary type or List or String]`
`[Identifier or String or Number] @ [Identifier → Dictionary type or List or String]`

(Example)
```javascript
car :
	brand : `Foo`, `Bar`, `Baz`

0 @ brand @ car
```

## `↵`	(evaluation postfix operator) []({#(evaluation-postfix-operator)})

The evaluation operator has the same meaning as the system's delimiter for token groups by line. Therefore, a newline is used.
It's just possible to view a newline as nothing more than an operator indicating that the line can be evaluated.

## `@`	(import postfix operator) []({#　@　(import-postfix-operator)})

The `@` postfix operator is used when importing files or libraries. The type is as follows:

`[Identifier or String]@`

(Example 1: Import of standard library)
```javascript
IO@ ' say `hello`
```

(Example 2: Loading from your own project - if there's a description of \#myFunc in myObject, it can be read with this)
```javascript
myFunc : myFunc @ `myObject`@
```

## `@`	(input prefix operator) []({#　@　(input-prefix-operator)})

The `@` prefix operator handles references to address values... that is, input.
The type is as follows:

`@[Hexadecimal]`
`@[Identifier → Hexadecimal]`





## About Block Construction []({#　about-block-construction})

The block construction prefix operator is the construction of blocks by indentation.

(Example: After the tab, the newline becomes the same as the expression enclosed in parentheses)
```javascript
[x y ?
	x = y = _ & [_] |
	x + y
]

[x y ? [x = y = _ & [_]] | [x + y]]
```
The following inline block construction with parentheses has the same meaning, so it's omitted.

# Type Description

Parts enclosed in `"` are treated as type definitions and acquisitions.
```
"f" : "Number" "Number" "Number"
f : x y ? x + y
```

Type-based branching
```
typeCase : x ?
  "x" = "Number" : x * 2
  "x" = "String" : x
```

Arbitrary type definitions are basically not recommended features.
It's better to specify the range of lists or directly describe the behavior for the target value.
Reason: It can lead to excessive abstraction (interpreted as it being the language's responsibility to ensure abstraction as a structure)
