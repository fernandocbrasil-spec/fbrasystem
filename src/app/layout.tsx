import type { Metadata } from "next";
import { Zen_Dots, Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";

// Logo mark only — Brand Guide PF
const zenDots = Zen_Dots({
  variable: "--font-zen-dots",
  subsets: ["latin"],
  weight: "400",
});

// UI, text, and display — primary font
const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

// Monospace — monetary values, dates, codes
const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains",
  subsets: ["latin"],
  weight: ["400", "500", "700"],
});

export const metadata: Metadata = {
  title: "PF Advogados — Sistema de Gestão",
  description: "Escritório Autônomo de Advocacia - Peixoto Feiteiro",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <body
        className={`${zenDots.variable} ${inter.variable} ${jetbrainsMono.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
