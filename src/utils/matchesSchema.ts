import type { ZodSchema } from 'zod';

export function matchesSchema<T>(schema: ZodSchema<T>, value: unknown): value is T {
	return schema.safeParse(value).success;
}
