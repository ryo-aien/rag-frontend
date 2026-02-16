import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "RAG Studio",
  description: "Intelligent document Q&A powered by RAG",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja" className="dark">
      <body className="antialiased overflow-hidden">
        {children}
      </body>
    </html>
  );
}
