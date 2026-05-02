import { encodeUnsubscribeToken } from "./unsubscribe-token";

type FooterWorkspace = {
  name: string;
  postalAddress: string | null;
};

type FooterContact = {
  id: string;
  email: string;
};

export function buildComplianceFooter(
  workspace: FooterWorkspace,
  contact: FooterContact,
  deliveryId: string,
): string {
  const appUrl = process.env.APP_URL ?? "http://localhost:3000";
  const secret = process.env.JWT_SECRET ?? "";
  const campaignId = deliveryId.split(":")[0] ?? "";
  const token = encodeUnsubscribeToken(
    {
      contactId: contact.id,
      campaignId,
      deliveryId,
    },
    secret,
  );
  const unsubscribeUrl = `${appUrl}/unsubscribe/${token}`;
  const postalAddress = workspace.postalAddress?.trim() || "Postal address required";
  return [
    "<hr style=\"margin-top:24px;border:none;border-top:1px solid #e4ddd4\"/>",
    `<p style="font-size:12px;line-height:1.6;color:#7c6f63;margin-top:12px;">`,
    `You are receiving this email from ${escapeHtml(workspace.name)}.`,
    "<br/>",
    escapeHtml(postalAddress),
    "<br/>",
    `<a href="${unsubscribeUrl}" style="color:#7c6f63;text-decoration:underline;">Unsubscribe</a>`,
    "</p>",
  ].join("");
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}
