"use client"

import type React from "react"
import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Mail, Phone, MapPin, Send, Linkedin, CheckCircle, AlertCircle } from "lucide-react"
import { sendEmail } from "@/app/actions/send-email"

/**
 * NOTE:
 * - This uses FormSubmit (https://formsubmit.co).
 * - Replace the recipient email below if you want to forward to a different address.
 */
const FORMSUBMIT_ENDPOINT = "https://formsubmit.co/mekonnengebretsadikabel@gmail.com";

export function ContactSection() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    company: "",
    message: "",
    _honey: "", // honeypot for FormSubmit
  })
  const [isLoading, setIsLoading] = useState(false)
  const [submitStatus, setSubmitStatus] = useState<{
    type: "success" | "error" | null
    message: string
  }>({ type: null, message: "" })

  const validateEmail = (email: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setSubmitStatus({ type: null, message: "" })

    // If honeypot filled, treat as spam
    if (formData._honey) {
      setSubmitStatus({ type: "error", message: "Spam detected." });
      return;
    }

    setIsLoading(true);

    try {
      // Build FormData exactly as a normal form would
      const payload = new FormData();
      payload.append("name", formData.name);
      payload.append("email", formData.email);
      payload.append("company", formData.company);
      payload.append("message", formData.message);

      // Optional FormSubmit control fields:
      payload.append("_subject", `Portfolio Contact: ${formData.name}${formData.company ? ` — ${formData.company}` : ""}`);
      payload.append("_replyto", formData.email); // sets reply-to for forwarded email
      payload.append("_honey", formData._honey); // honeypot
      // You can set template to "table" or "plain" (FormSubmit support)
      payload.append("_template", "table");

      const res = await fetch(FORMSUBMIT_ENDPOINT, {
        method: "POST",
        body: payload,
        // Do not set Content-Type; browser will set multipart/form-data with boundary
      });

      // FormSubmit will normally redirect when submitted from a real form,
      // but when using fetch it responds with a status.
      if (res.ok) {
        setSubmitStatus({
          type: "success",
          message: "Thank you! Your message has been sent.",
        });
        setFormData({ name: "", email: "", company: "", message: "", _honey: "" });
      } else {
        // Non-200 — show friendly message
        const text = await res.text();
        setSubmitStatus({
          type: "error",
          message: `Failed to send message. (${res.status}) ${text || ""}`,
        });
      }
    } catch (err) {
      setSubmitStatus({
        type: "error",
        message: "An unexpected error occurred. Please try emailing directly.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const contactInfo = [
    {
      icon: Mail,
      title: "Email",
      value: "mekonnengebretsadikabel@gmail.com",
      href: "mailto:mekonnengebretsadikabel@gmail.com",
    },
    {
      icon: Phone,
      title: "Phone",
      value: "+251 983 342 060",
      href: "tel:+251983342060",
    },
    {
      icon: Linkedin,
      title: "LinkedIn",
      value: "Connect on LinkedIn",
      href: "https://www.linkedin.com/in/abel-mekonnen-055a93147",
    },
    {
      icon: MapPin,
      title: "Location",
      value: "Available Worldwide",
      href: "Addis Ababa, Ethiopia",
    },
  ];

  return (
    <section id="contact" className="py-20 bg-muted/30">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-balance mb-4">Get In Touch</h2>
            <p className="text-lg text-muted-foreground text-pretty max-w-2xl mx-auto">
              Ready to discuss your environmental consultancy needs? Let's connect and explore how I can help your
              project succeed.
            </p>
          </div>

          <div className="grid lg:grid-cols-2 gap-12">
            {/* Contact Information */}
            <div className="space-y-8">
              <div>
                <h3 className="text-2xl font-semibold mb-6">Let's Collaborate</h3>
                <p className="text-muted-foreground leading-relaxed mb-8">
                  I'm available for environmental consultancy projects worldwide. Whether you need expertise in
                  hydrology, air quality assessment, or GIS analysis, I'm here to provide professional solutions
                  tailored to your specific requirements.
                </p>
              </div>

              <div className="space-y-4">
                {contactInfo.map((info, index) => {
                  const IconComponent = info.icon
                  return (
                    <div key={index} className="flex items-center gap-4">
                      <div className="p-3 bg-primary/10 rounded-lg">
                        <IconComponent className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <h4 className="font-medium">{info.title}</h4>
                        {info.href ? (
                          <a
                            href={info.href}
                            className="text-muted-foreground hover:text-primary transition-colors"
                            {...(info.icon === Linkedin && { target: "_blank", rel: "noopener noreferrer" })}
                          >
                            {info.value}
                          </a>
                        ) : (
                          <p className="text-muted-foreground">{info.value}</p>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Contact Form */}
            <Card>
              <CardHeader>
                <CardTitle>Send a Message</CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Input
                        name="name"
                        placeholder="Your Name"
                        value={formData.name}
                        onChange={handleChange}
                        required
                        disabled={isLoading}
                      />
                    </div>
                    <div>
                      <Input
                        name="email"
                        type="email"
                        placeholder="Your Email"
                        value={formData.email}
                        onChange={handleChange}
                        required
                        disabled={isLoading}
                      />
                    </div>
                  </div>
                  <div>
                    <Input
                      name="company"
                      placeholder="Company/Organization"
                      value={formData.company}
                      onChange={handleChange}
                      disabled={isLoading}
                    />
                  </div>

                  {/* HONEYPOT - hidden from users, traps bots (FormSubmit expects a hidden honeypot field like _honey) */}
                  <div style={{ display: "none" }}>
                    <label htmlFor="_honey">Leave this field empty</label>
                    <input
                      id="_honey"
                      name="_honey"
                      value={formData._honey}
                      onChange={handleChange}
                      autoComplete="off"
                      tabIndex={-1}
                    />
                  </div>

                  <div>
                    <Textarea
                      name="message"
                      placeholder="Tell me about your project requirements..."
                      rows={5}
                      value={formData.message}
                      onChange={handleChange}
                      required
                      disabled={isLoading}
                    />
                  </div>

                  {submitStatus.type && (
                    <div
                      className={`flex items-start gap-2 p-4 rounded-lg ${
                        submitStatus.type === "success"
                          ? "bg-emerald-50 dark:bg-emerald-950/30 text-emerald-800 dark:text-emerald-200"
                          : "bg-red-50 dark:bg-red-950/30 text-red-800 dark:text-red-200"
                      }`}
                    >
                      {submitStatus.type === "success" ? (
                        <CheckCircle className="h-5 w-5 flex-shrink-0 mt-0.5" />
                      ) : (
                        <AlertCircle className="h-5 w-5 flex-shrink-0 mt-0.5" />
                      )}
                      <p className="text-sm leading-relaxed">{submitStatus.message}</p>
                    </div>
                  )}

                  <Button type="submit" className="w-full" disabled={isLoading}>
                    {isLoading ? (
                      <>
                        <span className="mr-2">Sending...</span>
                      </>
                    ) : (
                      <>
                        <Send className="mr-2 h-4 w-4" />
                        Send Message
                      </>
                    )}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </section>
  )
}
