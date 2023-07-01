import { expect } from 'chai';
import { ArrayFilter, FilterKeys, FilterOperator, ScalarFilter } from '../../src';
import checkMatchingFilter from '../../src/utils/checkMatchingFilter';

describe('utils/checkMatchingFilter', () => {
	it('matches scalar filters', () => {
		const a: ScalarFilter = { op: FilterKeys.GreaterThan, content: { fieldName: 'score', value: 90 } };
		const match: ScalarFilter = { op: FilterKeys.GreaterThan, content: { fieldName: 'score', value: 90 } };
		const notMatchValue: ScalarFilter = { op: FilterKeys.GreaterThan, content: { fieldName: 'score', value: 89 } };
		const notMatchOp: ScalarFilter = { op: FilterKeys.LesserThan, content: { fieldName: 'score', value: 90 } };
		const notMatchFieldName: ScalarFilter = { op: FilterKeys.GreaterThan, content: { fieldName: 'age', value: 90 } };
		expect(checkMatchingFilter(a, match)).true;
		expect(checkMatchingFilter(a, notMatchValue)).false;
		expect(checkMatchingFilter(a, notMatchOp)).false;
		expect(checkMatchingFilter(a, notMatchFieldName)).false;
	});
	it('matches array filters', () => {
		const a: ArrayFilter = { op: FilterKeys.In, content: { fieldName: 'score', value: 90 } };
		const match: ArrayFilter = { op: FilterKeys.In, content: { fieldName: 'score', value: 90 } };
		const notMatchValue: ArrayFilter = { op: FilterKeys.In, content: { fieldName: 'score', value: 89 } };
		const notMatchOp: FilterOperator = { op: FilterKeys.LesserThan, content: { fieldName: 'score', value: 90 } };
		const notMatchFieldName: ArrayFilter = { op: FilterKeys.In, content: { fieldName: 'age', value: 90 } };
		expect(checkMatchingFilter(a, match)).true;
		expect(checkMatchingFilter(a, notMatchValue)).false;
		expect(checkMatchingFilter(a, notMatchOp)).false;
		expect(checkMatchingFilter(a, notMatchFieldName)).false;
	});
	it('matches array filters with mixed array orders', () => {
		const a: ArrayFilter = { op: FilterKeys.In, content: { fieldName: 'name', value: ['Jim', 'Bob', 'May'] } };
		const matchSameOrder: ArrayFilter = {
			op: FilterKeys.In,
			content: { fieldName: 'name', value: ['Jim', 'Bob', 'May'] },
		};
		const matchDifferentOrder: ArrayFilter = {
			op: FilterKeys.In,
			content: { fieldName: 'name', value: ['May', 'Jim', 'Bob'] },
		};
		const notMatchMissingValue: ArrayFilter = {
			op: FilterKeys.In,
			content: { fieldName: 'name', value: ['Jim', 'Bob'] },
		};
		const notMatchAddedValue: FilterOperator = {
			op: FilterKeys.In,
			content: { fieldName: 'name', value: ['Jim', 'Bob', 'May', 'Sue'] },
		};
		expect(checkMatchingFilter(a, matchSameOrder)).true;
		expect(checkMatchingFilter(a, matchDifferentOrder)).true;
		expect(checkMatchingFilter(a, notMatchMissingValue)).false;
		expect(checkMatchingFilter(a, notMatchAddedValue)).false;
	});
});
