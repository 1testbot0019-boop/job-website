import { Fraunces, IBM_Plex_Sans, IBM_Plex_Mono } from "next/font/google";
import Header from "../components/Header";
import Footer from "../components/Footer";
import "./globals.css";
import "./modern.css";
const display = Fraunces({ subsets: ["latin"], weight: ["500", "600"], variable: "--font-display" });
const body = IBM_Plex_Sans({ subsets: ["latin"], weight: ["400", "500"], variable: "--font-body" });
const mono = IBM_Plex_Mono({ subsets: ["latin"], weight: ["400", "500"], variable: "--font-mono" });
export const metadata = { metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || "https://job-website-vvuu.onrender.com"), title: { default: "Govt. Jobs India | Government Jobs, Results, Schemes & Admit Cards", template: "%s | Govt. Jobs India" }, description: "Government jobs, results, admit cards, notifications and state-wise government schemes with detailed eligibility, benefits and official links.", robots: { index: true, follow: true } };
export default function RootLayout({ children }) { return <html lang="en" className={`${display.variable} ${body.variable} ${mono.variable}`}><body className="min-h-screen flex flex-col"><Header /><main className="flex-1 site-shell">{children}</main><Footer /></body></html>; }
