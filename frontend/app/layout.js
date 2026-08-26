import { Fraunces, IBM_Plex_Sans, IBM_Plex_Mono } from "next/font/google";
import Header from "../components/Header";
import Footer from "../components/Footer";
import "./globals.css";

const display = Fraunces({
  subsets: ["latin"],
  weight: ["500", "600"],
  variable: "--font-display",
});

const body = IBM_Plex_Sans({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--font-body",
});

const mono = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--font-mono",
});

export const metadata = {
  title: "Uttarakhand Rojgar | Govt Jobs, Results & Admit Cards",
  description:
    "Automatically updated tracker for Uttarakhand government job vacancies, results, admit cards, and answer keys from UKPSC, UKSSSC, Uttarakhand Police and more.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={`${display.variable} ${body.variable} ${mono.variable}`}>
      <body className="bg-paper text-ink font-body min-h-screen flex flex-col">
        <Header />
        <main className="flex-1 max-w-4xl w-full mx-auto px-5 py-10">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
