"use client"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Menu, X } from "lucide-react"

export function Navigation() {
  const [isOpen, setIsOpen] = useState(false)
  const [isScrolled, setIsScrolled] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  const profilePicture = [
    {
      name: "Profile Picture",
      title: "Abel Mekonnen",
      image: "/images/expert-pics/My-Profile-Pic-2.webp",
    },
  ]

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50)
      // Close menu on scroll
      if (isOpen) {
        setIsOpen(false)
      }
    }

    const handleClickOutside = (event: MouseEvent) => {
      // Close menu if clicked outside
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    window.addEventListener("scroll", handleScroll)
    document.addEventListener("mousedown", handleClickOutside)

    return () => {
      window.removeEventListener("scroll", handleScroll)
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [isOpen])

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
      className={`fixed top-0 w-full z-50 transition-all duration-50 bg-transparent ${
        isScrolled ? "bg-background/95 backdrop-blur-sm border-b border-border" : "bg-transparent"
      }`}
    >
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="hidden md:flex flex-wrap items-center gap-6 flex-shrink-0">
            {profilePicture.map((profile) => (
              <div key={profile.name}>
                <img
                  src={profile.image || "/placeholder.svg"}
                  alt={profile.title}
                  className={`rounded-full w-12 h-12 object-cover ${
                    isScrolled ? "border-transparent" : "border" }`}
                />
              </div>
            ))}
            
            {home.map((item) => (
              <a 
                key={item.title}
                href={item.link}
              >
                <h1 className="text-xl font-bold text-primary">ABEL MEKONNEN G.</h1> {/* Environmental Expert */}
              </a>
            ))}
          </div>
          {/* name & profile picture for mobile screens */}
          <div className="md:hidden flex flex-wrap items-center gap-5 flex-shrink-0">
            {profilePicture.map((profile) => (
              <div key={profile.name}>
                <img
                  src={profile.image || "/placeholder.svg"}
                  alt={profile.title}
                  className={`rounded-full w-10 h-10 object-cover ${
                    isScrolled ? "border-transparent" : "border" }`}
                />
              </div>
            ))}
            
            {home.map((item) => (
              <a 
                key={item.title}
                href={item.link}
              >
                <h1 className="text-lg font-bold text-primary">ABEL MEKONNEN G.</h1> {/* Environmental Expert */}
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

          {/* Enhanced Mobile menu button */}
          <div className="md:hidden">
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={() => setIsOpen(!isOpen)} 
              aria-label="Toggle menu"
            >
                {isOpen ? (
                  <X className="w-6 h-6" />
                ) : (
                  <Menu className="w-6 h-6" />
                )}
            </Button>
          </div>
        </div>

        {/* Enhanced Mobile Navigation */}
        {isOpen && (
          <div className="md:hidden">
            <div className="px-1 pt-1 pb-1 space-y-1 sm:px-1 bg-background w-24 ml-78">
                {navItems.map((item) => (
                  <a
                    key={item.href}
                    href={item.href}
                    className="
                      text-foreground 
                      hover:text-primary
                      block
                      px-2
                      py-1
                      rounded-md
                      text-base 
                      font-medium 
                      transition-colors
                      duration-200
                      text-sm"
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
