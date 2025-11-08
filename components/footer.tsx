import { Droplets, Wind, Map, CheckCircle, Phone, Mail, Linkedin, User, BookOpenIcon } from "lucide-react"

export function Footer() {
  const currentYear = new Date().getFullYear()

  const home = [
    {
      title: "Abel Mekonnen G.",
      link: "#",
    },
  ]

  const services = [
    { href: "#services", label: "Services" },
  ]
  const expertise = [
    { href: "#expertise", label: "Expertise" },
  ]
  const about = [
    { href: "#about", label: "About" },
  ]
  const portfolio = [
    { href: "#portfolio", label: "Portfolio" },
  ]
  const contact = [
    { href: "#contact", label: "Contact" },
  ]

  return (
    <footer className="bg-foreground text-background py-6">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">

              {/* <div className="grid md:grid-cols-4 gap-10"> */}
              <div className="flex md:flex-cols-4 justify-center gap-12">
                {/* Brand */} 
                <div className="md:col-span-2">
                  <div className="flex-shrink-0 mb-4 pl-2 w-max ml-17">
                    {home.map((index) => (
                      <a 
                        key={index.title}
                        href={index.link}
                      >
                        <h3 className="text-xl font-bold hover:text-primary/60 hover:transition-3000">{index.title}</h3> {/*Environmental Expert*/}
                      </a>
                    ))}
                  </div>
                  <p className="text-background/80 text-center text-pretty leading-relaxed">
                    Professional environmental consultant with 10+ years of experience in hydrology, air quality & noise assessment,
                  </p>
                  <p className="text-background/80 text-center text-pretty leading-relaxed mb-4">
                    GIS and remote sensing.
                  </p>
                  <div className="flex gap-8 mt-10 text-primary ml-22">
                    <div className="bg-background/10 font-bold p-2 bg-background/10 rounded-lg">
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
            <div>
              {services.map((index) => (
                  <a 
                    key={index.href}
                    href={index.href}
                  >
                    <h4 className="w-max ml-8 flex items-left align-center space-y-4 font-semibold mb-6 px-3 hover:underline hover:italic ">{index.label}</h4>
                  </a>
              ))}
                  
                  <ul className="flex flex-wrap space-y-4 ml-5 text-sm italic font-pretty text-background/80">
                    <li className="flex items-center gap-2 text-sm">
                      <CheckCircle className="h-4 w-4 text-secondary flex-shrink-0" />
                      <span>ESIA & ESMP</span>
                    </li>
                    <li className="flex items-center gap-2 text-sm">
                      <CheckCircle className="h-4 w-4 text-secondary flex-shrink-0" />
                      <span>Regulatory Compliance</span>
                    </li>
                    <li className="flex items-center gap-2 text-sm">
                      <CheckCircle className="h-4 w-4 text-secondary flex-shrink-0" />
                      <span>Consulting & Advisory</span>
                    </li>
                    <li className="flex items-center gap-2 text-sm">
                      <CheckCircle className="h-4 w-4 text-secondary flex-shrink-0" />
                      <span>Data Analysis & Modeling</span>
                    </li>
                  </ul>
            </div>

            {/* Expertise */}
            <div>
              {expertise.map((index) => (
                  <a 
                    key={index.href}
                    href={index.href}
                  >
                    <h4 className="flex ml-8 w-max items-left align-center space-y-4 font-semibold mb-6 px-3 hover:underline hover:italic">{index.label}</h4>
                  </a>
              ))}
              <ul className="flex flex-wrap flex-shrink-0 space-y-4 ml-5 text-sm italic font-pretty text-background/80">
                <li className="flex items-center gap-2 text-sm">
                  <CheckCircle className="h-4 w-4 text-secondary flex-shrink-0" />
                  <span>Environmental Consultancy</span>
                </li>
                <li className="flex flex-wrap items-center gap-2 text-sm">
                  <CheckCircle className="h-4 w-4 text-secondary flex-shrink-0" />
                  <span>Hydrology</span>
                </li>
                <li className="flex flex-wrap items-center gap-2 text-sm">
                  <CheckCircle className="h-4 w-4 text-secondary flex-shrink-0" />
                  <span>Air Quality & Noise</span>
                </li>
                <li className="flex flex-wrap items-center gap-2 text-sm">
                  <CheckCircle className="h-4 w-4 text-secondary flex-shrink-0" />
                  <span>GIS & Remote Sensing</span>
                </li>
              </ul>
            </div>

            {/* About, Portfolio, Contact */}
            <div className="flex flex-wrap items-left space-y-4 font-semibold mb-6 px-10">
              <div>
                {about.map((index) => (
                  <a 
                    key={index.href}
                    href={index.href}
                  >
                    <h4 className="w-max font-semibold mb-4 ml-3 hover:underline hover:italic">{index.label}</h4>
                  </a>
              ))}
                <div className="flex ml-7 font-bold text-background/10">
                  <User className="h-6 w-6" />
                </div>
              </div>
              <div>
                {portfolio.map((index) => (
                  <a 
                    key={index.href}
                    href={index.href}
                  >
                    <h4 className="w-full font-semibold mb-4 ml-1 hover:underline hover:italic">{index.label}</h4>
                  </a>
              ))}
                <div className="flex ml-8 font-bold text-background/10">
                  <BookOpenIcon className="h-5 w-5" />
                </div>
              </div>
              <div>
                {contact.map((index) => (
                  <a 
                    key={index.href}
                    href={index.href}
                  >
                    <h4 className="w-max font-semibold mb-4 ml-2 hover:underline hover:italic">{index.label}</h4>
                  </a>
                ))}
                <div className="flex gap-5 font-bold text-background/10 mt-2">
                  <Phone className="h-4 w-4" />
                  <Mail className="h-4 w-4" />
                  <Linkedin className="h-4 w-4" />
                </div>
              </div>
            </div>
          </div>
          </div>

          <div className="border-t border-background/20 mt-8 pt-2 text-center"> {/* Environmental Expert */}
            <p className="text-background/60">
              © {currentYear} Abel Mekonnen. All rights reserved. | Professional Environmental Consultancy
              Services
            </p>
          </div>

        <div>
        </div>
      </div>
    </footer>
  )
}
