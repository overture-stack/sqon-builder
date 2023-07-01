type StripFunctions<T extends { [key: string]: any }> = T extends infer U
	? { [k in keyof U]: T[k] extends Function ? never : T[k] }
	: never;

/**
 * Create a clone of the provided object, stripping out all functions.
 * The resulting object should include a copy of the original object but containing only the objects, arrays,
 * and primatives.
 *
 * This is used in the SQONBuilder to return a copy of the sqon data without passing along the builder functions.
 * @param source
 * @returns
 */
const cloneDeepPojo = <T extends { [key: string]: any }>(source: T): StripFunctions<T> => {
	return Array.isArray(source)
		? source.map((item) => cloneDeepPojo(item))
		: source && typeof source === 'object'
		? Object.getOwnPropertyNames(source).reduce((o, prop) => {
				if (typeof source[prop] === 'function') {
					// don't clone functions
					return o;
				}
				Object.defineProperty(o, prop, Object.getOwnPropertyDescriptor(source, prop)!);
				o[prop] = cloneDeepPojo(source[prop]);
				return o;
		  }, Object.create(Object.getPrototypeOf(source)))
		: source;
};

export default cloneDeepPojo;
