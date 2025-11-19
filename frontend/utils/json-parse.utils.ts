export function safeJsonParse<T = any>(str: string | null | undefined): T | null {
  if (!str) return null;
  try {
    return JSON.parse(str) as T;
  } catch (error) {
    console.error('Failed to parse JSON:', str);
    return null;
  }
}
