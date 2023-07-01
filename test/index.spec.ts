import { expect } from 'chai';
import * as Exports from '../src';

describe('index', () => {
	describe('exports', () => {
		it('default is SQONBuilder', () => {
			const { default: SQONBuilder } = Exports;
			expect(typeof SQONBuilder).equal('function');
			expect(SQONBuilder).haveOwnProperty('from');
			expect(SQONBuilder).haveOwnProperty('in');
			expect(SQONBuilder).haveOwnProperty('and');

			// Test it builds
			expect(SQONBuilder(`{"op":"in","content":{"fieldName":"name","value":["Jim"]}}`).toValue()).deep.equal({
				op: Exports.ArrayFilterKeys.In,
				content: {
					fieldName: 'name',
					value: ['Jim'],
				},
			});
		});
		it('reduceSQON is exported', () => {
			const { reduceSQON } = Exports;
			expect(typeof reduceSQON).equal('function');
		});
		describe('type guards', () => {
			it('isCombination is exported', () => {
				const { isCombination } = Exports;
				expect(typeof isCombination).equal('function');
			});
			it('isFilter is exported', () => {
				const { isFilter } = Exports;
				expect(typeof isFilter).equal('function');
			});
			it('isArrayFilter is exported', () => {
				const { isArrayFilter } = Exports;
				expect(typeof isArrayFilter).equal('function');
			});
		});
	});
});
