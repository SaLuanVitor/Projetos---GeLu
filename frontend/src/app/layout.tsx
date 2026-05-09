import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "NutriFam",
  description: "Organizacao familiar de receitas, dietas, treinos e sugestoes assistivas."
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <body>{children}</body>
    </html>
  );
}
