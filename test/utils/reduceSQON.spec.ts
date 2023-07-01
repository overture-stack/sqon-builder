import { expect } from 'chai';
import {
	CombinationKeys,
	CombinationOperator,
	FilterKeys,
	FilterOperator,
	GreaterThanFilter,
	InFilter,
	LesserThanFilter,
	SQON,
	reduceSQON,
} from '../../src';

describe('reduceSQON', () => {
	describe('filters', () => {
		// Filters of the same type and same name in the same combination operator can combine into a single filter
		it('combines multiple `in` filters', () => {
			const filterA: InFilter = { op: FilterKeys.In, content: { fieldName: 'name', value: ['Jim', 'Sue'] } };
			const filterB: InFilter = { op: FilterKeys.In, content: { fieldName: 'name', value: ['Bob', 'May'] } };
			const input: SQON = { op: CombinationKeys.And, content: [filterA, filterB] };

			const expected = { op: FilterKeys.In, content: { fieldName: 'name', value: ['Jim', 'Sue', 'Bob', 'May'] } };

			const output = reduceSQON(input);

			expect(output).deep.equal(expected);
		});
		it('removes duplicates in array filter', () => {
			const filterA: InFilter = { op: FilterKeys.In, content: { fieldName: 'name', value: ['Jim', 'Sue', 'May'] } };
			const filterB: InFilter = { op: FilterKeys.In, content: { fieldName: 'name', value: ['Jim', 'Bob', 'May'] } };
			const input: SQON = { op: CombinationKeys.And, content: [filterA, filterB] };

			const expected = { op: FilterKeys.In, content: { fieldName: 'name', value: ['Jim', 'Sue', 'May', 'Bob'] } };

			const output = reduceSQON(input);

			expect(output).deep.equal(expected);
		});
		it('combines multiple `greaterThan` within `and` using max', () => {
			const filterA: GreaterThanFilter = { op: FilterKeys.GreaterThan, content: { fieldName: 'num', value: 1 } };
			const filterB: GreaterThanFilter = { op: FilterKeys.GreaterThan, content: { fieldName: 'num', value: 2 } };
			const input: SQON = { op: CombinationKeys.And, content: [filterA, filterB] };

			const expected = { op: FilterKeys.GreaterThan, content: { fieldName: 'num', value: 2 } };

			const output = reduceSQON(input);

			expect(output).deep.equal(expected);
		});
		it('combines multiple `greaterThan` within `not` using max', () => {
			const filterA: GreaterThanFilter = { op: FilterKeys.GreaterThan, content: { fieldName: 'num', value: 1 } };
			const filterB: GreaterThanFilter = { op: FilterKeys.GreaterThan, content: { fieldName: 'num', value: 2 } };
			const input: SQON = { op: CombinationKeys.Not, content: [filterA, filterB] };

			const expected = {
				op: CombinationKeys.Not,
				content: [{ op: FilterKeys.GreaterThan, content: { fieldName: 'num', value: 2 } }],
			};

			const output = reduceSQON(input);

			expect(output).deep.equal(expected);
		});
		it('combines multiple `greaterThan` within `or` using min', () => {
			const filterA: GreaterThanFilter = { op: FilterKeys.GreaterThan, content: { fieldName: 'num', value: 1 } };
			const filterB: GreaterThanFilter = { op: FilterKeys.GreaterThan, content: { fieldName: 'num', value: 2 } };
			const input: SQON = { op: CombinationKeys.Or, content: [filterA, filterB] };

			const expected = { op: FilterKeys.GreaterThan, content: { fieldName: 'num', value: 1 } };

			const output = reduceSQON(input);

			expect(output).deep.equal(expected);
		});
		it('combines multiple `lesserThan` within `and` using min', () => {
			const filterA: LesserThanFilter = { op: FilterKeys.LesserThan, content: { fieldName: 'num', value: 1 } };
			const filterB: LesserThanFilter = { op: FilterKeys.LesserThan, content: { fieldName: 'num', value: 2 } };
			const input: SQON = { op: CombinationKeys.And, content: [filterA, filterB] };

			const expected = { op: FilterKeys.LesserThan, content: { fieldName: 'num', value: 1 } };

			const output = reduceSQON(input);

			expect(output).deep.equal(expected);
		});
		it('combines multiple `lesserThan` within `not` using min', () => {
			const filterA: LesserThanFilter = { op: FilterKeys.LesserThan, content: { fieldName: 'num', value: 1 } };
			const filterB: LesserThanFilter = { op: FilterKeys.LesserThan, content: { fieldName: 'num', value: 2 } };
			const input: SQON = { op: CombinationKeys.Not, content: [filterA, filterB] };

			const expected = {
				op: CombinationKeys.Not,
				content: [{ op: FilterKeys.LesserThan, content: { fieldName: 'num', value: 1 } }],
			};

			const output = reduceSQON(input);

			expect(output).deep.equal(expected);
		});
		it('combines multiple `lesserThan` within `or` using max', () => {
			const filterA: LesserThanFilter = { op: FilterKeys.LesserThan, content: { fieldName: 'num', value: 1 } };
			const filterB: LesserThanFilter = { op: FilterKeys.LesserThan, content: { fieldName: 'num', value: 2 } };
			const input: SQON = { op: CombinationKeys.Or, content: [filterA, filterB] };

			const expected = { op: FilterKeys.LesserThan, content: { fieldName: 'num', value: 2 } };

			const output = reduceSQON(input);

			expect(output).deep.equal(expected);
		});
		it('does not combine filters with different names', () => {
			const filterA: InFilter = { op: FilterKeys.In, content: { fieldName: 'name', value: ['Jim', 'Sue'] } };
			const filterB: InFilter = { op: FilterKeys.In, content: { fieldName: 'sibling', value: ['Bob', 'May'] } };
			const input: SQON = { op: CombinationKeys.And, content: [filterA, filterB] };

			const expected = input;

			const output = reduceSQON(input);

			expect(output).deep.equal(expected);
		});
	});

	describe('combinations', () => {
		it('`and` and `or` combination with single filter is removed', () => {
			const filter: FilterOperator = { op: FilterKeys.GreaterThan, content: { fieldName: 'num', value: 1 } };
			const inputAnd: CombinationOperator = { op: CombinationKeys.And, content: [filter] };
			const inputOr: CombinationOperator = { op: CombinationKeys.And, content: [filter] };

			expect(reduceSQON(inputAnd)).deep.equal(filter);
			expect(reduceSQON(inputOr)).deep.equal(filter);
		});
		it('`not` combination with single filter is not changed', () => {
			const filter: FilterOperator = { op: FilterKeys.GreaterThan, content: { fieldName: 'num', value: 1 } };
			const inputNot: CombinationOperator = { op: CombinationKeys.Not, content: [filter] };

			expect(reduceSQON(inputNot)).deep.equal(inputNot);
		});
		it('nested `and` combinations are removed', () => {
			const filterA: FilterOperator = { op: FilterKeys.In, content: { fieldName: 'name', value: ['Jim', 'Sue'] } };
			const filterB: FilterOperator = { op: FilterKeys.GreaterThan, content: { fieldName: 'num', value: 2 } };
			const filterC: FilterOperator = { op: FilterKeys.LesserThan, content: { fieldName: 'score', value: 10 } };
			const comboA: CombinationOperator = { op: CombinationKeys.And, content: [filterA, filterB] };
			const comboB: CombinationOperator = { op: CombinationKeys.And, content: [filterC] };
			const input: CombinationOperator = { op: CombinationKeys.And, content: [comboA, comboB] };
			const expected = { op: CombinationKeys.And, content: [filterA, filterB, filterC] };
			expect(reduceSQON(input)).deep.equal(expected);
		});
		it('nested `or` combinations are removed', () => {
			const filterA: FilterOperator = { op: FilterKeys.In, content: { fieldName: 'name', value: ['Jim', 'Sue'] } };
			const filterB: FilterOperator = { op: FilterKeys.GreaterThan, content: { fieldName: 'num', value: 2 } };
			const filterC: FilterOperator = { op: FilterKeys.LesserThan, content: { fieldName: 'score', value: 10 } };
			const comboA: CombinationOperator = { op: CombinationKeys.Or, content: [filterA, filterB] };
			const comboB: CombinationOperator = { op: CombinationKeys.Or, content: [filterC] };
			const input: CombinationOperator = { op: CombinationKeys.Or, content: [comboA, comboB] };
			const expected = { op: CombinationKeys.Or, content: [filterA, filterB, filterC] };
			expect(reduceSQON(input)).deep.equal(expected);
		});
		it('nested `not` combinations are left unchanged', () => {
			// Not optimal behaviour, but simplest way to not introduce errors with negation
			const filterA: FilterOperator = { op: FilterKeys.In, content: { fieldName: 'name', value: ['Jim', 'Sue'] } };
			const filterB: FilterOperator = { op: FilterKeys.GreaterThan, content: { fieldName: 'num', value: 2 } };
			const filterC: FilterOperator = { op: FilterKeys.LesserThan, content: { fieldName: 'score', value: 10 } };
			const comboA: CombinationOperator = { op: CombinationKeys.Not, content: [filterA, filterB] };
			const comboB: CombinationOperator = { op: CombinationKeys.Not, content: [filterC] };
			const input: CombinationOperator = { op: CombinationKeys.Not, content: [comboA, comboB] };
			const expected = input;
			expect(reduceSQON(input)).deep.equal(expected);
		});
		it('removes empty combination operators', () => {
			const input = {
				op: CombinationKeys.And,
				content: [
					{ op: CombinationKeys.And, content: [] },
					{ op: CombinationKeys.Or, content: [] },
					{ op: CombinationKeys.Not, content: [] },
				],
			};
			const expected = { op: CombinationKeys.And, content: [] };
			expect(reduceSQON(input)).deep.equal(expected);
		});
	});
});
