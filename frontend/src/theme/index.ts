export { colors } from "./colors";

/** Dyslexia-friendly font (Lexend). Use these in styles for readable text. */
export const fonts = {
  regular: "'Lexend', sans-serif",
  medium: "'Lexend', sans-serif",
  semiBold: "'Lexend', sans-serif",
  bold: "'Lexend', sans-serif",
} as const;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
} as const;

export const borderRadius = {
  sm: 8,
  md: 12,
  lg: 16,
  full: 9999,
} as const;
