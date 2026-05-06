/**
 * Generate the discrete option set for a resource input — min, every power of 2
 * between min and max, and max. Buttons step through these values; free-form
 * typing accepts anything in [min, max].
 *
 * @example
 * generateValuesWithPowersOfTwo(1, 64)  // [1, 2, 4, 8, 16, 32, 64]
 * generateValuesWithPowersOfTwo(0, 8)   // [0, 1, 2, 4, 8]
 * generateValuesWithPowersOfTwo(3, 33)  // [3, 4, 8, 16, 32, 33]
 */
export function generateValuesWithPowersOfTwo(min: number, max: number): number[] {
  const values: number[] = [];
  let current = min;

  if (current === 0) {
    values.push(0);
    current = 1;
  } else {
    values.push(current);
  }

  let powerOfTwo = 2;
  while (powerOfTwo <= max) {
    if (powerOfTwo > current) {
      values.push(powerOfTwo);
      current = powerOfTwo;
    }
    powerOfTwo *= 2;
  }

  if (values[values.length - 1] !== max) {
    values.push(max);
  }

  return values;
}
