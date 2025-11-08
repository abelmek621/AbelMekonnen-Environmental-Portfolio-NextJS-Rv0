import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ExternalLink } from "lucide-react"

export function PortfolioSection() {
  const projects = [
    {
      title: "Mining & Oil Exploration",
      category: "Hydrology",
      category2: "Air Quality & Noise",
      description:
        "Comprehensive environmental impact assessment including hydrogeological baseline studies; air quality, noise level, and dust monitoring /recording/.",
      image: "/urban-watershed-management-project.jpg",
      tags: ["Impact Assessment", "Baseline", "Monitoring"],
      impact: "Minimized environmental impact",
      link: "https://drive.google.com/drive/folders/1SsCn9KYpCco3s7DJKEWn9lOjuyaPo4kT?usp=drive_link",
    },
    {
      title: "Wind Power & Geothermal Energy",
      category: "Air Quality & Noise",
      category2: "GIS & Remote Sensing",
      description:
        "Air-quality and noise impact modelling, construction and operational air emissions, and mitigation design for sustainable power development.",
      image: "/industrial-air-quality-monitoring.jpg",
      tags: ["Air Emissions", "Modelling", "Mitigation"],
      impact: "Modelled impacts & optimized siting",
      link: "https://docs.google.com/presentation/d/1b3FYmLWHKAUwdf8majkuPnfYSS-zjnTKuAu7HfcVkfA/edit?usp=sharing",
    },
    {
      title: "Transmission Lines & Substations",
      category: "GIS & Remote Sensing",
      category2: "Hydrology",
      description:
        "Route selection and corridor impact assessment using GIS-based constraints mapping, habitat and land-use analysis, EMF and erosion considerations.",
      image: "/mining-environmental-impact-assessment2.png",
      tags: ["TL Corridors", "Route Selection", "Habitat Mapping"],
      impact: "Minimized habitat impact & optimized routing",
      link: "#",
    },
    {
      title: "Environmental Audit & ESG",
      category: "Hydrology",
      category2: "Air Quality & Noise",
      description:
        "Corporate environmental audits and ESG gap analysis, including water-use audits, compliance reviews, and actionable roadmap to improve sustainability.",
      image: "/coastal-erosion-study-environmental.jpg",
      tags: ["Environmental Audit", "ESG", "Water Audits"],
      impact: "Improved ESG performance",
      link: "#",
    },
    {
      title: "LULC & Constarints Mapping",
      category: "GIS & Remote Sensing",
      category2: "Hydrology",
      description:
        "High-resolution land use / land cover mapping and constraints analysis (floodplains, protected areas, steep slopes) using multi-source satellite imagery.",
      image: "/forest-change-detection-satellite.jpg",
      tags: ["LULC", "Constraints Mapping", "Remote Sensing"],
      impact: "Delivered decision-ready maps",
      link: "#",
    },
    {
      title: "Environmental Monitoring & EMS",
      category: "Air Quality & Noise",
      category2: "Hydrology",
      description:
        "Design and implementation of environmental monitoring programs and EMS, data management and reporting to support compliance and continuous improvement.",
      image: "/environmental-mapping-satellite-imagery.jpg",
      tags: ["Monitoring Network", "EMS", "Data Management"],
      impact: "Implemented EMS & reduced incidents",
      link: "#",
    },
  ]


  return (
    <section id="portfolio" className="py-20 bg-muted/30">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-balance mb-4">Portfolio & Projects</h2>
            <p className="text-lg text-muted-foreground text-pretty max-w-2xl mx-auto">
              Selected projects showcasing expertise across environmental consultancy disciplines
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {projects.map((project, index) => (
              <a
                key={index}
                href={project.link}
                target="_blank"
                rel="noopener noreferrer"
                className="block group hover:shadow-lg transition-all duration-300 hover:-translate-y-1"
              >
                <Card className="h-full overflow-hidden border-2 hover:border-primary transition-colors">
                  <div className="relative overflow-hidden">
                    <img
                      src={project.image || "/placeholder.svg"}
                      alt={project.title}
                      className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    <div className="absolute top-4 left-4">
                      <Badge variant="secondary" className="bg-background/90">
                        {project.category}
                      </Badge>
                    </div>
                    <div className="absolute top-12 left-4">
                      <Badge variant="secondary" className="bg-background/90">
                        {project.category2}
                      </Badge>
                    </div>
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-300 flex items-center justify-center opacity-0 group-hover:opacity-100">
                      <ExternalLink className="h-6 w-6 text-white" />
                    </div>
                  </div>

                  <CardHeader>
                    <CardTitle className="text-lg group-hover:text-primary transition-colors">
                      {project.title}
                    </CardTitle>
                  </CardHeader>

                  <CardContent className="space-y-4">
                    <p className="text-sm text-muted-foreground leading-relaxed">{project.description}</p>

                    <div className="flex flex-wrap gap-1">
                      {project.tags.map((tag) => (
                        <span key={tag} className="text-xs bg-primary/10 text-primary px-2 py-1 rounded-full">
                          {tag}
                        </span>
                      ))}
                    </div>

                    <div className="pt-2 border-t border-border">
                      <p className="text-sm font-medium text-primary">{project.impact}</p>
                    </div>
                  </CardContent>
                </Card>
              </a>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
