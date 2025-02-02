import { expect } from 'chai';
import { GreaterThanFilter, type InFilter, type LesserThanFilter } from '../../src/types/sqonFilters';
import { isSameFilter } from '../../src/utils/isSameFilter';

const inFilter: InFilter = {
	op: 'in',
	content: { value: 0, fieldName: 'anything' },
};
const gtFilter: GreaterThanFilter = {
	op: 'gt',
	content: { value: 0, fieldName: 'anything' },
};
const gtSymbolFilter: GreaterThanFilter = {
	op: '>',
	content: { value: 0, fieldName: 'anything' },
};
const ltFilter: LesserThanFilter = {
	op: 'lt',
	content: { value: 0, fieldName: 'anything' },
};
const ltSymbolFilter: LesserThanFilter = {
	op: '<',
	content: { value: 0, fieldName: 'anything' },
};

describe('utils/isSameFilter', () => {
	it('same op - returns true', () => {
		expect(isSameFilter(gtFilter, gtFilter)).true;
		expect(isSameFilter(gtSymbolFilter, gtSymbolFilter)).true;
		expect(isSameFilter(ltFilter, ltFilter)).true;
		expect(isSameFilter(ltSymbolFilter, ltSymbolFilter)).true;
		expect(isSameFilter(inFilter, inFilter)).true;
	});
	it('greaterthan - alt op - returns true', () => {
		expect(isSameFilter(gtFilter, gtSymbolFilter)).true;
		expect(isSameFilter(gtSymbolFilter, gtFilter)).true;
	});
	it('lesserthan - different op values - returns true', () => {
		expect(isSameFilter(ltFilter, ltSymbolFilter)).true;
		expect(isSameFilter(ltSymbolFilter, ltFilter)).true;
	});
	it('non-matching - returns false', () => {
		expect(isSameFilter(ltFilter, gtSymbolFilter)).false;
		expect(isSameFilter(ltSymbolFilter, gtFilter)).false;
		expect(isSameFilter(gtSymbolFilter, inFilter)).false;
		expect(isSameFilter(inFilter, ltFilter)).false;
	});
});
