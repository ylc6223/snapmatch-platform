import type React from "react"
import type { Metadata } from "next"
import localFont from "next/font/local"
import { Analytics } from "@vercel/analytics/next"
import { ThemeProvider } from "@/components/theme-provider"
import "./globals.css"

export const metadata: Metadata = {
  title: "光影工作室 | 专业摄影服务",
  description:
    "光影工作室专注于商业摄影、人像摄影和产品摄影服务，用专业的技术和独特的视角，为每一位客户创造难忘的视觉体验。",
  generator: "v0.app",
}

const geistSans = localFont({
  src: "./fonts/Geist[wght].woff2",
  display: "swap",
  variable: "--font-geist-sans",
  weight: "100 900",
})

const geistMono = localFont({
  src: "./fonts/GeistMono[wght].woff2",
  display: "swap",
  variable: "--font-geist-mono",
  weight: "100 900",
})

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html
      lang="zh-CN"
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable}`}
    >
      <body className="font-sans antialiased">
        <ThemeProvider defaultTheme="system" storageKey="photography-theme">
          {children}
        </ThemeProvider>
        <Analytics />
      </body>
    </html>
  )
}
