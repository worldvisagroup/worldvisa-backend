import React, { ReactNode } from 'react';
interface PageLayoutProps {
    children: ReactNode;
    showHeader?: boolean;
    showFooter?: boolean;
    headerTitle?: string;
}
export declare function PageLayout({ children, showHeader, showFooter, headerTitle }: PageLayoutProps): React.JSX.Element;
export {};
