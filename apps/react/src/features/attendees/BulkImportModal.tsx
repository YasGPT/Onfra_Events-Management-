import { useState, type FC, type ChangeEvent } from 'react';
import { Modal, Icon } from '../../components/common';
import { attendeesApi, type BulkImportSummary } from '../../api';

export interface BulkImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  eventId: string;
  onImportComplete: () => void;
}

export const BulkImportModal: FC<BulkImportModalProps> = ({
  isOpen,
  onClose,
  eventId,
  onImportComplete,
}) => {
  const [file, setFile] = useState<File | null>(null);
  const [csvPreview, setCsvPreview] = useState<string[][]>([]);
  const [csvContent, setCsvContent] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [downloadingTemplate, setDownloadingTemplate] = useState(false);
  const [summary, setSummary] = useState<BulkImportSummary | null>(null);
  const [error, setError] = useState<string | null>(null);

  const resetState = () => {
    setFile(null);
    setCsvPreview([]);
    setCsvContent('');
    setLoading(false);
    setSummary(null);
    setError(null);
  };

  const handleClose = () => {
    resetState();
    onClose();
  };

  const handleDownloadTemplate = async () => {
    try {
      setDownloadingTemplate(true);
      setError(null);
      const csv = await attendeesApi.downloadImportTemplate(eventId);

      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'attendees_sample_template.csv';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err: any) {
      setError(err?.message || 'Failed to download sample CSV template.');
    } finally {
      setDownloadingTemplate(false);
    }
  };

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    setError(null);
    setSummary(null);

    if (!selected) {
      setFile(null);
      setCsvPreview([]);
      setCsvContent('');
      return;
    }

    if (!selected.name.toLowerCase().endsWith('.csv')) {
      setError('Please select a valid .csv file.');
      return;
    }

    setFile(selected);

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      setCsvContent(text || '');

      // Parse preview lines
      const lines = (text || '')
        .split(/\r?\n/)
        .map((l) => l.trim())
        .filter((l) => l.length > 0)
        .slice(0, 6); // Header + 5 sample rows

      const previewRows = lines.map((line) =>
        line.split(',').map((cell) => cell.replace(/^"(.*)"$/, '$1').trim()),
      );
      setCsvPreview(previewRows);
    };

    reader.onerror = () => {
      setError('Error reading file. Please try again.');
    };

    reader.readAsText(selected);
  };

  const handleUpload = async () => {
    if (!csvContent || !eventId) {
      setError('Please select a CSV file to upload.');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const res = await attendeesApi.uploadBulkImport(eventId, csvContent);
      setSummary(res.summary);
      onImportComplete();
    } catch (err: any) {
      setError(err?.message || 'Failed to import attendees from CSV.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal open={isOpen} onClose={handleClose} title="Bulk Import Attendees (CSV)">
      <div className="bulk-import-container" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
        <p style={{ margin: 0, color: 'var(--text-secondary, #64748b)', fontSize: '0.9rem' }}>
          Upload a CSV file to import multiple attendees into this event simultaneously. Pre-approved accounts will be created automatically.
        </p>

        {/* Template Download Card */}
        <div
          style={{
            padding: '1rem',
            background: 'var(--bg-subtle, #f8fafc)',
            border: '1px solid var(--border-color, #e2e8f0)',
            borderRadius: '8px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div>
            <strong style={{ fontSize: '0.95rem' }}>Need the format template?</strong>
            <p style={{ margin: '0.25rem 0 0', fontSize: '0.825rem', color: '#64748b' }}>
              Download our ready-to-use CSV template with correct headers.
            </p>
          </div>
          <button
            type="button"
            className="ghost-button"
            onClick={handleDownloadTemplate}
            disabled={downloadingTemplate}
            style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', whiteSpace: 'nowrap' }}
          >
            <Icon name="download" />
            {downloadingTemplate ? 'Downloading…' : 'Download Template'}
          </button>
        </div>

        {/* Error notification */}
        {error && (
          <div
            style={{
              padding: '0.75rem 1rem',
              backgroundColor: '#fef2f2',
              border: '1px solid #fecaca',
              borderRadius: '6px',
              color: '#dc2626',
              fontSize: '0.875rem',
            }}
          >
            {error}
          </div>
        )}

        {/* Summary Card upon successful import */}
        {summary && (
          <div
            style={{
              padding: '1rem',
              backgroundColor: '#f0fdf4',
              border: '1px solid #bbf7d0',
              borderRadius: '8px',
              color: '#166534',
            }}
          >
            <h4 style={{ margin: '0 0 0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Icon name="check-circle" /> Bulk Import Completed
            </h4>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.75rem', marginTop: '0.75rem' }}>
              <div style={{ padding: '0.5rem', background: '#ffffff', borderRadius: '6px', textAlign: 'center' }}>
                <div style={{ fontSize: '0.75rem', color: '#64748b' }}>Total Rows</div>
                <strong style={{ fontSize: '1.25rem', color: '#0f172a' }}>{summary.total}</strong>
              </div>
              <div style={{ padding: '0.5rem', background: '#ffffff', borderRadius: '6px', textAlign: 'center' }}>
                <div style={{ fontSize: '0.75rem', color: '#166534' }}>Imported</div>
                <strong style={{ fontSize: '1.25rem', color: '#16a34a' }}>{summary.imported}</strong>
              </div>
              <div style={{ padding: '0.5rem', background: '#ffffff', borderRadius: '6px', textAlign: 'center' }}>
                <div style={{ fontSize: '0.75rem', color: '#ca8a04' }}>Duplicates</div>
                <strong style={{ fontSize: '1.25rem', color: '#eab308' }}>{summary.duplicates}</strong>
              </div>
              <div style={{ padding: '0.5rem', background: '#ffffff', borderRadius: '6px', textAlign: 'center' }}>
                <div style={{ fontSize: '0.75rem', color: '#dc2626' }}>Failed</div>
                <strong style={{ fontSize: '1.25rem', color: '#ef4444' }}>{summary.failed}</strong>
              </div>
            </div>
          </div>
        )}

        {/* File Picker */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          <label style={{ fontSize: '0.875rem', fontWeight: 600 }}>Select CSV File</label>
          <input
            type="file"
            accept=".csv,text/csv"
            onChange={handleFileChange}
            disabled={loading}
            style={{
              padding: '0.6rem',
              border: '1px solid #cbd5e1',
              borderRadius: '6px',
              fontSize: '0.9rem',
              cursor: 'pointer',
            }}
          />
          {file && (
            <span style={{ fontSize: '0.8rem', color: '#64748b' }}>
              Selected: <strong>{file.name}</strong> ({(file.size / 1024).toFixed(1)} KB)
            </span>
          )}
        </div>

        {/* CSV Preview Table */}
        {csvPreview.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <span style={{ fontSize: '0.85rem', fontWeight: 600, color: '#334155' }}>
              Data Preview (First {Math.min(5, csvPreview.length - 1)} rows)
            </span>
            <div
              style={{
                maxHeight: '180px',
                overflowX: 'auto',
                overflowY: 'auto',
                border: '1px solid #e2e8f0',
                borderRadius: '6px',
              }}
            >
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8rem' }}>
                <thead>
                  <tr style={{ background: '#f1f5f9', borderBottom: '1px solid #cbd5e1' }}>
                    {csvPreview[0]?.map((col, idx) => (
                      <th key={idx} style={{ padding: '6px 10px', textAlign: 'left', fontWeight: 600 }}>
                        {col}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {csvPreview.slice(1).map((row, rIdx) => (
                    <tr key={rIdx} style={{ borderBottom: '1px solid #f1f5f9' }}>
                      {row.map((cell, cIdx) => (
                        <td key={cIdx} style={{ padding: '6px 10px' }}>
                          {cell || <span style={{ color: '#94a3b8' }}>—</span>}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Actions */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1rem' }}>
          <button type="button" className="ghost-button" onClick={handleClose} disabled={loading}>
            {summary ? 'Close' : 'Cancel'}
          </button>
          {!summary && (
            <button
              type="button"
              className="primary-button"
              onClick={handleUpload}
              disabled={loading || !file}
              style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}
            >
              <Icon name="plus" />
              {loading ? 'Importing…' : 'Upload & Import'}
            </button>
          )}
        </div>
      </div>
    </Modal>
  );
};

export default BulkImportModal;
