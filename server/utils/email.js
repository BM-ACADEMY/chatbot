const nodemailer = require("nodemailer");
require("dotenv").config();

const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  secure: true,
  port: 465,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

// Verify SMTP connection on startup
transporter.verify((error, success) => {
  if (error) {
    console.error("❌ Email SMTP connection FAILED:", error.message);
  } else {
    console.log("✅ Email SMTP server is ready to send messages");
  }
});

const sendEmail = async (to, subject, text, html) => {
  console.log(`📧 Attempting to send email to: ${to} | Subject: ${subject}`);
  try {
    const mailOptions = {
      from: `"ABM Connect" <${process.env.EMAIL_USER}>`,
      to,
      subject,
      text,
      html,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log("✅ Email sent successfully:", info.messageId);
    return true;
  } catch (error) {
    console.error("❌ Error sending email:", error.message);
    console.error("   Full error:", JSON.stringify(error, null, 2));
    return false;
  }
};

const sendLeadInfoEmail = async (adminEmail, leadData) => {
  // Generate a professional subject line
  const subject = `🚀 New Lead Captured: ${leadData.name || "Anonymous Lead"}`;

  // Build key-value dynamic rows for the template from the leadData map
  let extraFieldsHtml = "";
  if (leadData.leadData && leadData.leadData.size > 0) {
      for (const [key, value] of leadData.leadData.entries()) {
          const formattedKey = key.replace(/_/g, ' ');
          extraFieldsHtml += `
            <tr>
              <td style="padding: 10px; border-bottom: 1px solid #eee; font-weight: bold; color: #555; text-transform: capitalize;">${formattedKey}</td>
              <td style="padding: 10px; border-bottom: 1px solid #eee; color: #333;">${value}</td>
            </tr>
          `;
      }
  }

  // Handle uploaded documents if any
  let documentsHtml = "";
  if (leadData.documents && leadData.documents.length > 0) {
      documentsHtml = `
          <tr>
            <td style="padding: 10px; border-bottom: 1px solid #eee; font-weight: bold; color: #555; vertical-align: top;">Documents</td>
            <td style="padding: 10px; border-bottom: 1px solid #eee; color: #333;">
              <ul style="margin: 0; padding-left: 20px;">
                ${leadData.documents.map(doc => `<li><a href="${doc.url}" style="color: #4CAF50;">${doc.name || 'Document'}</a> (${doc.type})</li>`).join('')}
              </ul>
            </td>
          </tr>
      `;
  }

  const htmlContent = `
    <div style="max-width: 600px; margin: auto; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; border: 1px solid #e0e0e0; border-radius: 12px; overflow: hidden; background-color: #ffffff;">
      
      <!-- Header -->
      <div style="background-color: #4CAF50; padding: 25px; text-align: center;">
        <h2 style="color: #ffffff; margin: 0; font-size: 24px; letter-spacing: 1px;">New Lead Captured</h2>
        <p style="color: #e8f5e9; margin: 5px 0 0 0; font-size: 14px;">A conversation has been completed or marked as pending review.</p>
      </div>

      <!-- Lead Details -->
      <div style="padding: 30px;">
        <h3 style="margin-top: 0; color: #333; font-size: 18px; border-bottom: 2px solid #4CAF50; padding-bottom: 10px; display: inline-block;">Contact Details</h3>
        
        <table style="width: 100%; border-collapse: collapse; margin-top: 15px; font-size: 15px;">
          <tr>
            <td style="padding: 10px; border-bottom: 1px solid #eee; font-weight: bold; color: #555; width: 35%;">Name</td>
            <td style="padding: 10px; border-bottom: 1px solid #eee; color: #333;">${leadData.name || 'N/A'}</td>
          </tr>
          <tr>
            <td style="padding: 10px; border-bottom: 1px solid #eee; font-weight: bold; color: #555;">Phone</td>
            <td style="padding: 10px; border-bottom: 1px solid #eee; color: #333;">
              ${leadData.phone ? `<a href="tel:${leadData.phone}" style="color: #4CAF50; text-decoration: none;">${leadData.phone}</a>` : 'N/A'}
            </td>
          </tr>
          <tr>
            <td style="padding: 10px; border-bottom: 1px solid #eee; font-weight: bold; color: #555;">Email</td>
            <td style="padding: 10px; border-bottom: 1px solid #eee; color: #333;">
              ${leadData.email ? `<a href="mailto:${leadData.email}" style="color: #4CAF50; text-decoration: none;">${leadData.email}</a>` : 'N/A'}
            </td>
          </tr>
          <tr>
            <td style="padding: 10px; border-bottom: 1px solid #eee; font-weight: bold; color: #555;">Location</td>
            <td style="padding: 10px; border-bottom: 1px solid #eee; color: #333;">${leadData.address || 'N/A'}</td>
          </tr>
          ${extraFieldsHtml}
          ${documentsHtml}
        </table>

        <!-- Call to Action -->
        <div style="text-align: center; margin-top: 30px;">
          <a href="${process.env.APP_URL || 'http://localhost:5173'}" style="display: inline-block; padding: 12px 25px; background-color: #4CAF50; color: #ffffff; text-decoration: none; font-size: 16px; font-weight: bold; border-radius: 8px; box-shadow: 0 4px 6px rgba(76, 175, 80, 0.2);">Go to Dashboard</a>
        </div>
      </div>

      <!-- Footer -->
      <div style="background-color: #f9f9f9; padding: 20px; text-align: center; border-top: 1px solid #e0e0e0;">
        <p style="font-size: 12px; color: #888; margin: 0;">
          This is an automated message from your ABM Connect Chatbot. Please do not reply directly to this email. For support, contact <a href="mailto:${process.env.EMAIL_USER}" style="color: #4CAF50;">${process.env.EMAIL_USER}</a>.
        </p>
      </div>
      
    </div>
  `;

  const textContent = `New Lead Captured!
Name: ${leadData.name || 'N/A'}
Phone: ${leadData.phone || 'N/A'}
Email: ${leadData.email || 'N/A'}
Location: ${leadData.address || 'N/A'}

Please log in to the dashboard to view full details.`;

  return await sendEmail(adminEmail, subject, textContent, htmlContent);
};

const sendOtpEmail = async (email, otp) => {
  const subject = "🔐 Your One-Time Password (OTP) for Verification";

  const htmlContent = `
    <div style="max-width: 600px; margin: auto; padding: 20px; font-family: Arial, sans-serif; border: 1px solid #ddd; border-radius: 8px;">

      <h2 style="color: #333; text-align: center;">Your One-Time Password (OTP)</h2>
      <p style="font-size: 16px; color: #555; text-align: center;">
        Use the OTP below to verify your email. This OTP is valid for <strong>5 minutes</strong>.
      </p>

      <div style="background: #f4f4f4; padding: 15px; text-align: center; border-radius: 5px; font-size: 22px; font-weight: bold; color: #333;">
        ${otp}
      </div>

      <p style="font-size: 14px; color: #888; text-align: center; margin-top: 20px;">
        If you didn’t request this, please ignore this email. Do not share this OTP with anyone for security reasons.
      </p>

      <hr style="margin: 20px 0; border: 0; border-top: 1px solid #ddd;">

      <p style="font-size: 12px; color: #888; text-align: center;">
        This is an automated message. Please do not reply to this email. For support, contact <a href="mailto:merchantexpo2025@gmail.com">merchantexpo2025@gmail.com</a>.
      </p>
    </div>
  `;

  return await sendEmail(email, subject, "Your OTP Code: " + otp, htmlContent);
};

module.exports = { sendEmail, sendLeadInfoEmail, sendOtpEmail };
