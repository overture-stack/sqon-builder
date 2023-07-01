import {
	CombinationKeys,
	CombinationOperator,
	FilterKeys,
	FilterOperator,
	SQON,
	ScalarFilterKeys,
	isArrayFilter,
	isFilter,
} from '../types/sqon';
import asArray from './asArray';
import filterDuplicates from './filterDuplicates';
const deduplicateValues = (filter: FilterOperator): FilterOperator => {
	if (isArrayFilter(filter)) {
		return {
			op: filter.op,
			content: { fieldName: filter.content.fieldName, value: asArray(filter.content.value).filter(filterDuplicates) },
		};
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
		for (const innerSqon of sqon.content) {
			// Filters are added to output content
			if (isFilter(innerSqon)) {
				// Check for duplicate filter in this operator
				const match = output.content.find(
					(content) => content.op === innerSqon.op && content.content.fieldName === innerSqon.content.fieldName,
				);
				if (match !== undefined) {
					/**
					 * Simplifying filters with the same name in one combo:
					 * - 1. multiple GT on the same 'and'/'not' combo can be a single with the greater value
					 * - 2. multiple GT on the same 'or' combo can be a single with the lesser value
					 * - 3. multiple LT on the same 'and'/'not' combo can be the lesser value
					 * - 4. multiple GT on the same 'or' combo can be the greater value
					 * - 5. multiple IN on the same 'or'/'and'/'not' combo can be combined into a list
					 */
					// In this if/else chain we check both the match and the innersqon match. we know this is true thanks to the .find that found the match, but this is needed for the type checker
					if (match.op === FilterKeys.GreaterThan && innerSqon.op === FilterKeys.GreaterThan) {
						if (output.op === CombinationKeys.And || output.op === CombinationKeys.Not) {
							// 1. multiple GT on the same 'and'/'not' combo can be a single with the greater value
							match.content.value = Math.max(match.content.value, innerSqon.content.value);
						} else {
							// 2. multiple GT on the same 'or' combo can be a single with the lesser value
							match.content.value = Math.min(match.content.value, innerSqon.content.value);
						}
					}

					if (match.op === FilterKeys.LesserThan && innerSqon.op === FilterKeys.LesserThan) {
						if (output.op === CombinationKeys.And || output.op === CombinationKeys.Not) {
							// 3. multiple LT on the same 'and'/'not combo can be the lesser value
							match.content.value = Math.min(match.content.value, innerSqon.content.value);
						} else {
							// 4. multiple LT on the same 'or' combo can be the greater value
							match.content.value = Math.max(match.content.value, innerSqon.content.value);
						}
					}

					if (match.op === FilterKeys.In && innerSqon.op === FilterKeys.In) {
						// 5. multiple IN on the same 'or'/'and'/'not' combo can be combined into a list
						match.content.value = [...asArray(match.content.value), ...asArray(innerSqon.content.value)];
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
				if (innerSqon.op === output.op) {
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
