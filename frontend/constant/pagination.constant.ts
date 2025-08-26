export const LIMITS = [10, 20, 50, 100] as const;

export const DEFAULT_PAGINATION = {
  PAGE: 1,
  LIMIT: LIMITS[0],
} as const;
