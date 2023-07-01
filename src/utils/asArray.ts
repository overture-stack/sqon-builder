/**
 * Ensure a value is wrapped in an array.
 *
 * If passed an array, return it without change. If passed a single item, wrap it in an array.
 */
const asArray = <T>(input: T | T[]): T[] => (Array.isArray(input) ? input : [input]);

export default asArray;
