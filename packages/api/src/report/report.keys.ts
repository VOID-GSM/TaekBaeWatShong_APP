export const reportKeys = {
  all: ['report'] as const,
  adminList: () => [...reportKeys.all, 'admin-list'] as const,
};
