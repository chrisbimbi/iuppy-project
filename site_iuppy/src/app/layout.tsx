import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

export const metadata: Metadata = {
  title: "iuppy! | Comunicação Inteligente",
  description: "A única plataforma de CI que transforma comunicação em execução. Reduza o turnover e aumente o engajamento.",
  icons: {
    icon: "/assets/favicon.ico",
  },
  openGraph: {
    title: "iuppy! | Comunicação Inteligente",
    description: "A única plataforma de CI que transforma comunicação em execução. Reduza o turnover e aumente o engajamento.",
    images: [
      {
        url: "/assets/dashboard.png", // Usando imagem do dashboard para dar mais destaque
        width: 1200,
        height: 630,
        alt: "Dashboard da Plataforma Iuppy",
      },
    ]
  }
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" className="scroll-smooth">
      <body className={`${inter.variable} antialiased font-sans`}>
        <Navbar />
        <main className="min-h-screen">
          {children}
        </main>
        <Footer />
      </body>
    </html>
  );
}
