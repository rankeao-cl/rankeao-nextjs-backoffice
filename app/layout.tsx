import type { Metadata } from "next";
import { Inter, Rajdhani } from "next/font/google";
import { Providers } from "@/lib/providers";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const rajdhani = Rajdhani({
  variable: "--font-rajdhani",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "Rankeao Admin — Backoffice",
  description:
    "Panel de administración de Rankeao.cl — gestión de tenants, gamificación, disputas y notificaciones.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" className="dark" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var t=localStorage.getItem('rankeao-theme');if(t==='light'){document.documentElement.classList.remove('dark');document.documentElement.classList.add('light')}}catch(e){}})()`,
          }}
        />
      </head>
      <body
        className={`${inter.variable} ${rajdhani.variable} font-[var(--font-body)] antialiased bg-[var(--background)] text-[var(--foreground)]`}
      >
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
