# Sign Programming Language

## Philosophy and Key Features

1. It never execute a line that has no semantic
2. Function-oriented design with category theory concepts
3. Type inference - implementation is type, name is type
4. Function composition is left-identity
5. Strong emphasis on point-free style
6. Whitespace represents function application or composition
7. String literals with backticks
8. Block formation using indentation
9. Lazy evaluation by default
10. `:` as assignment operator
11. `=` as comparison operator
12. `,` for product (tuples)
13. ` ` for coproduct
14. `?` for lambda expression definition
15. Placeholders: `@` and `@n`, rest params: `@~` or `@n~`
16. `~` for recursive definitions
17. Natural support for higher-order functions and partial application
18. Implicit support for monads and comonads
19. Built-in metaprogramming capabilities

## Design Goals

- Bridge mathematical concepts with practical programming
- Provide high-level abstraction and expressiveness
- Powerful type inference with minimal syntax
- Reflect functional programming principles while maintaining usability
- Promote fusion of mathematical thinking and programming

## Syntax Highlights

- Function definition: `func : x y ? x + y`
- Lambda with placeholders: `[@0 + @1]`
- Lambda with recursion: `[@0 @1] , [@' @0 @2]`
- Allow Point-free style: `[+ 2] 3`
- String concatenation: ``` `Hello ` `World!` ``` = ``` `Hello World!` ```
- Block scope and indentation:
  ```
  myGreet:
    greet: 
      hello: `hello`
      welcome: `welcome`
    world: `, world!`

  context: ~myGreet
    'greet 'hello
    'world

  context = `hello, world!`

  ```
- Pattern matching and guards:
  ```

    0 : `zero`
    > 0 : `more`
    < 0 : `less`
    @ : `other`
  ```

## Notable Operators

- `#`: export
- `~`: Scope expansion, recursive definition
- `'`: Access operator (similar to dot notation)
- `@`: Import, placeholder

The Sign language aims to combine theoretical elegance with practical power, fostering the integration of mathematical concepts in programming.
