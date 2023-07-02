import { FilterOperator, isArrayFilter } from '../types/sqon';
import asArray from './asArray';
import filterDuplicates from './filterDuplicates';

/**
 * Compare two arrays ensuring they have the same elements. This removes duplicates and compares them
 * item by item in sorted order.
 *
 * Note this will work well with primatives. For arrays of objects it will be matching by reference and not by value.
 *
 * @param a
 * @param b
 * @returns
 */
export const checkMatchingArrays = <T>(a: T[], b: T[]): boolean => {
	const valuesA = [...a].filter(filterDuplicates).sort();
	const valuesB = [...b].filter(filterDuplicates).sort();
	// This check requires that each array is the same length so we can compare them item by item
	return valuesA.length === valuesB.length && valuesA.every((value, index) => value === valuesB[index]);
};

/**
 * Check if two filters are equivalent.
 * In addition to checking if op and content.fieldName are matching strings, this
 * will compare values as sorted arrays so that any mixed orders do not prevent matching.
 * @param a
 * @param b
 * @returns
 */
const checkMatchingFilter = (a: FilterOperator, b: FilterOperator): boolean => {
	if (a.op !== b.op || a.content.fieldName !== b.content.fieldName) {
		return false;
	}

	// Clone values into arrays and sort them so we can compare item by item.
	return checkMatchingArrays(asArray(a.content.value), asArray(b.content.value));
};

export default checkMatchingFilter;
