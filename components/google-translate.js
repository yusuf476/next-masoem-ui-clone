"use client";

import { useEffect } from "react";

export default function GoogleTranslate() {
  useEffect(() => {
    // Check if the script is already loaded to avoid duplicates
    if (!document.querySelector("#google-translate-script")) {
      const script = document.createElement("script");
      script.id = "google-translate-script";
      script.src = "//translate.google.com/translate_a/element.js?cb=googleTranslateElementInit";
      script.async = true;
      document.body.appendChild(script);

      window.googleTranslateElementInit = () => {
        new window.google.translate.TranslateElement(
          { 
            pageLanguage: 'id',
            includedLanguages: 'en,id', // Only allow ID and EN
            autoDisplay: false
          }, 
          'google_translate_element'
        );
      };
    }
  }, []);

  return null;
}
