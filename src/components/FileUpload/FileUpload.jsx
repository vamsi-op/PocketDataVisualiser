/**
 * FileUpload component
 * --------------------
 * Drag-and-drop / click-to-upload area for CSV and TSV files.
 *
 * Props:
 *   onFile(file: File) — called when a valid file is selected
 */
import { useState, useRef } from 'react';
import './FileUpload.css';

const ACCEPTED = ['.csv', '.tsv', 'text/csv', 'text/tab-separated-values'];

/** @param {{ onFile: (file: File) => void }} props */
export default function FileUpload({ onFile }) {
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef(null);

  function handleFile(file) {
    if (!file) return;
    const ext = file.name.slice(file.name.lastIndexOf('.')).toLowerCase();
    if (ext !== '.csv' && ext !== '.tsv' && !file.type.includes('csv') && !file.type.includes('tab')) {
      alert('Please upload a .csv or .tsv file.');
      return;
    }
    onFile(file);
  }

  function onDrop(e) {
    e.preventDefault();
    setDragging(false);
    handleFile(e.dataTransfer.files[0]);
  }

  function onInputChange(e) {
    handleFile(e.target.files[0]);
  }

  return (
    <div
      id="file-upload-zone"
      className={`upload-zone ${dragging ? 'upload-zone--dragging' : ''}`}
      onClick={() => inputRef.current?.click()}
      onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
      onDragLeave={() => setDragging(false)}
      onDrop={onDrop}
      role="button"
      tabIndex={0}
      aria-label="Upload CSV or TSV file — click or drag and drop"
      onKeyDown={(e) => e.key === 'Enter' && inputRef.current?.click()}
    >
      <div className="upload-icon" aria-hidden="true">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
          <path strokeLinecap="round" strokeLinejoin="round"
            d="M12 16.5V9.75m0 0 3 3m-3-3-3 3M6.75 19.5a4.5 4.5 0 0 1-1.632-8.664
               50.003 50.003 0 0 0-.198-3.293A4.5 4.5 0 0 1 8.916 3h.084a4.5 4.5 0 0 1
               4.5 4.5v.017l-.009.013A4.5 4.5 0 0 1 17.25 19.5H6.75Z" />
        </svg>
      </div>
      <p className="upload-title">Drop your CSV / TSV here</p>
      <p className="upload-subtitle">or <span className="upload-link">browse files</span></p>
      <p className="upload-hint">Supports .csv and .tsv · All processing is done locally in your browser</p>
      <input
        ref={inputRef}
        id="file-input"
        type="file"
        accept={ACCEPTED.join(',')}
        onChange={onInputChange}
        className="upload-hidden-input"
        aria-hidden="true"
        tabIndex={-1}
      />
    </div>
  );
}
