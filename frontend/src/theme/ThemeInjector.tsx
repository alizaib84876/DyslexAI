/**
 * Injects theme tokens from theme/colors.ts and theme/index.ts into CSS variables.
 * Single source of truth: theme/colors.ts, theme/index.ts
 */
import { useEffect } from "react";
import { colors } from "./colors";
import { spacing, borderRadius, fonts } from "./index";

function toKebab(str: string): string {
  return str.replace(/([A-Z])/g, "-$1").toLowerCase();
}

export function ThemeInjector() {
  useEffect(() => {
    const root = document.documentElement;

    Object.entries(colors).forEach(([key, value]) => {
      root.style.setProperty(`--color-${toKebab(key)}`, value);
    });

    Object.entries(spacing).forEach(([key, value]) => {
      root.style.setProperty(`--spacing-${key}`, `${value}px`);
    });

    Object.entries(borderRadius).forEach(([key, value]) => {
      root.style.setProperty(`--radius-${key}`, `${value}px`);
    });

    root.style.setProperty("--font-family", fonts.regular);
  }, []);

  return null;
}
