"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.pdfStyles = void 0;
exports.pdfStyles = `
  /* ========================================
     RESET & BASE STYLES
     ======================================== */
  * {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
  }

  html, body {
    width: 210mm;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif;
    font-size: 11pt;
    line-height: 1.6;
    color: #1F2937;
    background: #FFFFFF;
  }

  /* ========================================
     TYPOGRAPHY
     ======================================== */
  h1 {
    font-size: 24pt;
    font-weight: 700;
    line-height: 1.2;
    color: #0066CC;
    margin-top: 0;
    margin-bottom: 24pt;
  }

  h2 {
    font-size: 18pt;
    font-weight: 600;
    line-height: 1.3;
    color: #1F2937;
    margin-top: 20pt;
    margin-bottom: 16pt;
  }

  h3 {
    font-size: 14pt;
    font-weight: 600;
    line-height: 1.3;
    color: #374151;
    margin-top: 16pt;
    margin-bottom: 12pt;
  }

  h4 {
    font-size: 12pt;
    font-weight: 600;
    line-height: 1.3;
    color: #4B5563;
    margin-top: 12pt;
    margin-bottom: 8pt;
  }

  p {
    margin-bottom: 12pt;
    text-align: justify;
    orphans: 3;
    widows: 3;
  }

  strong {
    font-weight: 600;
    color: #111827;
  }

  em {
    font-style: italic;
  }

  /* ========================================
     COVER PAGE
     ======================================== */
  .cover-page {
    display: flex;
    flex-direction: column;
    min-height: 100vh;
    padding: 0;
    margin: 0;
    width: 100%;
  }

  .cover-logo {
    max-width: 200pt;
    max-height: 80pt;
    margin-bottom: 40pt;
  }

  .cover-title {
    font-size: 32pt;
    font-weight: 700;
    color: #0066CC;
    margin-bottom: 16pt;
    line-height: 1.2;
  }

  .cover-subtitle {
    font-size: 20pt;
    font-weight: 400;
    color: #4B5563;
    margin-bottom: 40pt;
  }

  .cover-meta {
    font-size: 12pt;
    color: #6B7280;
    margin-top: 60pt;
  }

  .cover-meta p {
    margin-bottom: 6pt;
  }

  /* ========================================
     PAGE LAYOUT
     ======================================== */
  .content-wrapper {
    padding: 6mm 6mm;
  }

  .page {
    padding: 6mm 6mm;
  }

  .page-break {
    page-break-after: always;
    break-after: page;
  }

  .page-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding-bottom: 12pt;
    margin-bottom: 20pt;
    border-bottom: 1pt solid #E5E7EB;
  }

  .page-header-logo {
    max-height: 30pt;
  }

  .page-header-title {
    font-size: 10pt;
    color: #6B7280;
  }

  .page-footer {
    position: fixed;
    bottom: 20mm;
    left: 25mm;
    right: 25mm;
    text-align: center;
    font-size: 9pt;
    color: #9CA3AF;
    padding-top: 12pt;
    border-top: 1pt solid #E5E7EB;
  }

  /* ========================================
     SECTIONS
     ======================================== */
  .section {
    margin-bottom: 24pt;
  }

  .section-header {
    margin-top: 24pt;
    margin-bottom: 20pt;
    padding-bottom: 10pt;
    border-bottom: 2pt solid #0066CC;
  }

  .section-number {
    display: inline-block;
    background: #0066CC;
    color: #FFFFFF;
    font-size: 14pt;
    font-weight: 700;
    padding: 6pt 14pt;
    border-radius: 4pt;
    margin-right: 10pt;
  }

  .section-title {
    display: inline-block;
    font-size: 20pt;
    font-weight: 600;
    color: #1F2937;
  }

  .subsection {
    margin-top: 0;
    margin-bottom: 20pt;
  }
  
  /* ========================================
     CARD COMPONENTS
     ======================================== */
  .card {
    background: #F9FAFB;
    border: 1pt solid #E5E7EB;
    border-radius: 6pt;
    padding: 16pt;
    margin-bottom: 12pt;
  }
  
  .card-header {
    margin-bottom: 12pt;
    padding-bottom: 8pt;
    border-bottom: 1pt solid #E5E7EB;
  }
  
  .card-title {
    font-size: 13pt;
    font-weight: 600;
    color: #1F2937;
  }
  
  .card-grid {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 12pt;
    margin: 16pt 0;
  }
  
  .card-grid-3 {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 12pt;
    margin: 16pt 0;
  }
  
  /* ========================================
     BADGES & INDICATORS
     ======================================== */
  .badge {
    display: inline-block;
    padding: 3pt 8pt;
    border-radius: 12pt;
    font-size: 9pt;
    font-weight: 600;
    margin-right: 6pt;
  }
  
  .badge-primary {
    background: #DBEAFE;
    color: #1E40AF;
  }
  
  .badge-success {
    background: #D1FAE5;
    color: #065F46;
  }
  
  .badge-warning {
    background: #FEF3C7;
    color: #92400E;
  }
  
  .badge-info {
    background: #E0E7FF;
    color: #3730A3;
  }
  
  .demand-indicator {
    display: inline-block;
    padding: 2pt 10pt;
    border-radius: 4pt;
    font-size: 9pt;
    font-weight: 600;
  }
  
  .demand-very-high {
    background: #10B981;
    color: #FFFFFF;
  }
  
  .demand-high {
    background: #34D399;
    color: #FFFFFF;
  }
  
  .demand-medium {
    background: #FBBF24;
    color: #FFFFFF;
  }

  /* ========================================
     TABLES
     ======================================== */
  table {
    width: 100%;
    border-collapse: collapse;
    margin: 16pt 0;
    font-size: 10pt;
    page-break-inside: auto;
  }

  tbody tr {
    page-break-inside: avoid;
    page-break-after: auto;
  }

  thead {
    background: linear-gradient(135deg, #EBF5FF 0%, #DBEAFE 100%);
  }

  thead th {
    padding: 10pt 12pt;
    text-align: left;
    font-weight: 600;
    color: #1F2937;
    border: 1pt solid #E5E7EB;
    font-size: 11pt;
  }

  tbody td {
    padding: 10pt 12pt;
    border: 1pt solid #E5E7EB;
    vertical-align: top;
    line-height: 1.5;
  }

  /* Ensure consistent table spacing */
  table {
    margin: 16pt 0;
  }

  tbody tr {
    page-break-inside: avoid;
  }

  tbody tr:nth-child(even) {
    background: #F9FAFB;
  }

  tbody tr:nth-child(odd) {
    background: #FFFFFF;
  }
  
  tbody tr:hover {
    background: #EBF5FF;
  }

  /* ========================================
     LISTS
     ======================================== */
  ul, ol {
    margin-left: 20pt;
    margin-bottom: 12pt;
  }

  li {
    margin-bottom: 6pt;
  }

  ul.checkmark-list {
    list-style: none;
    margin-left: 0;
  }

  ul.checkmark-list li {
    margin-bottom: 8pt;
  }

  ul.checkmark-list li:before {
    content: "✓ ";
    color: #10B981;
    font-weight: 700;
    margin-right: 6pt;
  }

  /* ========================================
     TABLE OF CONTENTS
     ======================================== */
  .toc {
    margin: 40pt 0;
  }

  .toc-title {
    font-size: 24pt;
    font-weight: 700;
    color: #0066CC;
    margin-bottom: 24pt;
    text-align: center;
  }

  .toc-item {
    display: flex;
    justify-content: space-between;
    padding: 8pt 0;
    border-bottom: 1pt dotted #D1D5DB;
    font-size: 11pt;
  }

  .toc-item-title {
    flex: 1;
    color: #374151;
  }

  .toc-item-page {
    color: #6B7280;
    font-weight: 600;
    margin-left: 12pt;
  }

  /* ========================================
     VISA PATHWAY CARDS
     ======================================== */
  .visa-pathway {
    background: #F9FAFB;
    border: 1pt solid #E5E7EB;
    border-left: 4pt solid #0066CC;
    padding: 16pt;
    margin-bottom: 16pt;
    border-radius: 4pt;
  }

  .visa-pathway-title {
    font-size: 14pt;
    font-weight: 600;
    color: #0066CC;
    margin-bottom: 8pt;
  }

  .visa-pathway-subclass {
    font-size: 12pt;
    color: #6B7280;
    margin-bottom: 12pt;
  }

  .visa-requirement {
    margin-bottom: 6pt;
  }

  .visa-requirement-label {
    font-weight: 600;
    color: #374151;
  }

  .visa-requirement-value {
    color: #4B5563;
  }

  /* ========================================
     TIMELINE
     ======================================== */
  .timeline {
    margin: 20pt 0;
  }

  .timeline-phase {
    position: relative;
    padding-left: 30pt;
    margin-bottom: 20pt;
    border-left: 3pt solid #0066CC;
    page-break-inside: avoid;
    background: #F9FAFB;
    padding: 16pt 16pt 16pt 30pt;
    border-radius: 4pt;
  }

  .timeline-phase:before {
    content: "";
    position: absolute;
    left: -8pt;
    top: 16pt;
    width: 14pt;
    height: 14pt;
    background: #0066CC;
    border-radius: 50%;
    border: 3pt solid #FFFFFF;
  }

  .timeline-phase-name {
    font-size: 13pt;
    font-weight: 600;
    color: #1F2937;
    margin-bottom: 6pt;
  }

  .timeline-phase-duration {
    font-size: 10pt;
    color: #6B7280;
    margin-bottom: 10pt;
    font-style: italic;
  }

  .timeline-steps {
    list-style: none;
    margin-left: 0;
  }

  .timeline-steps li {
    padding-left: 16pt;
    margin-bottom: 6pt;
    position: relative;
    font-size: 10pt;
  }

  .timeline-steps li:before {
    content: "→";
    position: absolute;
    left: 0;
    color: #0066CC;
    font-weight: 700;
  }

  /* ========================================
     COMPANY LIST & CARDS
     ======================================== */
  .company-tier {
    margin-bottom: 24pt;
    page-break-inside: avoid;
  }

  .company-tier-header {
    background: linear-gradient(135deg, #EBF5FF 0%, #DBEAFE 100%);
    padding: 10pt 14pt;
    margin-bottom: 14pt;
    border-left: 4pt solid #0066CC;
    border-radius: 4pt;
  }

  .company-tier-title {
    font-size: 14pt;
    font-weight: 600;
    color: #0066CC;
    margin-bottom: 4pt;
  }

  .company-tier-description {
    font-size: 10pt;
    color: #6B7280;
    margin-top: 4pt;
  }

  .company-list {
    list-style: none;
    margin-left: 0;
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 12pt;
  }

  .company-item {
    padding: 10pt 12pt;
    background: #F9FAFB;
    border: 1pt solid #E5E7EB;
    border-left: 3pt solid #0066CC;
    border-radius: 4pt;
    page-break-inside: avoid;
  }

  .company-name {
    font-weight: 600;
    color: #1F2937;
    font-size: 11pt;
    display: block;
    margin-bottom: 4pt;
  }

  .company-location {
    font-size: 9pt;
    color: #6B7280;
    background: #E5E7EB;
    padding: 2pt 6pt;
    border-radius: 8pt;
    display: inline-block;
    margin-bottom: 6pt;
  }

  .company-description {
    font-size: 10pt;
    color: #4B5563;
    margin-top: 4pt;
    line-height: 1.4;
  }
  
  /* ========================================
     CITY CARDS & SALARY VISUALIZATION
     ======================================== */
  .city-card {
    background: #F9FAFB;
    border: 1pt solid #E5E7EB;
    border-radius: 6pt;
    padding: 16pt;
    margin-bottom: 12pt;
    page-break-inside: avoid;
  }
  
  .city-card-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 12pt;
    padding-bottom: 8pt;
    border-bottom: 1pt solid #E5E7EB;
  }
  
  .city-name {
    font-size: 14pt;
    font-weight: 600;
    color: #1F2937;
  }
  
  .city-icon {
    font-size: 20pt;
  }
  
  .salary-range {
    margin: 8pt 0;
  }
  
  .salary-label {
    font-size: 10pt;
    font-weight: 600;
    color: #4B5563;
    display: block;
    margin-bottom: 4pt;
  }
  
  .salary-value {
    font-size: 12pt;
    font-weight: 700;
    color: #0066CC;
  }
  
  .salary-bar {
    height: 8pt;
    background: #E5E7EB;
    border-radius: 4pt;
    margin: 6pt 0;
    overflow: hidden;
  }
  
  .salary-bar-fill {
    height: 100%;
    background: linear-gradient(90deg, #0066CC 0%, #3B82F6 100%);
    border-radius: 4pt;
  }
  
  .city-details {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 12pt;
    margin-top: 12pt;
  }
  
  .city-detail-item {
    font-size: 9pt;
  }
  
  .city-detail-label {
    color: #6B7280;
    margin-bottom: 2pt;
  }
  
  .city-detail-value {
    font-weight: 600;
    color: #1F2937;
  }

  /* ========================================
     THANK YOU PAGE
     ======================================== */
  .thank-you-page {
    padding: 10pt;
    text-align: center;
    min-height: 100vh;
    display: flex;
    flex-direction: column;
    justify-content: center;
  }

  .thank-you-hero {
    background: linear-gradient(135deg, #EBF5FF 0%, #DBEAFE 100%);
    padding: 32pt;
    border-radius: 12pt;
    margin-bottom: 32pt;
  }

  .thank-you-heading {
    font-size: 28pt;
    font-weight: 700;
    color: #0066CC;
    margin-bottom: 16pt;
    line-height: 1.2;
  }

  .thank-you-message {
    font-size: 14pt;
    color: #374151;
    margin-bottom: 24pt;
    line-height: 1.8;
  }

  .about-worldvisa {
    text-align: left;
    margin: 24pt 0;
    padding: 24pt;
    background: #FFFFFF;
    border: 2pt solid #E5E7EB;
    border-radius: 8pt;
  }

  .about-worldvisa h3 {
    color: #0066CC;
    margin-top: 0;
    font-size: 16pt;
  }

  .contact-info {
    margin: 24pt 0;
    text-align: left;
    background: #F9FAFB;
    padding: 20pt;
    border-radius: 8pt;
  }

  .contact-item {
    margin-bottom: 10pt;
    font-size: 11pt;
    display: flex;
    align-items: center;
  }

  .cta-button {
    display: inline-block;
    background: linear-gradient(135deg, #0066CC 0%, #3B82F6 100%);
    color: #FFFFFF;
    padding: 14pt 40pt;
    font-size: 14pt;
    font-weight: 600;
    text-decoration: none;
    border-radius: 8pt;
    margin: 28pt 0;
    box-shadow: 0 4pt 12pt rgba(0, 102, 204, 0.3);
  }

  .footer-text {
    margin-top: 40pt;
    font-size: 10pt;
    color: #6B7280;
  }
  
  .trust-indicators {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 16pt;
    margin: 24pt 0;
  }
  
  .trust-item {
    text-align: center;
    padding: 16pt;
    background: #F9FAFB;
    border-radius: 6pt;
  }
  
  .trust-number {
    font-size: 24pt;
    font-weight: 700;
    color: #0066CC;
    display: block;
    margin-bottom: 4pt;
  }
  
  .trust-label {
    font-size: 10pt;
    color: #6B7280;
  }

  /* ========================================
     TABLE STYLES (Standardized - Overrides earlier definition)
     ======================================== */
  /* Note: Table styles are defined earlier, this section ensures consistency */

  /* ========================================
     UTILITY CLASSES
     ======================================== */
  .text-center {
    text-align: center;
  }

  .text-right {
    text-align: right;
  }

  .mb-small {
    margin-bottom: 8pt;
  }

  .mb-medium {
    margin-bottom: 16pt;
  }

  .mb-large {
    margin-bottom: 24pt;
  }

  .color-primary {
    color: #0066CC;
  }

  .color-success {
    color: #10B981;
  }

  .color-gray {
    color: #6B7280;
  }

  /* ========================================
     PAGE NUMBERING
     ======================================== */
  @page {
    margin: 15mm 15mm 20mm 15mm;
    
    @bottom-center {
      content: "Page " counter(page);
      font-size: 9pt;
      color: #6B7280;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif;
    }
  }
  
  /* Hide page number on cover page */
  .cover-page {
    page: cover;
  }
  
  @page cover {
    @bottom-center {
      content: none;
    }
  }

  .table-of-contents {
    page: toc;
  }

  @page toc {
    @bottom-center {
      content: none;
    }
  }

  /* ========================================
     PRINT OPTIMIZATION
     ======================================== */
  @media print {
    .page-break {
      page-break-after: always;
    }

    .no-print {
      display: none;
    }

    a {
      text-decoration: none;
      color: inherit;
    }

    table {
      page-break-inside: avoid;
    }

    .visa-pathway {
      page-break-inside: avoid;
    }

    .company-tier {
      page-break-inside: avoid;
    }
  }
`;
