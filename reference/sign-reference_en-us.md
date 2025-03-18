# Sign Language Reference 

# Introduction []({#introduction})

Thank you for your interest in the Sign programming language.
Simply put, mathematics is a language, but not everyone understands it. Therefore, I considered a method to express it in a way that would be easily understood by everyone.

There are numerous symbols in mathematics. Of course, there are also many in programming languages.
But before that, what about natural languages?
Is it possible to mathematically redefine the symbols of these natural languages?

Sign was born from that concept.

Originally, programming is an art. Therefore, it must be enjoyable.
Would you like to help end the era where engineers suffer in the shadows?

I hope we can grow together with Sign, a language that helps us think better and work better.

I hope you will enjoy Sign - a compact, expressive programming language with predictable and readable behavior.

Shinichi Okazaki

# Prerequisite Knowledge []({#prerequisite-knowledge})

* Identity element - A value that, when operated with a number, does not change the original number
* Left identity - When the value calculated from the left is considered correct
* Right identity - When the value calculated from the right is considered correct
* Product - Stacking several values (constructing a list)
* Coproduct - Integrating, applying
* Duality - Representing reverse calculations or operations, such as + and -; product and coproduct are also dual
* Literal - A collection of values that can be targeted
* Function - Something that describes a change (same meaning as a verb)
* Prefix operator - An operator placed before a literal
  (Example) !5
* Infix operator - An operator placed between literals
  (Example) 1 + 2
* Postfix operator - An operator placed after a literal
  (Example) 5!
* Polynomial - An expression that uses multiple operators
  (Example) 1 + 2 * 3
* Binary operation - An expression represented by only one infix operator
  (Example) 1 + 2
* Operation set - Particularly, a description of a set of binary operations like the example
  (Example) (1 + 2) * (3 + 4)
* Scope - Necessary to hierarchize state changes during operations and prevent mutual interference
  Particularly exists for security purposes

# Language Features []({#language-features})

Sign is a language with conventions that differ from existing languages.
The features are summarized below.

* Regardless of the type of brackets, the meaning of brackets is the same
* There are no reserved words (keywords) used for control
* There are no statements for control; all calculations always return an answer
* Block syntax is done through indentation using tab characters
* Spaces are considered as operators, but as an implementation of the processing system, they don't need to be treated as operators and can be treated as delimiters for literals
* Infix operators generally require spaces before and after them, but if they can be interpreted as infix operators, spaces are automatically inserted
* Prefix and postfix operators must not have spaces between them and their target literals
* A line with only literals that has no meaning will not be executed
* Code files have local scope at the unit level, and the scope will not be contaminated unless import or export is performed
* 0, an empty list, and an unexecuted lambda term are false. Others are true, so a Boolean type is not explicitly specified
* All logical operations are short-circuit evaluations
* Bit operations exist for optimization. Therefore, there are no operators or functions that directly represent bit operations
* The list of arguments passed to a function is a list
* The target to be calculated is all lists
* The Sign source code itself is also a list

# Comments []({#comments})

Sign does not execute lines with meaningless literals alone.
In other words, a string literal that starts from the beginning of a line becomes a comment.
Since it is obvious that it is a \` starting from the beginning of a line, it is treated as a comment even if the string is not closed.

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
  * Floating point numbers
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

Numbers are almost the same as in other languages. However, there is a philosophy that arithmetic should be considered as floating-point operations.
Other integer values and n-ary numbers should be limited to only when handling systems.
Each format is as follows:

* Unsigned integers
  57

* Signed integers
  -57
  57

* Floating point numbers
  3537.45468
  0.357
  187.0235
  -0.00357
  -187.0235

* Hexadecimal numbers
  0xAF8534

* Octal numbers
  0o3574

* Binary numbers
  0b00101001

## Characters []({#characters})

For characters, Sign takes a unique approach.

* Any single character immediately following `\` is always treated as a character. All symbols (including newlines) follow this rule
* If `\` exists within a string literal, `\` becomes a `\` as a single character within the string

## Strings []({#strings})

Sign's behavior for strings is as follows:

* A string enclosed by \` is a string

  (Example)
  ```javascript
  `Hello World`
  ```
* Cannot include newlines inside
* Can include \\

  (Example)
  ```javascript
  `sign strings can include \`
  ```

## Lists []({#lists})

A list is, in principle, literals separated by commas.

* For literals other than functions, they can also be separated by spaces
* Lists are, in principle, tuple lists
* A list of characters is treated as a string
* `_` is the same as an empty list
* The comma `,` used as a separator is an operator that creates a product.

## Functions []({#functions})

The ways to express functions are as follows. (For examples of function usage, see separate section)

* Functions are generally defined with the ? operator (lambda constructor)
  In this case, the left side is the argument list, and the right side contains the instruction group
  (Example)
    ```javascript
    x y ? x + y
    ```
* All operators are functions, so they can be used as functions by enclosing them in brackets
  (Example)
  ```javascript
  [+]
  ```
* A partially applied function is also a function
  (Example)
  ```javascript
  [+ 1]
  ```

## Dictionary Types []({#dictionary-types})

The behavior of associative arrays is just a summary of normal data structures. Details are as follows:

* Written in the format "key : value"
* Hierarchized by tab characters
* The key becomes an identifier, a character, or a string
* For the value, anything that is a literal can be used as a value.

## Identifiers []({#identifiers})

Since there are no reserved words in this language, any word can be used as an identifier. Details are as follows:

* `_` alone cannot be used as an identifier
* Symbols in general cannot be used as identifiers
* Cannot start with a number
* Can start with `_`
* Can include all alphanumeric characters
* All characters outside the ASCII code range can be used

## Unit []({#unit})

The identity element of lists and functions.
Usually used with the meaning of Null, and also used with the meaning of false. Details are as follows:

* Represented by the single character `_`.
* When only `_` is evaluated, it naturally returns `_`.
* Since `_` stands as a symbol of the identity law, it returns the first argument.

# Operators []({#operators})

Operators are categorized into the following types, and are explained in order of low priority because explaining from the low priority area is considered to speak to the origin of basic functions. However, grandchild levels in the bullet points have the same operator priority and are left identity in principle. (Those that should be noted as right identity have an asterisk at the end)

* Definition domain
  * `:`	(define infix operator *)　

* Output domain
  * `#`	(output export prefix operator)

* Construction domain
  * ` `	(coproduct infix operator)
  * `?`	(lambda construction infix operator *)
  * `,`	(product infix operator *)
  * `~`	(range list construction infix operator)
  * `~`	(rest argument list construction prefix operator)

* Logical domain
  * Logical OR
    * `;`	(xor infix operator)
    * `|`	(or infix operator)
  * Logical AND
    * `&`	(and infix operator)
  * Negation
    * `!`	(not prefix operator)

* Comparison operation domain
  * Comparison operators have no priority
    * `<`	(less infix operator)
    * `<=`	(less equal infix operator)
    * `=`	(equal infix operator)
    * `>=`	(more equal infix operator)
    * `>`	(more infix operator)
    * `!=`	(not equal infix operator)

* Arithmetic operation domain
  * Addition and subtraction
    * `+`	(addition infix operator)
    * `-`	(subtraction infix operator)

  * Multiplication and division
    * `*`	(multiplication infix operator)
    * `/`	(division infix operator)
    * `%`	(modulo infix operator)

  * Exponentiation
    * `^`	(power infix operator *)

  * Factorial
    * `!`	(factorial postfix operator)

* Resolution evaluation domain
  * `~`	(expansion postfix operator)
  * `'`	(get infix operator)
  * `
  `	(evaluation postfix operator)

* Input domain
  * `@`	(input import prefix operator)

* Block control
  * Indented block
    * `	`	(block construction prefix operator)
  * Inline block construction
    * (inline block start prefix operator)
      * `[`
      * `{`
      * `(`
    * (inline block end postfix operator)
      * `]`
      * `}`
      * `)`

## `:`	(define infix operator *) []({#:-define-infix-operator-*})

The reason why define has the lowest priority in this language is because it is used to define other functions or operations with different names.
As a syntax, nesting is possible, and in that case, it becomes a dictionary type.
Since define always has the following type, it can be understood similarly to an assignment operator in normal languages.

`[identifier] : [expression]`

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

## `#`	(output export prefix operator) []({#-output-export-prefix-operator})

It is also possible to take specific IO addresses or memory addresses. The type is as follows:

`#[identifier or hexadecimal]`

(Example 1: Written together with define)
```javascript
#hello : `hello`
```
(Example 2: Define a print function with recursion using the address for a system call)
```javascript
#print : s ~t ?
	#0x40 : s
	@print t~
```

## ` `	(coproduct infix operator) []({#-coproduct-infix-operator})

The act of separating tokens with spaces represents an operation, which is a specification.
However, it is more rational for the processing system to understand coproduct as just a token separator.
In this language, it is important to remember it as a description where coproduct and product neatly correspond.
Multiple spaces are treated the same as a single space.
The operator takes the following types, and the behaviors of each are listed below:

`[non-function] [expression]`

`[identifier -> non-function] [expression]`

* Anything other than a function can be listed.
* Concatenates strings or tuple lists.
* Dictionary type concatenation is also possible, but be careful of value overwriting
* Note that coproduct for function application has higher operator priority

(Example)
```javascript
1 2 3 = 1,2,3
1,2,3 4,5,6 = 1,2,3,4,5,6
`hello` \  `world!` = `hello world!`

sign : `Sign!`
hello : `Hello ` 
hello sign = `Hello Sign!`
```
`[function] [expression]`

`[identifier -> function] [expression]`

* Represents function application.
* Function composition occurs in the same order. (It is a left identity)
* To explicitly specify the enumeration of arguments to be passed to the argument list, use the `,` infix operator

(Example)
```javascript
[+ 2] [* 5] 4 = 30
[+] [* 2] 1 2 3 4 = 40
```

## `?`	(lambda construction infix operator *) []({#?-lambda-construction-infix-operator-*})

? defines a lambda (anonymous function).
Since this feature is a core feature of Sign, I would like to explain it with abundant concrete examples.
The reason is that loops and conditional branching are implemented using lambda.

1. ### Function definition method using the ? mark    This method is represented by the following type.

   ### [argument list] ? [expression] 

   * (Example 1: When defining with a name)
     ```javascript
     exp2fn : x y ? (x + y) ^ 2
     ```

   * (Example 2: If there is no name, it needs to be enclosed in brackets.)
     ```javascript
     [x y ? (x + y) ^ 2]
     ```

   * (Example 3: When you want to define a function with conditional branching)
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

   * (Example 5: Example of recursion, describing a function to reverse a list with recursion)
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

2. ### Description by point-free style    This method provides a way to directly treat operators as functions, but note that the operator's priority is lost because function application is inserted!    The type is as follows:

   `[[operator]] [expression]`

   * For point-free of postfix operators, express by putting `_` before the operator
     (Example)
     ```javascript
     [!] 5 = !5
     [_!] 5 = 5!
     ```

   * Partially applied operators also correspond to such notation
     The type is as follows:

     
     `[[infix operator] [non-function]] [expression]`

     `[[non-function][infix operator]] [expression]`

   * (Example 1: Example of a partially applied operator, the answer is 20)
     ```javascript
     [7 -] [* 5] 3
     ```

   * (Example 2: Example of omitting brackets with block syntax)
     ```javascript
     [
     	7 -
     	* 5
     ] 3
     ```

3. ### Lambda provides a natural transformation for lists
    This method can be understood with the rough image of replacing the product operator `,` with a lambda expression in parentheses 

   * (Example 1: Left fold, the answer is 10)
     ```javascript
     [+] 1 2 3 4
     ```

   * (Example 2: Map has a `,` operator at the end, the answer is 2 4 6 8)
     ```javascript
     [* 2,] 1 2 3 4
     ```

## `,`	(product infix operator *) []({#,-product-infix-operator-*})

`,` is an operator that represents product and is used to define lists.
When non-functions are separated by spaces, product and coproduct uniquely correspond.
Therefore, the evaluation result becomes the construction of a list.
The product operator takes the following type:

`[literal] , [expression]`

Therefore, even if a function is not used immediately, it can be directly added to the argument list by separating it with `,`.

(Example)
```javascript
1 , 2 , 3
F [* 2] , 1 , 2 , 3
```

## `~`	(range list construction infix operator) []({#~-range-list-construction-infix-operator})

Note that `~` has different meanings when used as a prefix, postfix, or infix operator!

The `~` infix operator can handle ranges abstractly, such as specifying ranges. The type is as follows:

`[character] ~ [character]`
`[number] ~ [number]`

Note that the range list construction operator has a low priority.
It is also useful when you want to get a specific range from a list.

(Example)
```javascript
[1 ~ 10]
[* 2,] [1 ~ 10] ' [3 ~ 5] = 8 , 10 , 12
[\a ~ \z]
```

## `~`	(rest argument list construction prefix operator) []({#~-rest-argument-list-construction-prefix-operator})

Note that `~` has different meanings when used as a prefix, postfix, or infix operator!

The `~` prefix operator can be thought of as "enclosing the rest of the argument list in a list one scope higher."

The type is as follows:

`~[identifier] ? [expression]`

(Example 1: A function that returns the rest of the list except for the beginning)
```javascript
tail : x ~y ? y
```
(Example 2: Write a function that returns the length of a list, using the \~ postfix operator)
```javascript
length : [x y ~z ?
y = _ : x
	length x + 1, z~
] 0
```

## `;`	(xor infix operator) []({#;-xor-infix-operator})

From here on, I will explain operators for specific operations.

`;` is an infix operator for exclusive logical OR.
In Sign, since numerical 0 or an empty list is false, there is no explicit boolean.
This operator is purely a logical operation.
All logical operations are short-circuit evaluations.

## `|`	(or infix operator) []({#|-or-infix-operator})

`|` is an infix operator for logical OR.
This operator is purely a logical operation.
All logical operations are short-circuit evaluations.

## `&`	(and infix operator) []({#&-and-infix-operator})

`&` is an infix operator for logical AND.
This operator is purely a logical operation.
All logical operations are short-circuit evaluations.

## `!`	(not prefix operator) []({#!-not-prefix-operator})

`!` is a prefix operator for negation.
Note that the postfix operator `!` is factorial, so distinguish between them.
This operator is purely a logical operation.
All logical operations are short-circuit evaluations.

## `<`	(less infix operator) []({#<-less-infix-operator})

From here, I will explain comparison operators.
In Sign, you can write polynomials for all comparison operators.
The reason is that the comparison operation of each term returns a specific value that is either a Unit or a solution.
The next term will return a lambda term, but the lambda term itself is defined as false.
If you want to ask whether a lambda term is a valid function or not, you will obtain a valid address with the $ prefix operator.
The details of $ are not disclosed in the current specification.

less becomes true if the left is smaller.

(Example: The top and bottom have the same meaning)
```javascript
[x y ? 3 < x = y < 20]
[x y ? [[[3 < x & x] = y & y] < 20 & y]]
```

## `<=`	(less equal infix operator) []({#<=-less-equal-infix-operator})

less equal becomes true if the left is less than or equal to the right.

## `=`	(equal infix operator) []({#=-equal-infix-operator})

equal becomes true if the left and right are equal.
equal can also compare lists and strings.

## `>=`	(more equal infix operator) []({#>=-more-equal-infix-operator})

more equal becomes true if the left is greater than or equal to the right.

## `>`	(more infix operator) []({#>-more-infix-operator})

more becomes true if the left is larger.

## `!=`	(not equal infix operator) []({#!=-not-equal-infix-operator})

not equal becomes true if the left and right are not equal.
not equal can also compare lists and strings.

## `+`	(addition infix operator) []({#+-addition-infix-operator})

From here, I will explain arithmetic operators.
Addition...in other words, an operator that performs general addition.

## `-`	(subtraction infix operator) []({#--subtraction-infix-operator})

Subtraction...in other words, an operator that performs general subtraction.

## `*`	(multiplication infix operator) []({#*-multiplication-infix-operator})

Multiplication...in other words, an operator that performs general multiplication.

## `/`	(division infix operator) []({#/-division-infix-operator})

Division...in other words, an operator that performs general division.

## `%`	(modulo infix operator) []({#%-modulo-infix-operator})

Modulo...in other words, an operator that calculates only the remainder.

## `^`	(power infix operator *) []({#^-power-infix-operator-*})

Power...in other words, an operator that performs exponential calculations.
If the right side is described with division, it is possible to calculate the nth root.
If the right side becomes a negative number, it will be a series of divisions.

## `!`	(factorial postfix operator) []({#!-factorial-postfix-operator})

Factorial is a postfix operator.
It is simply realized with syntactic sugar.

(Example: The answer for all is 120)
```javascript
5!
[*] [1 ~ 5]
1 * 2 * 3 * 4 * 5
```
## `~`	(expansion postfix operator) []({#~-expansion-postfix-operator})

Note that `~` has different meanings when used as a prefix, postfix, or infix operator!

The `~` postfix operator can be thought of as "expanding the target list into a scope one level down." The type is as follows:

[List or dictionary type or string]\~
[Identifier -> list or dictionary type or string]\~

(Example 1: When used when passing arguments)
```javascript
a : 1 2 3 4 5
f : x y z ? z

f a~
```

(Example 2: Expansion of the rest argument list)
```javascript
a : 1 2 3 4 5
reverse : x ~y ? reverse y~, x

reverse a~
```

(Example 3: Used with import)
```javascript
@IO~
say `hello!`
```

## `'`	(get infix operator) []({#'-get-infix-operator})

The `'` infix operator gets a specific value from the target. If there is no corresponding value, it returns Unit.
Furthermore, by adding the : infix operator after it, it is possible to rewrite the value of the target.
The type is as follows:

`[Dictionary type or list or string] ' [identifier or string or number]`
`[Identifier -> dictionary type or list or string] ' [identifier or string or number]`

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

## `↵`	(evaluation postfix operator) []({#evaluation-postfix-operator})

The evaluation operator has the same meaning as separating tokens into lines as a processing system. Therefore, a newline is used.
Newline can also be viewed as an operator that means it is OK to evaluate that line.

## `@`	(input import prefix operator) []({#@-input-import-prefix-operator})

The `@` prefix operator is used when importing files or libraries, or when retrieving data from IO addresses. The type is as follows:

`@[identifier or hexadecimal or string]`

(Example 1: Importing a standard library)
```javascript
@IO ' say `hello`
```

(Example 2: Loading from your own project. If there is a description of \#myFunc in myObject, it can be read like this)
```javascript
@`myObject` ' myFunc
```
## About Block Construction []({#about-block-construction})

The block construction prefix operator is the construction of blocks by indentation.

(Example: The newline after the tab becomes the same as the expression in brackets)
```javascript
[x y ?
	x = y = _ & [_] |
	x + y
]

[x y ? [x = y = _ & [_]] | [x + y]]
```
The following construction of inline blocks by brackets has the same meaning, so I will omit it.
