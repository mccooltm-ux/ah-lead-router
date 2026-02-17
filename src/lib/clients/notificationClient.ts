/**
 * Notification Client Abstraction Layer
 *
 * Handles sending alerts to sales reps and daily digests to leadership.
 * Currently logs to console. Plug in email/Slack providers as needed.
 *
 * TO CONNECT EMAIL:
 * 1. Implement EmailNotificationClient using SendGrid, Resend, or similar
 * 2. Set NOTIFICATION_CHANNEL="email" and configure provider env vars
 *
 * TO CONNECT SLACK:
 * 1. Implement SlackNotificationClient with Slack webhook URL
 * 2. Set NOTIFICATION_CHANNEL="slack" or "both"
 */

import type { LeadNotificationPayload, DailyDigestPayload } from "@/lib/types";

// ─── Interface ───────────────────────────────────────────────────────────────

export interface NotificationClient {
  /** Send a lead assignment alert to a sales rep */
  sendLeadAlert(payload: LeadNotificationPayload): Promise<void>;

  /** Send the daily summary digest to sales leadership */
  sendDailyDigest(payload: DailyDigestPayload): Promise<void>;

  /** Send a stale lead reminder to a sales rep */
  sendStaleReminder(repEmail: string, repName: string, staleLeads: { id: string; name: string; firmName: string; daysSinceRouted: number }[]): Promise<void>;
}

// ─── Console/Mock Implementation ─────────────────────────────────────────────

class ConsoleNotificationClient implements NotificationClient {
  async sendLeadAlert(payload: LeadNotificationPayload): Promise<void> {
    console.log(`\n━━━ LEAD ALERT ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
    console.log(`To: ${payload.repName} <${payload.repEmail}>`);
    console.log(`Subject: New Lead Assigned — ${payload.lead.name} at ${payload.lead.firmName}`);
    console.log(`──────────────────────────────────────────────────────`);
    console.log(`Contact: ${payload.lead.name}${payload.lead.title ? ` (${payload.lead.title})` : ""}`);
    console.log(`Firm: ${payload.lead.firmName}`);
    console.log(`Research: ${payload.lead.researchInterest}`);
    console.log(`Lead Score: ${payload.lead.leadScore}`);
    console.log(`Account Status: ${payload.lead.isExistingAccount ? "⚡ EXISTING ACCOUNT" : "New Prospect"}`);
    console.log(`Dashboard: ${payload.dashboardUrl}`);
    console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`);
  }

  async sendDailyDigest(payload: DailyDigestPayload): Promise<void> {
    console.log(`\n━━━ DAILY DIGEST ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
    console.log(`Date: ${payload.date}`);
    console.log(`Total New Leads: ${payload.totalLeads}`);
    console.log(`Conversion Rate: ${(payload.conversionRate * 100).toFixed(1)}%`);
    console.log(`Stale Leads: ${payload.staleLeads}`);
    console.log(`By Territory:`, payload.leadsByTerritory);
    console.log(`By Brand:`, payload.leadsByBrand);
    console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`);
  }

  async sendStaleReminder(
    repEmail: string,
    repName: string,
    staleLeads: { id: string; name: string; firmName: string; daysSinceRouted: number }[]
  ): Promise<void> {
    console.log(`\n━━━ STALE LEAD REMINDER ━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
    console.log(`To: ${repName} <${repEmail}>`);
    console.log(`You have ${staleLeads.length} lead(s) awaiting action:`);
    for (const lead of staleLeads) {
      console.log(`  • ${lead.name} at ${lead.firmName} — ${lead.daysSinceRouted} days since routed`);
    }
    console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`);
  }
}

// ─── Factory ─────────────────────────────────────────────────────────────────

let clientInstance: NotificationClient | null = null;

export function getNotificationClient(): NotificationClient {
  if (!clientInstance) {
    const channel = process.env.NOTIFICATION_CHANNEL || "email";
    // TODO: Implement real email/Slack clients
    // if (channel === "email") clientInstance = new EmailNotificationClient();
    // if (channel === "slack") clientInstance = new SlackNotificationClient();
    // if (channel === "both") clientInstance = new CompositeNotificationClient([email, slack]);
    void channel;
    clientInstance = new ConsoleNotificationClient();
  }
  return clientInstance;
}
