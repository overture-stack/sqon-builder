# SQON Builder

SQONBuilder is a utility for the creation and manipulation of SQON filter objects. SQON is an acronym for "Serialized Query Object Notation" and was defined as the filter syntax for [Arranger](http://github.com/overture-stack/arranger).

Along with the SQONBuilder, this library exports TypeScript type definitions for a SQON and the matching schema validation objects that you can use to independently validate the structure of a SQON.

## Arranger Compatibility

__Important note: This utility is only compatible with Arranger v3+__

Arranger 3 clarified the SQON property naming, changing `field` to be `fieldName` in every Filter. This builder and exported type definitions use this syntax.

## Table of Contents
- [SQON Builder](#sqon-builder)
	- [Arranger Compatibility](#arranger-compatibility)
	- [Table of Contents](#table-of-contents)
	- [How to Use](#how-to-use)
		- [Filters](#filters)
		- [Combining Multiple Filters](#combining-multiple-filters)
		- [SQON Output to String or Object](#sqon-output-to-string-or-object)
	- [API](#api)
		- [Root](#root)
		- [Filters](#filters-1)
			- [SQON.in(fieldName, values)](#sqoninfieldname-values)
			- [SQON.gt(fieldName, value)](#sqongtfieldname-value)
			- [SQON.lt(fieldName, value)](#sqonltfieldname-value)
		- [Combinations](#combinations)
			- [SQON.and(sqon)](#sqonandsqon)
			- [SQON.or(sqon)](#sqonorsqon)
			- [SQON.not(sqon)](#sqonnotsqon)
		- [From](#from)
	- [Types and SQON Validation](#types-and-sqon-validation)
		- [SQON Type Composition](#sqon-type-composition)
			- [FilterOperators](#filteroperators)
			- [CombinationOperators](#combinationoperators)
			- [Convenient Type Guards](#convenient-type-guards)
		- [SQON Reduction](#sqon-reduction)
		- [Check Matching Filter](#check-matching-filter)


## How to Use

### Filters

To create a SQON that filters one property by value:

```ts
import SQONBuilder from '@overture-stack/sqon-builder';

SQONBuilder.in('name', ['Jim', 'Bob']);
```

Produces a SQON with the following content:

```json
{
  "op": "in",
  "content": {
    "fieldName": "name",
    "value": ["Jim", "Bob"]
  }
}
```

There are currently 3 filters available (to be expanded to match the full SQON specification):

| **Filter** |               **Value Type**                |                                **Description**                                 |
| :--------: | :-----------------------------------------: | :----------------------------------------------------------------------------: |
|    `in`    | Array<string \| number> \| string \| number | In - field must match the provided value or be included in the array of values |
|    `gt`    |                   number                    |        Greater Than - field value must be greater than the given number        |
|    `lt`    |                   number                    |         Lesser Than - field value must be lesser than the given number         |

A SQON can chain multiple of these filters together into a single SQON that requires all the provided conditions. By default, these are grouped into an 'and' operator:

```ts
SQONBuilder.in('name', ['Jim', 'Bob']).gt('score', 9000).lt('age', 100);
```

Creates the SQON:

```json
{
  "op": "and",
  "content": [
    { "op": "in", "content": { "fieldName": "name", "value": ["Jim", "Bob"] } },
    { "op": "gt", "content": { "fieldName": "score", "value": 9000 } },
    { "op": "lt", "content": { "fieldName": "age", "value": 100 } }
  ]
}
```

### Combining Multiple Filters

Every SQON can be combined with other SQONs through the boolean combinations `and`, `or`, and `not`:

```ts
const nameFilter = SQONBuilder.in('name', ['Jim', 'Bob']);
const scoreFilter = SQONBuilder.gt('score', 9000);

SQONBuilder.or([nameFilter, scoreFilter]);
```
Result:

```json
{
  "op": "or",
  "content": [
    { "op": "in", "content": { "fieldName": "name", "value": ["Jim", "Bob"] } },
    { "op": "gt", "content": { "fieldName": "score", "value": 9000 } }
  ]
}
```

A SQON can also chain these operations like with filters to combine with other SQONs. Chaining another operator onto the right of a builder will wrap the existing SQON in that operator, combined with the provided content. 

Each Combination Operator can accept a SQON or array of SQONs.

```ts
const score = SQONBuilder.gt('score', 9000);
const age = SQONBuilder.lt('age', 100);
const name = SQONBuilder.in('name', ['Jim', 'Bob']);

score.or(age).and(name);
```

This is equivalent to:

```ts
SQON.and([
  SQON.or([
    score,
    age
  ])
  name
]);
```

Result:

```json
{
  "op": "and",
  "content": [
    {
      "op": "or",
      "content": [
        { "op": "gt", "content": { "fieldName": "score", "value": 9000 } },
        { "op": "lt", "content": { "fieldName": "age", "value": 100 } }
      ]
    },
    { "op": "in", "content": { "fieldName": "name", "value": ["Jim", "Bob"] } }
  ]
}

```

The `.not()` combination will wrap the existing content in an `and` operation, and then insert a `not` operator surrounding the argument:

```ts
SQONBuilder.lt('age', 100).not(SQONBuilder.in('status', ['DENIED']) );
```

Results in:

```json
{
  "op": "and",
  "content": [
    { "op": "lt", "content": { "fieldName": "age", "value": 100 } },
    {
      "op": "not",
      "content": [
        {
          "op": "in",
          "content": { "fieldName": "status", "value": ["DENIED"] }
        }
      ]
    }
  ]
}
```

### SQON Output to String or Object

The SQONBuilder object can be passed directly to most network request libraries since it contains the properties of the SQON. In cases where a string is required or the object with builder functions cannot be used, the builder can be output as a string with `.toString()` or as a plain object as `.toValue()`. 

```ts
const builder = SQONBuilder.in('name', ['Jim', 'Bob']);

builder.toString();
// '{"op":"in","content":{"fieldName":"name","value":["Jim","Bob"]}}'


builder.toValue();
// { op: 'in', content: { fieldName: 'name', value: [ 'Jim', 'Bob' ] } }
```

## API

### Root

The `SQONBuilder` is a function that will create a new builder from another SQONBuilder, SQON object, or JSON string.

Example: `const builder = SQONBuilder(sqonJson);`

All filters and combination methods described here can be called from the returned builder object.

Example: `builder.in('name','Jim').gt('score',95);`

This will throw an error if the provided value is not a valid SQON or JSON string.

### Filters

#### SQON.in(fieldName, values)

Creates a filter requiring the given field to have one of the given values. The value can be a single string or number value, or an array of strings or numbers.

Example: `SQON.in('name',['Jim','Bob'])`

#### SQON.gt(fieldName, value)

Greater Than operator. Create a filter requiring the given field to be greater than the given value

Example: `SQON.gt('age',21)`

#### SQON.lt(fieldName, value)

Lesser Than operator. Create a filter requiring the given field to be lesser than the given value

Example: `SQON.lt('count', 100)`

### Combinations

Combinations can be initiaed from the SQON class or from a SQON instance.

If this is called from an instance, the method will accept one SQON or an array, and the instance can be considered grouped with the SQONs provided in the arguments.

If this is called from the class, an array of SQONs is required to be passed.

#### SQON.and(sqon)

All filters in the resulting SQON must be true.

Example: `SQON.and( [someSqon, anotherSqon] )`

#### SQON.or(sqon)

At least one filter in the resulting SQON must be true.

Example: `SQON.or( [someSqon, anotherSqon] )`

#### SQON.not(sqon)

None of the filters in the resulting SQON can be true.

Example: `SQON.not( [someSqon] )`

### From

Build a new SQON from a string or from a JSON object.

Example with string:

```ts
SQON.from(
  '{"op":"and","content":[{"op":"in","content":{"fieldName":"name","value":"Tim"}},{"op":"gt","content":{"fieldName":"age","value":"19"}}]}',
);
```

This will throw an error if the provided value is not a valid SQON or JSON string.

## Types and SQON Validation

SQON types are exported from the library, and a [Zod](http://https://www.npmjs.com/package/zod) schema that will provide validation of the type is exported as a variable with a matching name.

The base type is `SQON`.

```ts
import { SQON } form '@overture-stack/sqon-builder';

// TypeScript checked SQON types
const mySqon: SQON = { op: 'in', content: { fieldName: 'name', value: [ 'Jim', 'Bob' ] } };

// Parsing an unknown variable
const maybeSqon = {'might':'not be valid'};// invalid sqon
const validationResult = SQON.safeParse(maybeSqon);

if(validationResult.success) {
	// Successfully parsed
	const validSqon = validationResult.data;
} else {
	// Validation errors, can be read out here
	const errors = validationResult.error;
}
```

### SQON Type Composition

A SQON is composed from a series of nested `Operators` that take the general structure:

```json
{
	"op": "<operation code>",
	"content": <Value or array of values>
}
```

There are two types of Operators:
1. `FilterOperators` - Define a rule used to filter data based on matches to a specific field., for example the `in` filter will find all data that has a field value matching one of the included values in the filter.
2. `CombinationOperators` - Combine multiple operators with boolean logic. 

#### FilterOperators

The `content` property of a `FilterOperator` is a single object of the form:

```json
{
	"fieldName": "<Field name to filter on>",
	"value": <Value or array of values>,
}
```

Some filters accept an array of values, number or string, and some only accept a single number. These are differentiated in this library by the types `ArrayFilterOperator` and `ScalarFilterOperator`. You also have access to all the corresponding operation keys in the `FilterKeys`, `ArrayFilterKeys`, and `ScalarFilterKeys` records.

#### CombinationOperators

The `content` property of a `CombinationOperator` is an array of other operators - these can be `FilterOperators` or additional nested `CombinationOperators`

There are three supported combinations representing the common boolean operations `and` and `or`, plus `not`. `not` indicates that all contained operations must be false, so is equivalent to a list of negated filters combined with an `and`.

All keys used in combinations are available in the `CombinationKeys` object.

> Note: The SQONBuilder will not create a cyclical combination loop. All SQONs passed into the SQON builder are cloned to get their immediate value and are stored by reference.

The `Operator` type is a union of the `FilterOperator | CombinationOperator`. This is equivalent to a `SQON` type - SQON is just an alias for this type.

#### Convenient Type Guards

To help identify which type of `Operator` the top level of a given `SQON` is, this package exports some functions that act as type guards:

1. `isCombination()` will identify if the input is a `CombinationOperator`
2. `isFilter()` will identify if the input is a `FilterOperator`
3. `isArrayFilter()` will further narrow a filter down to see if it can accept an Array of values, or only a single number.

Example:

```ts
import { isCombination, isArrayFilter } from '@overture-stack/sqon-builder';

const sqon: SQON = getSQON();

if(isCombination(sqon)) {
	// can interact with sqon knowing it is a combination operator
} else {
	// can interact with sqon knowing it is a filter

	// Lets narrow down the filter type further
	if(isArrayFilter(sqon)) {
		// we can assign an array of values to sqon.content.value
	} else {
		// sqon.content.value is a single number
	}
}
```

### SQON Reduction

`reduceSQON(sqon: SQON) => SQON`

The `reduceSQON` function is used internally by the SQON builder to reduce the complexity of a SQON by removing redundant operators and collecting similar filters. For example, if there is an `and` combination wrapping a single filter, the `and` operator can be removed and replaced by the single filter.

The reducer function is exported so you are able to run the reduction algorithm on SQONs independent of the SQONBuilder.

```ts
import { reduceSQON } from '@overture-stack/sqon-builder`;

const sqon: SQON = { op: 'and', 'content': [ { op: 'lt', content: { fieldName: 'age', value: 100 } } ] };

const reduced = reduceSQON(sqon);
// { op: 'lt', content: { fieldName: 'age', value: 100 } }
```

### Check Matching Filter

`checkMatchingFilter(a: FilterOperator, b: FilterOperator) => boolean`

The `checkMatchingFilter` function will compare two `FilterOperators` and return is they match in all properties. This ensures they have the same filter operation (`op` value), same `fieldName` and matching `value`. Note that for array values, the match is performed independent of order and after removing duplicates - it is a match on the logical content not on the exact array.

```ts
import { checkMatchingFilter } from '@overture-stack/sqon-builder`;
const filterA = { op: FilterKeys.In, content: { fieldName: 'name', value: ['Jim', 'Bob', 'May'] } };
const filterB = {	op: FilterKeys.In, content: { fieldName: 'name', value: ['May', 'Jim', 'Bob'] } };

const matchResult = checkMatchingFilter(filterA, filterB); // true
```
