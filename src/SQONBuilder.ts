import {
	ArrayFilter,
	ArrayFilterValue,
	CombinationKey,
	CombinationKeys,
	CombinationOperator,
	FilterKey,
	FilterKeys,
	FilterOperator,
	FilterValue,
	FilterTypeMap,
	GreaterThanFilter,
	InFilter,
	LesserThanFilter,
	Operator,
	SQON,
	ScalarFilterValue,
	isArrayFilter,
	isCombination,
	isFilter,
} from './types/sqon';
import asArray from './utils/asArray';
import checkMatchingFilter, { checkMatchingArrays } from './utils/checkMatchingFilter';
import cloneDeepValues from './utils/cloneDeepValues';
import { createFilter } from './utils/createFilter';
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
	 *
	 * Note: This only looks for filters at the root of the sqon or in the content of the top level combination operator.
	 * This will not search recursively through the SQON.
	 * @example
	 * ```
	 * const initial = SQONBuilder.in('name', 'Jim').gt('score', 50);
initial.removeFilter({op: FilterKeys.In, content: {fieldName: 'name', value: ['Jim']}});
// {op: 'gt', content: {fieldName: 'score', value: 50}}
	 * ```
	 * @param filter
	 * @returns
	 */
	removeExactFilter: (filter: FilterOperator) => SQONBuilder;

	/**
	 * Find partial matching filters based on optional arguments and remove them from the SQON.
	 *
	 * If only the fieldName is provided, all filters on that field will be removed.
	 *
	 * If the fieldName and operator are provided, then a filter matching that fieldName and op will be removed
	 * (shouldn't ever be more than one in an operator due to the SQON reducer).
	 *
	 * If values are provided, then a filter exactly matching all the arguments will be removed.
	 * If a filter is found that matches the fieldName and op, then all matching values form the provided array will
	 * be removed from the filter. This lets you remove select values from an array filter without removing the entire
	 * filter.
	 *
	 * Note: This only looks for filters at the root of the sqon or in the content of the top level combination operator.
	 * This will not search recursively through the SQON.
	 *
	 * @example
	 * ```
	 * const builder = SQONBuilder.in('name', ['Jim', 'Bob']).gt('age', 20).lt('age', 50);
	 *
	 * // Remove all filters on 'age'
	 * builder.removeFilter('age');
	 * // {"op":"in","content":{"fieldName":"name","value":["Jim","Bob"]}}
	 * ```
	 * @example
	 * ```
	 * const builder = SQONBuilder.in('name', ['Jim', 'Bob', 'May']);
	 *
	 * // Remove values in filter
	 * builder.removeFilter('name', FilterKeys.In, ['Jim', 'Bob', 'Sue']);
	 * // {"op":"in","content":{"fieldName":"name","value":["May"]}}
	 * ```
	 * @param fieldName
	 * @param op
	 * @param value
	 * @returns
	 */
	removeFilter: (fieldName: string, op?: FilterKey, value?: FilterValue) => SQONBuilder;

	/**
	 * Add a specific filter to the content of the top level operator, or replace a matching filter (same `op` and `fieldName`) with the new value specified.
	 * If the current SQON is just a filter, then the existing filter and this new filter will be combined with an `and` operator.
	 *
	 * @example
	 * ```
	 * const builder = SQONBuilder.gt('age', 50).in('name', ['Jim', 'Bob']);
	 * builder.setFilter('name', FilterKeys.In, ['Jim', 'Sue']);
	 * // {"op":"and","content":[{"op":"gt","content":{"fieldName":"age","value":50}},{"op":"in","content":{"fieldName":"name","value":["Jim","Sue"]}}]}
	 * ```
	 *
	 * @param fieldName
	 * @param operator Filter key string
	 * @param value Filter value of a type that corresponds to the provided operator
	 * @returns
	 */
	setFilter: <Key extends FilterKey>(
		fieldName: string,
		op: Key,
		value: FilterTypeMap[Key]['content']['value'],
	) => SQONBuilder;

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

export const emptySQON = (): Operator => ({ op: CombinationKeys.And, content: [] });

const createBuilder = (sqon: SQON): SQONBuilder => {
	const _sqon = reduceSQON(cloneDeepValues(sqon));

	/* ===== Outputs ===== */
	const toString = () => JSON.stringify(_sqon);
	const toValue = () => _sqon;

	/* ===== Filter modification ===== */
	const removeExactFilter = (filter: FilterOperator): SQONBuilder => {
		if (isFilter(_sqon)) {
			if (checkMatchingFilter(_sqon, filter)) {
				// The entire sqon matches the filter to remove, so we will return an empty and combination operator
				return createBuilder(emptySQON());
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

	const removeFilter = (fieldName: string, op?: FilterKey, value?: FilterValue): SQONBuilder => {
		// To prevent repeatedly converting value into an array, do it once at the top
		// This is now our list of values we want to filter:
		const valuesToFilter = value !== undefined ? asArray(value) : undefined;

		/* ===== Private Functions for Matching ===== */
		// Conditional matching based on all the provided arguments
		function isMatchArgs(filter: FilterOperator) {
			return (
				fieldName === filter.content.fieldName &&
				(op === undefined || op === filter.op) &&
				(valuesToFilter === undefined || checkMatchingArrays(valuesToFilter, asArray(filter.content.value)))
			);
		}

		// Conditional matching based on fiedlName and op only - use this to find partial matchs on array filters before filtering array values
		function isPartialMatchArgs(filter: FilterOperator) {
			return fieldName === filter.content.fieldName && (op === undefined || op === filter.op);
		}

		// Clones filter and then removes values from content.value
		function filterValuesFromFilter(filter: ArrayFilter, valuesToFilter: (string | number)[]): ArrayFilter {
			const output = cloneDeepValues(filter);
			output.content.value = asArray(output.content.value).filter((value) => !valuesToFilter.includes(value));
			return output;
		}

		/* ===== Remove Filter Work ===== */
		// First check if the entire sqon is a filter, if so we can apply the matching logic to just that opeartor
		if (isFilter(_sqon)) {
			if (isMatchArgs(_sqon)) {
				// Remove entire sqon since it matches the filter args
				return createBuilder(emptySQON());
			} else if (valuesToFilter !== undefined && isArrayFilter(_sqon) && isPartialMatchArgs(_sqon)) {
				// Filter wasnt removed, but it matches partially so we can filter out specific filter values
				const output = filterValuesFromFilter(_sqon, valuesToFilter);
				return createBuilder(output);
			} else {
				// No match, no change
				return createBuilder(_sqon);
			}
		}

		// Filter content to remove all exact matches
		const filteredContent = _sqon.content.filter((operator) => isCombination(operator) || !isMatchArgs(operator));

		if (valuesToFilter !== undefined) {
			// we also need to find partial matches for array filters and remove any values that are included in our values array here
			// map over the filtered content to find any partial matches, then filter values out of the partial match, otherwise return the unmodified operator
			const outputContent = filteredContent.map((operator) =>
				isArrayFilter(operator) && isPartialMatchArgs(operator)
					? filterValuesFromFilter(operator, valuesToFilter)
					: operator,
			);
			const updated: CombinationOperator = { op: _sqon.op, content: outputContent };
			return createBuilder(updated);
		} else {
			const updated: CombinationOperator = { op: _sqon.op, content: filteredContent };
			return createBuilder(updated);
		}
	};

	const setFilter = <Key extends FilterKey>(
		fieldName: string,
		op: Key,
		value: FilterTypeMap[Key]['content']['value'],
	): SQONBuilder => {
		if (isFilter(_sqon)) {
			// Builder is just one filter, check if it matches our applied filter and replace it, or join them both with an and
			if (_sqon.op === op && _sqon.content.fieldName === fieldName) {
				return createBuilder(createFilter(fieldName, op, value));
			} else {
				return SQONBuilder.and([_sqon, createFilter(fieldName, op, value)]);
			}
		}

		let found = false;
		const updatedContent = _sqon.content.map((operator) => {
			if (isFilter(operator) && operator.op === op && operator.content.fieldName === fieldName) {
				found = true;
				const replacement = cloneDeepValues(operator);
				replacement.content.value = value;
				return replacement;
			}
			return operator;
		});
		if (!found) {
			updatedContent.push(createFilter(fieldName, op, value));
		}
		return createBuilder({ op: _sqon.op, content: updatedContent });
	};

	return {
		and: _and(_sqon),
		or: _or(_sqon),
		not: _not(_sqon),
		in: _in(_sqon),
		gt: _gt(_sqon),
		lt: _lt(_sqon),
		removeExactFilter,
		removeFilter,
		setFilter,
		toString,
		toValue,
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
		return createBuilder(sqon); // TODO: make cloneDeep copy everything and have a second step strip functions
	}
};
SQONBuilder.and = _and(emptySQON());
SQONBuilder.or = _or(emptySQON());
SQONBuilder.not = _not(emptySQON());
SQONBuilder.in = _in(emptySQON());
SQONBuilder.gt = _gt(emptySQON());
SQONBuilder.lt = _lt(emptySQON());
SQONBuilder.from = _from;

export default SQONBuilder;
