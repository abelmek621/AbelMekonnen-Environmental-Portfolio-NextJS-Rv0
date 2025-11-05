"use server"

import { Resend } from "resend"

const resend = new Resend(process.env.RESEND_API_KEY)

export async function sendEmail(formData: {
  name: string
  email: string
  subject: string
  message: string
}) {
  try {
    console.log("[v0] Starting email send process")
    console.log("[v0] API Key exists:", !!process.env.RESEND_API_KEY)

    if (!process.env.RESEND_API_KEY) {
      throw new Error("RESEND_API_KEY is not configured")
    }

    const { data, error } = await resend.emails.send({
      from: "Portfolio Contact <onboarding@resend.dev>",
      to: "mekonnengebretsadikabel@gmail.com",
      replyTo: formData.email,
      subject: `Portfolio Contact: ${formData.subject}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #006e46;">New Contact Form Submission</h2>
          <div style="background-color: #f7f7f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <p><strong>Name:</strong> ${formData.name}</p>
            <p><strong>Email:</strong> ${formData.email}</p>
            <p><strong>Subject:</strong> ${formData.subject}</p>
          </div>
          <div style="margin: 20px 0;">
            <h3 style="color: #006e46;">Message:</h3>
            <p style="line-height: 1.6;">${formData.message.replace(/\n/g, "<br>")}</p>
          </div>
          <hr style="border: none; border-top: 1px solid #e0e0e0; margin: 20px 0;">
          <p style="color: #666; font-size: 12px;">
            This email was sent from your portfolio website contact form.
          </p>
        </div>
      `,
    })

    if (error) {
      console.log("[v0] Resend API error:", error.message)
      throw new Error(error.message)
    }

    console.log("[v0] Email sent successfully:", data?.id)
    return { success: true, message: "Email sent successfully!" }
  } catch (error) {
    console.log("[v0] Error in sendEmail:", error)
    return {
      success: false,
      message: error instanceof Error ? error.message : "Failed to send email",
    }
  }
}
