import { Plus_Jakarta_Sans, Be_Vietnam_Pro } from "next/font/google";
import SiteFooter from "../components/site-footer";
import SiteHeader from "../components/site-header";
import BottomNav from "../components/bottom-nav";
import Providers from "../components/providers";
import { getViewerContext } from "../lib/session";
import "./globals.css";

const headingFont = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-heading",
});

const bodyFont = Be_Vietnam_Pro({
  subsets: ["latin"],
  variable: "--font-body",
  weight: ["400", "500", "600", "700", "800"],
});

export const dynamic = "force-dynamic";

export const viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  themeColor: "#1e3a8a",
};

export const metadata = {
  title: "Masoem Market — Belanja Kampus Modern",
  description: "Platform belanja kampus untuk kebutuhan kuliner, merchandise, dan kebutuhan akademik.",
};

export default async function RootLayout({ children }) {
  const viewer = await getViewerContext();
  
  return (
    <html lang="id">
      <head>
        <link rel="manifest" href="/manifest.json" />
        <link rel="apple-touch-icon" href="/logo.png" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              try {
                if (localStorage.theme === 'dark' || (!('theme' in localStorage) && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
                  document.documentElement.classList.add('dark')
                } else {
                  document.documentElement.classList.remove('dark')
                }
              } catch (_) {}
            `,
          }}
        />
      </head>
      <body className={`${headingFont.variable} ${bodyFont.variable}`}>
        <Providers initialViewer={viewer}>
          <div className="app-shell">
            <SiteHeader viewer={viewer} />
            <div className="page-shell">
              {children}
            </div>
            <SiteFooter />
          </div>
          <BottomNav viewer={viewer} />
        </Providers>
      </body>
    </html>
  );
}
