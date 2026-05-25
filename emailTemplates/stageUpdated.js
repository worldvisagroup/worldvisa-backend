'use strict';

const { base } = require('./base');

const FRONTEND_URL = process.env.FRONTEND_URL || 'https://dms.worldvisagroup.com';

function render(data) {
  const { recipientName, clientName, newStage, updatedBy, leadId } = data;

  const portalUrl = leadId
    ? `${FRONTEND_URL}/v2/applications/${leadId}`
    : `${FRONTEND_URL}/v2/applications`;

  const firstName = (recipientName || 'Admin').split(' ')[0];

  const content = `
    <p style="margin:0 0 4px 0;font-size:11px;font-weight:700;letter-spacing:1px;color:#555555;text-transform:uppercase;">Application Update</p>
    <h1 style="margin:0 0 24px 0;font-size:22px;font-weight:700;color:#000000;line-height:1.3;">Application Stage Updated</h1>

    <p style="margin:0 0 20px 0;font-size:15px;color:#111111;line-height:1.6;">
      Hi ${firstName},
    </p>

    <p style="margin:0 0 20px 0;font-size:15px;color:#111111;line-height:1.6;">
      An application stage has been updated. Here are the details:
    </p>

    <!-- Detail box -->
    <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%"
      style="border-collapse:collapse;border:1px solid #e0e0e0;margin-bottom:28px;">
      <tbody>
        <tr style="background-color:#f9f9f9;">
          <td style="padding:12px 16px;font-size:13px;font-weight:700;color:#555555;width:40%;border-bottom:1px solid #e0e0e0;">
            Client
          </td>
          <td style="padding:12px 16px;font-size:14px;color:#111111;border-bottom:1px solid #e0e0e0;">
            ${clientName || 'N/A'}
          </td>
        </tr>
        <tr>
          <td style="padding:12px 16px;font-size:13px;font-weight:700;color:#555555;width:40%;border-bottom:1px solid #e0e0e0;">
            New Stage
          </td>
          <td style="padding:12px 16px;font-size:14px;color:#111111;border-bottom:1px solid #e0e0e0;">
            <strong>${newStage || 'N/A'}</strong>
          </td>
        </tr>
        <tr style="background-color:#f9f9f9;">
          <td style="padding:12px 16px;font-size:13px;font-weight:700;color:#555555;width:40%;">
            Updated By
          </td>
          <td style="padding:12px 16px;font-size:14px;color:#111111;">
            ${updatedBy || 'Staff'}
          </td>
        </tr>
      </tbody>
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
  `;

  return {
    html: base(content, {
      previewText: `${clientName} — application stage updated to "${newStage}" by ${updatedBy}.`,
    }),
    subject: `Application Stage Updated: ${clientName}`,
  };
}

module.exports = { render };
