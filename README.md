# SQON Builder

SQONBuilder is a utility for the creation and manipulation of SQON filter objects. SQON is an acronym for "Serialized Query Object Notation" and was defined as the filter syntax for [Arraner](http://github.com/overture-stack/arranger).

Along with the SQONBuilder, this library exports TypeScript type definitions for a SQON and the matching schema validation objects that you can use to independently validate the structure of a SQON.

### Arranger Compatibility

__Important note: This utility is only compatible with Arranger v3+__

Arranger 3 clarified the SQON property naming, changing `field` to be `fieldName` in every Filter. This builder adheres to that formatting.

- [SQON Builder](#sqon-builder)
		- [Arranger Compatibility](#arranger-compatibility)
	- [How to Use](#how-to-use)
		- [Filters](#filters)
		- [Combining Multiple Filters](#combining-multiple-filters)
		- [String Output](#string-output)
	- [API](#api)
		- [Filters](#filters-1)
			- [SQON.in(fieldName, values)](#sqoninfieldname-values)
			- [SQON.gt(fieldName, value)](#sqongtfieldname-value)
			- [SQON.lt(fieldName, value)](#sqonltfieldname-value)
		- [Combinations](#combinations)
			- [SQON.and(sqon)](#sqonandsqon)
			- [SQON.or(sqon)](#sqonorsqon)
			- [SQON.not(sqon)](#sqonnotsqon)
		- [From](#from)

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
    {
      "op": "in",
      "content": {
        "fieldName": "name",
        "value": ["Jim", "Bob"]
      }
    },
    {
      "op": "gt",
      "content": {
        "fieldName": "score",
        "value": 9000
      }
    },
    {
      "op": "lt",
      "content": {
        "fieldName": "age",
        "value": 100
      }
    }
  ]
}
```

### Combining Multiple Filters

Every SQON can be combined with other SQONs through the boolean combinations `and`, `or`, and `not`:

```ts
const nameFilter = SQONBuilder.in('name', ['Jim', 'Bob']);
const scoreFilter = SQONBuilder.gt('score', 9000);

SQONBuilder.or(nameFilter, scoreFilter);
```
Result:

```json
{
  "op": "or",
  "content": [
    {
      "op": "and",
      "content": [
        {
          "op": "in",
          "content": {
            "fieldName": "name",
            "value": ["Jim", "Bob"]
          }
        }
      ]
    },
    {
      "op": "and",
      "content": [
        {
          "op": "gt",
          "content": {
            "fieldName": "score",
            "value": 9000
          }
        }
      ]
    }
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
        {
          "op": "and",
          "content": [
            {
              "op": "gt",
              "content": {
                "fieldName": "score",
                "value": 9000
              }
            }
          ]
        },
        {
          "op": "and",
          "content": [
            {
              "op": "lt",
              "content": {
                "fieldName": "age",
                "value": 100
              }
            }
          ]
        }
      ]
    },
    {
      "op": "in",
      "content": {
        "fieldName": "name",
        "value": ["Jim", "Bob"]
      }
    }
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

### SQON Output to String or POJO

The SQONBuilder object can be passed directly to most network request libraries since it contains the properties of the SQON. In cases where a string is required or the object with builder functions cannot be used, the builder can be output as a string with `.toString()` or as a plain object as `.toPojo()`. 

```ts
const builtder = SQONBuilder.in('name', ['Jim', 'Bob']);

builder.toString();
// '{"op":"in","content":{"fieldName":"name","value":["Jim","Bob"]}}'


builder.toPojo();
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

There are two types of operators that compose a SQON, and there are exported types that represent them

1. `FilterOperator` union of In, GreaterThan and LesserThan filters. The content requires a `fieldName` and value that it will match. `InFilter` is an `ArrayFilter` that can accept an array of values, while `GreaterThanFilter` and `LesserThanFilter` are a `ScalarFilter` that only accept a `number` as a value.
2. `CombinationOperator` have `and`, `or`, and `not` as operations, and has `content` that accepts a single or array of `Operators`, either Filter or Combination.

The `Operator` type is a union of the `FilterOperator | CombinationOperator`. This is equivalent to a `SQON` type - SQON is just an alias for this type.

## SQON Reduction

SQONs produced by the SQON builder are run through a reducer function which will remove redundant operators and collect similar filters. For example, if there is an `and` combination wrapping a single filter, the `and` operator can be removed and replaced by the single filter.

The reducer function is exported so if you want to reduce a SQON provided by another source:

```ts
import { reduceSQON } from '@overture-stack/sqon-builder`;

const sqon: SQON = { op: 'and', 'content': [ { op: 'lt', content: { fieldName: 'age', value: 100 } } ] }

const reduced = reduceSQON(sqon);
// { op: 'lt', content: { fieldName: 'age', value: 100 } }
```