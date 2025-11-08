"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Menu, X } from "lucide-react"

export function Navigation() {
  const [isOpen, setIsOpen] = useState(false)
  const [isScrolled, setIsScrolled] = useState(false)

  const profilePicture = [
    {
      name: "Profile Picture",
      title: "Abel Mekonnen",
      image: "/My-Profile-Pic-2.jpg",
    },
  ]

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50)
    }
    window.addEventListener("scroll", handleScroll)
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  const home = [
    {
      title: "Home",
      link: "#",
    },
  ]

  const navItems = [
    { href: "#about", label: "About" },
    { href: "#expertise", label: "Expertise" },
    { href: "#portfolio", label: "Portfolio" },
    { href: "#services", label: "Services" },
    { href: "#contact", label: "Contact" },
  ]

  return (
    <nav
      className={`fixed top-0 w-full z-50 transition-all duration-50 ${
        isScrolled ? "bg-background/95 backdrop-blur-sm border-b border-border" : "bg-transparent"
      }`}
    >
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex flex-wrap items-center gap-6 flex-shrink-0">
            {profilePicture.map((index) => (
              <img
                src={index.image || "/placeholder.svg"}
                alt={index.title}
                className={`rounded-full w-12 h-12 object-cover ${
                  isScrolled ? "border-transparent" : "border" }`}
              />
            ))}
            
            {home.map((index) => (
              <a 
                key={index.title}
                href={index.link}
              >
                <h1 className="text-xl font-bold text-primary">ABEL MEKONNEN G.</h1> {/* Environmental Expert */}
              </a>
            ))}
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:block">
            <div className={`ml-10 flex items-baseline space-x-4 ${
        isScrolled ? "border-transparent" : "border-b" }`}>
              {navItems.map((item) => (
                <a
                  key={item.href}
                  href={item.href}
                  className="text-foreground hover:text-primary px-3 py-2 rounded-md text-sm font-medium transition-colors duration-200"
                >
                  {item.label}
                </a>
              ))}
            </div>
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden">
            <Button variant="ghost" size="sm" onClick={() => setIsOpen(!isOpen)} aria-label="Toggle menu">
              {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </Button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isOpen && (
          <div className="md:hidden">
            <div className={`px-2 pt-2 pb-3 space-y-1 sm:px-3 bg-background border-border border-b w-32 ml-120 ${
        isScrolled ? setIsOpen(!isOpen) : "" }`}>
              {navItems.map((item) => (
                <a
                  key={item.href}
                  href={item.href}
                  className="text-foreground hover:text-primary block px-3 py-2 rounded-md text-base font-medium transition-colors duration-200"
                  onClick={() => setIsOpen(false)}
                >
                  {item.label}
                </a>
              ))}
            </div>
          </div>
        )}
      </div>
    </nav>
  )
}
