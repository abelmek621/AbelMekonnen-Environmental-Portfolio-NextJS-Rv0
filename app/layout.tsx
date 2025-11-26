import type React from "react"
import type { Metadata } from "next"
import { GeistSans } from "geist/font/sans"
import { GeistMono } from "geist/font/mono"
import { Analytics } from "@vercel/analytics/next"
import { Suspense } from "react"
import 'leaflet/dist/leaflet.css'
import "./globals.css"
import ForceHomeOnLoad from "@/components/ForceHomeOnLoad"

export const metadata: Metadata = {
  title: "Abel Mekonnen | Environmental Consultant",
  description:
    "Professional environmental consultant with 10+ years experience in hydrology, air quality & noise assessment, and GIS & remote sensing. Available for consultancy projects.",
  // generator: "v0.app",
  icons: {
    icon: [
      { url: "/images/favicon/favicon-16x16.png", sizes: "16x16", type: "image/png" },
      { url: "/images/favicon/favicon-32x32.png", sizes: "32x32", type: "image/png" },
      { url: "/images/favicon/android-chrome-192x192.png", sizes: "192x192", type: "image/png" },
      { url: "/images/favicon/android-chrome-512x512.png", sizes: "512x512", type: "image/png" }, 
      // { url: "/favicon.ico" },
    ],
    apple: "/apple-touch-icon.png",
  },
  keywords: [
    "environmental consultant",
    "hydrology",
    "air quality",
    "noise assessment",
    "GIS",
    "remote sensing",
    "environmental consultancy",
    "ESIA",
    "EIA",
    "ESG",
    "ESMP",
    "Environmental Impact",
    "Environmental Audit",
    "Environmental Monitoring",
    "Environmental Impact Assessment",
    "EPA",
  ],
  authors: [{ name: "Abel Mekonnen G." }],
  openGraph: {
    title: "Abel Mekonnen | Expert in Environmental Consultancy",
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
        <ForceHomeOnLoad />
        <Suspense fallback={null}>{children}</Suspense>
        <Analytics />
      </body>
    </html>
  )
}
