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
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black",
    title: "Link Callendar",
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

const runtimeApiUrl =
  process.env.NEXT_PUBLIC_API_URL ||
  process.env.NEXT_PUBLIC_SERVICE_URL_API ||
  process.env.SERVICE_URL_API ||
  "";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" className="overflow-x-clip" suppressHydrationWarning>
      <head>
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black" />
        <meta name="apple-mobile-web-app-title" content="Link Callendar" />
        <meta name="application-name" content="Link Callendar" />
        {runtimeApiUrl ? <meta name="lc-api-url" content={runtimeApiUrl} /> : null}
        <link rel="apple-touch-icon" href="/logo.png" />
        <link rel="icon" type="image/png" href="/logo.png" />
        <link rel="manifest" href="/manifest.webmanifest" />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} ${outfit.variable} antialiased min-h-dvh w-full max-w-full overflow-x-clip`}
      >
        <div
          aria-hidden
          className="pointer-events-none fixed inset-0 z-0"
          style={{ backgroundColor: "var(--app-bg-color, var(--background))" }}
        />
        <div
          aria-hidden
          className="pointer-events-none fixed inset-0 z-10 bg-cover bg-center bg-no-repeat"
          style={{
            backgroundImage: "var(--app-bg-image, none)",
            opacity: "var(--app-bg-image-opacity, 0)",
          }}
        />
        <div className="relative z-20 min-h-dvh w-full max-w-full overflow-x-clip" data-pwa-shell>
        <ClientLayout>{children}</ClientLayout>
        </div>
        <div id="toast-root"></div>
      </body>
    </html>
  );
}
