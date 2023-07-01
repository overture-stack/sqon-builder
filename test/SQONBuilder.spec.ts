import { expect } from 'chai';
import { ZodError } from 'zod';
import SQONBuilder, {
	ArrayFilterKeys,
	CombinationKeys,
	FilterKeys,
	FilterOperator,
	SQON,
	ScalarFilterKeys,
} from '../src';
import reduceSQON from '../src/utils/reduceSQON';

describe('SQONBuilder', () => {
	describe('Root', () => {
		it('accepts a sqon', () => {
			const expectedSqon: SQON = {
				op: FilterKeys.In,
				content: {
					fieldName: 'score',
					value: [100],
				},
			};
			const builder = SQONBuilder({
				op: FilterKeys.In,
				content: {
					fieldName: 'score',
					value: [100],
				},
			});
			expect(builder).deep.contains(expectedSqon);
		});
		it('reduces input sqon', () => {
			const input: SQON = {
				op: CombinationKeys.And,
				content: [
					{
						op: CombinationKeys.And,
						content: [
							{
								op: FilterKeys.In,
								content: {
									fieldName: 'name',
									value: 'Jim',
								},
							},
							{
								op: FilterKeys.In,
								content: {
									fieldName: 'name',
									value: ['Bob', 'Greg'],
								},
							},
						],
					},
				],
			};
			const expected: SQON = reduceSQON(input);

			const builder = SQONBuilder(input);
			expect(builder).deep.contains(expected);
		});
		it('accepts another builder as a clone', () => {
			const input = SQONBuilder.in('name', 'Jim');
			const builder = SQONBuilder(input);
			expect(builder).not.equal(input);
			expect(builder.content).not.equal(input.content);
			expect(builder).deep.contain(input.toValue());
		});
		it('accepts a valid JSON string', () => {
			const input = `{"op":"in","content":{"fieldName":"name","value":["Jim"]}}`;
			const expectedSqon: SQON = {
				op: FilterKeys.In,
				content: {
					fieldName: 'name',
					value: ['Jim'],
				},
			};
			const builder = SQONBuilder(input);
			expect(builder).deep.contains(expectedSqon);
		});
		it('throws ZodError for json string with invalid sqon', () => {
			// invalid op type for value
			const input = '{"op":"gt","content":{"fieldName":"name","value":["Jim"]}}';
			expect(() => SQONBuilder(input)).throw(ZodError);
		});
		it('throws SyntaxError for invalid json string', () => {
			// invalid op type for value
			const input = 'bad json';
			expect(() => SQONBuilder(input)).throw(SyntaxError);
		});
	});
	describe('Static functions', () => {
		describe('in', () => {
			it('single number', () => {
				const expectedSqon: SQON = {
					op: FilterKeys.In,
					content: {
						fieldName: 'score',
						value: [100],
					},
				};
				const builder = SQONBuilder.in('score', 100);
				expect(builder).deep.contains(expectedSqon);
			});
			it('single string', () => {
				const expectedSqon: SQON = {
					op: FilterKeys.In,
					content: {
						fieldName: 'name',
						value: ['Jim'],
					},
				};
				const builder = SQONBuilder.in('name', 'Jim');
				expect(builder).deep.contains(expectedSqon);
			});
			it('array number', () => {
				const expectedSqon: SQON = {
					op: FilterKeys.In,
					content: {
						fieldName: 'score',
						value: [95, 96, 97, 98, 99, 100],
					},
				};
				const builder = SQONBuilder.in('score', [95, 96, 97, 98, 99, 100]);
				expect(builder).deep.contains(expectedSqon);
			});
			it('array string', () => {
				const expectedSqon: SQON = {
					op: FilterKeys.In,
					content: {
						fieldName: 'name',
						value: ['Jim', 'Bob'],
					},
				};
				const builder = SQONBuilder.in('name', ['Jim', 'Bob']);
				expect(builder).deep.contains(expectedSqon);
			});
			it('removes duplicates', () => {
				const expectedSqon: SQON = {
					op: FilterKeys.In,
					content: {
						fieldName: 'name',
						value: ['Jim', 'Bob'],
					},
				};
				const builder = SQONBuilder.in('name', ['Jim', 'Jim', 'Bob']);
				expect(builder).deep.contains(expectedSqon);
			});
		});
		describe('gt', () => {
			it('generates filter', () => {
				const expectedSqon: SQON = {
					op: FilterKeys.GreaterThan,
					content: {
						fieldName: 'score',
						value: 95,
					},
				};
				const builder = SQONBuilder.gt('score', 95);
				expect(builder).deep.contains(expectedSqon);
			});
		});
		describe('lt', () => {
			it('generates filter', () => {
				const expectedSqon: SQON = {
					op: FilterKeys.LesserThan,
					content: {
						fieldName: 'score',
						value: 50,
					},
				};
				const builder = SQONBuilder.lt('score', 50);
				expect(builder).deep.contains(expectedSqon);
			});
		});
		describe('and', () => {
			it('combines array of filters', () => {
				const expectedSqon: SQON = {
					op: CombinationKeys.And,
					content: [
						{
							op: FilterKeys.GreaterThan,
							content: {
								fieldName: 'score',
								value: 95,
							},
						},
						{
							op: FilterKeys.In,
							content: {
								fieldName: 'name',
								value: ['Jim', 'Bob'],
							},
						},
					],
				};
				const builder = SQONBuilder.and([SQONBuilder.gt('score', 95), SQONBuilder.in('name', ['Jim', 'Bob'])]);
				expect(builder).deep.contains(expectedSqon);
			});
			it('reduces a single filter', () => {
				const expectedSqon: SQON = {
					op: FilterKeys.GreaterThan,
					content: {
						fieldName: 'score',
						value: 95,
					},
				};
				const builder = SQONBuilder.and(SQONBuilder.gt('score', 95));
				expect(builder).deep.contains(expectedSqon);
			});
			it('reduces a single combination operator', () => {
				const expectedSqon: SQON = {
					op: FilterKeys.GreaterThan,
					content: {
						fieldName: 'score',
						value: 95,
					},
				};
				const input: SQON = {
					op: CombinationKeys.Or,
					content: [
						{
							op: FilterKeys.GreaterThan,
							content: { fieldName: 'score', value: 95 },
						},
					],
				};
				const builder = SQONBuilder.and(input);
				expect(builder).deep.contains(expectedSqon);
			});
			it('accepts combination operators and reduces', () => {
				const expectedSqon: SQON = {
					op: CombinationKeys.And,
					content: [
						{
							op: FilterKeys.GreaterThan,
							content: {
								fieldName: 'score',
								value: 95,
							},
						},
						{
							op: FilterKeys.LesserThan,
							content: {
								fieldName: 'age',
								value: 40,
							},
						},
					],
				};
				const builder = SQONBuilder.and([
					SQONBuilder.or(SQONBuilder.gt('score', 95)),
					SQONBuilder.and(SQONBuilder.lt('age', 40)),
				]);
				expect(builder).deep.contains(expectedSqon);
			});
		});
		describe('or', () => {
			it('combines array of filters', () => {
				const expectedSqon: SQON = {
					op: CombinationKeys.Or,
					content: [
						{
							op: FilterKeys.GreaterThan,
							content: {
								fieldName: 'score',
								value: 95,
							},
						},
						{
							op: FilterKeys.In,
							content: {
								fieldName: 'name',
								value: ['Jim', 'Bob'],
							},
						},
					],
				};
				const builder = SQONBuilder.or([SQONBuilder.gt('score', 95), SQONBuilder.in('name', ['Jim', 'Bob'])]);
				expect(builder).deep.contains(expectedSqon);
			});
			it('reduces a single filter', () => {
				const expectedSqon: SQON = {
					op: FilterKeys.GreaterThan,
					content: {
						fieldName: 'score',
						value: 95,
					},
				};
				const builder = SQONBuilder.or(SQONBuilder.gt('score', 95));
				expect(builder).deep.contains(expectedSqon);
			});
			it('accepts combination operators and reduces', () => {
				const expectedSqon: SQON = {
					op: CombinationKeys.Or,
					content: [
						{
							op: FilterKeys.GreaterThan,
							content: {
								fieldName: 'score',
								value: 95,
							},
						},
						{
							op: FilterKeys.LesserThan,
							content: {
								fieldName: 'age',
								value: 40,
							},
						},
					],
				};
				const builder = SQONBuilder.or([
					SQONBuilder.and(SQONBuilder.gt('score', 95)),
					SQONBuilder.or(SQONBuilder.lt('age', 40)),
				]);
				expect(builder).deep.contains(expectedSqon);
			});
			it('or(lt(a), lt(a)) reduces to lt() with max', () => {
				const expectedSqon: SQON = {
					op: FilterKeys.LesserThan,
					content: {
						fieldName: 'score',
						value: 55,
					},
				};
				const builder = SQONBuilder.or([SQONBuilder.lt('score', 55), SQONBuilder.lt('score', 40)]);
				expect(builder).deep.contains(expectedSqon);
			});
			it('or(gt(a), gt(a)) reduces to gt() with min', () => {
				const expectedSqon: SQON = {
					op: FilterKeys.GreaterThan,
					content: {
						fieldName: 'score',
						value: 85,
					},
				};
				const builder = SQONBuilder.or([SQONBuilder.gt('score', 95), SQONBuilder.gt('score', 85)]);
				expect(builder).deep.contains(expectedSqon);
			});
		});
		describe('not', () => {
			it('combines array of filters', () => {
				const expectedSqon: SQON = {
					op: CombinationKeys.Not,
					content: [
						{
							op: FilterKeys.GreaterThan,
							content: {
								fieldName: 'score',
								value: 95,
							},
						},
						{
							op: FilterKeys.In,
							content: {
								fieldName: 'name',
								value: ['Jim', 'Bob'],
							},
						},
					],
				};
				const builder = SQONBuilder.not([SQONBuilder.gt('score', 95), SQONBuilder.in('name', ['Jim', 'Bob'])]);
				expect(builder).deep.contains(expectedSqon);
			});
			it('preserves not operator with single filter', () => {
				const expectedSqon: SQON = {
					op: CombinationKeys.Not,
					content: [
						{
							op: FilterKeys.GreaterThan,
							content: {
								fieldName: 'score',
								value: 95,
							},
						},
					],
				};
				const builder = SQONBuilder.not(SQONBuilder.gt('score', 95));
				expect(builder).deep.contains(expectedSqon);
			});
			it('accepts combination operators and reduces', () => {
				const expectedSqon: SQON = {
					op: CombinationKeys.Not,
					content: [
						{
							op: FilterKeys.GreaterThan,
							content: {
								fieldName: 'score',
								value: 95,
							},
						},
						{
							op: FilterKeys.In,
							content: {
								fieldName: 'name',
								value: ['Jim', 'Bob'],
							},
						},
					],
				};
				const builder = SQONBuilder.not([
					SQONBuilder.and(SQONBuilder.gt('score', 95)),
					SQONBuilder.or(SQONBuilder.in('name', ['Jim', 'Bob'])),
				]);
				expect(builder).deep.contains(expectedSqon);
			});
		});
		describe('from', () => {
			it('accepts another builder as a clone', () => {
				const input = SQONBuilder.in('name', 'Jim');
				const builder = SQONBuilder.from(input);
				expect(builder).not.equal(input);
				expect(builder.content).not.equal(input.content);
				expect(builder).deep.contain(input.toValue());
			});
			it('creates builder from valid sqon', () => {
				const input: SQON = {
					op: FilterKeys.In,
					content: {
						fieldName: 'score',
						value: [100],
					},
				};
				const builder = SQONBuilder.from(input);
				expect(builder).deep.contains(input);
			});
			it('creates builder from valid string', () => {
				const input = `{"op":"in","content":{"fieldName":"name","value":["Jim"]}}`;
				const expectedSqon: SQON = {
					op: FilterKeys.In,
					content: {
						fieldName: 'name',
						value: ['Jim'],
					},
				};
				const builder = SQONBuilder.from(input);
				expect(builder).deep.contains(expectedSqon);
			});
			it('throws ZodError for invalid object', () => {
				// invalid op type for value
				const invalid = {
					op: FilterKeys.GreaterThan,
					content: {
						fieldName: 'name',
						value: ['Jim'],
					},
				};
				expect(() => SQONBuilder.from(invalid)).throw(ZodError);
			});
			it('throws ZodError for json string with invalid sqon', () => {
				// invalid op type for value
				const input = '{"op":"gt","content":{"fieldName":"name","value":["Jim"]}}';
				expect(() => SQONBuilder.from(input)).throw(ZodError);
			});
			it('throws SyntaxError for invalid json string', () => {
				// invalid op type for value
				const input = 'bad json';
				expect(() => SQONBuilder.from(input)).throw(SyntaxError);
			});
		});
	});
	describe('Builder functions', () => {
		describe('toString', () => {
			it('returns string matching sqon', () => {
				const expectedString = `{"op":"in","content":{"fieldName":"name","value":["Jim"]}}`;
				const output = SQONBuilder.in('name', 'Jim').toString();
				expect(output).equal(expectedString);
			});
		});
		describe('toValue', () => {
			it('returns object matching sqon', () => {
				const expectedSqon: SQON = {
					op: FilterKeys.In,
					content: {
						fieldName: 'name',
						value: ['Jim'],
					},
				};
				const output = SQONBuilder.in('name', 'Jim').toValue();
				expect(output).deep.equal(expectedSqon);
			});
			it('returns object with no functions', () => {
				const output = SQONBuilder.in('name', 'Jim').toValue();
				expect(Object.values(output).some((value) => typeof value === 'function')).false;
			});
		});

		describe('in', () => {
			it('gt().in() combines with and', () => {
				const expectedSqon: SQON = {
					op: CombinationKeys.And,
					content: [
						{
							op: FilterKeys.GreaterThan,
							content: {
								fieldName: 'score',
								value: 95,
							},
						},
						{
							op: FilterKeys.In,
							content: {
								fieldName: 'name',
								value: ['Jim', 'Bob'],
							},
						},
					],
				};
				const output = SQONBuilder.gt('score', 95).in('name', ['Jim', 'Bob']);
				expect(output).deep.contains(expectedSqon);
			});
			it('in(a).in(a) on same name collects into single filter', () => {
				const expectedSqon: SQON = {
					op: FilterKeys.In,
					content: {
						fieldName: 'name',
						value: ['Jim', 'Bob', 'Greg'],
					},
				};
				const output = SQONBuilder.in('name', 'Jim').in('name', ['Bob', 'Greg']);
				expect(output).deep.contains(expectedSqon);
			});
			it('in(a).in(b) on different names combines with and', () => {
				const expectedSqon: SQON = {
					op: CombinationKeys.And,
					content: [
						{
							op: FilterKeys.In,
							content: {
								fieldName: 'class',
								value: ['Bio', 'Math'],
							},
						},
						{
							op: FilterKeys.In,
							content: {
								fieldName: 'name',
								value: ['Jim', 'Bob'],
							},
						},
					],
				};
				const output = SQONBuilder.in('class', ['Bio', 'Math']).in('name', ['Jim', 'Bob']);
				expect(output).deep.contains(expectedSqon);
			});
			it('in(a).in(b).in(a) collects like names and combines in and', () => {
				const expectedSqon: SQON = {
					op: CombinationKeys.And,
					content: [
						{
							op: FilterKeys.In,
							content: {
								fieldName: 'name',
								value: ['Jim', 'Bob'],
							},
						},
						{
							op: FilterKeys.In,
							content: {
								fieldName: 'class',
								value: ['Bio'],
							},
						},
					],
				};
				const output = SQONBuilder.in('name', 'Jim').in('class', ['Bio']).in('name', 'Bob');
				expect(output).deep.contains(expectedSqon);
			});
		});
		describe('gt', () => {
			it('in().gt() combines in and', () => {
				const expectedSqon: SQON = {
					op: CombinationKeys.And,
					content: [
						{
							op: FilterKeys.In,
							content: {
								fieldName: 'name',
								value: ['Jim', 'Bob'],
							},
						},
						{
							op: FilterKeys.GreaterThan,
							content: {
								fieldName: 'score',
								value: 95,
							},
						},
					],
				};
				const output = SQONBuilder.in('name', ['Jim', 'Bob']).gt('score', 95);
				expect(output).deep.contains(expectedSqon);
			});
			it('gt(a).gt(a) with same name collects into single filter with max value', () => {
				const expectedSqon: SQON = {
					op: FilterKeys.GreaterThan,
					content: {
						fieldName: 'score',
						value: 97,
					},
				};
				const output = SQONBuilder.gt('score', 90).gt('score', 97);
				expect(output).deep.contains(expectedSqon);
			});
			it('gt(a).gt(b) on different names combines with and', () => {
				const expectedSqon: SQON = {
					op: CombinationKeys.And,
					content: [
						{
							op: FilterKeys.GreaterThan,
							content: {
								fieldName: 'score',
								value: 90,
							},
						},
						{
							op: FilterKeys.GreaterThan,
							content: {
								fieldName: 'age',
								value: 20,
							},
						},
					],
				};
				const output = SQONBuilder.gt('score', 90).gt('age', 20);
				expect(output).deep.contains(expectedSqon);
			});
		});
		describe('lt', () => {
			it('in().lt() combines in and', () => {
				const expectedSqon: SQON = {
					op: CombinationKeys.And,
					content: [
						{
							op: FilterKeys.In,
							content: {
								fieldName: 'name',
								value: ['Jim', 'Bob'],
							},
						},
						{
							op: FilterKeys.LesserThan,
							content: {
								fieldName: 'score',
								value: 50,
							},
						},
					],
				};
				const output = SQONBuilder.in('name', ['Jim', 'Bob']).lt('score', 50);
				expect(output).deep.contains(expectedSqon);
			});
			it('lt(a).lt(a) with same name collects into single filter with min value', () => {
				const expectedSqon: SQON = {
					op: FilterKeys.LesserThan,
					content: {
						fieldName: 'score',
						value: 45,
					},
				};
				const output = SQONBuilder.lt('score', 60).lt('score', 45);
				expect(output).deep.contains(expectedSqon);
			});
			it('lt(a).lt(b) on different names combines with and', () => {
				const expectedSqon: SQON = {
					op: CombinationKeys.And,
					content: [
						{
							op: FilterKeys.LesserThan,
							content: {
								fieldName: 'score',
								value: 51,
							},
						},
						{
							op: FilterKeys.LesserThan,
							content: {
								fieldName: 'age',
								value: 40,
							},
						},
					],
				};
				const output = SQONBuilder.lt('score', 51).lt('age', 40);
				expect(output).deep.contains(expectedSqon);
			});
		});
		describe('and', () => {
			it('gt().and() collects filters into single operator', () => {
				const expectedSqon: SQON = {
					op: CombinationKeys.And,
					content: [
						{
							op: FilterKeys.In,
							content: {
								fieldName: 'name',
								value: ['Jim', 'Bob'],
							},
						},
						{
							op: FilterKeys.LesserThan,
							content: {
								fieldName: 'score',
								value: 50,
							},
						},
					],
				};
				const output = SQONBuilder.in('name', ['Jim', 'Bob']).and(SQONBuilder.lt('score', 50));
				expect(output).deep.contain(expectedSqon);
			});
			it('or().and() wraps operators into and', () => {
				const expectedSqon: SQON = {
					op: CombinationKeys.And,
					content: [
						{
							op: CombinationKeys.Or,
							content: [
								{
									op: FilterKeys.GreaterThan,
									content: {
										fieldName: 'score',
										value: 95,
									},
								},
								{
									op: FilterKeys.In,
									content: {
										fieldName: 'name',
										value: ['Jim', 'Bob'],
									},
								},
							],
						},
						{
							op: FilterKeys.LesserThan,
							content: {
								fieldName: 'age',
								value: 22,
							},
						},
					],
				};
				const output = SQONBuilder.or([SQONBuilder.gt('score', 95), SQONBuilder.in('name', ['Jim', 'Bob'])]).and(
					SQONBuilder.lt('age', 22),
				);
				expect(output).deep.contain(expectedSqon);
			});
		});
		describe('or', () => {
			it('gt().or() collects filters into single operator', () => {
				const expectedSqon: SQON = {
					op: CombinationKeys.Or,
					content: [
						{
							op: FilterKeys.In,
							content: {
								fieldName: 'name',
								value: ['Jim', 'Bob'],
							},
						},
						{
							op: FilterKeys.LesserThan,
							content: {
								fieldName: 'score',
								value: 50,
							},
						},
					],
				};
				const output = SQONBuilder.in('name', ['Jim', 'Bob']).or(SQONBuilder.lt('score', 50));
				expect(output).deep.contain(expectedSqon);
			});
			it('gt().or(a).or(b) collects into or(gt, a, b)', () => {
				const expectedSqon: SQON = {
					op: CombinationKeys.Or,
					content: [
						{
							op: FilterKeys.In,
							content: {
								fieldName: 'name',
								value: ['Jim', 'Bob'],
							},
						},
						{
							op: FilterKeys.LesserThan,
							content: {
								fieldName: 'score',
								value: 50,
							},
						},
						{
							op: FilterKeys.GreaterThan,
							content: {
								fieldName: 'age',
								value: 25,
							},
						},
					],
				};
				const output = SQONBuilder.in('name', ['Jim', 'Bob'])
					.or(SQONBuilder.lt('score', 50))
					.or(SQONBuilder.gt('age', 25));
				expect(output).deep.contain(expectedSqon);
			});
		});
		describe('not', () => {
			it('gt().not(a) wraps a in not and combines in and', () => {
				const expectedSqon: SQON = {
					op: CombinationKeys.And,
					content: [
						{
							op: FilterKeys.In,
							content: {
								fieldName: 'name',
								value: ['Jim', 'Bob'],
							},
						},
						{
							op: CombinationKeys.Not,
							content: [
								{
									op: FilterKeys.LesserThan,
									content: {
										fieldName: 'score',
										value: 50,
									},
								},
							],
						},
					],
				};
				const output = SQONBuilder.in('name', ['Jim', 'Bob']).not(SQONBuilder.lt('score', 50));
				expect(output).deep.contain(expectedSqon);
			});
			it('gt().not(a).not(b) collects multiple nots within a single and', () => {
				/**
				 * This test is a bit counter intuitive.
				 * The optimum resolution would be to collect this into `and(gt(), not(a, b)))`,
				 * however we made the decision not to interfere with any negations added by the user
				 * so that they have more control on the resulting ES query. As a result this should become:
				 * `and(gt(), not(a), not(b) )` - still reduced to only one 'and' operator
				 */
				const expectedSqon: SQON = {
					op: CombinationKeys.And,
					content: [
						{
							op: FilterKeys.In,
							content: {
								fieldName: 'name',
								value: ['Jim', 'Bob'],
							},
						},
						{
							op: CombinationKeys.Not,
							content: [
								{
									op: FilterKeys.LesserThan,
									content: {
										fieldName: 'score',
										value: 50,
									},
								},
							],
						},
						{
							op: CombinationKeys.Not,
							content: [
								{
									op: FilterKeys.GreaterThan,
									content: {
										fieldName: 'age',
										value: 25,
									},
								},
							],
						},
					],
				};
				const output = SQONBuilder.in('name', ['Jim', 'Bob'])
					.not(SQONBuilder.lt('score', 50))
					.not(SQONBuilder.gt('age', 25));
				expect(output).deep.contain(expectedSqon);
			});
		});
		describe('removeExactFilter', () => {
			it('removes matching filter', () => {
				const filter: FilterOperator = { op: FilterKeys.In, content: { fieldName: 'name', value: ['Jim'] } };
				const base = SQONBuilder.gt('score', 90).in('name', 'Jim');
				const output = base.removeExactFilter(filter);

				const expected = SQONBuilder.gt('score', 90);

				expect(output).deep.contain(expected.toValue());
			});
			it('removes matching filter with array values independent of order', () => {
				const filter: FilterOperator = {
					op: FilterKeys.In,
					content: { fieldName: 'name', value: ['Jim', 'Bob', 'May', 'Sue'] },
				};
				const base = SQONBuilder.gt('score', 90).in('name', ['May', 'Sue', 'Bob', 'Jim']);
				const output = base.removeExactFilter(filter);

				const expected = SQONBuilder.gt('score', 90);

				expect(output).deep.contain(expected.toValue());
			});
			it('transforms filter to empty `and` operator', () => {
				const filter: FilterOperator = { op: FilterKeys.In, content: { fieldName: 'name', value: ['Jim'] } };
				const base = SQONBuilder.in('name', 'Jim');
				const output = base.removeExactFilter(filter);

				const expected = SQONBuilder.and([]);

				expect(output).deep.contain(expected.toValue());
			});
			it('makes no change when filter is not found', () => {
				const filter: FilterOperator = { op: FilterKeys.In, content: { fieldName: 'name', value: ['Jim'] } };
				const base = SQONBuilder.gt('score', 90).lt('age', 50);
				const output = base.removeExactFilter(filter);

				const expected = base;

				expect(output).deep.contain(expected.toValue());
			});
			it('makes no change to non matching filter', () => {
				const filter: FilterOperator = { op: FilterKeys.In, content: { fieldName: 'name', value: ['Jim'] } };
				const base = SQONBuilder.in('name', ['Jim', 'Bob']);
				const output = base.removeExactFilter(filter);

				const expected = base;

				expect(output).deep.contain(expected.toValue());
			});
		});
	});
});
