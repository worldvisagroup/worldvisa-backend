'use strict';

const { base } = require('./base');

const FRONTEND_URL = process.env.FRONTEND_URL || 'https://dms.worldvisagroup.com';

function render(notifications, { recipientName } = {}) {
  const total = notifications.length;
  const firstName = (recipientName || 'Team').split(/[.\s_]/)[0];
  // Build a unified review URL — individual leads can be navigated from there
  const reviewUrl = `${FRONTEND_URL}/v2/requested-docs`;

  let tableRows = '';
  notifications.forEach((n, i) => {
    const bg = i % 2 === 0 ? '#ffffff' : '#f7f7f7';
    const td = n.templateData || {};
    const clientName    = td.clientName    || td.client_name    || '—';
    const companyName   = td.companyName   || '—';
    const applicationType = td.applicationType || td.application_type || '—';
    const documentName  = n.entityName     || td.documentName   || '—';
    const comment       = td.comment       || '—';
    const requestedBy   = td.requestedBy   || '—';
    const requestedAt   = td.requestedAt ? formatDateTime(td.requestedAt) : '—';

    tableRows += `
      <tr style="background-color:${bg};">
        <td style="padding:7px 8px;font-size:11px;color:#111111;border-bottom:1px solid #e0e0e0;"><div style="max-width:90px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${escHtml(clientName)}</div></td>
        <td style="padding:7px 8px;font-size:11px;color:#555555;border-bottom:1px solid #e0e0e0;"><div style="max-width:90px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${escHtml(companyName)}</div></td>
        <td style="padding:7px 8px;font-size:11px;color:#555555;border-bottom:1px solid #e0e0e0;"><div style="max-width:85px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${escHtml(applicationType)}</div></td>
        <td style="padding:7px 8px;font-size:11px;color:#111111;border-bottom:1px solid #e0e0e0;"><div style="max-width:95px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${escHtml(documentName)}</div></td>
        <td style="padding:7px 8px;font-size:11px;color:#555555;border-bottom:1px solid #e0e0e0;"><div style="max-width:90px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${escHtml(comment)}</div></td>
        <td style="padding:7px 8px;font-size:11px;color:#555555;border-bottom:1px solid #e0e0e0;"><div style="max-width:65px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${escHtml(requestedBy)}</div></td>
        <td style="padding:7px 8px;font-size:11px;color:#555555;border-bottom:1px solid #e0e0e0;white-space:nowrap;">${requestedAt}</td>
      </tr>`;
  });

  const subject = total === 1
    ? `1 Document Pending Your Review — WorldVisa`
    : `${total} Documents Pending Your Review — WorldVisa`;

  const content = `
    <p style="margin:0 0 4px 0;font-size:11px;font-weight:700;letter-spacing:1px;color:#555555;text-transform:uppercase;">Review Required</p>
    <h1 style="margin:0 0 24px 0;font-size:22px;font-weight:700;color:#000000;line-height:1.3;">
      ${total} Document${total !== 1 ? 's' : ''} Pending Your Review
    </h1>

    <p style="margin:0 0 8px 0;font-size:15px;color:#111111;line-height:1.6;">
      Hi <strong>${escHtml(firstName)}</strong>,
    </p>

    <p style="margin:0 0 24px 0;font-size:15px;color:#111111;line-height:1.6;">
      The following document${total !== 1 ? 's have' : ' has'} been requested for your review. Kindly review ${total !== 1 ? 'them' : 'it'} to ensure timely processing.
    </p>

    <!-- Review table -->
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="border:1px solid #e0e0e0;border-collapse:collapse;margin-bottom:28px;">
      <thead>
        <tr style="background-color:#f0f0f0;">
          <th style="padding:7px 8px;font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:0.8px;color:#000000;text-align:left;border-bottom:2px solid #000000;white-space:nowrap;">Client Name</th>
          <th style="padding:7px 8px;font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:0.8px;color:#000000;text-align:left;border-bottom:2px solid #000000;white-space:nowrap;">Company</th>
          <th style="padding:7px 8px;font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:0.8px;color:#000000;text-align:left;border-bottom:2px solid #000000;white-space:nowrap;">App Type</th>
          <th style="padding:7px 8px;font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:0.8px;color:#000000;text-align:left;border-bottom:2px solid #000000;white-space:nowrap;">Document</th>
          <th style="padding:7px 8px;font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:0.8px;color:#000000;text-align:left;border-bottom:2px solid #000000;white-space:nowrap;">Comment</th>
          <th style="padding:7px 8px;font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:0.8px;color:#000000;text-align:left;border-bottom:2px solid #000000;white-space:nowrap;">Req. By</th>
          <th style="padding:7px 8px;font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:0.8px;color:#000000;text-align:left;border-bottom:2px solid #000000;white-space:nowrap;">Req. At (IST)</th>
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
          <a href="${reviewUrl}" target="_blank" style="display:inline-block;padding:13px 28px;font-size:14px;font-weight:700;color:#ffffff;text-decoration:none;letter-spacing:0.3px;">
            Review Document${total !== 1 ? 's' : ''}
          </a>
        </td>
      </tr>
    </table>
  `;

  return {
    html: base(content, { previewText: `${total} document${total !== 1 ? 's' : ''} pending your review.` }),
    subject,
  };
}

function formatDateTime(isoString) {
  try {
    return new Date(isoString).toLocaleString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
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
