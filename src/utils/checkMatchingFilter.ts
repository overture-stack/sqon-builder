import { FilterOperator, isArrayFilter } from '../types/sqon';
import asArray from './asArray';

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
	const valuesA = [...asArray(a.content.value)].sort();
	const valuesB = [...asArray(b.content.value)].sort();
	// This check requires that each array is the same length so we can compare them item by item
	return valuesA.length === valuesB.length && valuesA.every((value, index) => value === valuesB[index]);
};

export default checkMatchingFilter;
