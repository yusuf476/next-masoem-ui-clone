"use client";

import { useState } from "react";

function getInitialTheme() {
  if (typeof document === "undefined") {
    return false;
  }

  return (
    document.documentElement.classList.contains("dark") ||
    localStorage.getItem("theme") === "dark"
  );
}

export default function ThemeToggle({ compact = false }) {
  const [isDark, setIsDark] = useState(getInitialTheme);

  const toggleTheme = () => {
    const nextTheme = !isDark;
    setIsDark(nextTheme);

    if (nextTheme) {
      document.documentElement.classList.add("dark");
      localStorage.setItem("theme", "dark");
    } else {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("theme", "light");
    }
  };

  return (
    <button
      onClick={toggleTheme}
      className={`button button-secondary ${compact ? "theme-toggle-compact" : "theme-toggle"}`}
      aria-label="Toggle Dark Mode"
    >
      {compact ? (isDark ? "L" : "D") : isDark ? "Light" : "Dark"}
    </button>
  );
}
