import {
	ArrayFilterValue,
	FilterKey,
	FilterOperator,
	FilterValueMap,
	ScalarFilterValue,
	isArrayFilterKey,
	isArrayFilterValue,
	isScalarFilterKey,
	isScalarFilterValue,
} from '../types/sqon';
import asArray from './asArray';

export const createFilter = <Key extends FilterKey>(
	fieldName: string,
	op: Key,
	value: FilterValueMap[Key],
): FilterOperator => {
	if (isArrayFilterKey(op) && isArrayFilterValue(value)) {
		return { op, content: { fieldName, value: asArray(value) } };
	} else if (isScalarFilterKey(op) && isScalarFilterValue(value)) {
		return { op, content: { fieldName, value } };
	} else {
		// This code should not be reached if the typescript checks are adhered to, the value argument should always be appropriate for the op
		// However, should the checks fail and an incorrect value is provided for the given op this will throw an error.
		throw new TypeError(`Cannot assign the value "${value}" to a filter of type "${op}".`);
	}
};
