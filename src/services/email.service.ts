export class EmailService {
    private static RESEND_KEY = process.env.RESEND_API_KEY;

    /**
     * Dispatches an email using the Resend API directly.
     * Generous free tier (3,000 emails/mo).
     */
    static async send(to: string, subject: string, html: string) {
        if (!this.RESEND_KEY) {
            console.warn("⚠️ RESEND_API_KEY is missing. Email will be logged to console instead.");
            console.log(`\n📧 [EMAIL DISPATCH]\nTo: ${to}\nSubject: ${subject}\nBody: ${html}\n`);
            return { success: true, simulated: true };
        }

        try {
            const res = await fetch("https://api.resend.com/emails", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${this.RESEND_KEY}`
                },
                body: JSON.stringify({
                    from: "Inquisia Platform <onboarding@resend.dev>", // Uses Resend test domain by default
                    to,
                    subject,
                    html
                })
            });

            if (!res.ok) {
                const errorData = await res.json();
                console.error("Resend API Error:", errorData);
                throw new Error(`Failed to send email: ${errorData.message}`);
            }

            return { success: true };
        } catch (error) {
            console.error("Email service execution failed:", error);
            throw error;
        }
    }

    /**
     * High-level method to send a registration OTP
     */
    static async sendOTP(to: string, name: string, otp: string) {
        const subject = "Verify your Inquisia account";
        const html = `
            <div style="font-family: sans-serif; max-w: 600px; margin: 0 auto; padding: 20px;">
                <h2 style="color: #111827;">Welcome to Inquisia!</h2>
                <p style="color: #4b5563;">Hello ${name},</p>
                <p style="color: #4b5563;">Thank you for registering. Please use the 6-digit verification code below to activate your account:</p>
                
                <div style="background-color: #f3f4f6; padding: 20px; border-radius: 12px; text-align: center; margin: 30px 0;">
                    <span style="font-size: 32px; font-weight: 900; letter-spacing: 8px; color: #2563eb;">${otp}</span>
                </div>
                
                <p style="color: #6b7280; font-size: 14px;">This code will expire in 15 minutes.</p>
                <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;" />
                <p style="color: #9ca3af; font-size: 12px;">If you did not request this email, please ignore it.</p>
            </div>
        `;

        return this.send(to, subject, html);
    }
}
