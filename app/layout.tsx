import "./globals.css";
import type { Metadata } from "next";
import SiteFooter from "@/components/SiteFooter";

export const metadata: Metadata = {
  title: "BoxShot Maker",
  description: "Create polished 3D product box shots in your browser.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-slate-50 text-slate-950">
        <div className="flex min-h-screen flex-col">
          <div className="flex-1">{children}</div>
          <SiteFooter />
        </div>
      </body>
    </html>
  );
}
