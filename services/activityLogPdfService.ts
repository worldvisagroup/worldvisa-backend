import fs from 'fs';
import path from 'path';
import type {
  ActivityLogEntry,
  ActivityLogPdfParams,
  ActivityType,
  DayGroup,
  RecordType,
} from '../types/visaApplication.types';

// eslint-disable-next-line @typescript-eslint/no-var-requires
const puppeteer = require('puppeteer-core') as typeof import('puppeteer-core');
const { getPuppeteerConfig } = require('../utils/puppeteer-config') as {
  getPuppeteerConfig: () => Record<string, unknown>;
};
const logger = require('../utils/logger') as {
  error: (msg: string, ctx?: unknown) => void;
  info:  (msg: string, ctx?: unknown) => void;
};

// ─── Logo Fetcher ─────────────────────────────────────────────────────────────

export async function fetchLogoAsBase64(): Promise<string | null> {
  try {
    const logoPath = path.join(__dirname, '..', 'Images', 'world-visa-logo.png');
    const buffer = fs.readFileSync(logoPath);
    return `data:image/png;base64,${buffer.toString('base64')}`;
  } catch (err) {
    logger.error('Logo read failed', { error: err instanceof Error ? err.message : err });
    return null;
  }
}

// ─── Day Grouping ─────────────────────────────────────────────────────────────

export function groupByDay(logs: ActivityLogEntry[]): DayGroup[] {
  // logs arrive sorted createdAt DESC; we group by UTC date key
  const map = new Map<string, ActivityLogEntry[]>();

  for (const log of logs) {
    const d   = new Date(log.createdAt);
    const key = d.toISOString().slice(0, 10); // "YYYY-MM-DD"
    const bucket = map.get(key);
    if (bucket) {
      bucket.push(log);
    } else {
      map.set(key, [log]);
    }
  }

  // Sort days newest-first; within each day reverse to oldest-first
  const sorted = [...map.entries()].sort(([a], [b]) => b.localeCompare(a));

  return sorted.map(([dateKey, entries]) => {
    const label = new Date(`${dateKey}T12:00:00Z`).toLocaleDateString('en-AU', {
      weekday: 'long',
      year:    'numeric',
      month:   'long',
      day:     'numeric',
      timeZone: 'UTC',
    });
    return {
      label,
      dateKey,
      entries: [...entries].reverse(), // oldest-first within the day
    };
  });
}

// ─── Activity Type Metadata ───────────────────────────────────────────────────

interface ActivityMeta {
  label: string;
  badgeClass: string;
  icon: string; // inline SVG string
}

const ICONS: Record<string, string> = {
  document: `<svg width="11" height="11" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M4 2h6l4 4v10H4V2z" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
    <path d="M10 2v4h4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
    <path d="M7 9h4M7 12h3" stroke="currentColor" stroke-width="1.3" stroke-linecap="round"/>
  </svg>`,

  note: `<svg width="11" height="11" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M3 14l1.5-4L12 3l3 3-7.5 7.5L3 14z" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
    <path d="M10 5l3 3" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
  </svg>`,

  email: `<svg width="11" height="11" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="2" y="4" width="12" height="9" rx="1" stroke="currentColor" stroke-width="1.5"/>
    <path d="M2 4l6 5.5L14 4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
  </svg>`,

  review: `<svg width="11" height="11" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M1 8s3-5 7-5 7 5 7 5-3 5-7 5-7-5-7-5z" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
    <circle cx="8" cy="8" r="2" stroke="currentColor" stroke-width="1.5"/>
  </svg>`,

  quality_check: `<svg width="11" height="11" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M8 2l1.5 3.5H13l-2.8 2 1 3.5L8 9l-3.2 2 1-3.5L3 5.5h3.5L8 2z" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/>
  </svg>`,

  checklist: `<svg width="11" height="11" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M2 4h2M6 4h8M2 8h2M6 8h8M2 12h2M6 12h8" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
    <path d="M2 4l.8.8L4 3" stroke="currentColor" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round"/>
  </svg>`,

  comment: `<svg width="11" height="11" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M2 2h12v9H8.5l-3 3v-3H2V2z" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
    <path d="M5 6h6M5 9h4" stroke="currentColor" stroke-width="1.2" stroke-linecap="round"/>
  </svg>`,

  application: `<svg width="11" height="11" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M5 4h7l1 1v8H4V5l1-1z" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
    <path d="M6 4V3h4v1" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
    <path d="M6 8h4M6 11h3" stroke="currentColor" stroke-width="1.2" stroke-linecap="round"/>
  </svg>`,

  file: `<svg width="9" height="9" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M4 2h6l4 4v10H4V2z" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
    <path d="M10 2v4h4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
  </svg>`,
};

function getActivityMeta(type: ActivityType): ActivityMeta {
  switch (type) {
    case 'document_uploaded':
    case 'document_reuploaded':
    case 'document_status_changed':
      return { label: type === 'document_uploaded' ? 'Uploaded' : type === 'document_reuploaded' ? 'Re-uploaded' : 'Status Changed', badgeClass: 'badge-document', icon: ICONS.document };

    case 'note_added':
    case 'note_updated':
    case 'note_deleted':
      return { label: type === 'note_added' ? 'Note Added' : type === 'note_updated' ? 'Note Updated' : 'Note Deleted', badgeClass: 'badge-note', icon: ICONS.note };

    case 'email_sent':
    case 'email_received':
      return { label: type === 'email_sent' ? 'Email Sent' : 'Email Received', badgeClass: 'badge-email', icon: ICONS.email };

    case 'review_requested':
    case 'review_status_updated':
    case 'review_cancelled':
    case 'review_message_added':
      return { label: type === 'review_requested' ? 'Review Requested' : type === 'review_status_updated' ? 'Review Updated' : type === 'review_cancelled' ? 'Review Cancelled' : 'Review Message', badgeClass: 'badge-review', icon: ICONS.review };

    case 'quality_check_requested':
    case 'quality_check_removed':
      return { label: type === 'quality_check_requested' ? 'QC Requested' : 'QC Removed', badgeClass: 'badge-qc', icon: ICONS.quality_check };

    case 'checklist_created':
    case 'checklist_updated':
    case 'checklist_deleted':
      return { label: type === 'checklist_created' ? 'Checklist Created' : type === 'checklist_updated' ? 'Checklist Updated' : 'Checklist Deleted', badgeClass: 'badge-checklist', icon: ICONS.checklist };

    case 'comment_added':
    case 'comment_edited':
    case 'comment_deleted':
      return { label: type === 'comment_added' ? 'Comment' : type === 'comment_edited' ? 'Comment Edited' : 'Comment Deleted', badgeClass: 'badge-comment', icon: ICONS.comment };

    case 'application_created':
      return { label: 'App Created', badgeClass: 'badge-app', icon: ICONS.application };

    default:
      return { label: type, badgeClass: 'badge-comment', icon: ICONS.document };
  }
}

function formatTime(date: Date): string {
  return new Date(date).toLocaleTimeString('en-AU', {
    hour:     '2-digit',
    minute:   '2-digit',
    hour12:   false,
    timeZone: 'UTC',
  });
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

// ─── HTML Template ────────────────────────────────────────────────────────────

function buildRecordTypeBadge(recordType: RecordType): string {
  return recordType === 'visa_application' ? 'Visa Application' : 'Spouse Skill Assessment';
}

function buildDaySection(group: DayGroup): string {
  const rows = group.entries.map(entry => {
    const meta     = getActivityMeta(entry.activity_type);
    const timeStr  = formatTime(entry.createdAt);
    const summary  = escapeHtml(entry.summary);
    const actorName = escapeHtml(entry.actor_name);
    const actorRole = entry.actor_role ? escapeHtml(entry.actor_role) : null;

    const fileChip = entry.document_name
      ? `<div class="file-chip">${ICONS.file} ${escapeHtml(entry.document_name)}</div>`
      : '';

    const roleHtml = actorRole
      ? `<div class="actor-role">${actorRole}</div>`
      : '';

    return `
      <tr>
        <td class="col-time">${timeStr}</td>
        <td class="col-type">
          <span class="type-badge ${meta.badgeClass}">${meta.icon} ${meta.label}</span>
        </td>
        <td class="col-summary">
          <div class="summary-text">${summary}</div>
          ${fileChip}
        </td>
        <td class="col-actor">
          <div class="actor-name">${actorName}</div>
          ${roleHtml}
        </td>
      </tr>`;
  }).join('');

  return `
    <div class="day-section">
      <div class="day-header">
        <div class="day-accent"></div>
        <span class="day-label">${escapeHtml(group.label)}</span>
        <div class="day-divider"></div>
        <span class="day-count">${group.entries.length} ${group.entries.length === 1 ? 'activity' : 'activities'}</span>
      </div>
      <table>
        <thead>
          <tr>
            <th class="col-time">Time</th>
            <th class="col-type">Type</th>
            <th>Summary</th>
            <th class="col-actor">Actor</th>
          </tr>
        </thead>
        <tbody>${rows}</tbody>
      </table>
    </div>`;
}

export function buildActivityLogHtml(params: ActivityLogPdfParams): string {
  const { clientName, recordType, generatedAt, dayGroups, logoDataUri, totalEntries } = params;

  const logoHtml = logoDataUri
    ? `<img src="${logoDataUri}" style="height:30px;width:auto;object-fit:contain;display:block;" alt="WorldVisa">`
    : `<span class="logo-text">World<span style="color:#60A5FA;">Visa</span></span>`;

  const generatedStr = generatedAt.toLocaleDateString('en-AU', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
    hour: '2-digit', minute: '2-digit', hour12: true, timeZone: 'UTC',
  });

  const totalDays = dayGroups.length;
  const recordTypeLabel = buildRecordTypeBadge(recordType);

  const bodyContent = dayGroups.length > 0
    ? dayGroups.map(buildDaySection).join('')
    : `<div class="empty-state">
        <div style="margin-bottom:8px;font-size:24px;opacity:.3;">📋</div>
        <div>No activity recorded for this application.</div>
      </div>`;

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1.0">
<style>
/* ─── Reset ─────────────────────────────────────────────────── */
*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
@page { size: A4; margin: 0; }

/* ─── Base ──────────────────────────────────────────────────── */
body {
  font-family: -apple-system, 'Helvetica Neue', Helvetica, Arial, sans-serif;
  font-size: 10.5pt;
  line-height: 1.5;
  color: #111827;
  background: #fff;
  -webkit-print-color-adjust: exact;
  print-color-adjust: exact;
}

/* ─── Document Header ───────────────────────────────────────── */
.doc-header {
  background: #0A1628;
  color: #fff;
  padding: 32px 48px 28px;
}

.doc-header-top {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
  padding-bottom: 20px;
  border-bottom: 1px solid rgba(255,255,255,0.1);
}

.logo {
  display: flex;
  align-items: center;
  gap: 10px;
}

.logo-text {
  font-size: 17px;
  font-weight: 700;
  letter-spacing: -0.3px;
  color: #fff;
}

.doc-meta {
  text-align: right;
  font-size: 8px;
  color: rgba(255,255,255,0.45);
  line-height: 1.9;
}

.doc-meta-title {
  font-size: 9.5px;
  font-weight: 600;
  color: rgba(255,255,255,0.85);
  letter-spacing: 0.2px;
}

.doc-client-row {
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
}

.client-label {
  font-size: 7.5px;
  text-transform: uppercase;
  letter-spacing: 1.3px;
  color: rgba(255,255,255,0.38);
  margin-bottom: 5px;
}

.client-name {
  font-size: 21px;
  font-weight: 700;
  letter-spacing: -0.5px;
  line-height: 1.15;
  color: #fff;
}

.record-badge {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  margin-top: 9px;
  padding: 4px 11px;
  background: rgba(96,165,250,0.13);
  border: 1px solid rgba(96,165,250,0.28);
  border-radius: 20px;
  font-size: 8px;
  font-weight: 600;
  color: #93C5FD;
  letter-spacing: 0.6px;
  text-transform: uppercase;
}

.stat-block {
  text-align: right;
}

.stat-num {
  font-size: 28px;
  font-weight: 700;
  line-height: 1;
  color: #fff;
  letter-spacing: -1px;
}

.stat-label {
  font-size: 8px;
  color: rgba(255,255,255,0.4);
  margin-top: 3px;
}

/* ─── Content ───────────────────────────────────────────────── */
.content {
  padding: 32px 48px 20px;
}

/* ─── Day Section ────────────────────────────────────────────── */
.day-section {
  margin-bottom: 26px;
  page-break-inside: avoid;
}

.day-header {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 10px;
}

.day-accent {
  width: 3px;
  height: 15px;
  background: #1D4ED8;
  border-radius: 2px;
  flex-shrink: 0;
}

.day-label {
  font-size: 10px;
  font-weight: 700;
  color: #0A1628;
  letter-spacing: 0.1px;
  white-space: nowrap;
}

.day-divider {
  flex: 1;
  height: 1px;
  background: #E9ECF0;
}

.day-count {
  font-size: 7.5px;
  color: #9CA3AF;
  font-weight: 500;
  white-space: nowrap;
}

/* ─── Table ──────────────────────────────────────────────────── */
table {
  width: 100%;
  border-collapse: collapse;
}

thead tr {
  border-bottom: 1.5px solid #E5E7EB;
}

thead th {
  text-align: left;
  padding: 5px 8px 5px 0;
  font-size: 7px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.9px;
  color: #9CA3AF;
}

thead th.col-actor {
  text-align: right;
  padding-right: 0;
}

tbody tr {
  border-bottom: 1px solid #F3F4F6;
  page-break-inside: avoid;
}

tbody tr:last-child {
  border-bottom: none;
}

tbody tr:nth-child(even) {
  background: #FAFAFA;
}

tbody td {
  padding: 8px 8px 8px 0;
  vertical-align: top;
}

/* ─── Column Widths ─────────────────────────────────────────── */
.col-time {
  width: 46px;
  min-width: 46px;
  white-space: nowrap;
  color: #6B7280;
  font-size: 8px;
  font-variant-numeric: tabular-nums;
  padding-top: 10px !important;
}

.col-type {
  width: 120px;
  min-width: 120px;
  padding-right: 12px !important;
}

.col-summary {
  /* auto width */
}

.col-actor {
  width: 100px;
  min-width: 90px;
  text-align: right;
}

/* ─── Activity Badge ─────────────────────────────────────────── */
.type-badge {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 3px 7px 3px 5px;
  border-radius: 20px;
  font-size: 7.5px;
  font-weight: 600;
  letter-spacing: 0.2px;
  white-space: nowrap;
  line-height: 1.2;
}

.type-badge svg { flex-shrink: 0; }

.badge-document  { background: #EFF6FF; color: #1D4ED8; }
.badge-note      { background: #F5F3FF; color: #6D28D9; }
.badge-email     { background: #F0FDF4; color: #15803D; }
.badge-review    { background: #FFFBEB; color: #B45309; }
.badge-qc        { background: #FFF1F2; color: #BE123C; }
.badge-checklist { background: #ECFEFF; color: #0E7490; }
.badge-comment   { background: #F8FAFC; color: #475569; border: 1px solid #E2E8F0; }
.badge-app       { background: #F0FDF4; color: #059669; }

/* ─── Summary Cell ───────────────────────────────────────────── */
.summary-text {
  font-size: 8.5px;
  color: #1F2937;
  line-height: 1.45;
}

.file-chip {
  display: inline-flex;
  align-items: center;
  gap: 3px;
  margin-top: 4px;
  padding: 2px 7px 2px 5px;
  background: #F1F5F9;
  border: 1px solid #E2E8F0;
  border-radius: 4px;
  font-size: 7px;
  color: #64748B;
  max-width: 210px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  line-height: 1.4;
}

.file-chip svg { flex-shrink: 0; }

/* ─── Actor Cell ─────────────────────────────────────────────── */
.actor-name {
  font-weight: 600;
  color: #374151;
  font-size: 8px;
  text-align: right;
}

.actor-role {
  color: #9CA3AF;
  font-size: 7px;
  margin-top: 1px;
  text-align: right;
  text-transform: capitalize;
}

/* ─── Empty State ────────────────────────────────────────────── */
.empty-state {
  text-align: center;
  padding: 60px 0;
  color: #9CA3AF;
  font-size: 10.5px;
}
</style>
</head>
<body>

<!-- ─── Header ──────────────────────────────────────────────────────── -->
<div class="doc-header">
  <div class="doc-header-top">
    <div class="logo">
      ${logoHtml}
    </div>
    <div class="doc-meta">
      <div class="doc-meta-title">Application Activity Log</div>
      <div>Generated ${escapeHtml(generatedStr)} UTC</div>
      <div>Confidential &middot; Internal Use Only</div>
    </div>
  </div>

  <div class="doc-client-row">
    <div>
      <div class="client-label">Client</div>
      <div class="client-name">${escapeHtml(clientName)}</div>
      <div class="record-badge">${escapeHtml(recordTypeLabel)}</div>
    </div>
    <div class="stat-block">
      <div class="client-label" style="text-align:right;">Log Summary</div>
      <div class="stat-num">${totalEntries}</div>
      <div class="stat-label">${totalEntries === 1 ? 'activity' : 'activities'} &middot; ${totalDays} ${totalDays === 1 ? 'day' : 'days'}</div>
    </div>
  </div>
</div>

<!-- ─── Content ─────────────────────────────────────────────────────── -->
<div class="content">
  ${bodyContent}
</div>

</body>
</html>`;
}

// ─── Puppeteer PDF Generation ─────────────────────────────────────────────────

export async function generateActivityLogPdf(html: string): Promise<Buffer> {
  let browser: import('puppeteer-core').Browser | null = null;
  try {
    const config = getPuppeteerConfig(); // throws synchronously if Chrome not configured
    browser = await puppeteer.launch(config as Parameters<typeof puppeteer.launch>[0]);
    const page = await browser.newPage();

    // No network requests needed — all assets are inline
    await page.setContent(html, { waitUntil: 'domcontentloaded' });

    const pdf = await page.pdf({
      format:              'A4',
      printBackground:     true,
      margin:              { top: '0cm', bottom: '1.8cm', left: '0cm', right: '0cm' },
      displayHeaderFooter: true,
      headerTemplate:      '<div style="display:none"> </div>',
      footerTemplate: `
        <div style="
          font-size:7.5px;
          color:#9CA3AF;
          width:100%;
          display:flex;
          justify-content:space-between;
          padding:0 48px;
          font-family:-apple-system,'Helvetica Neue',Helvetica,Arial,sans-serif;
          align-items:center;
          height:100%;
        ">
          <span>WorldVisa &middot; Application Activity Log &middot; Confidential</span>
          <span>Page <span class="pageNumber"></span> of <span class="totalPages"></span></span>
        </div>`,
    });

    return Buffer.from(pdf); // pdf is Uint8Array in puppeteer-core v24+
  } finally {
    if (browser) {
      try { await browser.close(); } catch { /* suppress close errors */ }
    }
  }
}
