/**
 * Pass to an array filter to return an array with no duplicate values.
 * This will only match primitives or objects by reference, it is not doing a shallow
 * or deep equality check on objects.
 * @example myArray.filter(filterDuplicates); // returns myArray without duplicates
 */
const filterDuplicates = <T>(item: T, index: number, array: T[]) => array.indexOf(item) === index;
export default filterDuplicates;
