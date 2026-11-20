import type { Metadata, Viewport } from "next";
import "./globals.css";
import AppShell from "@/components/AppShell";
import { AuthProvider } from "@/context/AuthContext";
import { WatchlistProvider } from "@/context/WatchlistContext";

export const viewport: Viewport = {
  themeColor: "#080506",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export const metadata: Metadata = {
  title: "CINOVA — Stories. Anytime. Anywhere.",
  description:
    "Experience futuristic cinematic streaming on CINOVA. Stream global 4K movies, acclaimed series, and anime in Dolby Atmos.",
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
  ],
  icons: {
    icon: "/icon.svg",
    shortcut: "/icon.svg",
    apple: "/icon.svg",
  },
  openGraph: {
    title: "CINOVA — Stories. Anytime. Anywhere.",
    description: "Stream global 4K movies, exclusive series, and anime on CINOVA.",
    type: "website",
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
            <AppShell>{children}</AppShell>
          </WatchlistProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
