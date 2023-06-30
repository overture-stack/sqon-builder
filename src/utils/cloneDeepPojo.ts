/**
 * Create a clone of the provided object, stripping out all functions.
 * The resulting object should include a copy of the original object but containing only the objects, arrays,
 * and primatives.
 *
 * This is used in the SQONBuilder to return a copy of the sqon data without passing along the builder functions.
 * @param source
 * @returns
 */
const cloneDeepPojo = <T extends object>(source: T): T => {
	return Array.isArray(source)
		? source.map((item) => cloneDeepPojo(item))
		: source && typeof source === 'object'
		? Object.getOwnPropertyNames(source).reduce((o, prop) => {
				if (typeof (source as { [key: string]: any })[prop] === 'function') {
					// don't clone functions
					return o;
				}
				Object.defineProperty(o, prop, Object.getOwnPropertyDescriptor(source, prop)!);
				o[prop] = cloneDeepPojo((source as { [key: string]: any })[prop]);
				return o;
		  }, Object.create(Object.getPrototypeOf(source)))
		: source;
};

export default cloneDeepPojo;
