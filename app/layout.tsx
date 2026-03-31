import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Script from "next/script";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "ATSiteStatus - Monitoramento de Sites",
  description: "Monitoramento inteligente e disponibilidade em tempo real para sua infraestrutura digital.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        {children}
        {/* Bibliotecas pesadas carregadas de forma otimizada */}
        <Script src="https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js" strategy="lazyOnload" />
        <Script src="https://cdnjs.cloudflare.com/ajax/libs/jspdf-autotable/3.5.23/jspdf.plugin.autotable.min.js" strategy="lazyOnload" />
        <Script src="https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js" strategy="lazyOnload" />
        <Script src="https://cdn.jsdelivr.net/npm/moment@2.29.1/moment.min.js" strategy="afterInteractive" />
        <Script src="https://cdn.jsdelivr.net/npm/chart.js@3.9.1/dist/chart.min.js" strategy="afterInteractive" />
        <Script src="https://cdn.jsdelivr.net/npm/chartjs-adapter-moment@1.0.1/dist/chartjs-adapter-moment.min.js" strategy="afterInteractive" />
      </body>
    </html>
  );
}
