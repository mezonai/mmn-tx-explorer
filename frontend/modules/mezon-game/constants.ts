export const GAME_ENDPOINTS = {
  SEARCH: '/search',
} as const;
export const SORT_OPTIONS = [
  {
    value: 'createdAt_DESC',
    label: 'Created At (Newest)',
    sortField: 'createdAt',
    sortOrder: 'DESC' as const,
  },
  {
    value: 'createdAt_ASC',
    label: 'Created At (Oldest)',
    sortField: 'createdAt',
    sortOrder: 'ASC' as const,
  },
  {
    value: 'name_ASC',
    label: 'Name (A → Z)',
    sortField: 'name',
    sortOrder: 'ASC' as const,
  },
  {
    value: 'name_DESC',
    label: 'Name (Z → A)',
    sortField: 'name',
    sortOrder: 'DESC' as const,
  },
  {
    value: 'updatedAt_ASC',
    label: 'Updated At (Oldest)',
    sortField: 'updatedAt',
    sortOrder: 'ASC' as const,
  },
  {
    value: 'updatedAt_DESC',
    label: 'Updated At (Newest)',
    sortField: 'updatedAt',
    sortOrder: 'DESC' as const,
  },
] as const;
