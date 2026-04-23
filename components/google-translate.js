"use client";

import { useEffect } from "react";

export default function GoogleTranslate() {
  useEffect(() => {
    if (typeof window === "undefined" || window.matchMedia("(max-width: 900px)").matches) {
      return undefined;
    }

    let timeoutId = null;
    let idleCallbackId = null;
    let disposed = false;

    const loadTranslateScript = () => {
      if (disposed || document.querySelector("#google-translate-script")) {
        return;
      }

      const script = document.createElement("script");
      script.id = "google-translate-script";
      script.src = "//translate.google.com/translate_a/element.js?cb=googleTranslateElementInit";
      script.async = true;
      document.body.appendChild(script);

      window.googleTranslateElementInit = () => {
        if (disposed || !window.google?.translate) {
          return;
        }

        new window.google.translate.TranslateElement(
          {
            pageLanguage: "id",
            includedLanguages: "en,id",
            autoDisplay: false,
          },
          "google_translate_element",
        );
      };
    };

    if ("requestIdleCallback" in window) {
      idleCallbackId = window.requestIdleCallback(loadTranslateScript, { timeout: 1500 });
    } else {
      timeoutId = window.setTimeout(loadTranslateScript, 1200);
    }

    return () => {
      disposed = true;

      if (timeoutId) {
        window.clearTimeout(timeoutId);
      }

      if (idleCallbackId && "cancelIdleCallback" in window) {
        window.cancelIdleCallback(idleCallbackId);
      }
    };
  }, []);

  return null;
}
