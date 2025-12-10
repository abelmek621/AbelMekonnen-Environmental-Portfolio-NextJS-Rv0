"use client";

import React, { useEffect, useRef, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { CheckCircle, FileText, Users, Zap, ChevronLeft, ChevronRight } from "lucide-react"

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
      name: "SAMUEL HAILU YIRDAW",
      title: "Environmentalist",
      contact: "wwww.tsenvironment.com",
      description:
        " ''A quick learner who adapts seamlessly. His expertise was vital for our complex ESIA, Audit, and ESG projects in the extractive industries.'' ",
      image: "/images/testimonials-pics/Samuel-1.webp",
    },
    {
      name: "DESSIE NEDAW (DR.)",
      title: "Hydrologist",
      contact: "dessienedaw@yahoo.com",
      description:
        " ''He excels in hydrology fieldwork—planning to data collection. Rapid learning with strong communication for outstanding project outcomes.'' ",
      image: "/images/testimonials-pics/testimonial-no-photo-3.webp",
    },
    {
      name: "LYN BROWN",
      title: "Environmental Consultant",
      contact: "lyn89577@gmail.com",
      description:
        " ''His deep hydrological expertise provided critical analysis needed for Projects. Transforms complex data into actionable, compliant solutions.'' ",
      image: "/images/testimonials-pics/Lyn-1.webp",
    },
    {
      name: "DEJENE WOLDEMARIAM",
      title: "Environmentalist",
      contact: "dejenewm@gmail.com",
      description: 
        " ''His multidisciplinary skills and precise professional recommendations consistently enhanced our ESIA/RAP studies. An exceptional report writer.'' ",
      image: "/images/testimonials-pics/testimonial-no-photo-3.webp",
    },
    {
      name: "BELINDA RIDLEY",
      title: "Social Performance Advisory Head",
      contact: "belinda@ibisconsulting.com",
      description:
        " ''Has exceptional ability to navigate complex environmental regulations. His work ensure compliance & builds foundation for sustainable project.'' ",
      image: "/images/testimonials-pics/belinda-1.webp",
    },
    {
      name: "AREBO SAMBI",
      title: "Environmentalist",
      contact: "essdconsult@gmail.com",
      description:
        " ''Strong report writing and communication skills-consistently delivering exceptional work-make him a valuable asset on any ESIA project.'' ",
      image: "/images/testimonials-pics/testimonial-no-photo-3.webp",
    },
    {
      name: "LELISA TEMESGEN",
      title: "Socio-Economy Expert",
      contact: "essdconsult@gmail.com",
      description:
        " ''A true expert whose knowledge sets him apart. He is a go-to person for complex challenges and provides invaluable guidance.'' ",
      image: "/images/testimonials-pics/lelisa-1.webp",
    },
    {
      name: "DAWIT DAGNE",
      title: "Social Expert",
      contact: "dave14da@gmail.com",
      description:
        " ''A reliable expert who delivers high-quality reports on time. His clear communication ensures smooth project execution from start to finish.'' ",
      image: "/images/testimonials-pics/Dawit-1.webp",
    },
    {
      name: "SEMUNIGUS AYALEW",
      title: "GIS & Land Use Expert",
      contact: "semunigus2011@gmail.com",
      description:
        " ''His advanced GIS skills in data interpretation and visualization, paired with his ability to quickly master new challenges, are truly impressive.'' ",
      image: "/images/testimonials-pics/Semu-1.webp",
    },
    {
      name: "JAN TEN KATE",
      title: "Noise Consultant",
      contact: "jjltenkate@gmail.com",
      description:
        " ''His rigorous air quality and noise assessments are standard for excellence. He consistently delivers technically sound models and reports.'' ",
      image: "/images/testimonials-pics/Jan-1.webp",
    },
    {
      name: "MEQUANINT TENAW",
      title: "Environmental & SS Specialist",
      contact: "mequanntt@yahoo.com",
      description:
        " ''His talent for systematic data collection, management, and clear presentation was a key asset to our ESIA studies.'' ",
      image: "/images/testimonials-pics/Mekuanent-1.webp",
    },
    {
      name: "ZEWDU ALEBACHEW",
      title: "GIS & RS Expert",
      contact: "zedoethiopi@gmail.com",
      description:
        " ''He leverages cutting-edge GIS, remote sensing, and digital tools to deliver precise impact analysis and efficient on-field work solutions.'' ",
      image: "/images/testimonials-pics/Zewdu-1.webp",
    },
  ]

  /* ---------- Carousel state for rotating 3 cards ---------- */
  const [currentIndex, setCurrentIndex] = useState<number>(0)
  const [isTransitionEnabled, setIsTransitionEnabled] = useState<boolean>(true)
  const [isAutoPlayPaused, setIsAutoPlayPaused] = useState<boolean>(false)
  const transitionMs = 500
  const intervalMs = 3000

  // Get the current 3 cards to display
  const getCurrentCards = () => {
    const cards = []
    
    for (let i = 0; i < 3; i++) {
      const cardIndex = (currentIndex + i) % testimonials.length
      cards.push(testimonials[cardIndex])
    }
    
    return cards
  }

  // Get the next card that will slide in
  const getNextCard = () => {
    const nextIndex = (currentIndex + 3) % testimonials.length
    return testimonials[nextIndex]
  }

  // Get the previous card for smooth transitions
  const getPrevCard = () => {
    const prevIndex = (currentIndex - 1 + testimonials.length) % testimonials.length
    return testimonials[prevIndex]
  }

  // autoplay - rotate one card at a time
  useEffect(() => {
    if (isAutoPlayPaused) return
    
    const id = setInterval(() => {
      setIsTransitionEnabled(true)
      setCurrentIndex((prev) => (prev + 1) % testimonials.length)
    }, intervalMs)
    
    return () => clearInterval(id)
  }, [isAutoPlayPaused, testimonials.length])

  // Manual navigation
  const nextSlide = () => {
    setIsTransitionEnabled(true)
    setCurrentIndex((prev) => (prev + 1) % testimonials.length)
  }

  const prevSlide = () => {
    setIsTransitionEnabled(true)
    setCurrentIndex((prev) => (prev - 1 + testimonials.length) % testimonials.length)
  }

  const currentCards = getCurrentCards()
  const nextCard = getNextCard()
  const prevCard = getPrevCard()

  // Handle hover events
  const handleMouseEnter = () => {
    setIsAutoPlayPaused(true)
  }

  const handleMouseLeave = () => {
    setIsAutoPlayPaused(false)
  }

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

           {/* ================= Rotating 3-Card Testimonial Section ================= */}
          <div 
            className="relative mt-10"
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
          >
            
            <div className="hidden md:block">
              {/* Navigation Buttons */}
              <button
                onClick={prevSlide}
                className="absolute left-0 top-1/2 transform -translate-y-1/2 z-10 bg-white/80 hover:bg-white rounded-full p-2 shadow-lg border transition-all duration-200 hover:scale-110"
              >
                <ChevronLeft className="h-5 w-5 text-primary" />
              </button>
              
              <button
                onClick={nextSlide}
                className="absolute right-0 top-1/2 transform -translate-y-1/2 z-10 bg-white/80 hover:bg-white rounded-full p-2 shadow-lg border transition-all duration-200 hover:scale-110"
              >
                <ChevronRight className="h-5 w-5 text-primary" />
              </button>
            </div>

            {/* Navigation Buttons - mobile screens */}
            {/* <div className="md:hidden">
              <button
                onClick={prevSlide}
                className="absolute left-0 top-1/2 transform -translate-y-1/2 z-10 bg-white/80 hover:bg-white rounded-full p-2 shadow-lg border transition-all duration-200 hover:scale-110"
              >
                <ChevronLeft className="h-3 w-3 text-primary" />
              </button>
              
              <button
                onClick={nextSlide}
                className="absolute right-0 top-1/2 transform -translate-y-1/2 z-10 bg-white/80 hover:bg-white rounded-full p-2 shadow-lg border transition-all duration-200 hover:scale-110"
              >
                <ChevronRight className="h-3 w-3 text-primary" />
              </button>
            </div> */}

            <div className="relative px-16">
              {/* Previous Card (Slides out to left) */}
              <div 
                className={`
                  absolute top-0 left-0 z-0 w-1/3 pl-4
                  transition-all duration-${transitionMs} ease-in-out
                  ${isTransitionEnabled ? '-translate-x-full opacity-0' : 'translate-x-0 opacity-100'}
                `}
                style={{
                  transition: isTransitionEnabled ? `all ${transitionMs}ms ease-in-out` : 'none'
                }}
              >
                <a
                  // href="#"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block group transition-all duration-300"
                >
                  <Card className="pt-2 h-54 overflow-hidden border-1 border-primary/30 opacity-70">
                    <div className="relative">
                      <div className="flex flex-col items-end mr-6">
                        <img
                          src={prevCard.image || "/placeholder.svg"}
                          alt={prevCard.title}
                          className="rounded-full w-16 h-16 object-cover"
                        />
                      </div>
                      <div className="absolute top-4 left-8">
                        <Badge className="bg-transparent text-black font-bold text-xs">
                          {prevCard.name}
                        </Badge>
                        <p className="ml-4 text-xs text-black leading-relaxed">{prevCard.title}</p>
                      </div>
                    </div>
                    <CardContent className="space-y-1">
                      <p className="text-sm text-black leading-relaxed">{prevCard.description}</p>
                      <p className="text-xs italic text-black leading-relaxed text-right">{prevCard.contact}</p>
                    </CardContent>
                  </Card>
                </a>
              </div>

              {/* Main 3 Cards Grid */}
              <div className="hidden md:grid grid-cols-1 md:grid-cols-3 gap-4 relative z-10">
                {currentCards.map((testimonial, i) => (
                  <a
                    key={`${testimonial.name}-${i}-${currentIndex}`}
                    // href="#"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block group hover:shadow-lg transition-all duration-300 hover:-translate-y-1"
                  >
                    <Card className="pt-2 h-60 overflow-hidden border-1 border-primary/50 hover:border-secondary/70 transition-colors">
                      <div className="relative">
                        <div className="flex flex-col items-end mr-6">
                          <img
                            src={testimonial.image || "/placeholder.svg"}
                            alt={testimonial.title}
                            className="rounded-full w-16 h-16 object-cover"
                          />
                        </div>
                        <div className="absolute top-4 left-8">
                          <Badge className="bg-transparent text-black font-bold text-xs">
                            {testimonial.name}
                          </Badge>
                          <p className="ml-4 text-xs text-black leading-relaxed">{testimonial.title}</p>
                        </div>
                      </div>

                      <CardContent className="space-y-1">
                        <p className="text-sm text-black leading-relaxed">{testimonial.description}</p>
                        <p className="text-xs italic text-black leading-relaxed text-right mt-6">{testimonial.contact}</p>
                      </CardContent>
                    </Card>
                  </a>
                ))}
              </div>

              {/* Main 3 Cards Grid - mobile screen*/}
              <div className="md:hidden grid grid-cols-1 gap-4 relative z-10">
                {currentCards.map((testimonial, i) => (
                  <a
                    key={`${testimonial.name}-${i}-${currentIndex}`}
                    // href="#"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block group hover:shadow-lg transition-all duration-300 hover:-translate-y-1"
                  >
                    <Card className="pt-1 h-46 overflow-hidden border-1 border-primary/50 hover:border-secondary/70 transition-colors">
                      <div className="relative">
                        <div className="flex flex-col items-end mr-2">
                          <img
                            src={testimonial.image || "/placeholder.svg"}
                            alt={testimonial.title}
                            className="rounded-full w-8 h-8 object-cover"
                          />
                        </div>
                        <div className="absolute top-1.5 left-3">
                          <Badge className="text-xs bg-transparent text-black font-bold text-icon">
                            {testimonial.name}
                          </Badge>
                          <p className="ml-3 text-xs text-black leading-relaxed">{testimonial.title}</p>
                        </div>
                      </div>

                      <CardContent className="space-y-1 mb-2">
                        <p className="text-xs text-black leading-relaxed">{testimonial.description}</p>
                        <div className="absolute botom-2 left-8">
                          <p className="text-xs italic text-black leading-relaxed text-right mt-4">{testimonial.contact}</p>
                        </div>
                      </CardContent>
                    </Card>
                  </a>
                ))}
              </div>

              {/* Next Card (Slides in from right) */}
              <div 
                className={`
                  absolute top-0 right-0 z-0 w-1/3 pr-4
                  transition-all duration-${transitionMs} ease-in-out
                  ${isTransitionEnabled ? 'translate-x-full opacity-0' : 'translate-x-0 opacity-100'}
                `}
                style={{
                  transition: isTransitionEnabled ? `all ${transitionMs}ms ease-in-out` : 'none'
                }}
              >
                <a
                  // href="#"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block group transition-all duration-300"
                >
                  <Card className="pt-2 h-54 overflow-hidden border-1 border-primary/30 opacity-70">
                    <div className="relative">
                      <div className="flex flex-col items-end mr-6">
                        <img
                          src={nextCard.image || "/placeholder.svg"}
                          alt={nextCard.title}
                          className="rounded-full w-16 h-16 object-cover"
                        />
                      </div>
                      <div className="absolute top-4 left-8">
                        <Badge className="bg-transparent text-black font-bold text-xs">
                          {nextCard.name}
                        </Badge>
                        <p className="ml-4 text-xs text-black leading-relaxed">{nextCard.title}</p>
                      </div>
                    </div>

                    <CardContent className="space-y-1">
                      <p className="text-sm text-black leading-relaxed">{nextCard.description}</p>
                      <p className="text-xs italic text-black leading-relaxed text-right">{nextCard.contact}</p>
                    </CardContent>
                  </Card>
                </a>
              </div>
            </div>

            {/* Auto-play status indicator (optional - for debugging) */}
            <div className="md:hidden text-center mt-2">
              <span className="text-xs text-muted-foreground">
                {isAutoPlayPaused ? "⏸️ Auto-slide paused" : "▶️ Auto-slide running"}
              </span>
            </div> 

            {/* Slide Indicators */}
            <div className="flex justify-center mt-6 space-x-2">
              {testimonials.map((_, i) => (
                <button
                  key={i}
                  onClick={() => {
                    setIsTransitionEnabled(true)
                    setCurrentIndex(i)
                  }}
                  className={`w-2 h-2 rounded-full transition-all duration-300 ${
                    i === currentIndex ? 'bg-primary w-6' : 'bg-gray-300'
                  }`}
                />
              ))}
            </div>
          </div>
          {/* ================= End testimonial section ================= */}

        </div>
      </div>
    </section>
  )
}
