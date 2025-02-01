import { z as zod, type ZodSchema } from 'zod';
import type { Values } from './util';

/* *********** *
 * Filter Keys *
 * *********** */
export const ArrayFilterKeys = {
	In: 'in',
} as const;
export type ArrayFilterKey = Values<typeof ArrayFilterKeys>;

export const ScalarFilterKeys = {
	GreaterThan: 'gt',
	GreaterThanAlias: '>',
	LesserThan: 'lt',
} as const;
export type ScalarFilterKey = Values<typeof ScalarFilterKeys>;

export type FilterKey = ScalarFilterKey | ArrayFilterKey;
export const FilterKeys = Object.assign({}, ArrayFilterKeys, ScalarFilterKeys);

export type FilterSchema<Op extends string, Content extends ZodSchema> = ReturnType<
	typeof zod.object<{ op: zod.ZodLiteral<Op>; content: Content }>
>;

/* ===== Filter Values ==== */

/**
 * Utility to create a zod schema for the value of a filter, formatting consistently as:
 * `{op, content}`
 * @param op A string literal that will define when the
 * @param content
 * @returns
 */
const defineFilter = <Op extends string, Content extends ZodSchema>(
	op: Op,
	content: Content,
): FilterSchema<Op, Content> => {
	return zod.object({
		op: zod.literal(op),
		content,
	});
};

// The array value wants to be able to accept a single value or an array of values
// Arranger also doesnt care if the values are mixed numbers and strings, that will be sorted out by elasticsearch
// and in practice won't be mixed, so to simlpify type validation we use this nested union structure:
// string | number | (string | number)[]
export const ArrayFilterValue = zod.union([
	zod.union([zod.string(), zod.number()]).array(),
	zod.string(),
	zod.number(),
]);
export type ArrayFilterValue = zod.infer<typeof ArrayFilterValue>;

export const ArrayFilterContent = zod.object({
	fieldName: zod.string(),
	value: ArrayFilterValue,
});
export type ArrayFilterContent = zod.infer<typeof ArrayFilterContent>;

// Scalar filter value differs from the array filter because it only accepts numbers or arrays of numbers
export const ScalarFilterValue = zod.number();
export type ScalarFilterValue = zod.infer<typeof ScalarFilterValue>;

export const ScalarFilterContent = zod.object({
	fieldName: zod.string(),
	value: ScalarFilterValue,
});
export type ScalarFilterContent = zod.infer<typeof ScalarFilterContent>;

export const InFilter = defineFilter(ArrayFilterKeys.In, ArrayFilterContent);
export type InFilter = zod.infer<typeof InFilter>;

export const ArrayFilter = zod.discriminatedUnion('op', [InFilter]);
export type ArrayFilter = zod.infer<typeof ArrayFilter>;

export const GreaterThanFilter = defineFilter(ScalarFilterKeys.GreaterThan, ScalarFilterContent);
export type GreaterThanFilter = zod.infer<typeof GreaterThanFilter>;
export const GreaterThanAliasFilter = defineFilter(ScalarFilterKeys.GreaterThanAlias, ScalarFilterContent);
export type GreaterThanAliasFilter = zod.infer<typeof GreaterThanAliasFilter>;

export const LesserThanFilter = defineFilter(ScalarFilterKeys.LesserThan, ScalarFilterContent);
export type LesserThanFilter = zod.infer<typeof LesserThanFilter>;

export const ScalarFilter = zod.discriminatedUnion('op', [GreaterThanFilter, GreaterThanAliasFilter, LesserThanFilter]);
export type ScalarFilter = zod.infer<typeof ScalarFilter>;

export const FilterValue = zod.union([ScalarFilterValue, ArrayFilterValue]);
export type FilterValue = zod.infer<typeof FilterValue>;
export const FilterContent = zod.union([InFilter, GreaterThanFilter, GreaterThanAliasFilter, LesserThanFilter]);
export type FilterContent = zod.infer<typeof FilterContent>;
export const FilterOperator = zod.discriminatedUnion('op', [
	InFilter,
	GreaterThanFilter,
	GreaterThanAliasFilter,
	LesserThanFilter,
]);
export type FilterOperator = zod.infer<typeof FilterOperator>;

export type FilterTypeMap = {
	[ArrayFilterKeys.In]: InFilter;
	[ScalarFilterKeys.GreaterThan]: GreaterThanFilter;
	[ScalarFilterKeys.GreaterThanAlias]: GreaterThanAliasFilter;
	[ScalarFilterKeys.LesserThan]: LesserThanFilter;
};
