'use strict';

const { base } = require('./base');

const FRONTEND_URL = process.env.FRONTEND_URL || 'https://dms.worldvisagroup.com';

const ACTIVITY_LABELS = {
  document_upload: 'Uploaded',
  document_reupload: 'Re-uploaded',
  checklist_requested: 'Checklist Requested',
  comment_by_client: 'Comment Added',
};

const ACTIVITY_ORDER = ['document_upload', 'document_reupload', 'comment_by_client', 'checklist_requested'];


function render(notifications, { leadOwnerName, clientName, leadId } = {}) {
  const portalUrl = leadId
    ? `${FRONTEND_URL}/v2/applications/${leadId}`
    : `${FRONTEND_URL}/v2/applications`;

  const total = notifications.length;

  // Extract client name from first notification templateData if not passed
  const resolvedClientName = clientName
    || notifications[0]?.templateData?.clientName
    || 'Your client';

  const resolvedLeadOwner = leadOwnerName
    || notifications[0]?.templateData?.leadOwnerName
    || 'Team';

  // Group by activity type
  const groups = {};
  for (const n of notifications) {
    const key = n.notificationType;
    if (!groups[key]) groups[key] = [];
    groups[key].push(n);
  }

  let tableRows = '';
  let rowIndex = 0;

  for (const type of ACTIVITY_ORDER) {
    if (!groups[type]) continue;
    for (const n of groups[type]) {
      const bg = rowIndex % 2 === 0 ? '#ffffff' : '#f7f7f7';
      const activityLabel = ACTIVITY_LABELS[type] || type;
      const docName = n.entityName || (type === 'comment_by_client' ? '—' : '—');
      const companyName = n.templateData?.companyName || '—';
      const uploadedAt = n.templateData?.uploadedAt || n.templateData?.requestedAt || null;
      const timeStr = uploadedAt ? formatTime(uploadedAt) : '—';

      tableRows += `
        <tr style="background-color:${bg};">
          <td style="padding:10px 12px;font-size:13px;color:#111111;border-bottom:1px solid #e0e0e0;white-space:nowrap;">${escHtml(activityLabel)}</td>
          <td style="padding:10px 12px;font-size:13px;color:#111111;border-bottom:1px solid #e0e0e0;">${escHtml(docName)}</td>
          <td style="padding:10px 12px;font-size:13px;color:#555555;border-bottom:1px solid #e0e0e0;">${escHtml(companyName)}</td>
          <td style="padding:10px 12px;font-size:13px;color:#555555;border-bottom:1px solid #e0e0e0;white-space:nowrap;">${timeStr}</td>
        </tr>`;
      rowIndex++;
    }
  }

  const subject = total === 1
    ? `${total} Update from ${resolvedClientName} — WorldVisa`
    : `${total} Updates from ${resolvedClientName} — WorldVisa`;

  const content = `
    <p style="margin:0 0 4px 0;font-size:11px;font-weight:700;letter-spacing:1px;color:#555555;text-transform:uppercase;">WorldVisa Group &middot; Client Activity</p>
    <h1 style="margin:0 0 24px 0;font-size:22px;font-weight:700;color:#000000;line-height:1.3;">
      ${total} Update${total !== 1 ? 's' : ''} from ${escHtml(resolvedClientName)}
    </h1>

    <p style="margin:0 0 8px 0;font-size:15px;color:#111111;line-height:1.6;">
      Hi <strong>${escHtml(resolvedLeadOwner)}</strong>,
    </p>

    <p style="margin:0 0 24px 0;font-size:15px;color:#111111;line-height:1.6;">
      Your client <strong>${escHtml(resolvedClientName)}</strong> has recent activity on their WorldVisa Group visa application. Please review the updates at your earliest convenience.
    </p>

    <!-- Activity table -->
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="border:1px solid #e0e0e0;border-collapse:collapse;margin-bottom:28px;">
      <thead>
        <tr style="background-color:#f0f0f0;">
          <th style="padding:10px 12px;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.8px;color:#000000;text-align:left;border-bottom:2px solid #000000;white-space:nowrap;">Activity</th>
          <th style="padding:10px 12px;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.8px;color:#000000;text-align:left;border-bottom:2px solid #000000;">Document Name</th>
          <th style="padding:10px 12px;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.8px;color:#000000;text-align:left;border-bottom:2px solid #000000;">Company</th>
          <th style="padding:10px 12px;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.8px;color:#000000;text-align:left;border-bottom:2px solid #000000;white-space:nowrap;">Time</th>
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
            View Application
          </a>
        </td>
      </tr>
    </table>
  `;

  return {
    html: base(content, { previewText: `${resolvedClientName} has ${total} update${total !== 1 ? 's' : ''} on their application.` }),
    subject,
  };
}

function formatTime(isoString) {
  try {
    return new Date(isoString).toLocaleTimeString('en-IN', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
      timeZone: 'Asia/Kolkata',
    });
  } catch {
    return '—';
  }
}

function escHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

module.exports = { render };
