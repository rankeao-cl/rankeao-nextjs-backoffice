import type { Metadata, Viewport } from "next";
import { Poppins } from "next/font/google";
import { Providers } from "@/lib/providers";
import "./globals.css";

const poppins = Poppins({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
  variable: "--font-poppins",
});

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
};

export const metadata: Metadata = {
  title: {
    default: "Rankeao Admin — Backoffice",
    template: "%s | Rankeao Admin",
  },
  description:
    "Panel de administración de Rankeao.cl — gestión de tiendas, catálogo, gamificación, torneos y más.",
  robots: { index: false, follow: false },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" className={`light ${poppins.variable}`} data-theme="light" suppressHydrationWarning>
      <body className="font-[var(--font-poppins)] antialiased bg-[var(--background)] text-[var(--foreground)]">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
