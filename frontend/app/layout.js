import { Fraunces, IBM_Plex_Sans, IBM_Plex_Mono } from "next/font/google";
import Header from "../components/Header";
import Footer from "../components/Footer";
import "./globals.css";

const display = Fraunces({ subsets: ["latin"], weight: ["500", "600"], variable: "--font-display" });
const body = IBM_Plex_Sans({ subsets: ["latin"], weight: ["400", "500"], variable: "--font-body" });
const mono = IBM_Plex_Mono({ subsets: ["latin"], weight: ["400", "500"], variable: "--font-mono" });

export const metadata = {
  title: "Uttarakhand Rojgar | Govt Jobs, Results & Admit Cards",
  description: "Latest Uttarakhand government jobs, results, admit cards, answer keys and notifications.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={`${display.variable} ${body.variable} ${mono.variable}`}>
      <body className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1 site-shell">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
