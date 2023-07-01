import { expect } from 'chai';
import filterDuplicates from '../../src/utils/filterDuplicates';

describe('filterDuplicates', () => {
	it('no duplicates - not modified', () => {
		const input = [1, 2, 3, 4];
		const output = input.filter(filterDuplicates);
		expect(output).deep.equal(input);
	});
	it('duplicates - removes duplicates', () => {
		const input = [1, 1, 2, 3, 2, 3, 4, 4, 4, 4, 4];
		const output = input.filter(filterDuplicates);
		expect(output).deep.equal([1, 2, 3, 4]);
	});
});
