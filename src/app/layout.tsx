import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "OnConcilia — Conciliación bancaria automatizada para pymes argentinas",
  description:
    "Automatizá la conciliación bancaria. Importás el extracto, el sistema cruza los movimientos y genera el reporte. En minutos, no en horas.",
  openGraph: {
    title: "OnConcilia — Conciliación bancaria automatizada",
    description:
      "Dejá de hacer la conciliación bancaria en Excel. OnConcilia lo hace en minutos.",
    url: "https://onconcilia.com",
    siteName: "OnConcilia",
    locale: "es_AR",
    type: "website",
  },
  // Verificación del dominio en el portfolio comercial de Meta (WhatsApp Cloud API
  // vía Zernio). Si se borra, Meta puede dar el dominio por no verificado.
  other: {
    "facebook-domain-verification": "ry3oix1d29b14otyzk4lh5h6l4kugw",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body className={`${inter.variable} font-sans antialiased`}>
        {children}
      </body>
    </html>
  );
}
