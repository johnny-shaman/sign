# Sign Language Pure Functional Design Guidelines

## 1. Introduction

The Sign language is designed as a pure functional language, emphasizing the elimination of side effects and the enhancement of expressiveness through function composition. This document presents practical coding guidelines based on Sign language's pure functional design philosophy.

## 2. Prohibition of In-Function Definitions

### 2.1 Basic Principle

In Sign language, **writing code that does not involve definitions within functions is the specification**. The need to declare variables within a function means that it is essentially describing side effects, which goes against pure functional design.

### 2.2 Prohibited Patterns and Recommended Patterns

```sign
` Prohibited Pattern: Variable declaration within functions
bad_function : input ?
	temp : process_step1 input		` ← This is a side effect
	result : process_step2 temp		` ← This is also a side effect
	result

` Recommended Pattern: Direct function composition
good_function : input ?
	process_step2 process_step1 input
```

### 2.3 Theoretical Foundation

- **Mathematical function definition**: True functions are mappings from input to output and do not have internal state
- **Maintaining referential transparency**: To guarantee the same output for the same input always
- **Simplification of type inference**: Without intermediate variables, only direct type conversion from input to output needs to be tracked

## 3. Avoiding Mixed Patterns in Block Syntax

### 3.1 Prohibition of Mixing at the Same Level

In Sign language, **mixing conditional expressions (`:` operator) and general processing at the same hierarchical level within block syntax is prohibited**. This is to ensure logical consistency and automatic conversion by the preprocessor.

### 3.2 Problematic Patterns

```sign
` ❌ Problem: Conditional expressions and general processing mixed at the same level
problematic_function : x ?
	preProcess x			` General processing
	x < 0 : `negative`		` Conditional expression
	transform x				` General processing
	x > 100 : `large`		` Conditional expression
	finalize x				` General processing
```

Problems with this pattern:
- **Ambiguous processing order**: The execution order of conditional branching and sequential processing is unclear
- **Difficult preprocessor conversion**: Automatic listification and conditional branching conversion is impossible
- **Logical structure inconsistency**: It's difficult to distinguish what is conditional and what is processing

### 3.3 Allowed Patterns

#### Pattern A: Pure conditional branching only
```sign
` ✅ Valid: Block with conditional branching only
classify : x ?
	x < 0 : `negative`
	x = 0 : `zero`
	x > 0 : `positive`
```

#### Pattern B: Pure general processing only
```sign
` ✅ Valid: General processing only
process_steps : data ? step1 step2 step3 data
```

#### Pattern C: Proper hierarchical mixing (reference example)
```sign
` ✅ Reference: Proper hierarchical mixing of conditional expressions and general processing
process_data : x ?
	preProcess x
	x < 0 :
		`negative`
		transform_negative x
	x > 100 :
		`large`
		transform_large x
	finalize x
```

### 3.4 Recommended Pattern: "One Function, One Verb" Principle

**Recommended pattern based on Sign language's philosophy that "functions express general verbs"**:

```sign
` ✅ Recommended: Verb-like and clear expression
process_data : x ?
	preProcess x
	classify x
	finalize x

classify : x ?
	x < 0 & `negative` | x > 100 & `large` | `normal`
```

**Advantages of the recommended pattern**:
- **Visual simplicity**: No mixing of indentation and parentheses
- **Clear behavior**: Each function expresses one clear verb-like action
- **Natural language readability**: The processing flow reads like English
- **Improved maintainability**: Each function's responsibility is clear, and the scope of change impact is limited

### 3.5 Hierarchical Principles

When mixing is necessary, follow these principles for hierarchicalization:

1. **Lower conditional result processing by one level**: Processing that depends on conditions should be properly indented
2. **Logical grouping**: Group related conditions and processing in blocks
3. **Clear separation**: Clearly separate conditional branching blocks and general processing

### 3.6 Relationship with Preprocessor

This rule is closely related to automatic conversion by the Sign language preprocessor:

```sign
` Original code (proper hierarchicalization)
example : data ?
	validate_data data
	data ' type = `special` : 
		special_process data
	finalize_data data

` After preprocessor conversion
example : _0 ?
	[validate_data _0],
	[_0 ' type = `special` & special_process _0],
	[finalize_data _0]
```

## 4. Importance of Argument Design

### 4.1 Problems with Large Objects

**Code that passes large objects as arguments throws programs into chaos.**

Temporary memo-like behavior that manipulates arguments internally **should all be done when passing arguments**.

### 4.2 Comparison of Design Patterns

```sign
` Problematic pattern: Object manipulation within functions
problematic : large_object ?
	field1 : large_object ' field1
	field2 : large_object ' field2  
	combine field1 field2

` Recommended pattern: Extract necessary values when passing arguments
better : field1 field2 ?
	combine field1 field2

` Usage
result : better (large_object ' field1) (large_object ' field2)
```

### 4.3 Advantages of Argument Design

1. **Clear function responsibility**: What is needed is clear from the arguments
2. **Easy testing**: Tests can be performed by preparing only the necessary values
3. **Improved reusability**: Not dependent on specific object structures
4. **Promotes parallelization**: Dependencies between arguments are clear

## 5. Utilization of File Scope and Considerations

### 5.1 File Scope as an Alternative Measure

**Since scope is cut at the file level**, in-function definitions can be avoided by the following method:

```sign
` Identifier definition at file scope
config_value : complex_initialization_process
helper_data : precomputed_expensive_operation

` Using file scope identifiers within functions
process_function : input ?
	transform input config_value helper_data
```

## 6. Avoiding get Operator Dependency

### 6.1 Basic Policy

**If there are implementations that rely on the get operator every time, such descriptions can always be simplified.**

### 6.2 Problematic Patterns and Improvement Examples

```sign
` Problem: Excessive dependency on get operator
inefficient : data ?
	data ' field1 ' subfield + data ' field2 ' subfield

` Improvement 1: Structure redesign
efficient : field1_sub field2_sub ?
	field1_sub + field2_sub

` Improvement 2: Value extraction through preprocessing
with_preprocessing : data ?
	add (data ' field1 ' subfield) (data ' field2 ' subfield)

` Improvement 3: Utilizing dedicated access functions
extract_subfields : data ?
	data ' field1 ' subfield
	data ' field2 ' subfield

calculate : data ?
	add_subfields data

add_subfields : data ?
	data ' field1 ' subfield + data ' field2 ' subfield
```

### 6.3 Design Guidelines

1. **Data structure review**: Pass frequently accessed data directly as arguments
2. **Abstraction of access patterns**: Separate common access patterns into dedicated functions
3. **Utilize preprocessing**: Extract necessary values before function calls

## 7. Last Resort: Value Overwriting

### 7.1 Handling Exceptional Situations

In exceptional situations, **there is also a method of overwriting values with @ and #**:

```sign
` Last resort: Direct memory manipulation
emergency_update : address new_value ?
` Value overwriting
	address # new_value
` Getting updated value
	@address

` System-level state update example
system_state_update : state_address new_state ?
	state_address # new_state
	notify_state_change @state_address
```

### 7.2 Usage Considerations

- **Deviation from pure functional design**: This is an operation with side effects
- **Limited use**: Use only at system level or hardware control
- **Thorough documentation**: Clearly document that there are side effects
- **Testing difficulties**: Reproducible testing is difficult due to state changes

## 8. Practical Refactoring Techniques

### 8.1 Stepwise Improvement Process

Apply specific techniques to eliminate in-function definitions step by step:

#### Step 1: Function Division

```sign
` Before: Complex internal processing
complex_old : data ?
	validated : validate data
	normalized : normalize validated  
	processed : heavy_process normalized
	format processed

` After: Creating intermediate functions
validate_and_normalize : data ?
	normalize validate data

complex_new : data ?
	format heavy_process validate_and_normalize data
```

#### Step 2: Utilizing Function Composition

```sign
` Further improvement: Direct function composition
complex_optimized : data ?
	format heavy_process normalize validate data

` Or using function composition operator
pipeline_version : ?
	[format,] [heavy_process,] [normalize,] [validate,]
```

#### Step 3: Applying Verb-like Separation

```sign
` Before: Complex conditional processing
conditional_old : input ?
	type : input ' type
	type = `numeric` : process_numeric input
	type = `text` : process_text input
	default_process input

` After: Verb-like clarification
conditional_new : input ?
	validate input
	classify input
	process_by_type input

classify : input ?
	input ' type = `numeric` : `numeric`
	input ' type = `text` : `text`
	`default`

process_by_type : input ?
	input ' type = `numeric` : process_numeric input
	input ' type = `text` : process_text input
	default_process input
```

### 8.2 Refactoring Guidelines

1. **Identify temporary variables**: Identify intermediate values defined with the `:` operator
2. **Analyze dependencies**: Understand which intermediate values depend on other intermediate values
3. **Consider verb-like separation**: Separate logically independent actions into separate functions
4. **Review argument design**: Change to a design that directly receives necessary values as arguments
5. **Add tests**: Verify behavior after refactoring

## 9. Integration Effects of Design Guidelines

### 9.1 Synergy with Type System

These pure functional design guidelines integrate with Sign language's "invisible strong typing" as follows:

1. **Type inference efficiency**: Without intermediate variables, only direct type conversion from input to output needs to be tracked
2. **Hardware optimization**: Function composition naturally corresponds to pipeline processing and SIMD instructions
3. **Memory efficiency**: No need to store intermediate values, good compatibility with region-based memory management
4. **Parallel execution**: Dependencies between functions are clear, making automatic parallelization easy

### 9.2 Consistency with Language Philosophy

This design is consistent with the core philosophy of Sign language:

- **"Invisible strength"**: Programmers don't need to be conscious of side effects, and the language automatically guarantees purity
- **"Zero-cost abstraction"**: Function composition is theoretically beautiful and efficient at runtime
- **"Unified data model"**: List-based processing and function composition naturally harmonize
- **"Functions express general verbs"**: Each function expresses clear and simple behavior

## 10. Conclusion

Pure functional design in Sign language is not merely a constraint, but a design philosophy that enables more expressive and efficient programming. By following the prohibition of in-function definitions, avoiding mixed patterns in block syntax, proper argument design, avoiding get operator dependency, and the principle of "one function, one verb", we can achieve code that is maintainable, easily optimizable, and understandable.

Particularly important is **Sign language's philosophy that "functions express general verbs"**. By following this principle and writing code that is visually simple, has clear behavior, and is readable in natural language, we can realize beautiful programs that are truly Sign-like.

These guidelines, combined with Sign language's characteristics of "invisible strong typing," "zero-cost abstraction," and "unified data model," enable a complete integration of theory and implementation that is difficult to achieve with traditional imperative languages.