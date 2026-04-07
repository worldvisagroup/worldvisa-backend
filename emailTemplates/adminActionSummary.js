'use strict';

const { base } = require('./base');

const FRONTEND_URL = process.env.FRONTEND_URL || 'https://dms.worldvisagroup.com';

const TYPE_LABELS = {
  document_approved: 'Approved',
  document_reviewed: 'Reviewed',
  document_rejected: 'Rejected',
  checklist_created: 'Checklist Created',
  comment_to_client: 'Comment',
};


function render(notifications, { recipientName, leadId } = {}) {
  const portalUrl = leadId
    ? `${FRONTEND_URL}/applications/${leadId}`
    : `${FRONTEND_URL}/applications`;

  const firstName = (recipientName || 'Applicant').split(' ')[0];
  const total = notifications.length;

  const groups = {};
  for (const n of notifications) {
    const key = n.notificationType;
    if (!groups[key]) groups[key] = [];
    groups[key].push(n);
  }

  const typeOrder = ['document_rejected', 'document_approved', 'document_reviewed', 'checklist_created', 'comment_to_client'];

  let tableRows = '';
  let rowIndex = 0;
  for (const type of typeOrder) {
    if (!groups[type]) continue;
    for (const n of groups[type]) {
      const bg = rowIndex % 2 === 0 ? '#ffffff' : '#f7f7f7';
      const statusLabel = type === 'document_approved'
        ? '[APPROVED]'
        : type === 'document_rejected'
        ? '[REJECTED]'
        : type === 'document_reviewed'
        ? '[REVIEWED]'
        : type === 'checklist_created'
        ? '[CHECKLIST]'
        : '[COMMENT]';

      const reviewedBy = n.templateData?.reviewedBy || n.templateData?.changedBy || '—';
      const remarks = type === 'document_rejected' && n.templateData?.rejectReason
        ? escHtml(n.templateData.rejectReason)
        : '—';

      tableRows += `
        <tr style="background-color:${bg};">
          <td style="padding:10px 12px;font-size:12px;font-weight:700;color:#000000;border-bottom:1px solid #e0e0e0;white-space:nowrap;">${statusLabel}</td>
          <td style="padding:10px 12px;font-size:13px;color:#111111;border-bottom:1px solid #e0e0e0;">${escHtml(n.entityName || '—')}</td>
          <td style="padding:10px 12px;font-size:13px;color:#555555;border-bottom:1px solid #e0e0e0;">${escHtml(reviewedBy)}</td>
          <td style="padding:10px 12px;font-size:13px;color:#555555;border-bottom:1px solid #e0e0e0;">${remarks}</td>
        </tr>`;
      rowIndex++;
    }
  }

  // Subject line
  const rejectedCount = (groups['document_rejected'] || []).length;
  let subject;
  if (total === 1) {
    const type = notifications[0].notificationType;
    subject = `${TYPE_LABELS[type] || 'Update'}: ${notifications[0].entityName || 'Document'} — WorldVisa`;
  } else {
    subject = `${total} Document${total !== 1 ? 's' : ''} Reviewed on Your Application`;
  }

  const content = `
    <p style="margin:0 0 4px 0;font-size:11px;font-weight:700;letter-spacing:1px;color:#555555;text-transform:uppercase;">WorldVisa Group &middot; Application Update</p>
    <h1 style="margin:0 0 24px 0;font-size:22px;font-weight:700;color:#000000;line-height:1.3;">
      ${total} Document${total !== 1 ? 's' : ''} Reviewed
    </h1>

    <p style="margin:0 0 20px 0;font-size:15px;color:#111111;line-height:1.6;">
      Hi ${firstName},
    </p>

    <p style="margin:0 0 24px 0;font-size:15px;color:#111111;line-height:1.6;">
      Your submitted documents on your WorldVisa Group visa application have been reviewed. Please see the summary below.
      ${rejectedCount > 0 ? `<br><br><strong>Note:</strong> ${rejectedCount} document${rejectedCount !== 1 ? 's' : ''} ${rejectedCount !== 1 ? 'were' : 'was'} rejected — please re-upload the corrected version${rejectedCount !== 1 ? 's' : ''} to avoid delays.` : ''}
    </p>

    <!-- Documents table -->
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="border:1px solid #e0e0e0;border-collapse:collapse;margin-bottom:28px;">
      <thead>
        <tr style="background-color:#f0f0f0;">
          <th style="padding:10px 12px;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.8px;color:#000000;text-align:left;border-bottom:2px solid #000000;white-space:nowrap;">Status</th>
          <th style="padding:10px 12px;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.8px;color:#000000;text-align:left;border-bottom:2px solid #000000;">Document Name</th>
          <th style="padding:10px 12px;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.8px;color:#000000;text-align:left;border-bottom:2px solid #000000;">Reviewed By</th>
          <th style="padding:10px 12px;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.8px;color:#000000;text-align:left;border-bottom:2px solid #000000;">Remarks</th>
        </tr>
      </thead>
      <tbody>
        ${tableRows}
      </tbody>
    </table>

    <!-- CTA -->
    <table role="presentation" cellspacing="0" cellpadding="0" border="0" style="margin-bottom:8px;">
      <tr>
        <td style="background-color:#000000;">
          <a href="${portalUrl}" target="_blank" style="display:inline-block;padding:13px 28px;font-size:14px;font-weight:700;color:#ffffff;text-decoration:none;letter-spacing:0.3px;">
            View Your Documents
          </a>
        </td>
      </tr>
    </table>
  `;

  return {
    html: base(content, { previewText: `${total} document${total !== 1 ? 's' : ''} reviewed on your visa application.` }),
    subject,
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
