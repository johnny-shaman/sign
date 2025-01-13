
# Sign Language Reference

# Introduction []({#Introduction})

Thank you for your interest in the programming language Sign.
Mathematics is essentially a language, but not everyone can understand it. Therefore, I thought of a way to express it in a way that everyone can easily understand.

There are lots of symbols in mathematics, and of course in programming languages ​​too.
But before that, what about natural language?
Is it possible to redefine these natural language symbols mathematically?

Sign was born from that idea.

Programming is an art, after all, so it has to be fun.
Let's work together to put an end to the era in which engineers suffer in the shadows.

We hope you will join us in growing Sign, a language that thinks better and works better.

We hope you will continue to use Sign, a compact, expressive, readable and predictable programming language.

Shinichi Okazaki

# Index []({#Index})

[Introduction](#Introduction)

[Index](#Index)

[Prerequisite knowledge](#knowledge)

[Language features](#features)

[Comments](#Comments)

[Literal](#Literal)

[Number](#Number)

[Character](#character)

[String](#String)

[list](#list)

[Function](#Function)

[Dictionary type](#Dictionary)

[identifier](#identifier)

[Unit](#unit)

[operator](#operator)

[ : (define infix operator *)](#definition)

[ \# (output export prefix operator)](#export)

[ (coproduct infix operator)](#coproduct)

[ ? (lambda construction infix operator *)](#lambda)

[ , (product infix operator *)](#product)

[ \~ (range list construction infix operator)](#range_list)

[ \~ (rest argument list-construction prefix operator)](#rest_argument)

[ ; (xor infix operator)](#xor)

[ | (or infix operator)](#or)

[ & (and infix operator)](#and)

[ \! (not prefix operator)](#not)

[ \< (less infix operator)](#less)

[ \<= (less equal infix operator)](#less_eq)

[ = (equal infix operator)](#equal)

[ \>= (more equal infix operator)](#more_eq)

[ \> (more infix operator)](#more)

[ \!= (not equal infix operator)](#not_eq)

[ + (additive infix operator)](#add)

[ - (subtractive infix operator)](#sub)

[ \* (multiplicative infix operator)](#mlt)

[ / (division infix operator)](#div)

[ % (modulus infix operator)](#mod)

[ ^ (Power infix operator *)](#pow)

[ \! (factorial postfix operator)](#fact)

[ \~ (expansion postfix operator)](#expand)

[ ' (get infix operator)](#get)

[ ↵ (evaluation postfix operator)](#eval)

[ @ (input import prefix operator)](#import)

[About Block Construction](#block)

# Prerequisite knowledge []({#knowledge})

* Identity element A value that does not change the original number when it is operated on with another number
* Left identity element The value calculated from the left is considered correct.
* Right identity: The value calculated from the right is considered correct.
* Multiplication To accumulate some values ​​(build a list)
* Cointegration To integrate or apply
* Duality \Representing the inverse calculation or operation, such as + and -. Multiplication and coproduct are also dualities.
* Literal A collection of values ​​that can be targeted.
* Functions: Describing change (same meaning as verbs)
* Prefix operator An operator placed before a literal.
  (Example) \!5
* Infix operator An operator that is placed between literals.
  (Example) 1 \+ 2
* Postfix operator An operator that is placed after a literal.
  (Example) 5\!
* Polynomial: An expression that uses multiple operators.
  (Example) 1 \+ 2 \* 3
* Binary operation An expression expressed with only one infix operator
  (Example) 1 \+ 2
* Pairs of operators In particular, explanations such as pairs of binary operators are given.
  (Example) (1 \+ 2\) \* (3 \+ 4\)
* Scope: Necessary to hierarchically organize state changes during calculations so that they do not interfere with each other.
  		Especially for security

# Language features []({#features})

Sign is a language whose conventions differ from existing languages.
The features are summarized below.

* Regardless of the type of brackets, the meaning is the same
* There are no reserved words for control purposes.
* There are no control statements, every calculation always returns an answer
* Block syntax is done by indenting with tab characters.
* Although spaces are considered to be operators, they do not need to be operators in the implementation and may be treated as literal separators.
* Infix operators generally require spaces before and after them, but if they can be interpreted as infix operators, spaces will be inserted automatically.
* Prefix and postfix operators must not have spaces between them and the target literal.
* Literals alone will not cause meaningless lines to be executed.
* It has a local scope per code file, and the scope is not polluted unless you import or export it.
* Boolean is never explicitly typed because 0 and an empty list are false, and anything that is found to exist is true.
* All logical operations are short-circuit evaluated.
* Bitwise operations are for optimization purposes. Therefore, there are no operators or functions that directly represent bitwise operations.
* The list of arguments passed to a function is a list.
* All objects to be calculated are lists.
* The Sign source code itself is a list.

# Comments []({#Comments})

Sign will never execute a line that consists of meaningless literals.
In other words, a string literal that begins at the beginning of a line is a comment.
Since it is obvious that \` starts at the beginning of the line, it will be treated as a comment even if the string is not closed.

(example)
```javascript
`This is a comment`
`This is a comment

	`This is not a comment`
	`This is an error
```

# literal [] ({#literal})

The literals are as follows:

* Number
  * Unsigned integer
  * Signed integer
  * Floating point
  * Hexadecimal
  * Octal
  * Binary numbers
* Character
* String
* List
* Functions
* Dictionary type
* Identifier
* Unit

## Number []({#Number})

For numbers, it is pretty much the same as in other languages, except that the idea is that arithmetic should be thought of as floating point operations.
The aim is that other integer values ​​and n-ary numbers should be limited to cases where the system is being used.
The formats are as follows:

* Unsigned integer
  57

* Signed integer
  \-57
  57

* Floating point
  3537.45468
  0.357
  187.0235
  \-0.00357
  \-187.0235

* Hexadecimal
  0xAF8534

* Octal
  0o3574

* Binary numbers
  0b00101001

## Character []({#character})

When it comes to text, Sign takes a unique approach.

* Any character immediately following `\` is always treated as a character. All symbols (such as newlines) follow this rule.
* If there is a `\` in a string literal, then `\` will be treated as a single character in the string.

## String [] ({#string})

The behavior of Sign on strings is as follows:

* The string between \` is the string

  (example)
  ```javascript
  `Hello World`
  ```
* Cannot contain line breaks
* Can contain `\`

  (example)
  ```javascript
  `The sign string can contain \ (backslash)`
  ```

## List []({#List})

A list is essentially a set of literals separated by comma `,`.

* If it is a literal other than a function, it can be separated by a space.
* In principle, lists become tuple lists.
* Lists of characters are treated as strings
* `_` is the same as an empty list
* The separator , is the multiplication operator.

## Function []({#function})

The expression method for functions is as follows. (See separate section for examples of function usage.)

* Functions are generally defined using the ? operator (lambda constructor)
  In this case, the left side is the argument list and the right side is the set of instructions.
  (example)
    ```javascript
    x y ? x + y
    ```
* All operators are functions, so you can use them as functions by enclosing them in parentheses.
  (example)
  ```javascript
  [+]
  ```
* Partial application of a function is also a function
  (example)
  ```javascript
  [+1]
  ```

## Dictionary type []({#Dictionary})

The behavior of an associative array is simply a compilation of normal data structures, as detailed below.

* Enter in the format "key:value"
* Hierarchical by tab characters
* key can be an identifier, a character, or a string
* value can be any literal.

## Identifier []({#identifier})

The language has no reserved words, so any word can be used as an identifier.

* `_` cannot be a single character in an identifier
* Symbols in general cannot be used as identifiers
* Cannot start with a number
* You can start with `_`
* Can contain all alphanumeric characters
* All characters except for ASCII code can be used.

## Unit []({#unit})

Identity for lists and functions.
It is usually used to mean Null, but can also mean false. Details are as follows.

* Represented by a single character `_`.
* If only `_` is evaluated, it will naturally return `_`.
* Because `_` is a valid symbol for unity, it returns the first argument.

# operator [] ({# operator})

The types of operators are as follows, and since we believe that the order of precedence reflects the origin of basic functions, we will explain them starting from the areas with the lowest precedence.
However, the precedence of operators is the same for the grandchild levels of the bullet points, and the left identity element is the rule. (Those that should be noted as right identity elements are marked with an * at the end.)

* Domain
  * `:` (define infix operator *)　

* Output area
  * `#` (output export prefix operator)

* Construction area
  * ` ` (coproduct infix operator)
  * `?` (lambda construction infix operator ※)
  * `,` (product infix operator *)
  * `~` (range list construction infix operator)
  * `~` (rest argument list-construction prefix operator)

* Logical area
  * Logical OR
    * `;` (xor infix operator)
    * `|` (or infix operator)
  * Logical AND
    * `&` (and infix operator)
  * Negation
    * `!` (not prefix operator)

* Comparison area
  Comparison operators have no precedence
    * `<` (less infix operator)
    * `<=` (less equal infix operator)
    * `=` (equal infix operator)
    * `>=` (more equal infix operator)
    * `>` (more infix operator)
    * `!=` (not equal infix operator)

* Arithmetic Area
  * Adjustment
    * `+` (additive infix operator)
    * `-` (subtractive infix operator)

  * Multiplication and division
    * `*` (multiplication infix operator)
    * `/` (division infix operator)
    * `%` (modulus infix operator)

  * Exponent
    * `^` (Power infix operator *)

  * Factorial
    * `!` (factorial postfix operator)

* Solution evaluation area
  * `~` (expansion postfix operator)
  * `'` (get infix operator)
  * `
  ` (evaluation postfix operator)

* Input area
  * `@` (input import prefix operator)

* Block control
  * Indented blocks
    * ` ` (block construction prefix operator)
  * Inline block construction
    * (inline block start prefix operator)
      * `[`
      * `{`
      * `(`
    * (inline block end postfix operator)
      * `]`
      * `}`
      * `)`

## `:` (define infix operator *) []({#definition})

The reason define has the lowest precedence in the language is because it is used to define other functions or operations with different names.
It is syntactically possible to nest them, in which case they become a dictionary.
Since define always has the following type, it can be thought of as the same as an assignment operator in normal languages.

`[Identifier] : [Expression]`

(example)
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

## `#` (output export prefix operator) []({#export})

It can also take a specific IO address or memory address. The format is as follows:

`#【identifier or hexadecimal number】`

(Example 1: Write with define)
```javascript
#hello : `hello`
```
(Example 2: Define the print function in a recursive function using the address for the system call)
```javascript
#print : s ~t ?
	#0x40 : s
	@print t~
```

## ` ` (coproduct infix operator) []({#coproduct})

The specification states that separating tokens with whitespace represents an operation.
However, it is more reasonable for the processing system to understand the multiplication as simply a token separator.
It is important in this language to remember that coproduction and multiplication are neatly paired notations.
Multiple spaces have the same meaning as a single space.
The operators have the following types, and their behavior is listed below.

`【Non-function】 【Expression】`

`[Identifier → non-function] [Expression]`

* List anything that is not a function.
* Concatenate strings and tuple lists.
* Dictionary types can also be combined, but be careful not to overwrite values.
* Note that the coproduct of function application has higher operator precedence.

(example)
```javascript
1 2 3 = 1,2,3
1,2,3 4,5,6 = 1,2,3,4,5,6
`hello` \ `world!` = `hello world!`

sign : `Sign!`
hello : `Hello`
hello sign = `Hello Sign!`
```
`【Function】 【Expression】`

`[Identifier → Function] [Expression]`

* Represents function application.
* Functions are composed in the same order (left identity).
* If you need to specify the list of arguments to be passed to the argument list, use the infix operator,

(example)
```javascript
[+ 2] [* 5] 4 = 30
[+] [* 2] 1 2 3 4 = 40
```

## `?` (lambda construction infix operator *) []({#lambda})

`?` defines a lambda (anonymous function).
Since this function is a core feature of Sign, I would like to explain it with plenty of concrete examples.
The reason is that loops and conditionals are implemented using lambdas.

1. ### Function definition method using ? marks This method is represented by the following format.

    `[Argument list] ? [Expression]`

   * (Example 1: Defining a name)
     ```javascript
     exp2fn : x y ? (x \+ y) ^ 2
     ```

   * (Example 2: If there is no name, you must enclose it in parentheses.)
     ```javascript
     [x y ? (x + y) ^ 2]
     ```

   * (Example 3: When you want to define a function that performs conditional branching)
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

   * (Example 5: Recursion example, writing a function to reverse a list recursively)
     ```javascript
     reverse : x ~y ? reverse y~, x
     ```

   * (Example 6: Using recursion and conditional branching at the same time)
     ```javascript
     collatz: x?
     	x = 1 : `OK`
     	x % 2 = 0 : collatz x / 2
     	x % 2 = 1 : collatz 3 * x + 1
     ```

2. ### Point-free style notation This method provides a way to treat operators directly as functions, but because function application is involved, operator precedence is lost. The types are as follows:

   `[【Operator】] 【Expression】`

   * To make a postfix operator point-free, put `_` before the operator.
     (example)
     ```javascript
     [!] 5 = !5
     [_!] 5 = 5!
     ```

   * Partially applied operators also support this notation.
     The type is as follows:

     
     `[【infix operator】【non-function】] 【expression】`

     `[【Non-function】【Infix operator】] 【Expression】`

   * (Example 1 Example of partially applied operators, answer is 20)
     ```javascript
     [7 -] [* 5] 3
     ```

   * (Example 2: When parentheses are omitted due to block syntax)
     ```javascript
     [
     	7 -
     	* 5
     ] 3
     ```

3. ### Lambdas provide a natural conversion to lists
    This method works if you think of it roughly as textual replacement of the multiplication operator `,` with a lambda expression in parentheses.

   * (Example 1 Left fold answer is 10)
     ```javascript
     [+] 1 2 3 4
     ```

   * (Example 2: map has an operator at the end. The answer is 2 4 6 8.)
     ```javascript
     [* 2,] 1 2 3 4
     ```

## `,` (product infix operator *) []({#product})

`,` is the multiplication operator and is used to define lists.
If non-function elements are separated by spaces, products and coproducts correspond uniquely.
Thus, the evaluation results in the construction of a list.
The multiplication operator has the following form:

`【Literal】, 【Expression】`

Therefore, if a function is not going to be used immediately, it can be added directly to the argument list by separating it with , .

(example)
```javascript
1 , 2 , 3
F[*2], 1, 2, 3
```

## `~` (range list construction infix operator) []({#range_list})

Please note that `~` has different meanings depending on whether it is used as prefix, postfix, or infix!

The `~` infix operator allows you to handle ranges abstractly, such as range specifications. The types are as follows:

`【Character】 ~ 【Character】`

`[Number] ~ [Number]`

Note that range list construction operators have low precedence.
It is also useful for getting a specific range from a list.

(example)
```lisp
[1 ~ 10]
[* 2,] [1 ~ 10] ' [3 ~ 5] = 8 , 10 , 12
[\a ~ \z]
```

## `~` (rest argument list-build prefix operator) []({#rest_arg})

Please note that `~` has different meanings depending on whether it is used as prefix, postfix, or infix!

The `~` prefix operator can be thought of as confining the remainder of the argument list to the list in the next higher scope.

The types are as follows:

`~【identifier】 ? 【expression】`

(Example 1: A function that returns the rest of a string as a list)
```
tail : x ~y ? y
```
(Example 2: Write a function that returns the length of a list, using the \~ postfix operator)
```javascript
length : [x y ~z ?
	y = _ : x
	length x + 1, z~
] 0
```

## `;` (xor infix operator) []({#xor})

From here on, we will explain the operators for specific arithmetic operations.

`;` is the infix operator for exclusive or.
In Sign, there is no explicit Boolean since the number 0 or an empty list is false.
This operator is purely a logical operation.
All logical operations are short-circuit evaluated.

## `|` (or infix operator) []({#or})

`|` is the infix operator for logical or.
This operator is purely a logical operation.
All logical operations are short-circuit evaluated.

## `&` (and infix operator) []({#and})

`&` is the infix operator for logical and.
This operator is purely a logical operation.
All logical operations are short-circuit evaluated.

## `!` (not prefix operator) []({#not})

`!` is the prefix operator for negation.
Please distinguish between the `!` postfix operator, which is used to calculate factorials.
This operator is purely a logical operation.
All logical operations are short-circuit evaluated.

## `<` (less infix operator) []({#less})

Here we explain the comparison operators.
In Sign, you can write polynomials for all comparison operators.
It is interpreted as the conjunction of a pair of binary operators.
less is true if the left is less.

(Example: Up and down have the same meaning)
```javascript
[x y ? 3 < x = y < 20]
[x y ? 3 < x & x = y & y < 20]
```

## `<=` (less equal infix operator) []({#less_eq})

less equal is true if the left is less than or equal to the right.

## `=` (equal infix operator) []({#equal})

equal is true if the left and right are equal.
equal can also compare lists and strings.

## `>=` (more equal infix operator) []({#more_eq})

more equal is true if the left is greater than or equal to the right.

## `>` (more infix operator) []({#more})

more is true if the left is greater.

## `!=` (not equal infix operator) []({#not_eq})

not equal is true if the left and right are not equal
Not equal can also compare lists and strings.

## `+` (additive infix operator) []({#add})

Now let's explain the arithmetic operators.
Addition...that is, the operator that performs general addition.

## `-` (subtractive infix operator) []({#sub})

Subtraction...that is, the operator that performs general subtraction.

## `*` (multiplication infix operator) []({#mlt})

Multiplication...that is, the operator that performs general multiplication.

## `/` (division infix operator) []({#div})

Division...that is, an operator that performs general division.

## `%` (modulus infix operator) []({#mod})

Modulus...that is, an operator that calculates only the remainder.

## `^` (Power infix operator *) []({#pow})

Exponentiation...that is, an operator that performs exponential calculations.
If the right-hand side is written as division, it is possible to calculate the radical roots.
If the right hand side is a negative number, the division continues.

## `!` (factorial postfix operator) []({#fact})

The factorial is a postfix operator.
This is achieved simply with syntactic sugar.

(Example: The answer is 120.)
```javascript
5!
[*] [1 ~ 5]
1 * 2 * 3 * 4 * 5
```
## `~` (expansion postfix operator) []({#expand})

Note that `~` has different meanings depending on whether it is used as prefix, postfix, or infix!

The `~` postfix operator can be thought of as "expanding the list of targets to the next lower scope." Its type is:

[List or Dictionary or String]\~
[Identifier → List or Dictionary or String]\~

(Example 1: When used to pass arguments)
```javascript
a : 1 2 3 4 5
f : x y z ? z

f a~
```

(Example 2: Expanding the rest argument list)
```javascript
a : 1 2 3 4 5
reverse : x ~y ? reverse y~, x

reverse a~
```

(Example 3: Use with import)
```javascript
@IO~
say `hello!`
```

## `'` (get infix operator) []({#get})

The `'` infix operator gets a specific value from its target, or returns Unit if no such value exists.
In addition, you can rewrite the target value by adding the infix operator : after it.
The types are as follows:

`【or list or string】 ' 【identifier or string or number】`

`[Identifier → Dictionary or List or String] ' [Identifier or String or Number]`

(Example 1: When not changing variables)
```javascript
car :
	Brands: `Foo`, `Bar`, `Baz`
	
car ' brand ' 0
```
(Example 2: Changing with variables)
```javascript
car :
	Brand: `foo`, `Bar`, `Baz`
	
[factor number ? car ' factor~ ' number~] `brand` 0 : `Foo`
```

## `↵` (evaluation postfix operator) []({#eval})

From the perspective of the processing system, the evaluation operator is equivalent to separating a group of tokens into lines, so a line break is used.
In other words, it is possible to think of a line break as nothing more than an operator that allows the line to be evaluated.

## `@` (input import prefix operator) []({#import})

The `@` prefix operator is used to import files or libraries, or to get data from an IO address. The types are:

`@【identifier or hexadecimal number or string】`

(Example 1 Importing standard libraries)
```javascript
@IO ' say `hello`
```

(Example 2: Read from your own project. If myObject contains the description \#myFunc, you can read it with this.)
```javascript
@`myObject` ' myFunc
```
## About building blocks []({#block})

Block Construction Prefix operators result in block construction by indentation.

(For example, the line break after a tab will be the same as the expression in parentheses.)
```javascript
[x y ?
	x = y = _ & [_] |
	x + y
]

[x y ? [x = y = _ & [_]] | [x + y]]
```
In the following, constructing inline blocks using parentheses has the same meaning, so it is omitted.
