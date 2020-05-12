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

class Sqon {
  private _content: Array<Operator>;

  constructor(sqon?: Sqon | Operator | string) {
    if (!sqon) {
      this._content = [];
    } else if (typeof sqon === 'string') {
      // TODO: Error checking
      this._content = [JSON.parse(sqon)];
    } else if (sqon instanceof Sqon) {
      this._content = (<Sqon>sqon)._content;
    } else {
      this._content = [<Operator>sqon];
    }
    // this._content = sqon ? [sqon] : [];
  }

  // Combinations
  public and(content: Sqon): Sqon {
    this._content.push(combo(CombinationKeys.And, content._content));
    return this;
  }
  public or(content: Sqon): Sqon {
    this._content.push(combo(CombinationKeys.Or, content._content));
    return this;
  }
  public not(content: Sqon): Sqon {
    this._content.push(combo(CombinationKeys.Not, content._content));
    return this;
  }
  public has(field: string, value: Array<string | number>): Sqon {
    const fieldOp = {
      op: ArrayFieldKeys.In,
      content: { field, value },
    };
    this._content.push(fieldOp);
    return this;
  }
  public gt(field: string, value: number): Sqon {
    const fieldOp = {
      op: ScalarFieldKeys.GreaterThan,
      content: { field, value },
    };
    this._content.push(fieldOp);
    return this;
  }
  public lt(field: string, value: number): Sqon {
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
    return new Sqon(content);
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

export const from = (sqon: Operator | string): Sqon => new Sqon().from(sqon);
export const and = (content: Sqon) => new Sqon().and(content);
export const or = (content: Sqon) => new Sqon().or(content);
export const not = (content: Sqon) => new Sqon().not(content);
export const has = (field: string, value: Array<string | number>) =>
  new Sqon().has(field, value);
export const gt = (field: string, value: number) => new Sqon().gt(field, value);
export const lt = (field: string, value: number) => new Sqon().lt(field, value);
export const build = () => new Sqon().build();

const SqonBuilder: any = function (sqon?: Sqon | Operator | string) {
  return new Sqon(sqon);
};

SqonBuilder.and = and;
SqonBuilder.or = or;
SqonBuilder.not = not;
SqonBuilder.has = has;
SqonBuilder.gt = gt;
SqonBuilder.lt = lt;
SqonBuilder.from = from;
SqonBuilder.build = build;

export default SqonBuilder;
