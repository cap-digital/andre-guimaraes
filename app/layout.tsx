import type { Metadata } from "next";
import { Poppins } from "next/font/google";
import { Suspense } from "react";
import { DataProvider } from "@/components/DataProvider";
import { FullLoader } from "@/components/ui/States";
import "./globals.css";

const poppins = Poppins({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-poppins",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Grupo André Guimarães · Dashboard de Mídia",
  description:
    "Painel de performance das campanhas Meta Ads dos empreendimentos do Grupo André Guimarães.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <body className={`${poppins.variable} font-sans antialiased`}>
        {/* DataProvider único na raiz: landing e dashboard compartilham o mesmo
            carregamento, tornando a navegação entre eles instantânea. */}
        <Suspense fallback={<FullLoader />}>
          <DataProvider>{children}</DataProvider>
        </Suspense>
      </body>
    </html>
  );
}
