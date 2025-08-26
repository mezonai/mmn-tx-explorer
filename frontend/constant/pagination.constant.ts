export const LIMITS = [10, 20, 50, 100] as const;

export const PAGINATION = {
  DEFAULT_PAGE: 1,
  DEFAULT_LIMIT: LIMITS[0],
  MIN_PAGE: 1,
  ELLIPSIS_THRESHOLD: 2,
} as const;
