# Sign Programming Language

## Philosophy and Key Features

1. Function-oriented design with category theory concepts
2. Type inference - implementation is type, name is type
3. Function composition is left-identity
4. Strong emphasis on point-free style
5. Whitespace represents function application or composition
6. String literals with backticks
7. Block formation using indentation
8. Lazy evaluation by default
9. `:` as assignment operator
10. `=` as comparison operator
11. `,` for product (tuples)
12. Space for coproduct
13. `?` for lambda expression definition
14. Placeholders: `@` and `@n`, rest params: `@~` or `@n~`
15. `~` for recursive definitions
16. Natural support for higher-order functions and partial application
17. Implicit support for monads and comonads
18. Built-in metaprogramming capabilities

## Design Goals

- Bridge mathematical concepts with practical programming
- Provide high-level abstraction and expressiveness
- Powerful type inference with minimal syntax
- Reflect functional programming principles while maintaining usability
- Promote fusion of mathematical thinking and programming

## Syntax Highlights

- Function definition: `func : x y ? x + y`
- Lambda with placeholders: `[@0 + @1]`
- Allow Point-free style: `[+ 2] 3`
- String concatenation: ``` `Hello ` `World!` ``` = ``` `Hello World!` ```
- Block scope and indentation:
  ```
  myGreet:
    greet: 
      hello: `hello,`
      welcome: `welcome,`
    world: ` world`
  ```
- Pattern matching and guards:
  ```
  [
    0 : `zero`
    > 0 : `more`
    < 0 : `less`
    @ : `other`
  ] 3
  ```

## Notable Operators

- `#`: export
- `~`: Scope expansion, recursive definition
- `'`: Access operator (similar to dot notation)
- `@`: Import, placeholder

The Sign language aims to combine theoretical elegance with practical power, fostering the integration of mathematical concepts in programming.
