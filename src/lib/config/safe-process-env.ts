/**
 * Read env without referencing `process` when it does not exist (e.g. Safari
 * in the browser). Next may still inline `NEXT_PUBLIC_*` on the client; this
 * only prevents a thrown ReferenceError on `const env = process.env`.
 */
export function getProcessEnv(key: string): string | undefined {
  if (typeof process === 'undefined') {
    return undefined;
  }
  return process.env[key];
}
