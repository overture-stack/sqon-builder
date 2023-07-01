import {
	ArrayFilterValue,
	CombinationKey,
	CombinationKeys,
	CombinationOperator,
	FilterKeys,
	FilterOperator,
	GreaterThanFilter,
	InFilter,
	LesserThanFilter,
	SQON,
	ScalarFilterKeys,
	ScalarFilterValue,
	isCombination,
	isFilter,
} from './types/sqon';
import asArray from './utils/asArray';
import checkMatchingFilter from './utils/checkMatchingFilter';
import { default as clonePojo } from './utils/cloneDeepPojo';
import reduceSQON from './utils/reduceSQON';

type SQONBuilder = {
	and: (content: SQON | SQON[]) => SQONBuilder;
	or: (content: SQON | SQON[]) => SQONBuilder;
	not: (content: SQON | SQON[]) => SQONBuilder;

	in: (fieldName: string, value: ArrayFilterValue) => SQONBuilder;
	gt: (fieldName: string, value: ScalarFilterValue) => SQONBuilder;
	lt: (fieldName: string, value: ScalarFilterValue) => SQONBuilder;

	/* ===== Filter Modifiers ===== */
	/**
	 * Find exact matching filter at top level of SQON and remove it from the SQON.
	 * For filters with an array of values, the order of the array will be ignored during matching.
	 * @param filter
	 * @returns
	 */
	removeExactFilter: (filter: FilterOperator) => SQONBuilder;

	/**
	 * Return a string with the JSON stringified representation of the current SQON
	 * @returns
	 */
	toString: () => string;
	/**
	 * Return the current SQON as a plain object
	 * @returns
	 */
	toValue: () => SQON;
} & SQON;

const createBuilder = (sqon: SQON): SQONBuilder => {
	const _sqon = reduceSQON(clonePojo(sqon));

	const toString = () => JSON.stringify(_sqon);
	const toValue = () => _sqon;
	const removeExactFilter = (filter: FilterOperator): SQONBuilder => {
		if (isFilter(_sqon)) {
			if (checkMatchingFilter(_sqon, filter)) {
				// The entire sqon matches the filter to remove, so we will return an empty and combination operator
				return SQONBuilder.and([]);
			} else {
				return createBuilder(_sqon);
			}
		} else {
			const filteredContent = _sqon.content.filter(
				(operator) => !isFilter(operator) || !checkMatchingFilter(operator, filter),
			);
			const updated: CombinationOperator = { op: _sqon.op, content: filteredContent };
			return createBuilder(updated);
		}
	};
	return {
		and: _and(_sqon),
		or: _or(_sqon),
		not: _not(_sqon),
		in: _in(_sqon),
		gt: _gt(_sqon),
		lt: _lt(_sqon),
		toString,
		toValue,
		removeExactFilter,
		..._sqon,
	};
};

const combine = (op: CombinationKey, sqon: SQON, content: SQON | SQON[]): CombinationOperator => {
	if (sqon.op === op) {
		return {
			op,
			content: [...sqon.content, ...asArray(content)],
		};
	} else {
		return {
			op,
			content: [sqon, ...asArray(content)],
		};
	}
};

/**
 * Given any input, attempt to parse it as a SQON. If it is a valid SQON or SQON string then this
 * will return a SQONBuilder with that sqon.
 *
 * An error will be thrown if the provided input is invalid.
 * @param input
 * @throws ZodError - schema validation is performed by zod, the ZodError will include information on why the input failed validation.
 * @returns
 */
const _from = (input: unknown): SQONBuilder => {
	const parsed = typeof input === 'string' ? JSON.parse(input) : input;
	const sqon = SQON.parse(parsed);
	return createBuilder(sqon);
};
const _and =
	(original: SQON) =>
	(content: SQON | SQON[]): SQONBuilder =>
		createBuilder(combine(CombinationKeys.And, original, content));
const _or =
	(original: SQON) =>
	(content: SQON | SQON[]): SQONBuilder =>
		createBuilder(combine(CombinationKeys.Or, original, content));
const _not =
	(original: SQON) =>
	(content: SQON | SQON[]): SQONBuilder => {
		const notOp: CombinationOperator = {
			op: CombinationKeys.Not,
			content: asArray(content),
		};
		return createBuilder(combine(CombinationKeys.And, original, notOp));
	};
const _in =
	(original: SQON) =>
	(fieldName: string, value: ArrayFilterValue): SQONBuilder => {
		// To standardize outputs, we will always transform single values into an array of 1 item
		const filter: InFilter = {
			op: FilterKeys.In,
			content: { fieldName, value: asArray(value) },
		};
		return _and(original)(filter);
	};
const _gt =
	(original: SQON) =>
	(fieldName: string, value: ScalarFilterValue): SQONBuilder => {
		const filter: GreaterThanFilter = {
			op: FilterKeys.GreaterThan,
			content: { fieldName, value },
		};
		return _and(original)(filter);
	};
const _lt =
	(original: SQON) =>
	(fieldName: string, value: ScalarFilterValue): SQONBuilder => {
		const filter: LesserThanFilter = {
			op: FilterKeys.LesserThan,
			content: { fieldName, value },
		};
		return _and(original)(filter);
	};

const SQONBuilder = (sqon: SQONBuilder | SQON | string): SQONBuilder => {
	if (typeof sqon === 'string') {
		return _from(sqon);
	} else {
		return _from(clonePojo(sqon));
	}
};
SQONBuilder.and = _and({ op: CombinationKeys.And, content: [] });
SQONBuilder.or = _or({ op: CombinationKeys.And, content: [] });
SQONBuilder.not = _not({ op: CombinationKeys.And, content: [] });
SQONBuilder.in = _in({ op: CombinationKeys.And, content: [] });
SQONBuilder.gt = _gt({ op: CombinationKeys.And, content: [] });
SQONBuilder.lt = _lt({ op: CombinationKeys.And, content: [] });
SQONBuilder.from = _from;

export default SQONBuilder;
