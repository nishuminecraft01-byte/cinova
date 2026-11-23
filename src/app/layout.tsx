import type { Metadata, Viewport } from "next";
import "./globals.css";
import AppShell from "@/components/AppShell";
import { AuthProvider } from "@/context/AuthContext";
import { WatchlistProvider } from "@/context/WatchlistContext";
import { MusicProvider } from "@/context/MusicContext";

export const viewport: Viewport = {
  themeColor: "#080506",
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  viewportFit: "cover",
};

export const metadata: Metadata = {
  metadataBase: new URL("https://cinova.pages.dev"),
  alternates: {
    canonical: "https://cinova.pages.dev",
  },
  title: "CINOVA — Stories. Anytime. Anywhere.",
  description:
    "Experience futuristic cinematic streaming on CINOVA. Stream global 4K movies, acclaimed series, and anime in Dolby Atmos.",
  applicationName: "CINOVA",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "CINOVA",
  },
  formatDetection: {
    telephone: false,
  },
  keywords: [
    "streaming",
    "movies",
    "tv shows",
    "web series",
    "anime",
    "4K",
    "Dolby Atmos",
    "cinema",
    "CINOVA",
    "PWA",
  ],
  icons: {
    icon: [
      { url: "/icon.svg", type: "image/svg+xml" },
      { url: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    shortcut: "/icon.svg",
    apple: [
      { url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" },
      { url: "/icon-192.png", sizes: "192x192", type: "image/png" },
    ],
  },
  openGraph: {
    title: "CINOVA — Stories. Anytime. Anywhere.",
    description: "Stream global 4K movies, exclusive series, and anime on CINOVA.",
    url: "https://cinova.pages.dev",
    type: "website",
  },
  verification: {
    google: "VKYmhO85FDZQZXp_zLRQA5hnnhBML9p33FhhN6C43zk",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <head>
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="CINOVA" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        <link rel="manifest" href="/manifest.json" />
        <style
          dangerouslySetInnerHTML={{
            __html: `
              html, body {
                background-color: #080506 !important;
                color: #F5F1F3 !important;
                margin: 0;
                padding: 0;
                font-family: "Inter", system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
                -webkit-font-smoothing: antialiased;
                -moz-osx-font-smoothing: grayscale;
                overflow-x: hidden;
              }
              .text-cinova-primary {
                color: #E11D48;
              }
              .bg-cinova-primary {
                background-color: #E11D48;
              }
              .cinova-c-badge {
                font-family: Impact, -apple-system, BlinkMacSystemFont, "Arial Black", sans-serif;
                color: #E11D48;
              }
            `,
          }}
        />
      </head>
      <body className="bg-[#080506] text-[#F5F1F3] min-h-screen flex flex-col font-sans selection:bg-[#E11D48] selection:text-[#F5F1F3]">
        <AuthProvider>
          <WatchlistProvider>
            <MusicProvider>
              <AppShell>{children}</AppShell>
            </MusicProvider>
          </WatchlistProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
