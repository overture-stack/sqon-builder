enum ArrayFieldKeys {
  In = 'in',
}
enum ScalarFieldKeys {
  GreaterThan = 'gt',
  LesserThan = 'lt',
}

enum CombinationKeys {
  And = 'and',
  Or = 'or',
  Not = 'not',
}

interface ArrayField {
  field: string;
  value: Array<string | number>;
}

interface ScalarField {
  field: string;
  value: number;
}

interface ArrayFieldOperator {
  op: ArrayFieldKeys;
  content: ArrayField;
}

interface ScalarFieldOperator {
  op: ScalarFieldKeys;
  content: ScalarField;
}

type FieldOperator = ArrayFieldOperator | ScalarFieldOperator;

interface CombinationOperator {
  op: CombinationKeys;
  content: Array<Operator>;
}

type Operator = FieldOperator | CombinationOperator;

const combo = (
  op: CombinationKeys,
  content: Array<Operator>,
): CombinationOperator => ({
  op,
  content,
});

class SQON {
  private _content: Array<Operator>;

  constructor(sqon?: SQON | Operator | string) {
    if (!sqon) {
      this._content = [];
    } else if (typeof sqon === 'string') {
      // TODO: Error checking
      this._content = [JSON.parse(sqon)];
    } else if (sqon instanceof SQON) {
      this._content = (<SQON>sqon)._content;
    } else {
      this._content = [<Operator>sqon];
    }
    // this._content = sqon ? [sqon] : [];
  }

  // Combinations
  public and(content: SQON): SQON {
    this._content.push(combo(CombinationKeys.And, content._content));
    return this;
  }
  public or(content: SQON): SQON {
    this._content.push(combo(CombinationKeys.Or, content._content));
    return this;
  }
  public not(content: SQON): SQON {
    this._content.push(combo(CombinationKeys.Not, content._content));
    return this;
  }
  public in(field: string, value: Array<string | number>): SQON {
    const fieldOp = {
      op: ArrayFieldKeys.In,
      content: { field, value },
    };
    this._content.push(fieldOp);
    return this;
  }
  public gt(field: string, value: number): SQON {
    const fieldOp = {
      op: ScalarFieldKeys.GreaterThan,
      content: { field, value },
    };
    this._content.push(fieldOp);
    return this;
  }
  public lt(field: string, value: number): SQON {
    const fieldOp = {
      op: ScalarFieldKeys.LesserThan,
      content: { field, value },
    };
    this._content.push(fieldOp);
    return this;
  }

  public from(sqon: Operator | string) {
    const content: Operator =
      typeof sqon === 'string' ? JSON.parse(sqon) : sqon;
    return new SQON(content);
  }

  public build(): CombinationOperator {
    if (
      this._content.length === 1 &&
      Object.values(CombinationKeys).includes(
        (<CombinationOperator>this._content[0]).op,
      )
    ) {
      return <CombinationOperator>this._content[0];
    } else {
      return combo(CombinationKeys.And, this._content);
    }
  }
}

const SqonBuilder: any = function (sqon?: SQON | Operator | string) {
  return new SQON(sqon);
};

SqonBuilder.from = (sqon: Operator | string): SQON => new SQON().from(sqon);
SqonBuilder.and = (content: SQON) => new SQON().and(content);
SqonBuilder.or = (content: SQON) => new SQON().or(content);
SqonBuilder.not = (content: SQON) => new SQON().not(content);
SqonBuilder.in = (field: string, value: Array<string | number>) =>
  new SQON().in(field, value);
SqonBuilder.gt = (field: string, value: number) => new SQON().gt(field, value);
SqonBuilder.lt = (field: string, value: number) => new SQON().lt(field, value);
SqonBuilder.build = () => new SQON().build();

export default SqonBuilder;
