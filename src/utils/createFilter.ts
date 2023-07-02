import {
	FilterKey,
	FilterOperator,
	FilterValueMap,
	ScalarFilterValue,
	isArrayFilterKey,
	isScalarFilterKey,
} from '../types/sqon';
import asArray from './asArray';

export const createFilter = <Key extends FilterKey>(
	fieldName: string,
	op: Key,
	value: FilterValueMap[Key],
): FilterOperator => {
	if (isArrayFilterKey(op)) {
		return { op, content: { fieldName, value: asArray(value) } };
	} else {
		// TS will ensure x is a ScalarFilterValue but the type inference isnt keeping up
		// TODO: there must be a way to get the type inference to work here
		return { op, content: { fieldName, value: value as ScalarFilterValue } };
	}
};
