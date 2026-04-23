"use client";

import { AppViewerProvider } from "./app-viewer";
import { ToastProvider } from "./toast";
import ScrollToTop from "./scroll-to-top";
import { PwaInteractions } from "./pwa-interactions";
import GoogleTranslate from "./google-translate";

export default function Providers({ children, initialViewer }) {
  return (
    <ToastProvider>
      <AppViewerProvider initialViewer={initialViewer}>
        <GoogleTranslate />
        <PwaInteractions />
        {children}
        <ScrollToTop />
      </AppViewerProvider>
    </ToastProvider>
  );
}
