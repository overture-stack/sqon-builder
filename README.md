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
		- [SQONBuilder default export](#sqonbuilder-default-export)
			- [Filter: In](#filter-in)
			- [Filter: Greater Than](#filter-greater-than)
			- [Filter: Lesser Than](#filter-lesser-than)
			- [Combine: And](#combine-and)
			- [Combine: Or](#combine-or)
			- [Combine: Not](#combine-not)
			- [From](#from)
		- [SQONBuilder Object](#sqonbuilder-object)
			- [ToString](#tostring)
			- [ToValue](#tovalue)
			- [Remove Exact Filter](#remove-exact-filter)
			- [Remove Filter](#remove-filter)
			- [Set Filter](#set-filter)
		- [Reduce SQON](#reduce-sqon)
		- [Check Matching Filter](#check-matching-filter)
	- [Types and SQON Validation](#types-and-sqon-validation)
		- [SQON Type Composition](#sqon-type-composition)
			- [FilterOperators](#filteroperators)
			- [CombinationOperators](#combinationoperators)
			- [Convenient Type Guards](#convenient-type-guards)


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

### SQONBuilder default export
`SQONBuilder(sqon: SQONBuilder | SQON | string)`

The package default export is the `SQONBuilder`. This is a function that will generate a `SQONBuilder` object from another `SQONBuilder`, a `SQON` object, or JSON `string`.

> Note: This will attempt to parse the provided string as JSON and will then validate that the contents are a valid SQON. If the provided string cannot be parsed from JSON a `SyntaxError` will be thrown. If the parsed string is not a valid SQON, a [`ZodError`](https://zod.dev/ERROR_HANDLING) will be thrown.

Example: `const builder: SQONBuilder = SQONBuilder({op: 'in', content: {fieldName: 'name', value: ['Jim']}});`

The `SQONBuilder` function also provides many static methods that can be used to generate a new SQONBuilder without having a SQON to start with.

Example: `const builder: SQONBuilder = SQONBuilder.in('name', 'Jim');`

The returned `SQONBuilder` object stores the value of the generated SQON which can be accessed as a string with `.toString()` or as an object with `.toValue()`. From the `SQONBuilder` object you can now combine the stored SQON value with other filters or combination operations.

Example: `builder.lt('age','30').gt('score',95);`


#### Filter: In
`SQONBuilder.in(fieldName: string, value: ArrayFilterValue) => SQONBuilder`

Creates a filter requiring the given field to have one of the given values. The value matches the `ArrayFilterValue` type which representes a string, a number, or an array of strings and numbers.

Example: `SQONBuilder.in('name',['Jim','Bob'])`

#### Filter: Greater Than
`SQONBuilder.gt(fieldName: string, value: number) => SQONBuilder`

Greater Than operator. Create a filter requiring the given field to be greater than the given value.

Example: `SQONBuilder.gt('age',21)`

#### Filter: Lesser Than
`SQONBuilder.lt(fieldName: string, value: number) => SQONBuilder`

Lesser Than operator. Create a filter requiring the given field to be lesser than the given value.

Example: `SQONBuilder.lt('count', 100)`

#### Combine: And
`SQONBuilder.and(sqon: SQON | SQON[]) => SQONBuilder`

All filters in the resulting SQON must be true.

Example: `SQONBuilder.and( [someSqon, anotherSqon] )`

#### Combine: Or
`SQONBuilder.or(sqon: SQON | SQON[]) => SQONBuilder`

At least one filter in the resulting SQON must be true.

Example: `SQONBuilder.or( [someSqon, anotherSqon] )`

#### Combine: Not
`SQONBuilder.not(sqon: SQON | SQON[]) => SQONBuilder`

None of the filters in the resulting SQON can be true.

Example: `SQONBuilder.not( [someSqon] )`

#### From
`SQONBuilder.from(input: unknown) => SQONBuilder`

Build a new SQON from a string or from a JSON object.

Example with string:

```ts
SQONBuilder.from(
  '{"op":"and","content":[{"op":"in","content":{"fieldName":"name","value":"Tim"}},{"op":"gt","content":{"fieldName":"age","value":"19"}}]}',
);
```

This differs from the default function in that it will accept any input (i.e. type `unknown`). The use case for this function is when you have a JS object that could potentially be a valid SQON, you can pass this `uncheckedObject` to `SQONBuilder.from(uncheckedObject)` and validation will be performed before the `SQONBuilder` is returned, if possible.

If the provided string cannot be parsed from JSON a `SyntaxError` will be thrown.

If the provided object or parsed string is not a valid SQON, a [`ZodError`](https://zod.dev/ERROR_HANDLING) will be thrown.

### SQONBuilder Object

The `SQONBuilder` type is an object that stores a `SQON` object and exposes functions to modify that `SQON`, returning a new `SQONBuilder` object. This allows a user to chain function calls together to create complex filters one step at a time.

All filter and combination methods listed above can be called from the returned `SQONBuilder` object:
* In: `.in(fieldName: string, value: ArrayFilterValue) => SQONBuilder`
* GreaterThan: `.gt(fieldName: string, value: number) => SQONBuilder`
* LesserThan: `.lt(fieldName: string, value: number) => SQONBuilder`
* And: `.and(sqon: SQONBuilder | SQON) => SQONBuilder`
* Or: `.in(sqon: SQONBuilder | SQON) => SQONBuilder`
* Not: `.in(sqon: SQONBuilder | SQON) => SQONBuilder`

Example: `const mySqon: SQON = SQONBuilder.in('name', ['Jim']).or(SQONBuilder.gt('age', 25).lt('score', 50)).toValue();`

All builder methods are side-effect free: modifications made with to a `SQONBuilder` are additive on top of a cloned SQON from the previous builder, so that the original builder is not modified. This can let you, for example, create a builder as a base SQON to make variations on in your application:

```ts
const base = SQONBuilder.in('name', ['Jim']);
const ageRestricted = base.gt('age', 25);
// {"op":"and","content":[{"op":"in","content":{"fieldName":"name","value":["Jim"]}},{"op":"gt","content":{"fieldName":"age","value":25}}]}

const scoreRestricted = base.lt('score', 50);
// {"op":"and","content":[{"op":"in","content":{"fieldName":"name","value":["Jim"]}},{"op":"lt","content":{"fieldName":"score","value":50}}]}
```

As filters and combinations are added to a `SQONBuilder`, the `SQON` maintained will be [reduced](#reduce-sqon), if possible. This will result in matching filters and combinations to be combined, and empty combinations to be removed.

In addition to the filter and combination functions, there are some additional methods that can modify the filters stored in the existing SQON, and then two methods for outputing the stored `SQON` as either a string with [`.toString()`](#tostring) or a value with [`.toValue()`](#tovalue)

#### ToString
`builder.toString() => string`

Return stored `SQON` value as string.

#### ToValue
`builder.toValue() => SQON`

Return stored `SQON` value as an object.

#### Remove Exact Filter
`.removeExactFilter(filter: FilterOperator) => SQONBuilder`

Find exact matching filter and remove it from the SQON.

For filters with an array of values, the order of the array will be ignored during matching.

> Note: This only looks for filters at the root of the sqon or in the content of the top level combination operator.
This will not search recursively through the SQON.

```ts
const initial = SQONBuilder.in('name', 'Jim').gt('score', 50);
initial.removeFilter({op: FilterKeys.In, content: {fieldName: 'name', value: ['Jim']}});
// {op: 'gt', content: {fieldName: 'score', value: 50}}
```

#### Remove Filter
`.(fieldName: string, op?: FilterKey, value?: FilterValue) => SQONBuilder`

Find partial matching filters based on optional arguments and remove them from the SQON.

If only the fieldName is provided, all filters on that field will be removed.

If the fieldName and operator are provided, then a filter matching that fieldName and op will be removed
(shouldn't ever be more than one in an operator due to the SQON reducer).

If values are provided, then a filter exactly matching all the arguments will be removed.

If a filter is found that matches the fieldName and op, then all matching values form the provided array will
be removed from the filter. This lets you remove select values from an array filter without removing the entire
filter.

> Note: This only looks for filters at the root of the sqon or in the content of the top level combination operator.
This will not search recursively through the SQON.

_Example removing all filters for a property:_
```ts
const builder = SQONBuilder.in('name', ['Jim', 'Bob']).gt('age', 20).lt('age', 50);
// {"op":"and","content":[{"op":"in","content":{"fieldName":"name","value":["Jim","Bob"]}},{"op":"gt","content":{"fieldName":"age","value":20}},{"op":"lt","content":{"fieldName":"age","value":50}}]}

// Remove all filters on 'age'
builder.removeFilter('age');
// {"op":"in","content":{"fieldName":"name","value":["Jim","Bob"]}}
```

_Example removing some values from an array filter:_
```ts
const builder = SQONBuilder.in('name', ['Jim', 'Bob', 'May']);
builder.removeFilter('name', FilterKeys.In, ['Jim', 'Bob', 'Sue']);
// {"op":"in","content":{"fieldName":"name","value":["May"]}}
```

#### Set Filter
`.setFilter(fieldName: string, op: FilterKey, value: FilterValueMap[FilterKey]) => SQONBuilder`

Add a specific filter to the content of the top level operator, or replace a matching filter (same `op` and `fieldName`) with the new value specified.

If the current SQON is just a filter, then the existing filter and this new filter will be combined with an `and` operator.

Example:
```ts
const builder = SQONBuilder.gt('age', 50).in('name', ['Jim', 'Bob']);
builder.setFilter('name', FilterKeys.In, ['Jim', 'Sue']);
// {"op":"and","content":[{"op":"gt","content":{"fieldName":"age","value":50}},{"op":"in","content":{"fieldName":"name","value":["Jim","Sue"]}}]}
```

### Reduce SQON
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
import { checkMatchingFilter } from '@overture-stack/sqon-builder';

const filterA = { op: FilterKeys.In, content: { fieldName: 'name', value: ['Jim', 'Bob', 'May'] } };
const filterB = {	op: FilterKeys.In, content: { fieldName: 'name', value: ['May', 'Jim', 'Bob'] } };

const matchResult = checkMatchingFilter(filterA, filterB); // true
```


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
1. `FilterOperators` - Define a rule used to filter data based on matches to a specific field. For example, the `in` filter will find all data that has a field value matching one of the included values in the filter.
2. `CombinationOperators` - Combine multiple operators with boolean logic. 

#### FilterOperators

The `content` property of a `FilterOperator` is a single object of the form:

```json
{
	"fieldName": "<Field name to filter on>",
	"value": <Value or array of values>,
}
```

There are two categories of filters that differ based on the types of values they accept as an argument:
1. `ArrayFilter` - accept a number, a string, or an array of numbers or strings.
2. `ScalarFilter` - accept only a single number
Types are exported that represent these filters, their expected value types `ArrayFilterValue`/`ScalarFilterValue`, as well as types that define the keys available for each filter type and all filters together: `ArrayFilterKeys`, `ScalarFilterKeys` and  `FilterKeys`.

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
4. `isScalarFilter()` will further narrow a filter down to see if requires a number as a value.
5. `isArrayFilterKey()` will identify if the given input is one of the ArrayFilterKeys.
6. `isScalarFilter()` will identify if the given input is one of the ScalarFilterKeys.

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
