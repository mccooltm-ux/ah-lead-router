/**
 * Notification Client Abstraction Layer
 *
 * FIXED: Now includes a real email implementation via Resend.
 * Console logging kept as fallback for dev environments.
 *
 * Setup:
 * 1. npm install resend
 * 2. Set RESEND_API_KEY in your Vercel env vars
 * 3. Set NOTIFICATION_CHANNEL="email" (or "both" for email + console)
 * 4. Set NOTIFICATION_FROM_EMAIL="leads@yourdomain.com"
 *    (Must be a verified domain in Resend, or use onboarding@resend.dev for testing)
 */

import type {
  LeadNotificationPayload,
  DailyDigestPayload,
} from "@/lib/types";

// âââ Interface ââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââ

export interface NotificationClient {
  sendLeadAlert(payload: LeadNotificationPayload): Promise<void>;
  sendDailyDigest(payload: DailyDigestPayload): Promise<void>;
  sendStaleReminder(
    repEmail: string,
    repName: string,
    staleLeads: {
      id: string;
      name: string;
      firmName: string;
      daysSinceRouted: number;
    }[]
  ): Promise<void>;
}

// âââ Console Implementation (dev/fallback) ââââââââââââââââââââââââââââââââââââ

class ConsoleNotificationClient implements NotificationClient {
  async sendLeadAlert(payload: LeadNotificationPayload): Promise<void> {
    console.log(`\nâââ LEAD ALERT ââââââââââââââââââââââââââââââââââââ`);
    console.log(`To: ${payload.repName} <${payload.repEmail}>`);
    console.log(
      `Subject: New Lead â ${payload.lead.name} at ${payload.lead.firmName}`
    );
    console.log(`Lead Score: ${payload.lead.leadScore}`);
    console.log(
      `Account: ${payload.lead.isExistingAccount ? "EXISTING" : "New Prospect"}`
    );
    console.log(`Dashboard: ${payload.dashboardUrl}`);
    console.log(`âââââââââââââââââââââââââââââââââââââââââââââââââââ\n`);
  }

  async sendDailyDigest(payload: DailyDigestPayload): Promise<void> {
    console.log(`\nâââ DAILY DIGEST ââââââââââââââââââââââââââââââââââ`);
    console.log(`Date: ${payload.date}`);
    console.log(`Total New Leads: ${payload.totalLeads}`);
    console.log(
      `Conversion Rate: ${(payload.conversionRate * 100).toFixed(1)}%`
    );
    console.log(`Stale Leads: ${payload.staleLeads}`);
    console.log(`âââââââââââââââââââââââââââââââââââââââââââââââââââ\n`);
  }

  async sendStaleReminder(
    repEmail: string,
    repName: string,
    staleLeads: {
      id: string;
      name: string;
      firmName: string;
      daysSinceRouted: number;
    }[]
  ): Promise<void> {
    console.log(`\nâââ STALE REMINDER âââââââââââââââââââââââââââââââ`);
    console.log(`To: ${repName} <${repEmail}>`);
    console.log(`${staleLeads.length} stale lead(s)`);
    console.log(`âââââââââââââââââââââââââââââââââââââââââââââââââââ\n`);
  }
}

// âââ Resend Email Implementation ââââââââââââââââââââââââââââââââââââââââââââââ

class ResendNotificationClient implements NotificationClient {
  private apiKey: string;
  private fromEmail: string;

  constructor() {
    this.apiKey = process.env.RESEND_API_KEY || "";
    this.fromEmail =
      process.env.NOTIFICATION_FROM_EMAIL || "onboarding@resend.dev";

    if (!this.apiKey) {
      console.warn(
        "[Notifications] RESEND_API_KEY not set â emails will fail"
      );
    }
  }

  private async send(to: string, subject: string, html: string): Promise<void> {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: this.fromEmail,
        to,
        subject,
        html,
      }),
    });

    if (!res.ok) {
      const errorBody = await res.text();
      throw new Error(`Resend API error ${res.status}: ${errorBody}`);
    }
  }

  async sendLeadAlert(payload: LeadNotificationPayload): Promise<void> {
    const { lead } = payload;
    const scoreColor =
      lead.leadScore >= 75
        ? "#dc2626"
        : lead.leadScore >= 50
          ? "#ea580c"
          : lead.leadScore >= 25
            ? "#2563eb"
            : "#6b7280";

    const html = `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: #1e293b; color: white; padding: 20px 24px; border-radius: 8px 8px 0 0;">
          <h2 style="margin: 0; font-size: 18px;">New Lead Assigned</h2>
          <p style="margin: 4px 0 0; opacity: 0.8; font-size: 14px;">AH Lead Router</p>
        </div>
        <div style="border: 1px solid #e2e8f0; border-top: none; padding: 24px; border-radius: 0 0 8px 8px;">
          <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
            <tr>
              <td style="padding: 8px 0; color: #64748b; width: 140px;">Contact</td>
              <td style="padding: 8px 0; font-weight: 600;">${lead.name}${lead.title ? ` â ${lead.title}` : ""}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; color: #64748b;">Firm</td>
              <td style="padding: 8px 0; font-weight: 600;">${lead.firmName}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; color: #64748b;">Research Interest</td>
              <td style="padding: 8px 0;">${lead.researchInterest}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; color: #64748b;">Lead Score</td>
              <td style="padding: 8px 0;">
                <span style="background: ${scoreColor}; color: white; padding: 2px 10px; border-radius: 12px; font-weight: 600; font-size: 13px;">
                  ${lead.leadScore}
                </span>
              </td>
            </tr>
            <tr>
              <td style="padding: 8px 0; color: #64748b;">Account Status</td>
              <td style="padding: 8px 0; font-weight: 600;">
                ${lead.isExistingAccount ? "â¡ Existing Account" : "New Prospect"}
              </td>
            </tr>
          </table>
          <div style="margin-top: 20px;">
            <a href="${payload.dashboardUrl}" style="display: inline-block; background: #2563eb; color: white; padding: 10px 20px; border-radius: 6px; text-decoration: none; font-weight: 600; font-size: 14px;">
              View Lead Details
            </a>
          </div>
        </div>
      </div>
    `;

    await this.send(
      payload.repEmail,
      `New Lead: ${lead.name} at ${lead.firmName} (Score: ${lead.leadScore})`,
      html
    );
  }

  async sendDailyDigest(payload: DailyDigestPayload): Promise<void> {
    const leadershipEmail =
      process.env.LEADERSHIP_EMAIL || process.env.NOTIFICATION_FROM_EMAIL || "";
    if (!leadershipEmail) {
      console.warn("[Notifications] No LEADERSHIP_EMAIL set for daily digest");
      return;
    }

    const territoryRows = Object.entries(payload.leadsByTerritory)
      .map(
        ([t, c]) =>
          `<tr><td style="padding: 4px 12px; border: 1px solid #e2e8f0;">${t}</td><td style="padding: 4px 12px; border: 1px solid #e2e8f0; text-align: center;">${c}</td></tr>`
      )
      .join("");

    const html = `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 600px;">
        <h2>Daily Lead Digest â ${payload.date}</h2>
        <p><strong>New Leads:</strong> ${payload.totalLeads}</p>
        <p><strong>Conversion Rate:</strong> ${(payload.conversionRate * 100).toFixed(1)}%</p>
        <p><strong>Stale Leads:</strong> ${payload.staleLeads}</p>
        <h3>By Territory</h3>
        <table style="border-collapse: collapse; font-size: 14px;">
          <tr><th style="padding: 4px 12px; border: 1px solid #e2e8f0; background: #f8fafc;">Territory</th><th style="padding: 4px 12px; border: 1px solid #e2e8f0; background: #f8fafc;">Leads</th></tr>
          ${territoryRows}
        </table>
      </div>
    `;

    await this.send(leadershipEmail, `AH Lead Digest â ${payload.date}`, html);
  }

  async sendStaleReminder(
    repEmail: string,
    repName: string,
    staleLeads: {
      id: string;
      name: string;
      firmName: string;
      daysSinceRouted: number;
    }[]
  ): Promise<void> {
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    const leadRows = staleLeads
      .map(
        (l) =>
          `<tr>
            <td style="padding: 6px 12px; border: 1px solid #e2e8f0;"><a href="${appUrl}/leads/${l.id}">${l.name}</a></td>
            <td style="padding: 6px 12px; border: 1px solid #e2e8f0;">${l.firmName}</td>
            <td style="padding: 6px 12px; border: 1px solid #e2e8f0; text-align: center; color: #dc2626; font-weight: 600;">${l.daysSinceRouted}d</td>
          </tr>`
      )
      .join("");

    const html = `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 600px;">
        <h2>Stale Lead Reminder</h2>
        <p>Hi ${repName}, you have <strong>${staleLeads.length}</strong> lead(s) awaiting action:</p>
        <table style="border-collapse: collapse; font-size: 14px; width: 100%;">
          <tr>
            <th style="padding: 6px 12px; border: 1px solid #e2e8f0; background: #f8fafc; text-align: left;">Contact</th>
            <th style="padding: 6px 12px; border: 1px solid #e2e8f0; background: #f8fafc; text-align: left;">Firm</th>
            <th style="padding: 6px 12px; border: 1px solid #e2e8f0; background: #f8fafc;">Days</th>
          </tr>
          ${leadRows}
        </table>
      </div>
    `;

    await this.send(
      repEmail,
      `Action Required: ${staleLeads.length} stale lead(s) need attention`,
      html
    );
  }
}

// âââ Composite (send via multiple channels) âââââââââââââââââââââââââââââââââââ

class CompositeNotificationClient implements NotificationClient {
  constructor(private clients: NotificationClient[]) {}

  async sendLeadAlert(p: LeadNotificationPayload): Promise<void> {
    await Promise.allSettled(this.clients.map((c) => c.sendLeadAlert(p)));
  }

  async sendDailyDigest(p: DailyDigestPayload): Promise<void> {
    await Promise.allSettled(this.clients.map((c) => c.sendDailyDigest(p)));
  }

  async sendStaleReminder(
    repEmail: string,
    repName: string,
    staleLeads: { id: string; name: string; firmName: string; daysSinceRouted: number }[]
  ): Promise<void> {
    await Promise.allSettled(
      this.clients.map((c) => c.sendStaleReminder(repEmail, repName, staleLeads))
    );
  }
}

// âââ Factory ââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââ

let clientInstance: NotificationClient | null = null;

export function getNotificationClient(): NotificationClient {
  if (!clientInstance) {
    const channel = process.env.NOTIFICATION_CHANNEL || "console";

    switch (channel) {
      case "email":
        clientInstance = new ResendNotificationClient();
        break;
      case "both":
        clientInstance = new CompositeNotificationClient([
          new ResendNotificationClient(),
          new ConsoleNotificationClient(),
        ]);
        break;
      case "console":
      default:
        clientInstance = new ConsoleNotificationClient();
        break;
    }
  }
  return clientInstance;
}
