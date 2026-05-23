'use strict';

const { base } = require('./base');

const FRONTEND_URL = process.env.FRONTEND_URL || 'https://dms.worldvisagroup.com';

function render(data) {
  const { recipientName, missingDocuments = [], leadId } = data;
  const portalUrl = leadId
    ? `${FRONTEND_URL}/v2/applications/${leadId}`
    : `${FRONTEND_URL}/v2/applications`;

  const firstName = (recipientName || 'Applicant').split(' ')[0];

  const documentRows = missingDocuments
    .map(
      (doc) => `
        <tr>
          <td style="padding:10px 12px;border-bottom:1px solid #eeeeee;font-size:14px;color:#111111;">
            ${doc.document_type || 'Document'}
          </td>
          <td style="padding:10px 12px;border-bottom:1px solid #eeeeee;font-size:14px;color:#555555;">
            ${doc.document_category || ''}
          </td>
        </tr>`
    )
    .join('');

  const documentTable =
    missingDocuments.length > 0
      ? `
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%"
          style="border-collapse:collapse;border:1px solid #eeeeee;margin-bottom:28px;">
          <thead>
            <tr style="background-color:#f5f5f5;">
              <th style="padding:10px 12px;text-align:left;font-size:12px;font-weight:700;color:#555555;letter-spacing:0.5px;text-transform:uppercase;">
                Document
              </th>
              <th style="padding:10px 12px;text-align:left;font-size:12px;font-weight:700;color:#555555;letter-spacing:0.5px;text-transform:uppercase;">
                Category
              </th>
            </tr>
          </thead>
          <tbody>${documentRows}</tbody>
        </table>`
      : `<p style="margin:0 0 28px 0;font-size:14px;color:#555555;">Please log in to your portal to view the outstanding items.</p>`;

  const content = `
    <p style="margin:0 0 4px 0;font-size:11px;font-weight:700;letter-spacing:1px;color:#555555;text-transform:uppercase;">Action Required</p>
    <h1 style="margin:0 0 24px 0;font-size:22px;font-weight:700;color:#000000;line-height:1.3;">Documents Still Needed</h1>

    <p style="margin:0 0 20px 0;font-size:15px;color:#111111;line-height:1.6;">
      Hi ${firstName},
    </p>

    <p style="margin:0 0 20px 0;font-size:15px;color:#111111;line-height:1.6;">
      We noticed that some mandatory documents are still outstanding for your visa application. To avoid any delays, please upload the following items as soon as possible:
    </p>

    ${documentTable}

    <p style="margin:0 0 28px 0;font-size:15px;color:#111111;line-height:1.6;">
      Your application cannot proceed until all required documents have been submitted. If you have already uploaded these, please disregard this reminder.
    </p>

    <!-- CTA -->
    <table role="presentation" cellspacing="0" cellpadding="0" border="0" style="margin-bottom:28px;">
      <tr>
        <td style="background-color:#000000;">
          <a href="${portalUrl}" target="_blank" style="display:inline-block;padding:13px 28px;font-size:14px;font-weight:700;color:#ffffff;text-decoration:none;letter-spacing:0.3px;">
            Upload Documents Now
          </a>
        </td>
      </tr>
    </table>

    <p style="margin:0;font-size:14px;color:#555555;line-height:1.6;">
      If you have any questions or need assistance, please reach out to your visa consultant — we're here to help.
    </p>
  `;

  return {
    html: base(content, {
      previewText: `Reminder: ${missingDocuments.length} document(s) still needed for your visa application.`,
    }),
    subject: 'Reminder: Outstanding Documents Required for Your Visa Application',
  };
}

module.exports = { render };
