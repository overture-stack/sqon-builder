import { expect } from 'chai';
import { ArrayFilter, FilterKeys, FilterOperator, ScalarFilter } from '../../src';
import checkMatchingFilter, { checkMatchingArrays } from '../../src/utils/checkMatchingFilter';

describe('utils/checkMatchingFilter', () => {
	describe('checkMatchingArrays', () => {
		it('true when identical arrays', () => {
			const a = [1, 2, 3, 4];
			const b = [1, 2, 3, 4];
			expect(checkMatchingArrays(a, b)).true;
		});
		it('true when empty arrays', () => {
			const a: never[] = [];
			const b: never[] = [];
			expect(checkMatchingArrays(a, b)).true;
		});
		it('true when arrays with different orders', () => {
			const a = [1, 2, 3, 4];
			const b = [3, 2, 1, 4];
			expect(checkMatchingArrays(a, b)).true;
		});
		it('true when when one array has duplicates', () => {
			const a = [1, 2, 3, 4];
			const b = [3, 2, 1, 4, 2, 3];
			expect(checkMatchingArrays(a, b)).true;
		});
		it('false when arrays are different', () => {
			const a = [1, 2];
			const b = [3, 4];
			expect(checkMatchingArrays(a, b)).false;
		});
		it('false when one array has more elements', () => {
			const a = [1, 2, 3, 4];
			const b = [1, 2, 3, 4, 5];
			expect(checkMatchingArrays(a, b)).false;
			expect(checkMatchingArrays(b, a)).false;
		});
	});
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
