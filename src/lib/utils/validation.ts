/**
 * Check if num2 starts with num1 when converted to strings
 * Used for progressive typing validation in number inputs
 * @example startsWithNumber(1, 16) // true - "16" starts with "1"
 * @example startsWithNumber(12, 128) // true - "128" starts with "12"
 */
export function startsWithNumber(num1: number | string, num2: number | string): boolean {
  const pattern = new RegExp(`^${num1}`);
  return pattern.test(String(num2));
}
