# Sign Language Boolean Design: Specification Based on Categorical Approach

## 1. Overview

This document presents specifications for handling boolean values in Sign language to enhance mathematical foundations and consistency in language design.

**Specification**:
- Unit(`_`)/empty lists and unevaluated function literals are false
- All other values (including 0) are true

## 2. Theoretical Foundation

### 2.1 Categorical Perspective

In category theory, 0 plays an important role as the "initial object." The initial object is a special entity that has unique morphisms to any object, and should be treated as "something" (having function) rather than "nothing."

On the other hand, Unit/empty lists represent a state of "nothing," so it's natural to treat them as logical "false." This also aligns with the concept of Nothing in monad theory.

### 2.2 Mathematical Consistency

In ZFC set theory, 0 has a special role as the additive identity element in a Ring. From a categorical perspective, 0 functions as an initial object. Since Sign language's characteristics such as "invisible strong typing" and "unified data model based on lists" are closer to categorical thinking, treating 0 as true provides a more consistent mathematical foundation.

## 3. Practical Benefits

### 3.1 Clear Semantics

- The distinction between "whether a value exists" and "whether a value is 0" becomes clear
- The concept of 0 as a result of numerical computation and logical "false" are clearly separated
- Affinity with mathematical expressions is enhanced (since 0 is treated as a valid number in mathematics)

### 3.2 Language Design Consistency

In Sign language's "unified data model based on lists," treating the "empty" state of lists as false clarifies the relationship between the data model and boolean values. Numbers should be treated as a separate concept.

## 4. Concrete Examples

### Logical Operation Examples

```
` 0 is true, so returns x
0 & x
` Empty list is false, so returns Unit(`_`)
[] & x
` 1 is true, so returns x
1 & x
```

### Conditional Branch Examples

```
checkValue : x ?
	!x : `Value does not exist`
	x = 0 : `Value is zero`
	x > 0 : `Positive value`
	`Negative value`
```

## 5. Conclusion

The design of treating Unit(`_`)/empty lists as false and other values including 0 as true enhances consistency with Sign language's mathematical foundations (especially category theory) and provides more intuitive and clear semantics. This specification enables Sign language to function as a more expressive and mathematically robust language.

Particularly important is providing a consistent logical system that programmers can intuitively understand by clearly distinguishing between the numerical 0 and logical "nothing."