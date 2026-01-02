import { Resend } from "resend";

// Singleton Resend client
let resendClient: Resend | null = null;

function getResendClient(): Resend {
  if (!resendClient) {
    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) {
      throw new Error("Missing RESEND_API_KEY environment variable");
    }
    resendClient = new Resend(apiKey);
  }
  return resendClient;
}

// Email sender configuration
const FROM_EMAIL = "Luna HR <noreply@luna-hr.com>";

export interface EmailOptions {
  to: string | string[];
  subject: string;
  html: string;
  text?: string;
}

/**
 * Send an email using Resend
 */
export async function sendEmail(options: EmailOptions): Promise<{ id: string }> {
  const resend = getResendClient();

  const { data, error } = await resend.emails.send({
    from: FROM_EMAIL,
    to: options.to,
    subject: options.subject,
    html: options.html,
    text: options.text,
  });

  if (error) {
    throw new Error(`Failed to send email: ${error.message}`);
  }

  return { id: data!.id };
}

// Email templates

/**
 * Send application submitted notification to manager
 */
export async function sendApplicationSubmittedEmail(params: {
  managerEmail: string;
  managerName: string;
  employeeName: string;
  applicationId: string;
  startDate: string;
  endDate: string;
  reasonName: string;
  organisationAlias: string;
}): Promise<void> {
  const {
    managerEmail,
    managerName,
    employeeName,
    applicationId,
    startDate,
    endDate,
    reasonName,
    organisationAlias,
  } = params;

  const dashboardUrl = `${process.env.NEXT_PUBLIC_APP_URL}/${organisationAlias}`;

  await sendEmail({
    to: managerEmail,
    subject: `[Luna HR] Novi zahtjev za odobrenje - ${employeeName}`,
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>Pozdrav ${managerName},</h2>
        <p>Zaposlenik <strong>${employeeName}</strong> je podnio zahtjev za ${reasonName}.</p>
        <table style="border-collapse: collapse; margin: 20px 0;">
          <tr>
            <td style="padding: 8px; border: 1px solid #ddd;"><strong>Datum od:</strong></td>
            <td style="padding: 8px; border: 1px solid #ddd;">${startDate}</td>
          </tr>
          <tr>
            <td style="padding: 8px; border: 1px solid #ddd;"><strong>Datum do:</strong></td>
            <td style="padding: 8px; border: 1px solid #ddd;">${endDate}</td>
          </tr>
          <tr>
            <td style="padding: 8px; border: 1px solid #ddd;"><strong>Razlog:</strong></td>
            <td style="padding: 8px; border: 1px solid #ddd;">${reasonName}</td>
          </tr>
        </table>
        <p>
          <a href="${dashboardUrl}" style="background-color: #0070f3; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
            Pogledaj zahtjev
          </a>
        </p>
        <p style="color: #666; font-size: 14px; margin-top: 30px;">
          Ovaj email je automatski generiran od strane Luna HR sustava.
        </p>
      </div>
    `,
    text: `Pozdrav ${managerName},\n\nZaposlenik ${employeeName} je podnio zahtjev za ${reasonName}.\n\nDatum od: ${startDate}\nDatum do: ${endDate}\n\nPogledaj zahtjev: ${dashboardUrl}`,
  });
}

/**
 * Send application status update notification to employee
 */
export async function sendApplicationStatusEmail(params: {
  employeeEmail: string;
  employeeName: string;
  status: "APPROVED" | "REJECTED";
  startDate: string;
  endDate: string;
  reasonName: string;
  organisationAlias: string;
}): Promise<void> {
  const {
    employeeEmail,
    employeeName,
    status,
    startDate,
    endDate,
    reasonName,
    organisationAlias,
  } = params;

  const statusText = status === "APPROVED" ? "odobren" : "odbijen";
  const statusColor = status === "APPROVED" ? "#22c55e" : "#ef4444";
  const dashboardUrl = `${process.env.NEXT_PUBLIC_APP_URL}/${organisationAlias}`;

  await sendEmail({
    to: employeeEmail,
    subject: `[Luna HR] Vaš zahtjev je ${statusText}`,
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>Pozdrav ${employeeName},</h2>
        <p>Vaš zahtjev za <strong>${reasonName}</strong> je 
          <span style="color: ${statusColor}; font-weight: bold;">${statusText}</span>.
        </p>
        <table style="border-collapse: collapse; margin: 20px 0;">
          <tr>
            <td style="padding: 8px; border: 1px solid #ddd;"><strong>Datum od:</strong></td>
            <td style="padding: 8px; border: 1px solid #ddd;">${startDate}</td>
          </tr>
          <tr>
            <td style="padding: 8px; border: 1px solid #ddd;"><strong>Datum do:</strong></td>
            <td style="padding: 8px; border: 1px solid #ddd;">${endDate}</td>
          </tr>
        </table>
        <p>
          <a href="${dashboardUrl}" style="background-color: #0070f3; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
            Pogledaj dashboard
          </a>
        </p>
        <p style="color: #666; font-size: 14px; margin-top: 30px;">
          Ovaj email je automatski generiran od strane Luna HR sustava.
        </p>
      </div>
    `,
    text: `Pozdrav ${employeeName},\n\nVaš zahtjev za ${reasonName} je ${statusText}.\n\nDatum od: ${startDate}\nDatum do: ${endDate}\n\nPogledaj dashboard: ${dashboardUrl}`,
  });
}

