import type { Metadata, Viewport } from "next";
import "./globals.css";
import { MusicProvider } from "@/context/MusicContext";

export const metadata: Metadata = {
  title: "Louvor Cifras - Gestor e Visualizador de Palco",
  description:
    "Sistema completo para ministério de louvor: gerenciamento de cifras, montagem de setlist do culto e visualizador de palco com alinhamento perfeito de acordes e modo escuro.",
  icons: {
    icon: "/app-icon.jpg?v=3",
    shortcut: "/app-icon.jpg?v=3",
    apple: "/app-icon.jpg?v=3",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: "#121212",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" className="dark" suppressHydrationWarning>
      <body className="min-h-screen bg-neutral-50 dark:bg-[#121212] transition-colors duration-200">
        <MusicProvider>{children}</MusicProvider>
      </body>
    </html>
  );
}

