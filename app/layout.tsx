import type { Metadata } from "next";
import "./globals.css";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";

export const metadata: Metadata = {
  metadataBase: new URL("https://cri.example"),
  title: {
    default: "CRI — Construction Risk Intelligence for UK Contractors",
    template: "%s — CRI",
  },
  description:
    "Check client, payment, PM, QS and project risk before accepting construction work. Evidence-backed risk reports for UK contractors.",
  keywords: [
    "construction risk",
    "contractor risk report",
    "payment risk",
    "UK contractors",
    "client risk",
    "project risk",
  ],
  openGraph: {
    title: "CRI — Construction Risk Intelligence",
    description:
      "Evidence-backed client, payment and project risk reports for UK contractors. Know the risk before you price the job.",
    type: "website",
  },
  robots: { index: true, follow: true },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en-GB">
      <body className="flex min-h-screen flex-col">
        <Header />
        <main className="flex-1">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
