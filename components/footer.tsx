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
        <div className=" max-w-6xl mx-auto">
          {/* Main Footer Content */}
          <div className="hidden md:grid grid-cols-2 space-y-16 gap-10"> {/*grid md:grid-cols-4 gap-10*/}
              {/* Brand - Hidden on mobile, shown on desktop */}
              
                <div className="grid grid-cols-1 items-center space-y-8 gap-4"> {/*"flex md:flex-cols-4 justify-center gap-12"*/}
                  <div className="hidden md:grid align-center w-max mb-4"> {/*pl-2 w-max ml-17*/}
                    {home.map((item) => (
                      <a 
                        key={item.title} href={item.link}
                      >
                        <h3 className="text-xl font-bold hover:text-primary/60 hover:transition-3000">{item.title}</h3> {/*Environmental Expert*/}
                      </a>
                    ))}
                  </div>
                  <div className="hidden md:block">
                    <p className=" text-lg text-background/80 text-pretty leading-relaxed mb-4"> {/*"flex text-background/80 text-center text-pretty leading-relaxed"*/}
                      Professional environmental consultant with 10+ years of experience in hydrology, air quality & noise assessment, GIS and remote sensing.
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-2 justify-start items-start space-x-6">
                  {/* Services - Show only heading on mobile */}
                  <div className="grid grid-cols-1 space-y-6">
                    <div className="hidden md:grid items-center justify-center">
                      {services.map((item) => (
                          <a 
                            key={item.href} href={item.href}
                          >
                            <h4 className="font-semibold hover:underline hover:italic text-center md:text-left">{item.label}</h4> {/* w-max ml-8 flex items-left align-center space-y-4 font-semibold mb-6 px-3 hover:underline hover:italic */}
                          </a>
                      ))}
                    </div>
                    {/* Service details - hidden on mobile */}
                    <div className="hidden md:grid justify-center gap-3">
                      <ul className="space-y-3 text-sm italic font-pretty text-background/80"> {/*flex flex-wrap space-y-4 ml-5 text-sm italic font-pretty text-background/80*/}
                        <li className="flex items-center gap-2 text-sm">
                          <CheckCircle className="h-4 w-4 text-secondary flex-shrink-0" />
                          <span>Consulting & Advisory</span>
                        </li>
                        <li className="flex items-center gap-2 text-sm">
                          <CheckCircle className="h-4 w-4 text-secondary flex-shrink-0" />
                          <span>Regulatory Compliance</span>
                        </li>
                        <li className="flex items-center gap-2 text-sm">
                          <CheckCircle className="h-4 w-4 text-secondary flex-shrink-0" />
                          <span>ESIA & ESMP</span>
                        </li>
                        <li className="flex items-center gap-2 text-sm">
                          <CheckCircle className="h-4 w-4 text-secondary flex-shrink-0" />
                          <span>Data Analysis & Modeling</span>
                        </li>
                      </ul>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 space-y-6">
                    {/* Expertise - show only heading on mobile */}
                    <div className="hidden md:grid items-center justify-center justify-center">
                      {expertise.map((item) => (
                          <a 
                            key={item.href} href={item.href}
                          >
                            <h4 className="font-semibold hover:underline hover:italic text-center md:text-left">{item.label}</h4> {/* flex ml-8 w-max items-left align-center space-y-4 font-semibold mb-6 px-3 hover:underline hover:italic */}
                          </a>
                      ))}
                    </div>
                    {/* Expertise details - hidden on mobile */}
                    <div className="hidden md:grid justify-center items-center gap-3">
                      <ul className="space-y-3 text-sm italic font-pretty text-background/80"> {/* flex flex-wrap flex-shrink-0 space-y-4 ml-5 text-sm italic font-pretty text-background/80 */}
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
                  </div>
                </div>
              </div>

              {/* ONLY ON MOBILE SCREENS */}
              {/* Mobile Brand - Only show on mobile */}
              <div className="md:hidden grid grid-cols-1 justify-center items-center space-y-6">
                <div className="md:hidden text-center mb-10">
                  {home.map((item) => (
                    <a key={item.title} href={item.link}>
                      <h3 className="text-xl font-bold hover:text-primary/60">
                        {item.title}
                      </h3>
                    </a>
                  ))}
                </div>
                <div className="md:hidden grid grid-cols-1 justify-center items-center space-y-6">
                  <div className="md:hidden text-center">
                    {about.map((item) => (
                      <a key={item.href} href={item.href}>
                        <h3 className="font-semibold font-semibold hover:underline hover:italic">
                          {item.label}
                        </h3>
                      </a>
                    ))}
                  </div>
                  {/* Services - Only show on mobile */}
                  <div className="md:hidden grid text-center">
                    {services.map((item) => (
                      <a key={item.href} href={item.href}>
                        <h3 className="font-semibold font-semibold hover:underline hover:italic">
                          {item.label}
                        </h3>
                      </a>
                    ))}
                  </div>
                </div>
              </div>
            
            <div className="grid grid-cols-4 justify-center items-center space-x-12 gap-6">
              <div className="hidden md:flex flex-cols-3 justify-center gap-12"> {/*gap-8 mt-4 text-primary ml-22*/}
                <div className="bg-background/10 font-bold p-2 rounded-lg">
                  <Droplets className="text-primary font-bold h-5 w-5" />
                </div>
                <div className="p-2 bg-background/10 rounded-lg">
                  <Wind className="text-primary font-bold h-5 w-5" />
                </div>
                <div className="p-2 bg-background/10 rounded-lg">
                  <Map className="text-primary font-bold h-5 w-5" />
                </div>
              </div>
  
              {/* Navigation Links - Always visible, centered on mobile */}
              {/* flex flex-wrap items-left space-y-4 font-semibold mb-6 px-10 */}

                <div className="hidden md:grid grid-cols-1 gap-4 items-center space-y-2"> {/* className="grid grid-cols-2 gap-4 md:grid-cols-1 md:gap-2 w-full max-w-xs" */}
                  <div className="hidden md:flex justify-center space-x-4 items-center"> {/* flex ml-7 font-bold text-background/10 */}
                    <User className="h-5 w-5 text-background/60"/>
                    {about.map((item) => (
                      <a 
                        key={item.href} href={item.href}
                      >
                        <h4 className="font-semibold hover:underline hover:italic">{item.label}</h4> {/* w-max font-semibold mb-4 ml-3 hover:underline hover:italic */}
                      </a>
                    ))}
                  </div>
                  <div className="hidden md:grid">
                    <ul className="space-y-3 text-sm italic font-pretty text-background/80"> {/* flex flex-wrap flex-shrink-0 space-y-4 ml-5 text-sm italic font-pretty text-background/80 */}
                      <li className="flex flex-wrap items-center gap-2 justify-center text-sm">
                        <CheckCircle className="h-4 w-4 text-primary flex-shrink-0" />
                        <span>EPA CoC - Senior</span>
                      </li>
                    </ul>
                  </div>
                </div>

                <div className="hidden md:grid grid-cols-1 gap-4 items-center space-y-2">
                  <div className="hidden md:flex justify-center space-x-4 items-center">
                    <BookOpenIcon className="hidden md:flex h-5 w-5 text-background/60" />
                    {portfolio.map((item) => (
                      <a 
                        key={item.href} href={item.href}
                      >
                        <h4 className="font-semibold hover:underline hover:italic">{item.label}</h4> {/* w-full font-semibold mb-4 ml-1 hover:underline hover:italic */}
                      </a>
                    ))}
                  </div>
                  <div className="hidden md:grid gap-3">
                    <ul className="text-sm italic font-pretty text-background/80"> {/* flex flex-wrap flex-shrink-0 space-y-4 ml-5 text-sm italic font-pretty text-background/80 */}
                      <li className="flex flex-wrap justify-center gap-2 text-sm">
                        <CheckCircle className="h-4 w-4 text-primary flex-shrink-0" />
                        <span>100+ Projects - Global Clients</span>
                      </li>
                    </ul>
                  </div>
                </div>

                <div className="hidden md:grid grid-cols-1 gap-4 items-center space-y-2">
                  <div className="hidden md:flex justify-center md:justify-center items-center">
                    {contact.map((item) => (
                      <a 
                        key={item.href} href={item.href}
                      >
                        <h4 className="font-semibold hover:underline hover:italic">{item.label}</h4> {/* w-full font-semibold mb-4 ml-1 hover:underline hover:italic */}
                      </a>
                    ))}
                  </div>
                  <div className="hidden md:grid justify-center space-y-4">
                    <ul className="text-sm italic font-pretty text-background/80"> {/* flex flex-wrap flex-shrink-0 space-y-4 ml-5 text-sm italic font-pretty text-background/80 */}
                      <li className="flex flex-wrap items-center gap-6 text-sm">
                        <Phone className="h-5 w-5 text-background/60"/>
                        <Mail className="h-5 w-5 text-background/60"/>
                        <Linkedin className="h-5 w-5 text-background/60"/>
                      </li>
                    </ul>
                  </div>
                </div>
              </div>
              
                {/* ONLY ON MOBILE SCREENS */}
                {/* About - Only show on mobile */}
                <div className="md:hidden grid grid-cols-1 justify-center items-center space-y-6">
                  {/* Expertise - Only show on mobile */}
                  <div className="md:hidden grid text-center mt-4">
                    {expertise.map((item) => (
                      <a key={item.href} href={item.href}>
                        <h3 className="font-semibold font-semibold hover:underline hover:italic">
                          {item.label}
                        </h3>
                      </a>
                    ))}
                  </div>
                  <div className="md:hidden grid grid-cols-1 justify-center items-center space-y-6">
                    {/* Portfolio - Only show on mobile */}
                    <div className="md:hidden grid text-center">
                      {portfolio.map((item) => (
                        <a key={item.href} href={item.href}>
                          <h3 className="font-semibold font-semibold hover:underline hover:italic">
                            {item.label}
                          </h3>
                        </a>
                      ))}
                    </div>
                    {/* Contact - Only show on mobile */}
                    <div className="md:hidden grid text-center">
                      {contact.map((item) => (
                        <a key={item.href} href={item.href}>
                          <h3 className="font-semibold hover:underline hover:italic">
                            {item.label}
                          </h3>
                        </a>
                      ))}
                    </div>
                  </div>
                  {/* Icons - Only show on mobile */}
                  <div className="md:hidden flex flex-cols-1 justify-center items-center gap-16 mt-4"> {/*gap-8 mt-4 text-primary ml-22*/}
                    <div className="bg-background/10 font-bold p-2 rounded-lg">
                      <Droplets className="text-primary font-bold h-5 w-5" />
                    </div>
                    <div className="p-2 bg-background/10 rounded-lg">
                      <Wind className="text-primary font-bold h-5 w-5" />
                    </div>
                    <div className="p-2 bg-background/10 rounded-lg">
                      <Map className="text-primary font-bold h-5 w-5" />
                    </div>
                  </div>
                </div>
            

          {/* Copyright Section */}
          <div className="border-t border-background/20 mt-8 pt-6 text-center"> {/* Environmental Expert */}
            <p className="text-background/60 text-sm">
              © {currentYear} Abel Mekonnen. All rights reserved. | Professional Environmental Consultancy
              Services
            </p>
          </div>
        </div>
      </div>
    </footer>
  )
}
