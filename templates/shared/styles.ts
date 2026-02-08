
export const pdfStyles = `
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
    font-family: 'Segoe UI', -apple-system, BlinkMacSystemFont, Helvetica, Arial, sans-serif;
    font-size: 14pt;
    line-height: 1.6;
    color: #1F2937;
    background: #FFFFFF;
  }

  /* ========================================
     TYPOGRAPHY - Tight, professional spacing
     ======================================== */
  h1 {
    font-size: 20pt;
    font-weight: 700;
    line-height: 1.2;
    color: #111827;
    margin-top: 0;
    margin-bottom: 10pt;
  }

  h2 {
    font-size: 18pt;
    font-weight: 600;
    line-height: 1.25;
    color: #1F2937;
    margin-top: 14pt;
    margin-bottom: 8pt;
  }

  h3 {
    font-size: 16pt;
    font-weight: 600;
    line-height: 1.3;
    color: #374151;
    margin-top: 10pt;
    margin-bottom: 6pt;
  }

  h4 {
    font-size: 14pt;
    font-weight: 600;
    line-height: 1.3;
    color: #4B5563;
    margin-top: 8pt;
    margin-bottom: 4pt;
  }

  p {
    margin-bottom: 6pt;
    text-align: left;
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

  /* ========================================
     PAGE LAYOUT - Compact padding
     ======================================== */
  .content-wrapper {
    padding: 0mm 6mm;
  }

  .page {
    padding: 8mm 6mm;
  }

  .page-break {
    page-break-after: always;
    break-after: page;
  }

  .page-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding-bottom: 8pt;
    margin-bottom: 14pt;
    border-bottom: 0.5pt solid #E5E7EB;
  }

  .page-header-logo {
    max-height: 24pt;
  }

  .page-header-title {
    font-size: 9pt;
    color: #9CA3AF;
    font-weight: 500;
  }

  .page-footer {
    position: fixed;
    bottom: 15mm;
    left: 15mm;
    right: 15mm;
    text-align: center;
    font-size: 8pt;
    color: #9CA3AF;
    padding-top: 8pt;
    border-top: 0.5pt solid #E5E7EB;
  }

  /* ========================================
     SECTIONS - Tight, no wasted space
     ======================================== */
  .section {
    margin-bottom: 8pt;
  }

  .section-header {
    margin-top: 0;
    margin-bottom: 12pt;
    padding-bottom: 6pt;
    border-bottom: 2pt solid #1B2A4A;
    display: flex;
    align-items: center;
    gap: 10pt;
  }

  .section-number {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    background: #1B2A4A;
    color: #FFFFFF;
    font-size: 11pt;
    font-weight: 700;
    width: 28pt;
    height: 28pt;
    border-radius: 4pt;
    flex-shrink: 0;
  }

  .section-title {
    font-size: 16pt;
    font-weight: 700;
    color: #111827;
    line-height: 1.2;
  }

  .subsection {
    margin-top: 0;
    margin-bottom: 10pt;
  }

  /* ========================================
     CARD COMPONENTS - Minimal, clean
     ======================================== */
  .card {
    background: #FAFAFA;
    border: 0.5pt solid #E5E7EB;
    border-radius: 4pt;
    padding: 10pt 12pt;
    margin-bottom: 8pt;
  }

  .card-header {
    margin-bottom: 6pt;
    padding-bottom: 4pt;
    border-bottom: 0.5pt solid #E5E7EB;
  }

  .card-title {
    font-size: 11pt;
    font-weight: 600;
    color: #1F2937;
  }

  .card-grid {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 8pt;
    margin: 8pt 0;
  }

  .card-grid-3 {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 8pt;
    margin: 8pt 0;
  }

  /* ========================================
     BADGES & INDICATORS
     ======================================== */
  .badge {
    display: inline-block;
    padding: 2pt 7pt;
    border-radius: 3pt;
    font-size: 8pt;
    font-weight: 600;
    margin-right: 4pt;
  }

  .badge-primary {
    background: #EFF6FF;
    color: #1E40AF;
  }

  .badge-success {
    background: #ECFDF5;
    color: #065F46;
  }

  .badge-warning {
    background: #FFFBEB;
    color: #92400E;
  }

  .badge-info {
    background: #EEF2FF;
    color: #3730A3;
  }

  .badge-red {
    background: #FEF2F2;
    color: #991B1B;
  }

  .demand-indicator {
    display: inline-block;
    padding: 1pt 8pt;
    border-radius: 3pt;
    font-size: 8pt;
    font-weight: 600;
  }

  .demand-very-high {
    background: #059669;
    color: #FFFFFF;
  }

  .demand-high {
    background: #10B981;
    color: #FFFFFF;
  }

  .demand-medium {
    background: #F59E0B;
    color: #FFFFFF;
  }

  /* ========================================
     TABLES - Compact, professional
     ======================================== */
  table {
    width: 100%;
    border-collapse: collapse;
    margin: 6pt 0;
    font-size: 9pt;
    page-break-inside: auto;
  }

  thead {
    background: #F8F9FA;
  }

  thead th {
    padding: 7pt 8pt;
    text-align: left;
    font-weight: 600;
    color: #374151;
    border-bottom: 1.5pt solid #D1D5DB;
    font-size: 9pt;
    text-transform: uppercase;
    letter-spacing: 0.02em;
  }

  tbody td {
    padding: 6pt 8pt;
    border-bottom: 0.5pt solid #E5E7EB;
    vertical-align: top;
    line-height: 1.4;
    color: #374151;
  }

  tbody tr {
    page-break-inside: avoid;
    page-break-after: auto;
  }

  tbody tr:nth-child(even) {
    background: #FAFAFA;
  }

  tbody tr:nth-child(odd) {
    background: #FFFFFF;
  }

  /* ========================================
     LISTS - Tight spacing
     ======================================== */
  ul, ol {
    margin-left: 14pt;
    margin-bottom: 6pt;
  }

  li {
    margin-bottom: 3pt;
    line-height: 1.4;
  }

  ul.checkmark-list {
    list-style: none;
    margin-left: 0;
  }

  ul.checkmark-list li {
    margin-bottom: 4pt;
  }

  ul.checkmark-list li:before {
    content: "\\2713  ";
    color: #059669;
    font-weight: 700;
    margin-right: 4pt;
  }

  /* ========================================
     TABLE OF CONTENTS
     ======================================== */
  .toc {
    margin: 20pt 0;
  }

  .toc-title {
    font-size: 22pt;
    font-weight: 700;
    color: #111827;
    margin-bottom: 16pt;
  }

  .toc-item {
    display: flex;
    justify-content: space-between;
    padding: 6pt 0;
    border-bottom: 0.5pt dotted #D1D5DB;
    font-size: 10pt;
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
    background: #FFFFFF;
    border: 0.5pt solid #E5E7EB;
    border-left: 3pt solid #1B2A4A;
    padding: 10pt 12pt;
    margin-bottom: 8pt;
    border-radius: 2pt;
  }

  .visa-pathway-title {
    font-size: 12pt;
    font-weight: 600;
    color: #111827;
    margin-bottom: 4pt;
  }

  .visa-pathway-subclass {
    font-size: 9pt;
    color: #6B7280;
    margin-bottom: 6pt;
  }

  .visa-requirement {
    margin-bottom: 3pt;
    font-size: 9pt;
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
    margin: 8pt 0;
  }

  .timeline-phase {
    position: relative;
    padding-left: 24pt;
    margin-bottom: 10pt;
    border-left: 2pt solid #1B2A4A;
    page-break-inside: avoid;
    padding: 8pt 10pt 8pt 24pt;
  }

  .timeline-phase:before {
    content: "";
    position: absolute;
    left: -6pt;
    top: 10pt;
    width: 10pt;
    height: 10pt;
    background: #1B2A4A;
    border-radius: 50%;
    border: 2pt solid #FFFFFF;
  }

  .timeline-phase-name {
    font-size: 11pt;
    font-weight: 600;
    color: #1F2937;
    margin-bottom: 3pt;
  }

  .timeline-phase-duration {
    font-size: 9pt;
    color: #6B7280;
    margin-bottom: 4pt;
  }

  .timeline-steps {
    list-style: none;
    margin-left: 0;
  }

  .timeline-steps li {
    padding-left: 12pt;
    margin-bottom: 2pt;
    position: relative;
    font-size: 12pt;
    color: #4B5563;
  }

  .timeline-steps li:before {
    content: "\\2192";
    position: absolute;
    left: 0;
    color: #1B2A4A;
    font-weight: 700;
  }

  /* ========================================
     COMPANY LIST & CARDS
     ======================================== */
  .company-tier {
    margin-bottom: 12pt;
    page-break-inside: avoid;
  }

  .company-tier-header {
    background: #F8F9FA;
    padding: 6pt 10pt;
    margin-bottom: 6pt;
    border-left: 3pt solid #1B2A4A;
    border-radius: 2pt;
  }

  .company-tier-title {
    font-size: 11pt;
    font-weight: 600;
    color: #111827;
    margin-bottom: 2pt;
  }

  .company-tier-description {
    font-size: 9pt;
    color: #6B7280;
    margin-top: 2pt;
  }

  .company-list {
    list-style: none;
    margin-left: 0;
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 6pt;
  }

  .company-item {
    padding: 6pt 8pt;
    background: #FFFFFF;
    border: 0.5pt solid #E5E7EB;
    border-radius: 3pt;
    page-break-inside: avoid;
  }

  .company-name {
    font-weight: 600;
    color: #1F2937;
    font-size: 9.5pt;
    display: block;
    margin-bottom: 2pt;
  }

  .company-location {
    font-size: 8pt;
    color: #6B7280;
    background: #F3F4F6;
    padding: 1pt 5pt;
    border-radius: 2pt;
    display: inline-block;
    margin-bottom: 3pt;
  }

  .company-description {
    font-size: 8.5pt;
    color: #4B5563;
    margin-top: 2pt;
    line-height: 1.3;
  }

  /* ========================================
     SALARY VARIATION
     ======================================== */
  .salary-variation-intro {
    font-size: 10pt;
    color: #475569;
    margin-bottom: 10pt;
    line-height: 1.5;
  }

  .city-card {
    background: #FFFFFF;
    border: 0.5pt solid #E5E7EB;
    border-left: 3pt solid #1B2A4A;
    border-radius: 3pt;
    padding: 10pt 12pt;
    margin-bottom: 8pt;
    page-break-inside: avoid;
  }

  .city-card-header {
    margin-bottom: 6pt;
    padding-bottom: 4pt;
    border-bottom: 0.5pt solid #E5E7EB;
  }

  .city-card-header-content {
    flex: 1;
  }

  .city-name {
    font-size: 12pt;
    font-weight: 600;
    color: #111827;
  }

  .city-card-subtitle {
    font-size: 8pt;
    color: #6B7280;
    margin-top: 2pt;
    margin-bottom: 0;
  }

  .city-card-salary-block {
    margin-bottom: 8pt;
    padding: 6pt 8pt;
    background: #FAFAFA;
    border-radius: 3pt;
  }

  .salary-range {
    margin: 4pt 0;
  }

  .salary-range-row {
    display: flex;
    align-items: center;
    gap: 8pt;
  }

  .salary-label {
    font-size: 9pt;
    font-weight: 600;
    color: #475569;
    display: block;
    margin-bottom: 2pt;
  }

  .salary-value {
    font-size: 10pt;
    font-weight: 700;
    color: #1B2A4A;
  }

  .salary-premium-badge {
    background: #EFF6FF;
    color: #1E40AF;
    border: 0.5pt solid #BFDBFE;
    padding: 1pt 6pt;
    border-radius: 2pt;
    font-size: 7.5pt;
    font-weight: 600;
  }

  .salary-bar {
    height: 6pt;
    background: #E5E7EB;
    border-radius: 3pt;
    margin: 3pt 0;
    overflow: hidden;
  }

  .salary-bar-fill {
    height: 100%;
    background: #1B2A4A;
    border-radius: 3pt;
  }

  .city-details {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 4pt 12pt;
    margin-top: 6pt;
  }

  .city-detail-item {
    font-size: 8.5pt;
  }

  .city-detail-label {
    color: #6B7280;
    margin-bottom: 1pt;
  }

  .city-detail-value {
    font-weight: 600;
    color: #1F2937;
  }

  .city-detail-value-accent {
    color: #1B2A4A;
  }

  .city-notes {
    margin-top: 6pt;
    padding: 6pt 8pt;
    background: #F0F4F8;
    border-left: 2pt solid #1B2A4A;
    border-radius: 0 3pt 3pt 0;
  }

  .city-notes-text {
    font-size: 8.5pt;
    color: #374151;
    margin-bottom: 0;
    line-height: 1.4;
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

  .thank-you-logo-container {
    text-align: center;
    margin-bottom: 24pt;
    width: 100%;
  }

  .thank-you-logo {
    max-width: 200pt;
    max-height: 80pt;
    height: auto;
    width: auto;
    object-fit: contain;
  }

  .about-worldvisa-logo {
    max-width: 20pt;
    max-height: 20pt;
    height: auto;
    width: auto;
    object-fit: contain;
    flex-shrink: 0;
  }

  .thank-you-hero {
    padding: 20pt;
    margin-bottom: 16pt;
  }

  .thank-you-heading {
    font-size: 22pt;
    font-weight: 700;
    color: #111827;
    margin-bottom: 10pt;
    line-height: 1.2;
  }

  .thank-you-message {
    font-size: 10pt;
    color: #4B5563;
    margin-bottom: 16pt;
    line-height: 1.6;
  }

  .about-worldvisa {
    text-align: left;
    margin: 12pt 0;
    padding: 14pt;
    background: #FFFFFF;
    border: 0.5pt solid #E5E7EB;
    border-radius: 4pt;
  }

  .about-worldvisa h3 {
    color: #111827;
    margin-top: 0;
    font-size: 13pt;
  }

  .contact-info {
    margin: 12pt 0;
    text-align: left;
    background: #FAFAFA;
    padding: 14pt;
    border-radius: 4pt;
  }

  .contact-item {
    margin-bottom: 6pt;
    font-size: 10pt;
    display: flex;
    align-items: center;
  }

  .cta-button {
    display: inline-block;
    background: #1B2A4A;
    color: #FFFFFF !important;
    padding: 10pt 32pt;
    font-size: 12pt;
    font-weight: 600;
    text-decoration: none;
    border-radius: 4pt;
    margin: 16pt 0;
  }

  .cta-button:visited {
    color: #FFFFFF !important;
  }

  .footer-text {
    margin-top: 20pt;
    font-size: 8pt;
    color: #9CA3AF;
  }

  .trust-indicators {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 8pt;
    margin: 12pt 0;
  }

  .trust-item {
    text-align: center;
    padding: 10pt;
    background: #FAFAFA;
    border-radius: 4pt;
  }

  .trust-number {
    font-size: 20pt;
    font-weight: 700;
    color: #1B2A4A;
    display: block;
    margin-bottom: 2pt;
  }

  .trust-label {
    font-size: 8pt;
    color: #6B7280;
  }

  /* ========================================
     UTILITY CLASSES
     ======================================== */
  .text-center { text-align: center; }
  .text-right { text-align: right; }
  .mb-small { margin-bottom: 4pt; }
  .mb-medium { margin-bottom: 8pt; }
  .mb-large { margin-bottom: 16pt; }
  .color-primary { color: #D52636; }
  .color-success { color: #059669; }
  .color-gray { color: #6B7280; }

  /* ========================================
     PAGE NUMBERING
     ======================================== */
  @page {
    margin: 12mm 12mm 16mm 12mm;

    @bottom-center {
      content: "Page " counter(page);
      font-size: 8pt;
      color: #9CA3AF;
      font-family: 'Segoe UI', -apple-system, BlinkMacSystemFont, Helvetica, Arial, sans-serif;
    }
  }

  .cover-page { page: cover; }
  @page cover {
    margin: 0;
    @bottom-center { content: none; }
  }

  .table-of-contents { page: toc; }
  @page toc {
    @bottom-center { content: none; }
  }

  /* ========================================
     PRINT OPTIMIZATION
     ======================================== */
  @media print {
    .page-break { page-break-after: always; }
    .no-print { display: none; }
    a { text-decoration: none; color: inherit; }
    .section { page-break-inside: avoid; }
    table { page-break-inside: auto; }
    tbody tr { page-break-inside: avoid; }
    .visa-pathway { page-break-inside: avoid; }
    .company-tier { page-break-inside: avoid; }
    .city-card { page-break-inside: avoid; }
  }
`;
