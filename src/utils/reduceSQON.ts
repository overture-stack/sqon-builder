import {
	CombinationKeys,
	FilterKeys,
	GreaterThanFilter,
	InFilter,
	isArrayFilter,
	isFilter,
	LesserThanFilter,
	type CombinationOperator,
	type FilterOperator,
	type SQON,
} from '../types';
import asArray from './asArray';
import { createFilter } from './createFilter';
import filterDuplicates from './filterDuplicates';
import { isSameFilter } from './isSameFilter';
import { matchesSchema } from './matchesSchema';
/**
 * For an ArrayFilter, remove duplicate entries from the array of values.
 * @param filter
 * @returns
 */
const deduplicateValues = (filter: FilterOperator): FilterOperator => {
	if (isArrayFilter(filter)) {
		const value = asArray(filter.content.value).filter(filterDuplicates);
		return createFilter(filter.content.fieldName, filter.op, value);
	}
	return filter;
};

/**
 * Reduce the total number of operators in a sqon. This function recursively goes through all operators
 * nested in the provided SQON and collects the content where there is duplication or redundant combinations
 * and filters.
 * @param sqon
 * @returns SQON with redundant operators removed
 */
const reduceSQON = (sqon: SQON): SQON => {
	if (isFilter(sqon)) {
		return deduplicateValues(sqon);
	} else {
		const output: CombinationOperator = {
			op: sqon.op,
			content: [],
		};
		if (sqon.pivot !== undefined) {
			// dont automatically assign `pivot: undefined` to an operator, it will then appear in every output and that is not desired
			// optionally assigning pivot only if it has a value avoids this
			output.pivot = sqon.pivot;
		}
		for (const innerSqon of sqon.content) {
			// Filters are added to output content
			if (isFilter(innerSqon)) {
				// Check for duplicate filter already stored in our output operator
				const match = output.content.find(
					(content) =>
						isFilter(content) &&
						isSameFilter(content, innerSqon) &&
						content.content.fieldName === innerSqon.content.fieldName,
				);
				if (match !== undefined) {
					/**
					 * Simplifying filters with the same name in one combo:
					 * - 1. multiple GT on the same 'and'/'not' combo can be a single with the greater value
					 * - 2. multiple GT on the same 'or' combo can be a single with the lesser value
					 * - 3. multiple LT on the same 'and'/'not' combo can be the lesser value
					 * - 4. multiple GT on the same 'or' combo can be the greater value
					 * - 5. multiple IN on the same 'or' combo can be combined into a single list
					 */
					// In this if/else chain we check both the match and the innersqon match. we know this is true thanks to the .find that found the match, but this is needed for the type checker
					if (matchesSchema(GreaterThanFilter, match) && matchesSchema(GreaterThanFilter, innerSqon)) {
						if (output.op === CombinationKeys.And || output.op === CombinationKeys.Not) {
							// 1. multiple GT on the same 'and'/'not' combo can be a single with the greater value
							match.content.value = Math.max(match.content.value, innerSqon.content.value);
						} else {
							// 2. multiple GT on the same 'or' combo can be a single with the lesser value
							match.content.value = Math.min(match.content.value, innerSqon.content.value);
						}
					}

					if (matchesSchema(LesserThanFilter, match) && matchesSchema(LesserThanFilter, innerSqon)) {
						if (output.op === CombinationKeys.And || output.op === CombinationKeys.Not) {
							// 3. multiple LT on the same 'and'/'not' combo can be the lesser value
							match.content.value = Math.min(match.content.value, innerSqon.content.value);
						} else {
							// 4. multiple LT on the same 'or' combo can be the greater value
							match.content.value = Math.max(match.content.value, innerSqon.content.value);
						}
					}

					if (matchesSchema(InFilter, match) && matchesSchema(InFilter, innerSqon)) {
						if (output.op === CombinationKeys.Or) {
							// 5. multiple IN on the same 'or' combo can be combined into a list
							match.content.value = [...asArray(match.content.value), ...asArray(innerSqon.content.value)];
							// Note that we cannot reduce 'and'/'not' combos since there are cases for testing inclusion
							// in multiple separate lists when the tested property has an array of values.
						} else {
							output.content.push(innerSqon);
						}
					}
				} else {
					// Did not find a matching filter in the existing output, so we add this one
					output.content.push(innerSqon);
				}
			} else {
				/**
				 * Checks for nested combinations:
				 * 1. if inner sqon has empty content, we remove it from the sqon
				 * 2. if inner sqon has only one item, and output op is not 'not'
				 * 3. if inner sqon op is 'not' we add it to output as is -> not modifying negation logic
				 * 4. if inner sqon has the same 'op' as the output ('and'/'or'), we take the inner sqon's content but not the duplicated wrapper
				 */
				if (innerSqon.content.length === 0) {
					// 1. inner sqon has empty content
					continue;
				}
				if (innerSqon.content.length === 1 && innerSqon.op !== CombinationKeys.Not) {
					// 2. one item in and/or combination
					output.content.push(...innerSqon.content);
					continue;
				}
				if (innerSqon.op === CombinationKeys.Not) {
					// 3. inner sqon is 'not', add to content.
					output.content.push(innerSqon);
					continue;
				}
				if (innerSqon.op === output.op && innerSqon.pivot === output.pivot) {
					// 4. inner sqon op matches outter sqon, remove inner combination and use the content
					output.content.push(...innerSqon.content);
					continue;
				}
				output.content.push(innerSqon);
			}
		}

		if (output.content.length === 1 && sqon.op !== CombinationKeys.Not) {
			// Outter combination wrapper is not needed, we will remove it
			// Do not remove a `not` combination, but we can remove `and`/`or` with only a single entry
			return reduceSQON(output.content[0]);
		}

		output.content = output.content.map(reduceSQON);
		return output;
	}
};
export default reduceSQON;
