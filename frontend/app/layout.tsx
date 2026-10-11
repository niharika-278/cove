import type { Metadata } from "next";
import { DM_Sans, DM_Serif_Display } from "next/font/google";
import { AppBackground } from "@/components/ui/app-background";
import { ToastProvider } from "@/lib/toast-context";
import { ToastContainer } from "@/components/ui/toast-container";
import "./globals.css";

const display = DM_Serif_Display({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-display",
});

const sans = DM_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-sans",
});

export const metadata: Metadata = {
  title: "Cove — watch together",
  description:
    "A calm, private room for watching YouTube together. No signup. Just a link.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${display.variable} ${sans.variable} font-mono antialiased`}>
        <ToastProvider>
          <AppBackground>{children}</AppBackground>
          <ToastContainer />
        </ToastProvider>
      </body>
    </html>
  );
}
