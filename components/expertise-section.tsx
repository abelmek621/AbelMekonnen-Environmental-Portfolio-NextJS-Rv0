"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Droplets, Wind, Map, Download } from "lucide-react"

export function ExpertiseSection() {
  const expertiseAreas = [
    {
      icon: Droplets,
      title: "Hydrologist / Water Resource Enginner",
      description:
        "Water resource management, flood risk assessment, watershed analysis, and hydrological modeling for sustainable water solutions.",
      skills: ["Watershed Analysis", "Flood Risk Assessment", "Water Quality Monitoring", "Hydrological Modeling"],
      // cvFile: "/pdfs/hydrology-cv.pdf",
      // sampleWorksFile: "/pdfs/hydrology-sample-works.pdf",
    },
    {
      icon: Wind,
      title: "Air Quality & Noise Level Specialist",
      description:
        "Environmental impact assessment, air pollution monitoring, noise level analysis, and regulatory compliance consulting.",
      skills: [
        "Air Pollution Monitoring",
        "Noise Impact Assessment",
        "Environmental Impact Studies",
        "Regulatory Compliance",
      ],
      // cvFile: "/pdfs/air-quality-noise-cv.pdf",
      // sampleWorksFile: "/pdfs/air-quality-noise-sample-works.pdf",
    },
    {
      icon: Map,
      title: "GIS & Remote Sensing Expert",
      description:
        "Spatial analysis, satellite imagery interpretation, environmental mapping, and geospatial data management solutions.",
      skills: ["Spatial Analysis", "Satellite Imagery", "Environmental Mapping", "Geospatial Data Management"],
      // cvFile: "/pdfs/gis-remote-sensing-cv.pdf",
      // sampleWorksFile: "/pdfs/gis-remote-sensing-sample-works.pdf",
    },
  ]

  return (
    <section id="expertise" className="py-20 bg-background">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-balance mb-4">Areas of Expertise</h2>
            <p className="text-lg text-muted-foreground text-pretty max-w-2xl mx-auto">
              Three specialized disciplines with comprehensive knowledge and practical experience
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {expertiseAreas.map((area, index) => {
              const IconComponent = area.icon
              return (
                <Card key={index} className="group hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
                  <CardHeader className="text-center pb-4">
                    <div className="mx-auto mb-4 p-3 bg-primary/10 rounded-full w-fit group-hover:bg-primary/20 transition-colors">
                      <IconComponent className="h-8 w-8 text-primary" />
                    </div>
                    <CardTitle className="text-xl">{area.title}</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <p className="text-muted-foreground text-center leading-relaxed">{area.description}</p>
                    <div className="space-y-2">
                      <h4 className="font-semibold text-sm text-center">Key Skills:</h4>
                      <div className="flex flex-wrap gap-1 justify-center">
                        {area.skills.map((skill) => (
                          <span key={skill} className="text-xs bg-muted px-2 py-1 rounded-full text-muted-foreground">
                            {skill}
                          </span>
                        ))}
                      </div>
                    </div>
                    {/* <div className="flex gap-2 justify-center pt-4">
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex items-center gap-2 hover:bg-primary hover:text-primary-foreground transition-colors bg-transparent"
                        asChild
                      >
                        <a href={area.cvFile} target="_blank" rel="noopener noreferrer" download>
                          <Download className="h-4 w-4" />
                          Resume
                        </a>
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex items-center gap-2 hover:bg-secondary hover:text-secondary-foreground transition-colors bg-transparent"
                        asChild
                      >
                        <a href={area.sampleWorksFile} target="_blank" rel="noopener noreferrer" download>
                          <Download className="h-4 w-4" />
                          Sample Works
                        </a>
                      </Button> 
                    </div> */}
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </div>
      </div>
    </section>
  )
}
