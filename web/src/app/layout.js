import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

import Providers from "./Providers";


const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata = {
  title: "ClockIn",
  description: "Sistema de gerenciamento de ponto eletrônico",
};

export default function RootLayout({ children }) {
  return (
    <html lang="pt-BR">

      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <Providers>{children}</Providers>
          
      </body>

    </html>
  );
}
