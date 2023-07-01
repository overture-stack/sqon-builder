import { expect } from 'chai';
import cloneDeepPojo from '../../src/utils/cloneDeepPojo';

describe('cloneDeepPojo', () => {
	it('clones nested objects', () => {
		const object = {
			array: ['item', { a: 'objectInArray' }, 1234],
			number: 1234,
			string: 'asdf',
			object: { a: 'asdf', b: ['arrayInObject', 2345] },
			nested1: { nested2: { nested3: {} } },
		};
		const clone = cloneDeepPojo(object);
		expect(clone).not.equal(object);
		expect(clone).deep.equal(object);
		expect(clone).deep.contain(object);

		// Test deep clones
		expect(clone.array).not.equal(object.array);
		expect(clone.object).not.equal(object.object);
		expect(clone.nested1.nested2).not.equal(object.nested1.nested2);
		expect(clone.nested1.nested2.nested3).not.equal(object.nested1.nested2.nested3);
	});
	it('strips functions', () => {
		const object = {
			a: 'string',
			function: () => {},
		};
		const expected = { a: 'string' };

		const clone = cloneDeepPojo(object);
		expect(clone).deep.equal(expected);
		expect(clone).not.haveOwnProperty('function');
	});
});
