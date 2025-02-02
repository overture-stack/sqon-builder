import { z as zod } from 'zod';
import { matchesSchema } from '../utils/matchesSchema';
import {
	ArrayFilter,
	ArrayFilterKeys,
	ArrayFilterValue,
	FilterKeys,
	FilterOperator,
	ScalarFilter,
	ScalarFilterKeys,
	ScalarFilterValue,
} from './sqonFilters';
import { Clean, Values } from './util';

/* **** *
 * Keys *
 * **** */
export const CombinationKeys = {
	And: 'and',
	Or: 'or',
	Not: 'not',
} as const;
export type CombinationKey = Values<typeof CombinationKeys>;

export const Keys = Object.assign({}, FilterKeys, CombinationKeys);

/* ************ *
 * Combinations *
 * ************ */
// Combination is a recursive type, but Zod can't do TS type inference for recursive definitions.
// So in this one case we define the type first with the recursive structure and use it as a type-hint
// for our zod schema. Reference: https://zod.dev/?id=recursive-types
export type CombinationOperator = {
	op: CombinationKey;
	content: (CombinationOperator | FilterOperator)[];
	pivot?: string;
};
export const CombinationOperator: zod.ZodType<CombinationOperator> = zod.object({
	op: zod.union([zod.literal(CombinationKeys.And), zod.literal(CombinationKeys.Not), zod.literal(CombinationKeys.Or)]),
	content: zod.array(zod.union([FilterOperator, zod.lazy(() => CombinationOperator)])),
	pivot: zod.string().optional(),
});

export const Operator = zod.union([CombinationOperator, FilterOperator]);
export type Operator = zod.infer<typeof Operator>;

export const SQON = Operator;
export type SQON = Clean<Operator>;

/* ===== Convenient Type Guards ===== */
export const isCombination = (operator: Operator): operator is CombinationOperator =>
	matchesSchema(CombinationOperator, operator);

export const isFilter = (operator: Operator): operator is FilterOperator => matchesSchema(FilterOperator, operator);

export const isArrayFilter = (operator: Operator): operator is ArrayFilter => matchesSchema(ArrayFilter, operator);

export const isScalarFilter = (operator: Operator): operator is ScalarFilter => matchesSchema(ScalarFilter, operator);

const arrayFilterKeys: string[] = Object.values(ArrayFilterKeys);
export const isArrayFilterKey = (input: unknown): input is ArrayFilterKeys =>
	typeof input === 'string' && arrayFilterKeys.includes(input);
const scalarFilterKeys: string[] = Object.values(ScalarFilterKeys);
export const isScalarFilterKey = (input: unknown): input is ScalarFilterKeys =>
	typeof input === 'string' && scalarFilterKeys.includes(input);

export const isArrayFilterValue = (value: unknown): value is ArrayFilterValue => matchesSchema(ArrayFilterValue, value);
export const isScalarFilterValue = (value: unknown): value is ScalarFilterValue =>
	matchesSchema(ScalarFilterValue, value);
