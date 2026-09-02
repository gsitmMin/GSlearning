import type { Metadata } from "next";
import { Noto_Sans_KR, IBM_Plex_Mono } from "next/font/google";
import "./globals.css";
import Header from "@/components/Header";

const sans = Noto_Sans_KR({
  subsets: ["latin"],
  weight: ["400", "500", "700"],
  variable: "--font-sans",
  display: "swap",
});
const mono = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["400", "600"],
  variable: "--font-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: { default: "GSITM Learning", template: "%s · GSITM Learning" },
  description: "Vimeo 기반 사내 교육 사이트 프로토타입 (PRD v1.0)",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko" className={`${sans.variable} ${mono.variable}`}>
      <body>
        <Header />
        {children}
        <footer className="site-footer">
          <div className="inner">
            <span>GSITM Learning</span>
            <span>GS ITM.</span>
          </div>
        </footer>
      </body>
    </html>
  );
}
