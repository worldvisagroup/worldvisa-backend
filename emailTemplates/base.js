'use strict';

const LOGO_URL = process.env.COMPANY_LOGO_URL || '';
const COMPANY_NAME = 'WorldVisa Group';

function base(contentHtml, { previewText = '' } = {}) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <meta http-equiv="X-UA-Compatible" content="IE=edge" />
  <title>${COMPANY_NAME}</title>
  <!--[if mso]>
  <noscript>
    <xml><o:OfficeDocumentSettings><o:PixelsPerInch>96</o:PixelsPerInch></o:OfficeDocumentSettings></xml>
  </noscript>
  <![endif]-->
</head>
<body style="margin:0;padding:0;background-color:#f5f5f5;font-family:Arial,Helvetica,sans-serif;-webkit-text-size-adjust:100%;-ms-text-size-adjust:100%;">

${previewText ? `<div style="display:none;max-height:0;overflow:hidden;mso-hide:all;">${previewText}&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;</div>` : ''}

<table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color:#f5f5f5;">
  <tr>
    <td align="center" style="padding:32px 16px;">

      <!-- Outer card -->
      <table role="presentation" width="600" cellspacing="0" cellpadding="0" border="0" style="max-width:600px;width:100%;background-color:#ffffff;border:1px solid #e0e0e0;">

        <!-- Header -->
        <tr>
          <td style="padding:28px 32px 24px 32px;border-bottom:2px solid #000000;">
            ${LOGO_URL
              ? `<img src="${LOGO_URL}" alt="${COMPANY_NAME}" width="140" height="auto" style="display:block;border:0;outline:none;" />`
              : `<span style="font-size:18px;font-weight:700;color:#000000;letter-spacing:-0.3px;">${COMPANY_NAME}</span>`
            }
          </td>
        </tr>

        <!-- Body content -->
        <tr>
          <td style="padding:32px 32px 24px 32px;">
            ${contentHtml}
          </td>
        </tr>

        <!-- Footer -->
        <tr>
          <td style="padding:20px 32px 28px 32px;border-top:1px solid #e0e0e0;">
            <p style="margin:0 0 4px 0;font-size:11px;color:#888888;line-height:1.5;">
              This is an automated notification from ${COMPANY_NAME}. Please do not reply to this email.
            </p>
            <p style="margin:0;font-size:11px;color:#888888;line-height:1.5;">
              &copy; ${new Date().getFullYear()} ${COMPANY_NAME}. All rights reserved.
            </p>
          </td>
        </tr>

      </table>
      <!-- /Outer card -->

    </td>
  </tr>
</table>

</body>
</html>`;
}

module.exports = { base };
