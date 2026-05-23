'use strict';

const { base } = require('./base');

const FRONTEND_URL = process.env.FRONTEND_URL || 'https://dms.worldvisagroup.com';

function render(data) {
  const { recipientName, leadId, clientName, documentName, expiryDate, daysUntilExpiry } = data;
  const portalUrl = leadId
    ? `${FRONTEND_URL}/v2/applications/${leadId}`
    : `${FRONTEND_URL}/v2/applications`;

  const firstName = (recipientName || clientName || 'Applicant').split(' ')[0];

  const formattedExpiry = expiryDate
    ? new Date(expiryDate).toLocaleDateString('en-AU', { day: 'numeric', month: 'long', year: 'numeric' })
    : 'soon';

  const daysLabel =
    daysUntilExpiry != null
      ? `<strong>${daysUntilExpiry} day${daysUntilExpiry === 1 ? '' : 's'}</strong>`
      : 'soon';

  const content = `
    <p style="margin:0 0 4px 0;font-size:11px;font-weight:700;letter-spacing:1px;color:#c0392b;text-transform:uppercase;">Action Required</p>
    <h1 style="margin:0 0 24px 0;font-size:22px;font-weight:700;color:#000000;line-height:1.3;">English Language Test Expiring Soon</h1>

    <p style="margin:0 0 20px 0;font-size:15px;color:#111111;line-height:1.6;">
      Hi ${firstName},
    </p>

    <p style="margin:0 0 20px 0;font-size:15px;color:#111111;line-height:1.6;">
      This is a reminder that your English language test result is expiring in ${daysLabel} on <strong>${formattedExpiry}</strong>. An up-to-date English language test is mandatory for your visa application to proceed.
    </p>

    <!-- Expiry detail box -->
    <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%"
      style="border-collapse:collapse;background-color:#fff8f8;border:1px solid #f5c6c6;border-radius:4px;margin-bottom:28px;">
      <tr>
        <td style="padding:16px 20px;">
          <p style="margin:0 0 6px 0;font-size:13px;font-weight:700;color:#555555;text-transform:uppercase;letter-spacing:0.5px;">Document</p>
          <p style="margin:0 0 14px 0;font-size:15px;color:#111111;">${documentName || 'English Language Test'}</p>
          <p style="margin:0 0 6px 0;font-size:13px;font-weight:700;color:#555555;text-transform:uppercase;letter-spacing:0.5px;">Expiry Date</p>
          <p style="margin:0;font-size:15px;color:#c0392b;font-weight:700;">${formattedExpiry}</p>
        </td>
      </tr>
    </table>

    <p style="margin:0 0 28px 0;font-size:15px;color:#111111;line-height:1.6;">
      Please arrange to sit your English language test and upload the updated result before the expiry date to avoid delays to your application.
    </p>

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
      If you have already renewed your test or need assistance, please contact your visa consultant.
    </p>
  `;

  return {
    html: base(content, {
      previewText: `Your English language test expires in ${daysUntilExpiry ?? 'a few'} days — action required.`,
    }),
    subject: `Action Required: English Language Test Expiring in ${daysUntilExpiry ?? ''} Days`,
  };
}

module.exports = { render };
