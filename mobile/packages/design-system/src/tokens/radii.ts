export const radii = {
  none: 0,
  sm: 6,
  md: 8,
  lg: 10,
  xl: 14,
  '2xl': 18,
  '3xl': 22,
  '4xl': 26,
  full: 9999,
} as const;

export type RadiusKey = keyof typeof radii;
