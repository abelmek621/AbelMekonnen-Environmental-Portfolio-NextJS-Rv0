import { Button } from "@/components/ui/button"
import { ArrowDown, Mail } from "lucide-react"

export function HeroSection() {
  return (
    <section className="relative min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-muted/30">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-5">
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fillRule='evenodd'%3E%3Cg fill='%23006e46' fillOpacity='0.1'%3E%3Ccircle cx='30' cy='30' r='2'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          }}
        />
      </div>

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-balance mb-6">
            Environmental Consultant
            <span className="block text-primary mt-2">Expert Solutions</span>
          </h1>

          <p className="text-lg sm:text-xl text-muted-foreground text-pretty mb-8 max-w-2xl mx-auto">
            Over 10 years of specialized experience in hydrology, air quality & noise assessment, and GIS & remote
            sensing. Delivering professional environmental consultancy services to firms and organizations worldwide.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-12">
            <Button size="lg" className="text-lg px-8 py-3" asChild>
              <a href="#contact">
                <Mail className="mr-2 h-5 w-5" />
                Get In Touch
              </a>
            </Button>
            <Button variant="outline" size="lg" className="text-lg px-8 py-3 bg-transparent" asChild>
              <a href="#portfolio">View My Work</a>
            </Button>
          </div>

          <div className="animate-bounce">
            <Button className="bg-transparent hover:border-1 hover:bg-transparent hover:border-primary hover:round-full">
            <a href="#about" aria-label="Scroll to about section">
              <ArrowDown className="h-6 w-6 mx-auto text-bold text-muted-foreground" />
            </a>
            </Button>
          </div>
        </div>
      </div>
    </section>
  )
}
