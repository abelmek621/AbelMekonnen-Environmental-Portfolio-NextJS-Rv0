import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Download } from "lucide-react"

export function AboutSection() {
  const achievements = [
    "Multi-disciplinary Expert",
    "100+ ESIA Projects",
    "Senior Level License",
    "Global Clients",
    "10+ Years Experience",
    "Environmental Consultancy"
  ]
  const license = [
    {
      licenseFile: "/pdfs/EPA-Expert-CoC-2025.pdf",
    },
  ]
  const resume = [
    {
      resumeFile: "/pdfs/AbelMekonnen_Resume_2025.pdf",
    },
  ]

  return (
    <section id="about" className="py-20 bg-muted/30">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-balance mb-4">About Me</h2>
            <p className="text-lg text-muted-foreground text-pretty max-w-2xl mx-auto">
              Dedicated environmental professional with extensive expertise across multiple disciplines
            </p>
          </div>

          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-6">
              {resume.map((area, index) => {
                return (
                  <Card key={index} className="p-6">
                    <CardContent className="p-0">
                    <h3 className="text-xl font-semibold mb-4">Professional Background</h3>
                    <p className="text-muted-foreground leading-relaxed mb-4">
                      As an experienced Environmental Expert in the Environmental Consultancy Sector, I bring over a
                      decade of specialized knowledge across three critical areas.
                    </p>
                    <p className="text-muted-foreground leading-relaxed mb-4">
                      As an experienced Environmental Expert in the Environmental Consultancy Sector, I bring over a
                      decade of specialized knowledge across three critical areas: hydrology, air quality & noise
                      assessment, and GIS & remote sensing.
                    </p>
                    <p className="text-muted-foreground leading-relaxed mb-2">
                      My comprehensive approach combines technical expertise with practical solutions, helping
                      organizations navigate complex environmental challenges while ensuring regulatory compliance and
                      sustainable practices.
                    </p>
                    <div className="flex gap-2 justify-left ml-10 pt-6">
                        <Button
                          variant="outline"
                          size="sm"
                          className="flex items-left gap-2 hover:bg-primary hover:text-primary-foreground transition-colors bg-transparent"
                          asChild
                        >
                          <a href={area.resumeFile} download>
                            <Download className="h-4 w-4" />
                            Resume
                          </a>
                        </Button>
                    </div>
                    </CardContent>
                  </Card>
                  )
              })}
              <div className="center flex flex-wrap gap-2">
                      {achievements.map((achievement) => (
                        <Badge key={achievement} variant="secondary" className="px-3 py-1">
                          {achievement}
                        </Badge>
                      ))}
              </div>
            </div>

            <div className="relative">
              <div className="aspect-square rounded-2xl bg-gradient-to-br from-primary/10 to-secondary/10 p-4 flex items-center justify-center">
                <img
                  src="images/expert-pics/Abel-Mekonnen-portrait-3.webp"
                  alt="Environmental Consultant"
                  className="rounded-xl shadow-lg w-full h-full object-cover"
                />
              </div>
              
              <div className="absolute -bottom-6 -left-6 bg-primary text-primary-foreground p-4 rounded-xl shadow-lg">
                <div className="text-center">
                  <div className="text-2xl font-bold">10+</div>
                  <div className="text-sm">Years</div>
                </div>
              </div>
              <div className="absolute -bottom-6 -right-6 text-center bg-primary text-primary-foreground p-2 rounded-xl shadow-lg">
                  <div className="text-2xl font-bold">Senior</div>
                    {license.map((area, licenseFile) => (
                      <Button key={licenseFile} className="m-0 flex items-center text-sm hover:bg-secondary hover:text-secondary-foreground transition-colors bg-transparent">
                        <a href={area.licenseFile} download>
                          <Download className="w-6 h-6" />
                        </a>
                        <a href={area.licenseFile} download className="text-sm ">
                          EPA COC
                        </a>
                      </Button>
                    ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
