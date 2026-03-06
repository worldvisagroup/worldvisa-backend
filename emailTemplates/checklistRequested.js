'use strict';

const { base } = require('./base');

const FRONTEND_URL = process.env.FRONTEND_URL || 'https://dms.worldvisagroup.com';

function escHtml(str) {
  return String(str ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function render({ recipientName, clientName, leadId }) {
  const portalUrl = leadId
    ? `${FRONTEND_URL}/v2/applications/${leadId}`
    : `${FRONTEND_URL}/v2/applications`;

  const firstName = (recipientName || 'Team').split(' ')[0];
  const resolvedClientName = clientName || 'Your client';

  const content = `
    <p style="margin:0 0 4px 0;font-size:11px;font-weight:700;letter-spacing:1px;color:#555555;text-transform:uppercase;">Checklist Request</p>
    <h1 style="margin:0 0 24px 0;font-size:22px;font-weight:700;color:#000000;line-height:1.3;">Checklist Requested by ${escHtml(resolvedClientName)}</h1>

    <p style="margin:0 0 20px 0;font-size:15px;color:#111111;line-height:1.6;">
      Hi ${escHtml(firstName)},
    </p>

    <p style="margin:0 0 20px 0;font-size:15px;color:#111111;line-height:1.6;">
      <strong>${escHtml(resolvedClientName)}</strong> has requested their document checklist for their visa application.
      Please review and prepare the required checklist at your earliest convenience.
    </p>

    <!-- Info block -->
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="margin-bottom:28px;">
      <tr>
        <td style="padding:16px 20px;border:1px solid #e0e0e0;border-left:3px solid #000000;background-color:#f7f7f7;">
          <p style="margin:0 0 4px 0;font-size:11px;font-weight:700;letter-spacing:0.8px;text-transform:uppercase;color:#555555;">Client</p>
          <p style="margin:0;font-size:18px;font-weight:700;color:#000000;">${escHtml(resolvedClientName)}</p>
        </td>
      </tr>
    </table>

    <!-- CTA -->
    <table role="presentation" cellspacing="0" cellpadding="0" border="0" style="margin-bottom:28px;">
      <tr>
        <td style="background-color:#000000;">
          <a href="${portalUrl}" target="_blank" style="display:inline-block;padding:13px 28px;font-size:14px;font-weight:700;color:#ffffff;text-decoration:none;letter-spacing:0.3px;">
            View Application
          </a>
        </td>
      </tr>
    </table>

    <p style="margin:0;font-size:14px;color:#555555;line-height:1.6;">
      Please log in to the portal to prepare and assign the checklist to this client.
    </p>
  `;

  return {
    html: base(content, { previewText: `${resolvedClientName} has requested their document checklist.` }),
    subject: `Checklist Requested \u2014 ${resolvedClientName}`,
  };
}

module.exports = { render };
