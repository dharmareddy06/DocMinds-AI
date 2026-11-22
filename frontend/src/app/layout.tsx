import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "DocMind AI - Enterprise Document Intelligence & Agentic RAG",
  description: "Agentic Document Intelligence Platform for automated ingestion, semantic indexing, and grounded conversation.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="h-full antialiased dark">
      <body className="min-h-full flex flex-col bg-black text-white font-sans selection:bg-lime-500/20 selection:text-lime-300">
        {children}
      </body>
    </html>
  );
}
