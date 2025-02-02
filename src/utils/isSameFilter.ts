import { FilterKeySets, GreaterThanFilterKeys, type FilterOperator } from '../types';
import filterDuplicates from './filterDuplicates';

/**
 * Determine if every value in the values array is found in the options array.
 *
 * @param options
 * @param values
 * @returns
 */
function allIncluded<T>(options: T[], values: T[]): boolean {
	return values.filter((value) => options.includes(value)).length === values.length;

	// let count = 0;
	// for (const option of options) {
	// 	count += values.filter((i) => i === option).length;
	// 	if (count >= values.length) {
	// 		return true;
	// 	}
	// }
	// return false;
}

export function isSameFilter(filterA: FilterOperator, filterB: FilterOperator): boolean {
	if (filterA.op === filterB.op) {
		return true;
	}

	const operations: string[] = [filterA.op, filterB.op];
	for (const keySet of FilterKeySets) {
		if (allIncluded(keySet, operations)) {
			return true;
		}
	}

	return false;
}
