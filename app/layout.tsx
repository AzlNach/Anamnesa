import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import FloatingActionButton from "./components/FloatingActionButton";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Anamnesa AI - Asisten Konsultasi Kesehatan & Analisis Gambar Medis",
  description: "Aplikasi AI untuk konsultasi kesehatan awal, analisis gejala, dan segmentasi gambar medis dengan teknologi Google Gemini. Dilengkapi Chain of Thought prompting untuk analisis mendalam.",
  keywords: "konsultasi kesehatan, AI medis, analisis gambar medis, segmentasi gambar, diagnosa AI, anamnesis, Google Gemini, kesehatan digital",
  icons: {
    icon: [
      { url: '/favicon.svg', type: 'image/svg+xml' },
      { url: '/favicon.ico', sizes: '32x32', type: 'image/x-icon' }
    ],
    apple: '/favicon.svg',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-gradient-to-br from-blue-50 to-green-50 min-h-screen`}
      >
        {children}
        <FloatingActionButton />
      </body>
    </html>
  );
}
