import React, { useState } from "react";

const C = {
  teal: '#14B8A6',
  tealLight: 'rgba(20,184,166,0.15)',
  surface: '#13131A',
  surfaceHover: '#1A1A24',
  border: '#2E2E3E',
  text: '#F1F0FF',
  muted: '#8B8A9B',
};

export default function ExportButton({ data = [], columns = [], filename = "export.csv" }) {
  const [downloading, setDownloading] = useState(false);

  const handleExport = () => {
    if (!data || data.length === 0) return;
    setDownloading(true);

    let headers = columns.map(c => c.key || c);
    let headerLabels = columns.map(c => c.label || c);

    if (headers.length === 0 && data.length > 0) {
      headers = Object.keys(data[0]);
      headerLabels = headers;
    }

    const csvRows = [];
    csvRows.push(headerLabels.map(h => `"${String(h).replace(/"/g, '""')}"`).join(","));

    for (const row of data) {
      const values = headers.map(header => {
        const val = row[header];
        const strVal = val !== null && val !== undefined ? String(val) : "";
        return `"${strVal.replace(/"/g, '""')}"`;
      });
      csvRows.push(values.join(","));
    }

    const csvString = csvRows.join("\n");
    const blob = new Blob([csvString], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    setTimeout(() => setDownloading(false), 800);
  };

  return (
    <button
      onClick={handleExport}
      disabled={downloading || !data || data.length === 0}
      onMouseEnter={e => { if (!downloading) e.currentTarget.style.background = C.tealLight; e.currentTarget.style.borderColor = C.teal; }}
      onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.borderColor = C.border; }}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 6,
        padding: '9px 16px',
        border: `1px solid ${C.border}`,
        borderRadius: 10,
        background: 'transparent',
        color: C.teal,
        fontSize: 13,
        fontWeight: 500,
        fontFamily: 'Poppins, sans-serif',
        cursor: downloading || !data || data.length === 0 ? 'default' : 'pointer',
        opacity: !data || data.length === 0 ? 0.5 : 1,
        transition: 'all .2s',
        whiteSpace: 'nowrap',
      }}
    >
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
        <polyline points="7 10 12 15 17 10" />
        <line x1="12" y1="15" x2="12" y2="3" />
      </svg>
      {downloading ? 'Exporting...' : 'Export CSV'}
    </button>
  );
}

