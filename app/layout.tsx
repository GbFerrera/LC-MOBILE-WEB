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
    icon: "/logo.png",
    apple: "/logo.png",
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
        <link rel="apple-touch-icon" href="/logo.png" />
        <link rel="icon" type="image/png" href="/logo.png" />
        <link rel="manifest" href="/manifest.json" />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} ${outfit.variable} antialiased min-h-dvh`}
      >
        <div
          aria-hidden
          className="pointer-events-none fixed inset-0 z-0"
          style={{ backgroundColor: "var(--app-bg-color, #F1F1E7)" }}
        />
        <div
          aria-hidden
          className="pointer-events-none fixed inset-0 z-10 bg-cover bg-center bg-no-repeat"
          style={{
            backgroundImage: "var(--app-bg-image, none)",
            opacity: "var(--app-bg-image-opacity, 0)",
          }}
        />
        <div className="relative z-20 min-h-dvh">
        <ClientLayout>{children}</ClientLayout>
        </div>
        <div id="toast-root"></div>
      </body>
    </html>
  );
}
