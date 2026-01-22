import React, { ReactNode } from 'react';

interface PageLayoutProps {
  children: ReactNode;
  showHeader?: boolean;
  showFooter?: boolean;
  headerTitle?: string;
}

export function PageLayout({ 
  children, 
  showHeader = false, 
  showFooter = false,
  headerTitle 
}: PageLayoutProps) {
  return (
    <div className="page">
      {showHeader && (
        <div className="page-header">
          <div className="page-header-title">{headerTitle || 'Australia Report'}</div>
          <img 
            src="/images/logo.svg" 
            alt="WorldVisa" 
            className="page-header-logo"
          />
        </div>
      )}
      
      {children}
      
      {showFooter && (
        <div className="page-footer">
          WorldVisa - Your Global Immigration Partner
        </div>
      )}
    </div>
  );
}

