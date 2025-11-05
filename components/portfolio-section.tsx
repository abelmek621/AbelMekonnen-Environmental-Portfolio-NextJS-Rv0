import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ExternalLink } from "lucide-react"

export function PortfolioSection() {
  const projects = [
    {
      title: "Mining & Oil Exploration",
      category: "Hydrology",
      description:
        "Comprehensive watershed analysis and flood risk assessment for a major metropolitan area, including stormwater management solutions.",
      image: "/urban-watershed-management-project.jpg",
      tags: ["Flood Risk", "Stormwater", "Urban Planning"],
      impact: "Reduced flood risk by 40%",
      link: "https://drive.google.com/drive/folders/1SsCn9KYpCco3s7DJKEWn9lOjuyaPo4kT?usp=drive_link", // Added link property for portfolio cards
    },
    {
      title: "Wind Power & Geothermal Energy",
      category: "Air Quality & Noise",
      description:
        "Multi-site air quality monitoring and noise impact assessment for industrial facility expansion project.",
      image: "/industrial-air-quality-monitoring.jpg",
      tags: ["Air Monitoring", "Noise Assessment", "Industrial"],
      impact: "Ensured regulatory compliance",
      link: "https://docs.google.com/presentation/d/1b3FYmLWHKAUwdf8majkuPnfYSS-zjnTKuAu7HfcVkfA/edit?usp=sharing",
    },
    {
      title: "Transmission Lines & Substations",
      category: "GIS & Remote Sensing",
      description:
        "Comprehensive environmental impact assessment including air quality, noise, and dust monitoring for mining operations.",
      image: "/mining-environmental-impact-assessment2.png",
      tags: ["Mining", "Impact Assessment", "Monitoring"],
      impact: "Minimized environmental impact",
      link: "#",
    },
    {
      title: "Environmental Audit & ESG",
      category: "Hydrology",
      description:
        "Coastal vulnerability assessment and erosion modeling using advanced hydrological and GIS techniques.",
      image: "/coastal-erosion-study-environmental.jpg",
      tags: ["Coastal Management", "Erosion Modeling", "Climate Change"],
      impact: "Protected 50km coastline",
      link: "#",
    },
    {
      title: "LULC & Constarints Mapping",
      category: "GIS & Remote Sensing",
      description:
        "Multi-temporal satellite analysis for forest change detection and deforestation monitoring across tropical regions.",
      image: "/forest-change-detection-satellite.jpg",
      tags: ["Deforestation", "Change Detection", "Forest Management"],
      impact: "Monitored 50,000+ hectares",
      link: "#",
    },
    {
      title: "Environmental Monitoring & EMS",
      category: "Air Quality & Noise",
      description:
        "Large-scale environmental mapping using satellite imagery and GIS analysis for conservation planning.",
      image: "/environmental-mapping-satellite-imagery.jpg",
      tags: ["Satellite Imagery", "Conservation", "Mapping"],
      impact: "Mapped 10,000+ hectares",
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
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-300 flex items-center justify-center opacity-0 group-hover:opacity-100">
                      <ExternalLink className="h-6 w-6 text-white" />
                    </div>
                  </div>

                  <CardHeader className="pb-3">
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
