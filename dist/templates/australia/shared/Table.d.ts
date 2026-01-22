import React from 'react';
interface TableColumn {
    header: string;
    key: string;
    align?: 'left' | 'center' | 'right';
}
interface TableProps {
    columns: TableColumn[];
    data: Record<string, string | number>[];
}
export declare function Table({ columns, data }: TableProps): React.JSX.Element;
export {};
