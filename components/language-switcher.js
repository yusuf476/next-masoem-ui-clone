"use client";

import { useState } from "react";

function getInitialLanguage() {
  if (typeof document === "undefined") {
    return "id";
  }

  const match = document.cookie.match(/googtrans=\/auto\/(en|id)/);
  return match?.[1] ?? "id";
}

export default function LanguageSwitcher() {
  const [lang, setLang] = useState(getInitialLanguage);

  const changeLanguage = (newLang) => {
    setLang(newLang);
    document.cookie = `googtrans=/auto/${newLang}; path=/`;
    document.cookie = `googtrans=/id/${newLang}; path=/`;
    window.location.reload();
  };

  return (
    <div className="language-switcher">
      <div id="google_translate_element" style={{ display: "none" }}></div>
      <button
        className={`lang-btn ${lang === "id" ? "active" : ""}`}
        onClick={() => changeLanguage("id")}
        aria-label="Bahasa Indonesia"
      >
        <span>ID</span>
      </button>
      <button
        className={`lang-btn ${lang === "en" ? "active" : ""}`}
        onClick={() => changeLanguage("en")}
        aria-label="English"
      >
        <span>EN</span>
      </button>
    </div>
  );
}
