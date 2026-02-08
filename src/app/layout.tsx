import type { Metadata } from "next";
import { Plus_Jakarta_Sans, Inter } from "next/font/google";
import "./globals.css";
import { clsx } from 'clsx';

const jakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-jakarta",
  display: "swap",
});

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Maxiflores OMS/WMS",
  description: "Optimización de la cadena de suministro floral",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" className={clsx(jakarta.variable, inter.variable)}>
      <body
        className="antialiased min-h-screen bg-background-light dark:bg-background-dark font-sans text-text-primary-light"
        suppressHydrationWarning
      >
        {children}
      </body>
    </html>
  );
}
