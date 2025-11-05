import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { CheckCircle, FileText, Users, Zap } from "lucide-react"

export function ServicesSection() {
  const services = [
    {
      icon: FileText,
      title: "Environmental Impact Assessment",
      description:
        "Comprehensive EIA studies for development projects, ensuring regulatory compliance and environmental protection.",
      features: ["Baseline Studies", "Impact Prediction", "Mitigation Measures", "Monitoring Plans"],
    },
    {
      icon: CheckCircle,
      title: "Regulatory Compliance",
      description: "Expert guidance on environmental regulations, permitting processes, and compliance monitoring.",
      features: ["Permit Applications", "Compliance Audits", "Regulatory Updates", "Risk Assessment"],
    },
    {
      icon: Users,
      title: "Consulting & Advisory",
      description:
        "Strategic environmental consulting for businesses, government agencies, and development organizations.",
      features: ["Strategic Planning", "Technical Advisory", "Capacity Building", "Best Practices"],
    },
    {
      icon: Zap,
      title: "Data Analysis & Modeling",
      description:
        "Advanced data analysis, environmental modeling, and geospatial solutions for informed decision-making.",
      features: ["Statistical Analysis", "Predictive Modeling", "GIS Solutions", "Remote Sensing"],
    },
  ]

  const testimonials = [
    {
      name: "DEJENE WOLDEMARIAM",
      title: "Environmentalist",
      contact: "wwww.tsenvironment.com",
      description:
        " ''Comprehensive watershed analysis and flood risk assessment, including stormwater management solutions.'' ",
      image: "/professional-environmental-consultant-portrait.jpg",
    },
    {
      name: "SAMUEL HAILU YIRDAW",
      title: "Environmentalist",
      contact: "wwww.tsenvironment.com",
      description:
        " ''Multi-site air quality monitoring and noise impact assessment for industrial facility expansion project.'' ",
      image: "/Samuel-1.jpeg",
    },
    {
      name: "MELSEW SHANKO",
      title: "Livelihood Specialist",
      contact: "wwww.tsenvironment.com",
      description:
        " ''Large-scale environmental mapping using satellite imagery and GIS analysis for conservation planning.'' ",
      image: "/professional-environmental-consultant-portrait.jpg",
    },
    {
      name: "DAWIT DAGNE (DR.)",
      title: "Fishery Specialist",
      contact: "wwww.tsenvironment.com",
      description:
        " ''Coastal vulnerability assessment and erosion modeling using advanced hydrological and GIS techniques.'' ",
      image: "/Dawit-1.jpeg",
    },
    {
      name: "SEMUNIGUS AYALEW",
      title: "GIS & Land Use Expert",
      contact: "wwww.tsenvironment.com",
      description:
        " ''Comprehensive environmental impact assessment including air quality, noise, and dust monitoring for mining operations.'' ",
      image: "/professional-environmental-consultant-portrait-3.jpg",
    },
    {
      name: "MEKUANINT KEBEDE",
      title: "Senior Environmentalist",
      contact: "wwww.tsenvironment.com",
      description:
        " ''Multi-temporal satellite analysis for forest change detection and deforestation monitoring across tropical regions.'' ",
      image: "/professional-environmental-consultant-portrait-3.jpg",
    },
    {
      name: "DESIE NADEW (DR.)",
      title: "Hydrologist",
      contact: "wwww.tsenvironment.com",
      description:
        " ''Multi-temporal satellite analysis for forest change detection and deforestation monitoring across tropical regions.'' ",
      image: "/professional-environmental-consultant-portrait-3.jpg",
    },
    {
      name: "ZEWDU ALEBACHEW",
      title: "GIS & RS Expert",
      contact: "wwww.tsenvironment.com",
      description:
        " ''Multi-temporal satellite analysis for forest change detection and deforestation monitoring across tropical regions.'' ",
      image: "/Zewdu-1.png",
    },
  ]

  return (
    <section id="services" className="py-20 bg-background">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-balance mb-4">Services Offered</h2>
            <p className="text-lg text-muted-foreground text-pretty max-w-2xl mx-auto">
              Comprehensive environmental consultancy services tailored to your project needs
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            {services.map((service, index) => {
              const IconComponent = service.icon
              return (
                <Card key={index} className="group hover:shadow-lg transition-all duration-300">
                  <CardHeader className="pb-4">
                    <div className="flex items-center gap-4">
                      <div className="p-2 bg-primary/10 rounded-lg group-hover:bg-primary/20 transition-colors">
                        <IconComponent className="h-6 w-6 text-primary" />
                      </div>
                      <CardTitle className="text-xl">{service.title}</CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <p className="text-muted-foreground leading-relaxed">{service.description}</p>
                    <div className="space-y-2">
                      <h4 className="font-semibold text-sm">Key Features:</h4>
                      <ul className="grid grid-cols-2 gap-2">
                        {service.features.map((feature) => (
                          <li key={feature} className="flex items-center gap-2 text-sm">
                            <CheckCircle className="h-4 w-4 text-primary flex-shrink-0" />
                            <span className="text-muted-foreground">{feature}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
          
          <div className="bg-card text-center mb-6 mt-10">
            <h2 className="text-lg text-muted-foreground text-pretty sm:text-2xl font-bold text-balance mb-4">Co-workers & Testimonials</h2>
            {/* <p className="text-lg text-muted-foreground text-pretty max-w-2xl mx-auto">
              Comprehensive environmental consultancy services tailored to your project needs
            </p> */}
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 mt-10">
                      {testimonials.map((testimonial, index) => (
                        <a
                          key={index}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="block group hover:shadow-lg transition-all duration-300 hover:-translate-y-1"
                        >                     
                          <Card className="pt-2 h-54 overflow-hidden border-1 border-primary/50 hover:border-secondary/70 transition-colors">
                            <div className="relative">
                              <div className="flex flex-col items-end mr-6">
                                <img
                                    src={testimonial.image || "/placeholder.svg"}
                                    alt={testimonial.title}
                                    className="rounded-full w-16 h-16"
                                />
                                
                              </div>
                              <div className="absolute top-4 left-8">
                                <Badge className="bg-transparent text-black font-bold text-xs">
                                  {testimonial.name}
                                </Badge>
                                <p className="ml-4 text-xs text-black leading-relaxed">{testimonial.title}</p>
                              </div>
                              {/* <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-300 flex items-center justify-center opacity-0 group-hover:opacity-100">
                                <ExternalLink className="h-6 w-6 text-white" />
                              </div> */}
                            </div>
          
                            {/* <CardHeader className="pb-3">
                              <CardTitle className="text-lg group-hover:text-primary transition-colors">
                                {testimonial.title}
                              </CardTitle>
                            </CardHeader> */}
          
                            <CardContent className="space-y-1">
                              <p className="text-sm text-black leading-relaxed">{testimonial.description}</p>
                              <p className="ml-18 text-xs font-italic text-black leading-relaxed">{testimonial.contact}</p>
          
                              {/* <div className="flex flex-wrap gap-1">
                                {testimonial.tags.map((tag) => (
                                  <span key={tag} className="text-xs bg-primary/10 text-primary px-2 py-1 rounded-full">
                                    {tag}
                                  </span>
                                ))}
                              </div> */}
          
                              {/* <div className="pt-2 border-t border-border">
                                <p className="text-sm font-medium text-primary">{testimonial.impact}</p>
                              </div> */}
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
