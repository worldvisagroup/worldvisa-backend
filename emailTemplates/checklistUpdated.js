'use strict';

const { base } = require('./base');

const FRONTEND_URL = process.env.FRONTEND_URL || 'https://dms.worldvisagroup.com';

function render(data) {
  const { recipientName, leadId } = data;
  const portalUrl = leadId
    ? `${FRONTEND_URL}/applications/${leadId}`
    : `${FRONTEND_URL}/applications`;

  const firstName = (recipientName || 'Applicant').split(' ')[0];

  const content = `
    <p style="margin:0 0 4px 0;font-size:11px;font-weight:700;letter-spacing:1px;color:#555555;text-transform:uppercase;">Checklist Updated</p>
    <h1 style="margin:0 0 24px 0;font-size:22px;font-weight:700;color:#000000;line-height:1.3;">Your Document Checklist Has Been Updated</h1>

    <p style="margin:0 0 20px 0;font-size:15px;color:#111111;line-height:1.6;">
      Hi ${firstName},
    </p>

    <p style="margin:0 0 20px 0;font-size:15px;color:#111111;line-height:1.6;">
      Your document checklist has been updated by the WorldVisa team. Please log in to your portal to review the latest requirements and submit any outstanding documents.
    </p>

    <p style="margin:0 0 28px 0;font-size:15px;color:#111111;line-height:1.6;">
      Staying on top of your documents helps keep your application moving forward smoothly — we appreciate your prompt attention.
    </p>

    <!-- CTA -->
    <table role="presentation" cellspacing="0" cellpadding="0" border="0" style="margin-bottom:28px;">
      <tr>
        <td style="background-color:#000000;">
          <a href="${portalUrl}" target="_blank" style="display:inline-block;padding:13px 28px;font-size:14px;font-weight:700;color:#ffffff;text-decoration:none;letter-spacing:0.3px;">
            View Updated Checklist
          </a>
        </td>
      </tr>
    </table>

    <p style="margin:0;font-size:14px;color:#555555;line-height:1.6;">
      If you have any questions about the changes, please reach out to your visa consultant — we're happy to help.
    </p>
  `;

  return {
    html: base(content, { previewText: 'Your document checklist has been updated — log in to review the latest requirements.' }),
    subject: 'Your Document Checklist Has Been Updated',
  };
}

module.exports = { render };
