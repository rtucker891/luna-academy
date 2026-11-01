import type { Metadata } from "next";
import type { ReactNode } from "react";
import "./globals.css";
import AcademyAuthGate from "./academy-auth";

export const metadata: Metadata = {
  title: "Luna Academy",
  description:
    "Role-based Luna training for Directors, Bookkeepers, Salesmen, and Regulatory Specialists.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <AcademyAuthGate>{children}</AcademyAuthGate>
      </body>
    </html>
  );
}