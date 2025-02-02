import { z as zod, type ZodSchema } from 'zod';
import type { Values } from './util';

/* *********** *
 * Filter Keys *
 * *********** */
export const FilterKeys = {
	In: 'in',
	GreaterThan: 'gt',
	GreaterThanSymbol: '>',
	LesserThan: 'lt',
	LesserThanSymbol: '<',
} as const;
export type FilterKey = Values<typeof FilterKeys>;

export const InFilterKeys = [FilterKeys.In];
export const GreaterThanFilterKeys = [FilterKeys.GreaterThan, FilterKeys.GreaterThanSymbol];
export const LesserThanFilterKeys = [FilterKeys.LesserThan, FilterKeys.LesserThanSymbol];

export const ArrayFilterKeys = [...InFilterKeys];
export type ArrayFilterKeys = (typeof ArrayFilterKeys)[number];
export const ScalarFilterKeys = [...GreaterThanFilterKeys, ...LesserThanFilterKeys];
export type ScalarFilterKeys = (typeof ScalarFilterKeys)[number];

export const FilterKeySets = [InFilterKeys, GreaterThanFilterKeys, LesserThanFilterKeys];

/* ===== Filter Values ==== */

export type FilterSchema<Op extends string, Content extends ZodSchema> = ReturnType<
	typeof zod.object<{ op: zod.ZodLiteral<Op>; content: Content }>
>;
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

export const InFilter = defineFilter(FilterKeys.In, ArrayFilterContent);
export type InFilter = zod.infer<typeof InFilter>;

export const ArrayFilter = zod.discriminatedUnion('op', [InFilter]);
export type ArrayFilter = zod.infer<typeof ArrayFilter>;

export const GreaterThanFilter = zod.discriminatedUnion('op', [
	defineFilter(FilterKeys.GreaterThan, ScalarFilterContent),
	defineFilter(FilterKeys.GreaterThanSymbol, ScalarFilterContent),
]);
export type GreaterThanFilter = zod.infer<typeof GreaterThanFilter>;
export const LesserThanFilter = zod.discriminatedUnion('op', [
	defineFilter(FilterKeys.LesserThan, ScalarFilterContent),
	defineFilter(FilterKeys.LesserThanSymbol, ScalarFilterContent),
]);
export type LesserThanFilter = zod.infer<typeof LesserThanFilter>;

export const ScalarFilter = zod.discriminatedUnion('op', [...GreaterThanFilter.options, ...LesserThanFilter.options]);
export type ScalarFilter = zod.infer<typeof ScalarFilter>;

export const FilterValue = zod.union([ScalarFilterValue, ArrayFilterValue]);
export type FilterValue = zod.infer<typeof FilterValue>;
export const FilterContent = zod.union([InFilter, ...GreaterThanFilter.options, LesserThanFilter]);
export type FilterContent = zod.infer<typeof FilterContent>;
export const FilterOperator = zod.discriminatedUnion('op', [
	InFilter,
	...GreaterThanFilter.options,
	...LesserThanFilter.options,
]);
export type FilterOperator = zod.infer<typeof FilterOperator>;

export type FilterTypeMap = {
	[FilterKeys.In]: InFilter;
	[FilterKeys.GreaterThan]: GreaterThanFilter;
	[FilterKeys.GreaterThanSymbol]: GreaterThanFilter;
	[FilterKeys.LesserThan]: LesserThanFilter;
	[FilterKeys.LesserThanSymbol]: LesserThanFilter;
};
