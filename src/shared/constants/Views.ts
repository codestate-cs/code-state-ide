export const Views = {
  // Tree view providers
  CONFIG_TREE: 'codestateConfig',
} as const;

export type ViewId = typeof Views[keyof typeof Views]; 