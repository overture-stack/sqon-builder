# SQON Builder

## How to Use

### Filters

To create a SQON that filters one property by value:

```js
import SQON from 'sqon-builder';

SQON.in('name', ['Jim', 'Bob']);
```

Produces a SQON with the following content:

```js
{
  "op": "and",
  "content": [
    {
      "op": "in",
      "content": {
        "field": "name",
        "value": ["Jim", "Bob"]
      }
    }
  ]
}
```

There are currently 3 filters available (to be expanded to match the full SQON specification):

| **Filter** |     **Value Type**      |                         **Description**                          |
| :--------: | :---------------------: | :--------------------------------------------------------------: |
|    `in`    | Array<string \| number> |              field value must be in the given list.              |
|    `gt`    |         number          | Greater Than - field value must be greater than the given number |
|    `lt`    |         number          |  Lesser Than - field value must be lesser than the given number  |

A SQON can chain multiple of these filters together into a single SQON that requires all the provided conditions:

```js
SQON.in('name', ['Jim', 'Bob']).gt('score', 9000).lt('age', 100);
```

Creates the SQON:

```js
{
  "op": "and",
  "content": [
    {
      "op": "in",
      "content": {
        "field": "name",
        "value": ["Jim", "Bob"]
      }
    },
    {
      "op": "gt",
      "content": {
        "field": "score",
        "value": 9000
      }
    },
    {
      "op": "lt",
      "content": {
        "field": "age",
        "value": 100
      }
    }
  ]
}
```

### Combining Multiple Filters

Every SQON can be combined with other SQONs through the boolean combinations `and`, `or`, and `not`:

```js
const nameFilter = SQON.in('name', ['Jim', 'Bob']);
const scoreFilter = SQON.gt('score', 9000);

SQON.or(nameFilter, scoreFilter);
```

Result:

```js
{
  "op": "or",
  "content": [
    {
      "op": "and",
      "content": [
        {
          "op": "in",
          "content": {
            "field": "name",
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
            "field": "score",
            "value": 9000
          }
        }
      ]
    }
  ]
}
```

A SQON can also chain these operations like with filters to combine with other SQONs:

```js
const name = SQON.in('name', ['Jim', 'Bob']);
const denied = SQON.in('status', ['DENIED']);
const score = SQON.gt('score', 9000);
const age = SQON.lt('age', 100);

score.or(age).and(name).not(denied);
```

This is equivalent to:

```js
SQON.not([
  denied,
  SQON.and([
    name,
    SQON.or([
      age,
      score
    ])
  ])
]);
```

Result:

```js
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
                "field": "score",
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
                "field": "age",
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
        "field": "name",
        "value": ["Jim", "Bob"]
      }
    },
    {
      "op": "not",
      "content": [
        {
          "op": "and",
          "content": [
            {
              "op": "in",
              "content": {
                "field": "status",
                "value": ["DENIED"]
              }
            }
          ]
        }
      ]
    }
  ]
}
```

### String Output

The SQON data object can be passed directly to most network request libraries, but if a string is needed there is a convenience method `toString()`.

```js
SQON.in('name', ['Jim', 'Bob']).toString();
// {"op":"and","content":[{"op":"in","content":{"field":"name","value":["Jim","Bob"]}}]}
```

This is just a shortcut to running `JSON.stringify(someSqon)`.

## API

### Filters

#### SQON.in(fieldName, values)

Creates a filter requiring the named field to have one of the given values. Should function with single values or arrays of values.

Example: `SQON.in('name',['Jim','Bob'])`

#### SQON.gt(fieldName, value)

Greater Than operator. Create a filter requiring the named field to be greater than the given value

Example: `SQON.gt('age',21)`

#### SQON.lt(fieldName, value)

Lesser Than operator. Create a filter requiring the named field to be greater than the given value

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

```js
SQON.from(
  '{"op":"and","content":[{"op":"in","content":{"field":"name","value":"Tim"}},{"op":"gt","content":{"field":"age","value":"19"}}]}',
);
```
