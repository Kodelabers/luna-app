"use client";

import { useEffect, useState } from "react";

export const colorThemes = ["zinc", "blue", "green", "orange", "red", "violet", "yellow"] as const;
export type ColorTheme = (typeof colorThemes)[number];

const COLOR_THEME_KEY = "color-theme";

export function useColorTheme() {
  const [colorTheme, setColorThemeState] = useState<ColorTheme>("zinc");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    let cancelled = false;

    // Avoid calling setState synchronously inside the effect body (react-hooks/set-state-in-effect)
    queueMicrotask(() => {
      if (cancelled) return;

      setMounted(true);

      const stored = localStorage.getItem(COLOR_THEME_KEY) as ColorTheme | null;
      const initialTheme: ColorTheme = stored && colorThemes.includes(stored) ? stored : "zinc";

      setColorThemeState(initialTheme);
      applyColorTheme(initialTheme);
    });

    return () => {
      cancelled = true;
    };
  }, []);

  const setColorTheme = (theme: ColorTheme) => {
    setColorThemeState(theme);
    localStorage.setItem(COLOR_THEME_KEY, theme);
    applyColorTheme(theme);
  };

  return { colorTheme, setColorTheme, mounted };
}

function applyColorTheme(theme: ColorTheme) {
  const root = document.documentElement;
  if (theme === "zinc") {
    root.removeAttribute("data-color-theme");
  } else {
    root.setAttribute("data-color-theme", theme);
  }
}



