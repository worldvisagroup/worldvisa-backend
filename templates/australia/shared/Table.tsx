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

export function Table({ columns, data }: TableProps) {
  return (
    <table>
      <thead>
        <tr>
          {columns.map((col, index) => (
            <th key={index} style={{ textAlign: col.align || 'left' }}>
              {col.header}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {data.map((row, rowIndex) => (
          <tr key={rowIndex}>
            {columns.map((col, colIndex) => (
              <td key={colIndex} style={{ textAlign: col.align || 'left' }}>
                {row[col.key]}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
}

