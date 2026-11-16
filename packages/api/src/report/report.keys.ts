export const reportKeys = {
  all: ['report'] as const,
  mine: () => [...reportKeys.all, 'mine'] as const,
};
