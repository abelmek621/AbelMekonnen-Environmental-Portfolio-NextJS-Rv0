import { Droplets, Wind, Map } from "lucide-react"

export function Footer() {
  const currentYear = new Date().getFullYear()

  return (
    <footer className="bg-foreground text-background py-6">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          <div className="grid md:grid-cols-4 gap-10">
            {/* Brand */}
            <div className="md:col-span-2">
              <h3 className="text-xl font-bold mb-4">Abel Mekonnen G.</h3> {/* Environmental Expert */}
              <p className="text-background/80 leading-relaxed mb-4">
                Professional environmental consultant with 10+ years of experience in hydrology, air quality & noise
                assessment, and GIS & remote sensing.
              </p>
              <div className="flex gap-4">
                <div className="p-2 bg-background/10 rounded-lg">
                  <Droplets className="h-5 w-5" />
                </div>
                <div className="p-2 bg-background/10 rounded-lg">
                  <Wind className="h-5 w-5" />
                </div>
                <div className="p-2 bg-background/10 rounded-lg">
                  <Map className="h-5 w-5" />
                </div>
              </div>
            </div>

            {/* Services */}
            <div className="ml-8 mr-6">
              <h4 className="font-semibold mb-4">Services</h4>
              <ul className="space-y-2 text-background/80">
                <li>ESIA & ESMP</li>
                <li>Regulatory Compliance</li>
                <li>Consulting & Advisory</li>
                <li>Data Analysis & Modeling</li>
              </ul>
            </div>

            {/* Expertise */}
            <div className="ml-12">
              <h4 className="font-semibold mb-4">Expertise</h4>
              <ul className="space-y-2 text-background/80">
                <li>Hydrology</li>
                <li>Air Quality & Noise</li>
                <li>GIS & Remote Sensing</li>
                <li>Environmental Consultancy</li>
              </ul>
            </div>
          </div>

          <div className="border-t border-background/20 mt-4 pt-2 text-center"> {/* Environmental Expert */}
            <p className="text-background/60">
              © {currentYear} Abel Mekonnen. All rights reserved. | Professional Environmental Consultancy
              Services
            </p>
          </div>
        </div>
      </div>
    </footer>
  )
}
