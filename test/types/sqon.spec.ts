import { expect } from 'chai';
import {
	CombinationKeys,
	CombinationOperator,
	FilterKeys,
	FilterOperator,
	isArrayFilter,
	isArrayFilterKey,
	isCombination,
	isFilter,
	isScalarFilter,
	isScalarFilterKey,
} from '../../src/types/sqon';

const combo: CombinationOperator = { op: CombinationKeys.And, content: [] };
const arrayFilter: FilterOperator = { op: FilterKeys.In, content: { fieldName: 'a', value: ['b', 'c'] } };
const scalarFilter: FilterOperator = { op: FilterKeys.GreaterThan, content: { fieldName: 'a', value: 1 } };

describe('types/sqon', () => {
	describe('type guards', () => {
		describe('isCombination', () => {
			it('validates combination operator', () => {
				expect(isCombination(combo)).true;
			});
			it('rejects filter operator', () => {
				expect(isCombination(arrayFilter)).false;
				expect(isCombination(scalarFilter)).false;
			});
		});
		describe('isFilter', () => {
			it('validates filter operator', () => {
				expect(isFilter(arrayFilter)).true;
				expect(isFilter(scalarFilter)).true;
			});
			it('rejects combination operator', () => {
				expect(isFilter(combo)).false;
			});
		});
		describe('isArrayFilter', () => {
			it('validates array filter', () => {
				expect(isArrayFilter(arrayFilter)).true;
			});
			it('rejects combination operator', () => {
				expect(isArrayFilter(scalarFilter)).false;
			});
			it('rejects scalar filter', () => {
				expect(isArrayFilter(scalarFilter)).false;
			});
		});
		describe('isScalarFilter', () => {
			it('validates scalar filter', () => {
				expect(isScalarFilter(scalarFilter)).true;
			});
			it('rejects combination operator', () => {
				expect(isScalarFilter(arrayFilter)).false;
			});
			it('rejects array filter', () => {
				expect(isScalarFilter(combo)).false;
			});
		});
		describe('isArrayFilterKey', () => {
			it('validates array keys', () => {
				expect(isArrayFilterKey(FilterKeys.In)).true;
			});
			it('rejects scalar keys', () => {
				expect(isArrayFilterKey(FilterKeys.GreaterThan)).false;
				expect(isArrayFilterKey(FilterKeys.LesserThan)).false;
			});
		});
		describe('isScalarFilterKey', () => {
			it('validates array keys', () => {
				expect(isScalarFilterKey(FilterKeys.GreaterThan)).true;
				expect(isScalarFilterKey(FilterKeys.LesserThan)).true;
			});
			it('rejects scalar keys', () => {
				expect(isScalarFilterKey(FilterKeys.In)).false;
			});
		});
	});
});
