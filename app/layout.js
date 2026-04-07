import { Plus_Jakarta_Sans, Be_Vietnam_Pro } from "next/font/google";
import SiteFooter from "../components/site-footer";
import SiteHeader from "../components/site-header";
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

export const metadata = {
  title: "Masoem Market",
  description: "Platform belanja kampus untuk kebutuhan kuliner, merchandise, dan kebutuhan akademik.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="id">
      <body className={`${headingFont.variable} ${bodyFont.variable}`}>
        <div className="app-shell">
          <SiteHeader />
          <div className="page-shell">{children}</div>
          <SiteFooter />
        </div>
      </body>
    </html>
  );
}
