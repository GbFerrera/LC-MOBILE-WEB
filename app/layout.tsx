import type { Metadata } from "next";
import { Geist, Geist_Mono, Outfit } from "next/font/google";
import "./globals.css";
import ClientLayout from "./client-layout";
const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const outfit = Outfit({
  variable: "--font-outfit",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Link Callendar - Barbeiro",
  description: "Aplicativo de agendamento para barbearias",
  manifest: "/manifest.json",
  themeColor: "#3D583F",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black",
    title: "LC Barbeiro",
  },
  icons: {
    icon: "/favicon.ico",
    apple: "/icon.png",
  },
  viewport: {
    width: "device-width",
    initialScale: 1,
    maximumScale: 1,
    userScalable: false,
  },
};


export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <head>
        <meta name="theme-color" content="#3D583F" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black" />
        <meta name="apple-mobile-web-app-title" content="LC Barbeiro" />
        <link rel="apple-touch-icon" href="/icon.png" />
        <link rel="icon" type="image/x-icon" href="/favicon.ico" />
        <link rel="manifest" href="/manifest.json" />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} ${outfit.variable} antialiased`}
        style={{ backgroundColor: '#F1F1E7' }}
      >
        <ClientLayout>{children}</ClientLayout>
        <div id="toast-root"></div>
      </body>
    </html>
  );
}
