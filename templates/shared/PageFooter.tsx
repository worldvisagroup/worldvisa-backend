import React from 'react';

export function PageFooter() {
  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: `
        @page {
          @bottom-center {
            content: "Page " counter(page) " of " counter(pages);
            font-size: 9pt;
            color: #6B7280;
          }
        }
        
        /* Hide page number on cover page */
        .cover-page {
          counter-reset: page 0;
        }
      `}} />
    </>
  );
}

