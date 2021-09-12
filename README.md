# SQON Builder

## Quick Start Examples

#### One filter example:

```js
import SQON from '@joneubank/sqon';

SQON.in('name', 'Tim').build();
```

Gives the following JSON object:

```js
{
  "op": "and",
  "content": [
    { "op": "in", "content": { "field": "name", "value": "Tim" } }
  ]
}
```

#### More complicated example

```js
SQON.or(
  SQON.and(SQON.in('status', 'Approved').gt('age', '21')).not(
    SQON.in('name', 'Tim'),
  ),
).build();
```

Result:

```js
{
  "op": "or",
  "content": [
    {
      "op": "and",
      "content": [
        { "op": "in", "content": { "field": "status", "value": "Approved" } },
        { "op": "gt", "content": { "field": "age", "value": "21" } }
      ]
    },
    {
      "op": "not",
      "content": [
        { "op": "in", "content": { "field": "name", "value": "Tim" } }
      ]
    }
  ]
}
```

## API

This library exports a SQON builder utility. Invoking a method on the sqon builder will create a new SQON object with the desired filter. Operators can be chained, resulting in an array of filters.

SQON has two types of operators - Field and Combination:

    Field operators are filters applied to specific fields: `has`, `gt` (greater than), and `lt` (lesser than). They take as arguments the field name and the value(s).

    Combination operators combine lists of other operators: `and`, `or`, and `not`. They take another sqon or instance of this sqon builder as input. The sqons in the input can be any combination of operators (field or combination).

### Field Operators

#### SQON.in(fieldName, values)

Creates a filter requiring the named field to have one of the given values. Should function with single values or arrays of values.

Example: `SQON.in('name',['Tim','Bob','Joe'])`

#### SQON.gt(fieldName, value)

Greater Than operator. Create a filter requiring the named field to be greater than the given value

Example: `SQON.gt('age',21)`

#### SQON.lt(fieldName, value)

Lesser Than operator. Create a filter requiring the named field to be greater than the given value

Example: `SQON.lt('count', 100)`

### Combination Operators

#### SQON.and(sqon)

Creates a filter that requires all elements of its content to be true.

Example: `SQON.and( SQON.in('name', 'Tim').gt('score', 9000) )`

#### SQON.or(sqon)

Creates a filter that requires at least one element of its content to be true.

Example: `SQON.or( SQON.in('name', 'Tim').gt('score', 9000) )`

#### SQON.not(sqon)

Creates a filter that requires that none of its content elements are true.

Note: Arranger should be tested with an array of content in 'not', I can only remember using this with negating individual filters.

Example: `SQON.not( SQON.in('name', 'Tim') )`

### Build

To convert the builder object to a plain JS Object invoke `.build()`.

Example: `SQON.in('name', 'Tim').build()`

### From

Build a new sqon builder object with all the content of the sqon passed in. This can create a SQON builder from a JSON string or another SQON builder.

Example with string:

```js
SQON.from(
  '{"op":"and","content":[{"op":"in","content":{"field":"name","value":"Tim"}},{"op":"gt","content":{"field":"age","value":"19"}}]}',
);
```
