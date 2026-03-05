'use strict';

const { base } = require('./base');

const FRONTEND_URL = process.env.FRONTEND_URL || 'https://dms.worldvisagroup.com';


function render(data) {
  const { recipientName, documentName, rejectReason, reviewedBy, leadId } = data;
  const portalUrl = leadId
    ? `${FRONTEND_URL}/applications/${leadId}`
    : `${FRONTEND_URL}/applications`;

  const firstName = (recipientName || 'Applicant').split(' ')[0];

  const content = `
    <p style="margin:0 0 4px 0;font-size:11px;font-weight:700;letter-spacing:1px;color:#555555;text-transform:uppercase;">Action Required</p>
    <h1 style="margin:0 0 24px 0;font-size:22px;font-weight:700;color:#000000;line-height:1.3;">Document Rejected</h1>

    <p style="margin:0 0 20px 0;font-size:15px;color:#111111;line-height:1.6;">
      Hi ${firstName},
    </p>

    <p style="margin:0 0 20px 0;font-size:15px;color:#111111;line-height:1.6;">
      Your document has been reviewed and requires correction. Please re-upload the corrected document at the earliest to avoid delays in your application.
    </p>

    <!-- Document detail block -->
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="margin-bottom:24px;">
      <tr>
        <td style="padding:16px 20px;border:1px solid #e0e0e0;border-left:3px solid #000000;background-color:#f7f7f7;">
          <p style="margin:0 0 6px 0;font-size:11px;font-weight:700;letter-spacing:0.8px;text-transform:uppercase;color:#555555;">Document</p>
          <p style="margin:0;font-size:15px;font-weight:700;color:#000000;">${escHtml(documentName || 'N/A')}</p>
        </td>
      </tr>
    </table>

    ${rejectReason ? `
    <!-- Rejection reason -->
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="margin-bottom:24px;">
      <tr>
        <td style="padding:16px 20px;border:1px solid #e0e0e0;border-left:3px solid #000000;background-color:#f7f7f7;">
          <p style="margin:0 0 6px 0;font-size:11px;font-weight:700;letter-spacing:0.8px;text-transform:uppercase;color:#555555;">Reason for Rejection</p>
          <p style="margin:0;font-size:14px;color:#111111;line-height:1.6;">${escHtml(rejectReason)}</p>
        </td>
      </tr>
    </table>
    ` : ''}

    ${reviewedBy ? `
    <p style="margin:0 0 28px 0;font-size:13px;color:#555555;">
      Reviewed by: <strong>${escHtml(reviewedBy)}</strong>
    </p>
    ` : '<p style="margin:0 0 28px 0;"></p>'}

    <!-- CTA -->
    <table role="presentation" cellspacing="0" cellpadding="0" border="0" style="margin-bottom:28px;">
      <tr>
        <td style="background-color:#000000;">
          <a href="${portalUrl}" target="_blank" style="display:inline-block;padding:13px 28px;font-size:14px;font-weight:700;color:#ffffff;text-decoration:none;letter-spacing:0.3px;">
            Reupload Document
          </a>
        </td>
      </tr>
    </table>

    <p style="margin:0;font-size:14px;color:#555555;line-height:1.6;">
      If you need assistance, please contact your visa consultant.
    </p>
  `;

  return {
    html: base(content, { previewText: `Action required: Your document "${documentName}" has been rejected.` }),
    subject: `Action Required — Document Rejected: ${documentName}`,
  };
}

function escHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

module.exports = { render };
