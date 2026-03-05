'use strict';

const { base } = require('./base');

const FRONTEND_URL = process.env.FRONTEND_URL || 'https://dms.worldvisagroup.com';

function render(data) {
  const { recipientName, checklistCount, leadId } = data;
  const portalUrl = leadId
    ? `${FRONTEND_URL}/applications/${leadId}`
    : `${FRONTEND_URL}/applications`;

  const firstName = (recipientName || 'Applicant').split(' ')[0];
  const countText = checklistCount ? `${checklistCount} document${checklistCount !== 1 ? 's' : ''}` : 'documents';

  const content = `
    <p style="margin:0 0 4px 0;font-size:11px;font-weight:700;letter-spacing:1px;color:#555555;text-transform:uppercase;">New Checklist</p>
    <h1 style="margin:0 0 24px 0;font-size:22px;font-weight:700;color:#000000;line-height:1.3;">Your Document Checklist is Ready</h1>

    <p style="margin:0 0 20px 0;font-size:15px;color:#111111;line-height:1.6;">
      Hi ${firstName},
    </p>

    <p style="margin:0 0 20px 0;font-size:15px;color:#111111;line-height:1.6;">
      Your document checklist has been prepared by the WorldVisa team. Kindly submit all the required documents by logging in to your portal and uploading them to keep your application on track.
    </p>

    <!-- Info block -->
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="margin-bottom:28px;">
      <tr>
        <td style="padding:16px 20px;border:1px solid #e0e0e0;border-left:3px solid #000000;background-color:#f7f7f7;">
          <p style="margin:0 0 4px 0;font-size:11px;font-weight:700;letter-spacing:0.8px;text-transform:uppercase;color:#555555;">Documents Required</p>
          <p style="margin:0;font-size:22px;font-weight:700;color:#000000;">${checklistCount ? checklistCount : '—'}</p>
        </td>
      </tr>
    </table>

    <p style="margin:0 0 28px 0;font-size:14px;color:#555555;line-height:1.6;">
      Please log in to your portal to view the full checklist and start uploading the required ${countText}.
    </p>

    <!-- CTA -->
    <table role="presentation" cellspacing="0" cellpadding="0" border="0" style="margin-bottom:28px;">
      <tr>
        <td style="background-color:#000000;">
          <a href="${portalUrl}" target="_blank" style="display:inline-block;padding:13px 28px;font-size:14px;font-weight:700;color:#ffffff;text-decoration:none;letter-spacing:0.3px;">
            View Checklist
          </a>
        </td>
      </tr>
    </table>

    <p style="margin:0;font-size:14px;color:#555555;line-height:1.6;">
      If you have any questions about the required documents, please contact your visa consultant.
    </p>
  `;

  return {
    html: base(content, { previewText: `Your document checklist is ready. Kindly submit all the required ${countText}.` }),
    subject: 'Your Document Checklist is Ready',
  };
}

module.exports = { render };
