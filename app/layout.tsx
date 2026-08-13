import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "俳句道場｜一句を磨く、静かな稽古場",
  description: "俳句を五つの観点から採点し、講評と推敲例をお届けします。",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ja">
      <body>{children}</body>
    </html>
  );
}
