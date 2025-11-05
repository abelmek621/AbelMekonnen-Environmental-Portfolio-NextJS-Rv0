import type React from "react"
import type { Metadata } from "next"
import { GeistSans } from "geist/font/sans"
import { GeistMono } from "geist/font/mono"
import { Analytics } from "@vercel/analytics/next"
import { Suspense } from "react"
import "./globals.css"

export const metadata: Metadata = {
  title: "Environmental Consultant | Hydrology, Air Quality & GIS Expert",
  description:
    "Professional environmental consultant with 10+ years experience in hydrology, air quality & noise assessment, and GIS & remote sensing. Available for consultancy projects.",
  generator: "v0.app",
  keywords: [
    "environmental consultant",
    "hydrology",
    "air quality",
    "noise assessment",
    "GIS",
    "remote sensing",
    "environmental consultancy",
  ],
  authors: [{ name: "Environmental Expert" }],
  openGraph: {
    title: "Environmental Consultant | Expert in Hydrology & Air Quality",
    description:
      "Professional environmental consultant with 10+ years experience. Specializing in hydrology, air quality & noise assessment, and GIS & remote sensing.",
    type: "website",
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body className={`font-sans ${GeistSans.variable} ${GeistMono.variable} antialiased`}>
        <Suspense fallback={null}>{children}</Suspense>
        <Analytics />
      </body>
    </html>
  )
}
