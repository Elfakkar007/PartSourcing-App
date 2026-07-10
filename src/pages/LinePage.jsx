import { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import { createPortal } from 'react-dom'
import { useParams, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { useToast } from '../contexts/ToastContext'
import {
  collection, query, where, onSnapshot,
  addDoc, updateDoc, doc, setDoc, serverTimestamp, writeBatch
} from 'firebase/firestore'
import { db } from '../lib/firebase'

/* ------------------------------------------------------------------ */
/*  Column definitions — 11 columns per Spesifikasi §4                */
/*  (Plant & Location excluded — they are navigation context)         */
/* ------------------------------------------------------------------ */
const COLUMNS = [
  { key: 'subMachine', label: 'Sub-Machine', width: 140, type: 'text', wide: true },
  { key: 'itemCode', label: 'Item Code', width: 120, type: 'text', wide: true },
  { key: 'category', label: 'Category', width: 120, type: 'text', wide: true },
  { key: 'part', label: 'Part', width: 130, type: 'text', wide: true },
  { key: 'description', label: 'Description', width: 160, type: 'text', wide: true },
  { key: 'spesification', label: 'Spesification', width: 160, type: 'text', wide: true },
  { key: 'warehouseName', label: 'Warehouse Name', width: 140, type: 'text', wide: true },
  { key: 'status', label: 'Status', width: 120, type: 'select', wide: true, options: ['', 'Existing', 'Tidak Aktif'] },
  { key: 'qty', label: 'Qty', width: 70, type: 'number', wide: true },
  { key: 'foto', label: 'Foto', width: 120, type: 'foto', wide: true },
  { key: 'qtyWh', label: 'Qty WH', width: 80, type: 'number', wide: true },
]

/* ------------------------------------------------------------------ */
/*  Dummy locations — will be replaced by Firestore data later        */
/* ------------------------------------------------------------------ */
const LOCATIONS_BY_LINE = {
  line1: [
    { id: 'boiler-room', name: 'Boiler Room' },
    { id: 'turbine-hall', name: 'Turbine Hall' },
    { id: 'control-room', name: 'Control Room' },
  ],
  line2: [
    { id: 'compressor', name: 'Compressor' },
    { id: 'electrical-panel', name: 'Electrical Panel' },
    { id: 'generator-room', name: 'Generator Room' },
  ],
  line3: [
    { id: 'pump-station', name: 'Pump Station' },
    { id: 'cooling-tower', name: 'Cooling Tower' },
    { id: 'water-treatment', name: 'Water Treatment' },
  ],
  line4: [
    { id: 'motor-room', name: 'Motor Room' },
    { id: 'transformer', name: 'Transformer' },
    { id: 'switchgear', name: 'Switchgear' },
    { id: 'battery-room', name: 'Battery Room' },
  ],
}

/* ------------------------------------------------------------------ */
/*  Helpers                                                           */
/* ------------------------------------------------------------------ */
function formatLineName(lineId) {
  // "line1" → "Line 1"
  const num = lineId?.replace('line', '')
  return num ? `Line ${num}` : lineId
}

function getUserLineId(assignedLine) {
  if (!assignedLine) return null
  if (typeof assignedLine === 'number') return `line${assignedLine}`
  if (typeof assignedLine === 'string' && !assignedLine.startsWith('line')) return `line${assignedLine}`
  return assignedLine
}

function makeEmptyRow(lineId, locationId, uid) {
  return {
    line: lineId,
    locationId,
    subMachine: '',
    itemCode: '',
    category: '',
    part: '',
    description: '',
    spesification: '',
    warehouseName: '',
    status: '',
    qty: null,
    foto: '',
    qtyWh: null,
    createdBy: uid || '',
    lastEditedBy: uid || '',
    createdAt: serverTimestamp(),
    lastUpdated: serverTimestamp(),
    isDeleted: false,
    flag: null,
  }
}

/**
 * Extract Google Drive file ID from various URL formats:
 *  - https://drive.google.com/file/d/FILE_ID/view?usp=sharing
 *  - https://drive.google.com/open?id=FILE_ID
 *  - https://drive.google.com/uc?id=FILE_ID&export=view
 */
function extractDriveFileId(url) {
  if (!url || typeof url !== 'string') return null
  // Match /file/d/FILE_ID pattern
  let match = url.match(/\/file\/d\/([a-zA-Z0-9_-]+)/)
  if (match) return match[1]
  // Match ?id=FILE_ID or &id=FILE_ID
  match = url.match(/[?&]id=([a-zA-Z0-9_-]+)/)
  if (match) return match[1]
  return null
}


/* ------------------------------------------------------------------ */
/*  SyncStatusBar (duplicated from Dashboard — extract later)         */
/* ------------------------------------------------------------------ */
function SyncStatusBar() {
  const [isOnline, setIsOnline] = useState(navigator.onLine)

  useEffect(() => {
    const onOnline = () => setIsOnline(true)
    const onOffline = () => setIsOnline(false)
    window.addEventListener('online', onOnline)
    window.addEventListener('offline', onOffline)
    return () => {
      window.removeEventListener('online', onOnline)
      window.removeEventListener('offline', onOffline)
    }
  }, [])

  return (
    <div className={isOnline ? 'sync-bar sync-bar--online' : 'sync-bar sync-bar--offline'}>
      {isOnline ? (
        <>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M20 6L9 17l-5-5" />
          </svg>
          <span>Tersimpan • Online</span>
        </>
      ) : (
        <>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
          <span>Mode Offline • Tersimpan di perangkat, akan sinkron otomatis</span>
        </>
      )}
    </div>
  )
}

/* ------------------------------------------------------------------ */
/*  EditableCell — the core inline-edit component                     */
/* ------------------------------------------------------------------ */
function EditableCell({ value, field, rowId, type, canEdit, onSave, wide, colKey }) {
  const [isEditing, setIsEditing] = useState(false)
  const [editValue, setEditValue] = useState('')
  const [showSaved, setShowSaved] = useState(false)
  const inputRef = useRef(null)
  const savedTimerRef = useRef(null)

  // Display value logic
  const displayValue = (value === null || value === undefined || value === '') ? null : value

  function startEdit() {
    if (!canEdit) return
    setEditValue(displayValue != null ? String(displayValue) : '')
    setIsEditing(true)
  }

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus()
      // For text inputs, select all on focus
      if (type !== 'select' && inputRef.current.select) {
        inputRef.current.select()
      }
      // Auto-resize textarea on mount
      if (type === 'text') {
        inputRef.current.style.height = '40px'
        inputRef.current.style.height = (inputRef.current.scrollHeight) + 'px'
      }
    }
  }, [isEditing, type])

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (savedTimerRef.current) clearTimeout(savedTimerRef.current)
    }
  }, [])

  async function commitEdit() {
    setIsEditing(false)

    // Convert value based on type
    let newValue = editValue
    if (type === 'number') {
      newValue = editValue === '' ? null : Number(editValue)
    }

    // Skip save if value unchanged
    const oldValue = displayValue != null ? (type === 'number' ? displayValue : String(displayValue)) : (type === 'number' ? null : '')
    if (newValue === oldValue) return

    onSave(rowId, field, newValue).then(() => {
      // Show save indicator
      setShowSaved(true)
      savedTimerRef.current = setTimeout(() => setShowSaved(false), 1500)
    }).catch(err => {
      console.error(`Failed to save ${field}:`, err)
      if (err.code === 'permission-denied') {
        addToast('Permission denied: Anda tidak memiliki akses untuk mengedit data Line ini.', 'error')
      }
    })
  }

  function handleKeyDown(e) {
    if (e.key === 'Enter') {
      e.preventDefault()
      commitEdit()
    } else if (e.key === 'Escape') {
      setIsEditing(false)
    }
  }

  // --- Determine content based on mode ---
  let content

  if (isEditing) {
    if (type === 'select') {
      const options = COLUMNS.find(c => c.key === field)?.options || []
      content = (
        <select
          ref={inputRef}
          className="grid-cell-select"
          value={editValue}
          onChange={(e) => {
            setEditValue(e.target.value)
            // Auto-commit on select change
            setIsEditing(false)
            const newVal = e.target.value
            onSave(rowId, field, newVal).then(() => {
              setShowSaved(true)
              savedTimerRef.current = setTimeout(() => setShowSaved(false), 1500)
            }).catch((err) => {
              console.error(`Failed to save ${field}:`, err)
              if (err.code === 'permission-denied') {
                addToast('Permission denied: Anda tidak memiliki akses untuk mengedit data Line ini.', 'error')
              }
            })
          }}
          onBlur={() => setIsEditing(false)}
          onKeyDown={handleKeyDown}
        >
          {options.map(opt => (
            <option key={opt} value={opt}>{opt || '— Pilih —'}</option>
          ))}
        </select>
      )
    } else if (type === 'text') {
      content = (
        <>
          <textarea
            ref={inputRef}
            className="grid-cell-input grid-cell-textarea"
            style={{
              position: 'absolute',
              left: 0,
              top: 0,
              width: '100%',
              minHeight: '40px',
              height: 'auto',
              zIndex: 10,
              boxShadow: 'rgba(0,0,0,0.15) 0 4px 16px, rgba(0,0,0,0.08) 0 1px 4px',
              borderRadius: '2px',
              background: '#ffffff',
              resize: 'none',
              wordWrap: 'break-word',
              whiteSpace: 'pre-wrap',
              overflow: 'hidden'
            }}
            value={editValue}
            onChange={(e) => {
              setEditValue(e.target.value)
              e.target.style.height = '40px'
              e.target.style.height = (e.target.scrollHeight) + 'px'
            }}
            onBlur={commitEdit}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault()
                commitEdit()
              } else if (e.key === 'Escape') {
                setIsEditing(false)
              }
            }}
          />
          {showSaved && <SaveIndicator />}
        </>
      )
    } else {
      content = (
        <>
          <input
            ref={inputRef}
            type="number"
            className="grid-cell-input"
            style={{
              position: 'absolute',
              left: 0,
              top: 0,
              width: '100%',
              height: '100%',
              zIndex: 10,
              boxShadow: 'rgba(0,0,0,0.15) 0 4px 16px, rgba(0,0,0,0.08) 0 1px 4px',
              borderRadius: '2px',
              background: '#ffffff'
            }}
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            onBlur={commitEdit}
            onKeyDown={handleKeyDown}
          />
          {showSaved && <SaveIndicator />}
        </>
      )
    }
  } else if (type === 'foto' && displayValue) {
    // Foto column: render as link with hover/tap preview
    content = (
      <FotoDisplay
        url={displayValue}
        canEdit={canEdit}
        onStartEdit={startEdit}
        showSaved={showSaved}
      />
    )
  } else if (type === 'select' && displayValue) {
    // Status column: render as chip
    const chipClass = displayValue === 'Existing' ? 'chip-existing' : displayValue === 'Tidak Aktif' ? 'chip-inactive' : ''
    content = (
      <div
        className={`grid-cell-display ${!canEdit ? 'grid-cell-display--readonly' : ''}`}
        title={String(displayValue)}
        onClick={canEdit ? startEdit : undefined}
      >
        {chipClass ? (
          <span className={chipClass} style={{ fontSize: '11px' }}>{displayValue}</span>
        ) : (
          <span>{displayValue}</span>
        )}
        {showSaved && <SaveIndicator />}
      </div>
    )
  } else {
    // Default: text/number display
    content = (
      <div
        className={`grid-cell-display ${!canEdit ? 'grid-cell-display--readonly' : ''} ${displayValue == null ? 'grid-cell-display--empty' : ''}`}
        title={displayValue != null ? String(displayValue) : undefined}
        onClick={canEdit ? startEdit : undefined}
      >
        <span>{displayValue != null ? displayValue : '—'}</span>
        {showSaved && <SaveIndicator />}
      </div>
    )
  }

  // --- Render: td wrapper ---
  // overflow:visible needed for: wide columns in edit mode, and foto popover
  const needsOverflow = (isEditing && wide) || (type === 'foto' && displayValue)
  return (
    <td style={needsOverflow ? { overflow: 'visible' } : undefined}>
      {content}
    </td>
  )
}

/* ------------------------------------------------------------------ */
/*  SaveIndicator — small ✓ that fades out                            */
/* ------------------------------------------------------------------ */
function SaveIndicator() {
  return (
    <span className="save-indicator">
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
        <path d="M20 6L9 17l-5-5" />
      </svg>
    </span>
  )
}

/* ------------------------------------------------------------------ */
/*  FotoDisplay — hover-preview (desktop) + tap-preview (mobile)       */
/*  per {component.data-grid.photo-link-cell} in design system         */
/* ------------------------------------------------------------------ */
function FotoDisplay({ url, canEdit, onStartEdit, showSaved }) {
  const [showPopover, setShowPopover] = useState(false)
  const [showModal, setShowModal] = useState(false)
  const [imgError, setImgError] = useState(false)
  const [popoverPos, setPopoverPos] = useState({ top: 0, left: 0 })
  const popoverTimer = useRef(null)
  const cellRef = useRef(null)

  const fileId = extractDriveFileId(url)
  const thumbnailUrl = fileId ? `https://drive.google.com/thumbnail?id=${fileId}&sz=w800` : null

  // Detect hover-capable device (desktop vs touch-only)
  const hasHover = typeof window !== 'undefined'
    && window.matchMedia('(hover: hover)').matches

  // Reset img error when URL changes
  useEffect(() => { setImgError(false) }, [url])

  // Cleanup timer
  useEffect(() => {
    return () => { if (popoverTimer.current) clearTimeout(popoverTimer.current) }
  }, [])

  function handleMouseEnter() {
    if (!hasHover || !thumbnailUrl) return
    // Calculate position from the cell element
    if (cellRef.current) {
      const rect = cellRef.current.getBoundingClientRect()
      setPopoverPos({
        top: rect.bottom + 4,
        left: rect.left,
      })
    }
    popoverTimer.current = setTimeout(() => setShowPopover(true), 250)
  }

  function handleMouseLeave() {
    if (popoverTimer.current) clearTimeout(popoverTimer.current)
    setShowPopover(false)
  }

  function handleLinkClick(e) {
    // On touch devices: first tap opens modal, not Drive
    if (!hasHover && thumbnailUrl) {
      e.preventDefault()
      e.stopPropagation()
      setShowModal(true)
      return
    }
    // On desktop: normal link behavior (open in new tab)
    e.stopPropagation()
  }

  const previewContent = imgError ? (
    <div className="foto-preview-error">
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
        <circle cx="8.5" cy="8.5" r="1.5" />
        <path d="m21 15-5-5L5 21" />
      </svg>
      <span>Preview tidak tersedia — pastikan file di-share publik</span>
    </div>
  ) : (
    <img
      src={thumbnailUrl}
      alt="Preview"
      className="foto-preview-img"
      onError={() => setImgError(true)}
    />
  )

  return (
    <div
      ref={cellRef}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      style={{ height: '100%' }}
    >
      {/* Display content — inside overflow:hidden for text truncation */}
      <div
        className={`grid-cell-display ${!canEdit ? 'grid-cell-display--readonly' : ''}`}
        title={String(url)}
        onClick={canEdit ? onStartEdit : undefined}
      >
        {/* Link text */}
        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="grid-cell-link"
          onClick={handleLinkClick}
        >
          {url}
        </a>

        {/* Separate "open in Drive" icon for mobile (always visible on touch) */}
        {!hasHover && (
          <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="foto-external-icon"
            onClick={(e) => e.stopPropagation()}
            title="Buka di Google Drive"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
              <polyline points="15 3 21 3 21 9" />
              <line x1="10" y1="14" x2="21" y2="3" />
            </svg>
          </a>
        )}

        {showSaved && <SaveIndicator />}
      </div>

      {/* Desktop hover popover — rendered via Portal to escape overflow clipping */}
      {showPopover && thumbnailUrl && createPortal(
        <div
          className="foto-popover"
          style={{
            position: 'fixed',
            top: `${popoverPos.top}px`,
            left: `${popoverPos.left}px`,
          }}
        >
          {previewContent}
        </div>,
        document.body
      )}

      {/* Mobile tap modal — rendered via Portal for consistency */}
      {showModal && thumbnailUrl && createPortal(
        <div className="foto-modal-backdrop" onClick={(e) => { e.stopPropagation(); setShowModal(false) }}>
          <div className="foto-modal" onClick={(e) => e.stopPropagation()}>
            {/* Close button */}
            <button className="foto-modal-close" onClick={() => setShowModal(false)}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>

            {previewContent}

            {/* Actions */}
            <div className="foto-modal-actions">
              <a
                href={url}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-secondary"
                style={{ fontSize: '13px', padding: '6px 14px', gap: '6px' }}
                onClick={(e) => e.stopPropagation()}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                  <polyline points="15 3 21 3 21 9" />
                  <line x1="10" y1="14" x2="21" y2="3" />
                </svg>
                Buka di Drive
              </a>
              <button
                className="btn-secondary"
                style={{ fontSize: '13px', padding: '6px 14px' }}
                onClick={() => setShowModal(false)}
              >
                Tutup
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  )
}

/* ------------------------------------------------------------------ */
/*  ConfirmDeleteModal — confirmation dialog for delete operations     */
/* ------------------------------------------------------------------ */
function ConfirmDeleteModal({ count, locationName, onConfirm, onCancel }) {
  return createPortal(
    <div className="modal-backdrop" onClick={onCancel}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <h3 className="modal-title">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#d93025" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
          Konfirmasi Hapus
        </h3>
        <div className="modal-body">
          <p>
            Anda akan menghapus <strong>{count} baris</strong> dari lokasi <strong>{locationName}</strong>.
          </p>
          <p style={{ fontSize: '12px', color: '#5f6368', marginTop: '8px' }}>
            Data yang dihapus akan dipindahkan ke Recycle Bin dan bisa di-restore oleh Admin.
          </p>
        </div>
        <div className="modal-footer">
          <button className="btn-secondary" onClick={onCancel}>Batal</button>
          <button className="btn-danger" onClick={onConfirm}>Hapus {count} Baris</button>
        </div>
      </div>
    </div>,
    document.body
  )
}

/* ------------------------------------------------------------------ */
/*  BulkAddModal — input dialog for adding multiple rows at once       */
/* ------------------------------------------------------------------ */
function BulkAddModal({ locationName, onConfirm, onCancel }) {
  const [count, setCount] = useState(5)
  const inputRef = useRef(null)

  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus()
      inputRef.current.select()
    }
  }, [])

  function handleSubmit(e) {
    e.preventDefault()
    const n = Math.max(1, Math.min(100, Math.floor(count)))
    onConfirm(n)
  }

  return createPortal(
    <div className="modal-backdrop" onClick={onCancel}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <h3 className="modal-title">Tambah Baris Sekaligus</h3>
        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            <p>Tambahkan beberapa baris kosong ke lokasi <strong>{locationName}</strong>.</p>
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '12px' }}>
              <span style={{ fontSize: '13px', color: '#1f2328', whiteSpace: 'nowrap' }}>Jumlah baris:</span>
              <input
                ref={inputRef}
                type="number"
                className="ds-input"
                style={{ width: '80px' }}
                value={count}
                onChange={(e) => setCount(Number(e.target.value))}
                min={1}
                max={100}
              />
            </label>
            <p style={{ fontSize: '12px', color: '#80868b', marginTop: '6px' }}>Maksimal 100 baris per sekali tambah.</p>
          </div>
          <div className="modal-footer">
            <button type="button" className="btn-secondary" onClick={onCancel}>Batal</button>
            <button type="submit" className="btn-primary">Tambah {Math.max(1, Math.min(100, Math.floor(count || 0)))} Baris</button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  )
}

/* ------------------------------------------------------------------ */
/*  BulkFillModal — dialog for mass updating a specific column        */
/* ------------------------------------------------------------------ */
function BulkFillModal({ count, columns, onConfirm, onCancel }) {
  const fillableColumns = columns.filter(c => c.key !== 'foto')
  const [selectedCol, setSelectedCol] = useState(fillableColumns[0]?.key || '')
  const [value, setValue] = useState('')

  const activeColDef = fillableColumns.find(c => c.key === selectedCol)

  function handleSubmit(e) {
    e.preventDefault()
    // For number fields, parse it if it's not empty, otherwise empty string
    let finalValue = value
    if (activeColDef?.type === 'number' && value !== '') {
      finalValue = Number(value)
    }
    onConfirm(selectedCol, finalValue)
  }

  return createPortal(
    <div className="modal-backdrop" onClick={onCancel}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <h3 className="modal-title">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--color-secondary)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 20h9" />
            <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
          </svg>
          Isi Kolom Massal
        </h3>
        <form onSubmit={handleSubmit}>
          <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <p style={{ marginBottom: '8px' }}>
              Anda akan mengisi kolom untuk <strong>{count} baris</strong> terpilih.
            </p>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <label style={{ fontSize: '13px', fontWeight: 500, color: '#1f2328' }}>Pilih Kolom:</label>
              <select
                value={selectedCol}
                onChange={(e) => { setSelectedCol(e.target.value); setValue('') }}
                style={{
                  padding: '6px 8px',
                  borderRadius: '4px',
                  border: '1px solid var(--color-border)',
                  fontSize: '13px',
                  background: 'var(--color-canvas)'
                }}
              >
                {fillableColumns.map(c => (
                  <option key={c.key} value={c.key}>{c.label}</option>
                ))}
              </select>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <label style={{ fontSize: '13px', fontWeight: 500, color: '#1f2328' }}>Nilai Baru:</label>
              {activeColDef?.type === 'select' ? (
                <select
                  value={value}
                  onChange={(e) => setValue(e.target.value)}
                  style={{
                    padding: '6px 8px',
                    borderRadius: '4px',
                    border: '1px solid var(--color-border)',
                    fontSize: '13px',
                    background: 'var(--color-canvas)'
                  }}
                >
                  {activeColDef.options.map(opt => (
                    <option key={opt} value={opt}>{opt || '(Kosong)'}</option>
                  ))}
                </select>
              ) : activeColDef?.type === 'number' ? (
                <input
                  type="number"
                  value={value}
                  onChange={(e) => setValue(e.target.value)}
                  style={{
                    padding: '6px 8px',
                    borderRadius: '4px',
                    border: '1px solid var(--color-border)',
                    fontSize: '13px',
                    background: 'var(--color-canvas)'
                  }}
                  placeholder="Masukkan angka..."
                />
              ) : (
                <input
                  type="text"
                  value={value}
                  onChange={(e) => setValue(e.target.value)}
                  style={{
                    padding: '6px 8px',
                    borderRadius: '4px',
                    border: '1px solid var(--color-border)',
                    fontSize: '13px',
                    background: 'var(--color-canvas)'
                  }}
                  placeholder="Masukkan teks..."
                />
              )}
            </div>
            
            <div style={{ padding: '8px', background: 'var(--color-surface-subtle)', borderRadius: '4px', fontSize: '12px', color: 'var(--color-ink-muted)', marginTop: '4px' }}>
              Akan mengisi kolom <strong>{activeColDef?.label}</strong> dengan nilai <strong>{value || '(Kosong)'}</strong> ke {count} baris terpilih.
            </div>
          </div>
          <div className="modal-footer">
            <button type="button" className="btn-secondary" onClick={onCancel}>Batal</button>
            <button type="submit" className="btn-primary">Konfirmasi</button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  )
}

/* ------------------------------------------------------------------ */
/*  FindReplaceModal — dialog for finding and replacing text           */
/* ------------------------------------------------------------------ */
function FindReplaceModal({ rows, columns, onConfirm, onCancel }) {
  const textColumns = columns.filter(c => c.type === 'text')
  const [selectedCol, setSelectedCol] = useState(textColumns[0]?.key || '')
  const [findText, setFindText] = useState('')
  const [replaceText, setReplaceText] = useState('')

  // Live preview logic
  const matches = useMemo(() => {
    if (!findText) return []
    const lowerFindText = findText.toLowerCase()
    
    return rows.map(row => {
      const val = row[selectedCol]
      if (typeof val === 'string' && val.toLowerCase().includes(lowerFindText)) {
        // Case-insensitive replace
        const regex = new RegExp(findText.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi')
        const newVal = val.replace(regex, replaceText)
        return {
          id: row.id,
          subMachine: row.subMachine || '(Tanpa Sub-Machine)',
          oldVal: val,
          newVal: newVal
        }
      }
      return null
    }).filter(Boolean)
  }, [rows, selectedCol, findText, replaceText])

  function handleSubmit(e) {
    e.preventDefault()
    if (matches.length > 0) {
      onConfirm(selectedCol, findText, replaceText, matches)
    }
  }

  return createPortal(
    <div className="modal-backdrop" onClick={onCancel}>
      <div className="modal-content" style={{ maxWidth: '600px', width: '90%' }} onClick={(e) => e.stopPropagation()}>
        <h3 className="modal-title">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--color-secondary)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          Cari & Ganti
        </h3>
        <form onSubmit={handleSubmit}>
          <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            
            <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', flex: 1, minWidth: '140px' }}>
                <label style={{ fontSize: '13px', fontWeight: 500, color: '#1f2328' }}>Kolom:</label>
                <select
                  value={selectedCol}
                  onChange={(e) => setSelectedCol(e.target.value)}
                  style={{ padding: '6px 8px', borderRadius: '4px', border: '1px solid var(--color-border)', fontSize: '13px', background: 'var(--color-canvas)' }}
                >
                  {textColumns.map(c => (
                    <option key={c.key} value={c.key}>{c.label}</option>
                  ))}
                </select>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', flex: 1, minWidth: '140px' }}>
                <label style={{ fontSize: '13px', fontWeight: 500, color: '#1f2328' }}>Cari:</label>
                <input
                  type="text"
                  value={findText}
                  onChange={(e) => setFindText(e.target.value)}
                  style={{ padding: '6px 8px', borderRadius: '4px', border: '1px solid var(--color-border)', fontSize: '13px' }}
                  placeholder="Teks yang dicari..."
                />
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', flex: 1, minWidth: '140px' }}>
                <label style={{ fontSize: '13px', fontWeight: 500, color: '#1f2328' }}>Ganti dengan:</label>
                <input
                  type="text"
                  value={replaceText}
                  onChange={(e) => setReplaceText(e.target.value)}
                  style={{ padding: '6px 8px', borderRadius: '4px', border: '1px solid var(--color-border)', fontSize: '13px' }}
                  placeholder="Kosongkan untuk hapus"
                />
              </div>
            </div>
            
            {findText ? (
              <div style={{ border: '1px solid var(--color-grid-line)', borderRadius: '4px', overflow: 'hidden', marginTop: '8px' }}>
                <div style={{ background: 'var(--color-surface-subtle)', padding: '6px 12px', fontSize: '12px', fontWeight: 500, color: 'var(--color-ink-muted)', borderBottom: '1px solid var(--color-grid-line)' }}>
                  Preview: {matches.length} baris cocok
                </div>
                <div style={{ maxHeight: '240px', overflowY: 'auto', background: '#fff' }}>
                  {matches.length > 0 ? (
                    <table style={{ width: '100%', fontSize: '12px', borderCollapse: 'collapse', tableLayout: 'fixed' }}>
                      <tbody>
                        {matches.map(m => (
                          <tr key={m.id} style={{ borderBottom: '1px solid var(--color-grid-line)' }}>
                            <td style={{ padding: '6px 12px', color: '#5f6368', width: '30%', verticalAlign: 'top', wordBreak: 'break-word' }}>{m.subMachine}</td>
                            <td style={{ padding: '6px 12px', color: '#d93025', textDecoration: 'line-through', verticalAlign: 'top', background: '#fce8e6', wordBreak: 'break-word' }}>{m.oldVal}</td>
                            <td style={{ padding: '6px 12px', color: '#188038', verticalAlign: 'top', background: '#e6f4ea', wordBreak: 'break-word' }}>{m.newVal}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  ) : (
                    <div style={{ padding: '16px', textAlign: 'center', color: '#5f6368', fontSize: '13px' }}>
                      Tidak ditemukan kecocokan
                    </div>
                  )}
                </div>
              </div>
            ) : (
               <div style={{ padding: '16px', textAlign: 'center', color: '#80868b', fontSize: '13px', border: '1px dashed var(--color-border)', borderRadius: '4px', marginTop: '8px' }}>
                 Ketik teks pencarian untuk melihat preview.
               </div>
            )}
          </div>
          <div className="modal-footer">
            <button type="button" className="btn-secondary" onClick={onCancel}>Batal</button>
            <button type="submit" className="btn-primary" disabled={matches.length === 0}>
              Ganti {matches.length > 0 ? `${matches.length} Kemunculan` : ''}
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  )
}

/* ------------------------------------------------------------------ */
/*  AddLocationModal — dialog for adding a new location                */
/* ------------------------------------------------------------------ */
function AddLocationModal({ onConfirm, onCancel }) {
  const [locName, setLocName] = useState('')

  return createPortal(
    <div className="modal-backdrop" onClick={onCancel}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <h3 className="modal-title">Tambah Lokasi Baru</h3>
        <form onSubmit={(e) => onConfirm(e, locName)}>
          <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <label style={{ fontSize: '13px', fontWeight: 500, color: '#1f2328' }}>Nama Lokasi:</label>
            <input
              type="text"
              value={locName}
              onChange={(e) => setLocName(e.target.value)}
              style={{
                padding: '6px 8px',
                borderRadius: '4px',
                border: '1px solid var(--color-border)',
                fontSize: '13px',
                width: '100%'
              }}
              placeholder="Misal: Storage Room"
              autoFocus
              required
            />
          </div>
          <div className="modal-footer">
            <button type="button" className="btn-secondary" onClick={onCancel}>Batal</button>
            <button type="submit" className="btn-primary" disabled={!locName.trim()}>Tambah</button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  )
}

/* ------------------------------------------------------------------ */
/*  ColumnFilterDropdown — per-column filter popover                   */
const EMPTY_SENTINEL = '__EMPTY__'

function ColumnFilterDropdown({ colKey, rows, currentFilter, onApply, onClose, anchorRect }) {
  // Gather unique values for this column
  const uniqueValues = useMemo(() => {
    const vals = new Set()
    let hasEmpty = false
    rows.forEach(row => {
      const v = row[colKey]
      if (v === null || v === undefined || v === '') {
        hasEmpty = true
      } else {
        vals.add(String(v))
      }
    })
    const sorted = [...vals].sort((a, b) => a.localeCompare(b, 'id'))
    if (hasEmpty) sorted.unshift(EMPTY_SENTINEL)
    return sorted
  }, [rows, colKey])

  // Local checked state — initialize from currentFilter or "all checked"
  const [checked, setChecked] = useState(() => {
    if (currentFilter) return new Set(currentFilter)
    return new Set(uniqueValues)
  })

  function toggleValue(val) {
    setChecked(prev => {
      const next = new Set(prev)
      if (next.has(val)) next.delete(val)
      else next.add(val)
      return next
    })
  }

  function selectAll() { setChecked(new Set(uniqueValues)) }
  function selectNone() { setChecked(new Set()) }

  function handleApply() {
    // If all are checked, remove filter for this column (= no filter)
    if (checked.size === uniqueValues.length) {
      onApply(colKey, null)
    } else {
      onApply(colKey, checked)
    }
    onClose()
  }

  // Position below the anchor
  const top = anchorRect ? anchorRect.bottom + 4 : 0
  const left = anchorRect ? Math.max(4, anchorRect.left - 60) : 0

  return createPortal(
    <>
      <div className="filter-backdrop" onClick={() => onClose()} />
      <div className="filter-dropdown" style={{ top: `${top}px`, left: `${left}px` }}>
        <div className="filter-dropdown-header">
          <button className="filter-link-btn" onClick={selectAll}>Pilih Semua</button>
          <button className="filter-link-btn" onClick={selectNone}>Hapus Semua</button>
        </div>
        <div className="filter-dropdown-list">
          {uniqueValues.length === 0 ? (
            <p style={{ fontSize: '12px', color: '#80868b', padding: '8px 0', textAlign: 'center' }}>Tidak ada data</p>
          ) : (
            uniqueValues.map(val => (
              <label key={val} className="filter-dropdown-item">
                <input
                  type="checkbox"
                  checked={checked.has(val)}
                  onChange={() => toggleValue(val)}
                />
                <span>{val === EMPTY_SENTINEL ? '(Kosong)' : val}</span>
              </label>
            ))
          )}
        </div>
        <div className="filter-dropdown-footer">
          <button className="btn-secondary" style={{ fontSize: '12px', padding: '4px 12px' }} onClick={() => onClose()}>Batal</button>
          <button className="btn-primary" style={{ fontSize: '12px', padding: '4px 12px' }} onClick={handleApply}>Terapkan</button>
        </div>
      </div>
    </>,
    document.body
  )
}

/* ------------------------------------------------------------------ */
/*  RowFlagPopover — popover to select row flag                        */
/* ------------------------------------------------------------------ */
function RowFlagPopover({ currentFlag, onSelect, onClose, anchorRect }) {
  const top = anchorRect ? anchorRect.bottom + 4 : 0
  const left = anchorRect ? Math.max(4, anchorRect.left - 20) : 0

  return createPortal(
    <>
      <div className="filter-backdrop" onClick={onClose} />
      <div className="filter-dropdown" style={{ top: `${top}px`, left: `${left}px`, minWidth: '160px' }}>
        <div className="filter-dropdown-list" style={{ padding: '4px 0' }}>
          <div 
            className={`flag-menu-item ${currentFlag === null ? 'flag-menu-item--active' : ''}`}
            onClick={() => { onSelect(null); onClose() }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ opacity: 0.5 }}>
              <path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z" />
              <line x1="4" y1="22" x2="4" y2="15" />
            </svg>
            Tidak ada tanda
          </div>
          <div 
            className={`flag-menu-item ${currentFlag === 'question' ? 'flag-menu-item--active' : ''}`}
            onClick={() => { onSelect('question'); onClose() }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="var(--color-warning)" stroke="var(--color-warning)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z" />
              <line x1="4" y1="22" x2="4" y2="15" />
            </svg>
            Perlu Ditanyakan
          </div>
          <div 
            className={`flag-menu-item ${currentFlag === 'skip' ? 'flag-menu-item--active' : ''}`}
            onClick={() => { onSelect('skip'); onClose() }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="var(--color-ink-muted)" stroke="var(--color-ink-muted)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z" />
              <line x1="4" y1="22" x2="4" y2="15" />
            </svg>
            Dilewati
          </div>
        </div>
      </div>
    </>,
    document.body
  )
}

/* ------------------------------------------------------------------ */
/*  Main LinePage Component                                           */
/* ------------------------------------------------------------------ */
export default function LinePage() {
  const { lineId } = useParams()
  const navigate = useNavigate()
  const { currentUser, userRole, logout } = useAuth()
  const { addToast } = useToast()

  const [locations, setLocations] = useState(LOCATIONS_BY_LINE[lineId] || [])
  const [activeLocation, setActiveLocation] = useState(locations[0]?.id || '')
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(true)
  const [addingRow, setAddingRow] = useState(false)
  const [selectedRows, setSelectedRows] = useState(new Set())
  const [showBulkAddModal, setShowBulkAddModal] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [showBulkFillModal, setShowBulkFillModal] = useState(false)
  const [showFindReplaceModal, setShowFindReplaceModal] = useState(false)
  const [showAddLocationModal, setShowAddLocationModal] = useState(false)
  const [deleteTargetIds, setDeleteTargetIds] = useState([])
  // Column filters: { colKey: Set<checked values> } — null = no filter
  const [columnFilters, setColumnFilters] = useState({})
  const [openFilterCol, setOpenFilterCol] = useState(null)
  const [filterAnchorRect, setFilterAnchorRect] = useState(null)
  // Row flag
  const [openFlagRow, setOpenFlagRow] = useState(null)
  const [flagAnchorRect, setFlagAnchorRect] = useState(null)
  const [openBulkFlagMenu, setOpenBulkFlagMenu] = useState(false)
  const [bulkFlagAnchorRect, setBulkFlagAnchorRect] = useState(null)

  // Permission check
  const userLineId = getUserLineId(currentUser?.assignedLine)
  const canEdit = userRole === 'admin' || (userRole === 'intern' && userLineId === lineId)

  const lineName = formatLineName(lineId)
  const activeLocationName = locations.find(l => l.id === activeLocation)?.name || activeLocation

  // ---- Firestore real-time listener ----
  useEffect(() => {
    if (!lineId || !activeLocation) {
      setRows([])
      setLoading(false)
      return
    }

    setLoading(true)
    setSelectedRows(new Set())
    setDeleteTargetIds([])
    setColumnFilters({})
    setOpenFilterCol(null)
    setOpenFlagRow(null)
    setOpenBulkFlagMenu(false)
    const q = query(
      collection(db, 'components'),
      where('line', '==', lineId),
      where('locationId', '==', activeLocation),
      where('isDeleted', '==', false)
    )

    const unsub = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(d => ({ id: d.id, ...d.data() }))
      // Sort by createdAt ascending (oldest first)
      data.sort((a, b) => {
        const aTime = a.createdAt?.toMillis?.() || 0
        const bTime = b.createdAt?.toMillis?.() || 0
        return aTime - bTime
      })
      setRows(data)
      setLoading(false)
    }, (error) => {
      console.error('Firestore onSnapshot error:', error)
      setLoading(false)
    })

    return unsub
  }, [lineId, activeLocation])

  // ---- Locations real-time listener ----
  useEffect(() => {
    if (!lineId) {
      setLocations([])
      return
    }
    const qLoc = query(collection(db, 'locations'), where('line', '==', lineId))
    const unsubLoc = onSnapshot(qLoc, (snapshot) => {
      const data = snapshot.docs.map(d => ({ id: d.id, ...d.data() }))
      // Sort by createdAt ascending
      data.sort((a, b) => {
        const aTime = a.createdAt?.toMillis?.() || 0
        const bTime = b.createdAt?.toMillis?.() || 0
        return aTime - bTime
      })

      if (data.length > 0) {
        setLocations(data)
        setActiveLocation(prev => {
          if (!data.find(l => l.id === prev)) {
            return data[0].id
          }
          return prev
        })
      } else {
        const fallback = LOCATIONS_BY_LINE[lineId] || []
        setLocations(fallback)
        setActiveLocation(prev => {
          if (!fallback.find(l => l.id === prev) && fallback.length > 0) {
            return fallback[0].id
          }
          return prev
        })
      }
    }, (error) => {
      console.error('Firestore onSnapshot error (locations):', error)
    })
    return unsubLoc
  }, [lineId])

  // ---- Save cell to Firestore ----
  const handleSaveCell = useCallback(async (rowId, field, value) => {
    const docRef = doc(db, 'components', rowId)
    await updateDoc(docRef, {
      [field]: value,
      lastEditedBy: currentUser?.uid || '',
      lastUpdated: serverTimestamp(),
    })
  }, [currentUser])

  // ---- Add new row ----
  async function handleAddRow() {
    if (!canEdit || addingRow) return
    setAddingRow(true)
    addDoc(
      collection(db, 'components'),
      makeEmptyRow(lineId, activeLocation, currentUser?.uid)
    ).catch((err) => {
      console.error('Failed to add row:', err)
      if (err.code === 'permission-denied') {
        addToast('Permission denied: Anda tidak memiliki akses untuk menambah data di Line ini.', 'error')
      }
    })
    setTimeout(() => setAddingRow(false), 300)
  }

  // ---- Bulk Add ----
  function handleBulkAdd(count) {
    if (!canEdit || count < 1) return
    const batch = writeBatch(db)
    for (let i = 0; i < count; i++) {
      const newDocRef = doc(collection(db, 'components'))
      batch.set(newDocRef, makeEmptyRow(lineId, activeLocation, currentUser?.uid))
    }
    batch.commit().catch((err) => {
      console.error('Bulk add failed:', err)
      if (err.code === 'permission-denied') {
        addToast('Permission denied: Anda tidak memiliki akses untuk menambah data di Line ini.', 'error')
      }
    })
    setShowBulkAddModal(false)
  }

  // ---- Duplicate row ----
  function handleDuplicate(row) {
    if (!canEdit) return
    const { id, createdAt, lastUpdated, ...data } = row
    addDoc(collection(db, 'components'), {
      ...data,
      createdBy: currentUser?.uid || '',
      lastEditedBy: currentUser?.uid || '',
      createdAt: serverTimestamp(),
      lastUpdated: serverTimestamp(),
    }).catch((err) => {
      console.error('Duplicate failed:', err)
      if (err.code === 'permission-denied') {
        addToast('Permission denied: Anda tidak memiliki akses untuk menduplikat data di Line ini.', 'error')
      }
    })
  }

  // ---- Delete (soft delete) ----
  function handleDelete() {
    if (!canEdit || deleteTargetIds.length === 0) return
    const batch = writeBatch(db)
    deleteTargetIds.forEach((rowId) => {
      const docRef = doc(db, 'components', rowId)
      batch.update(docRef, {
        isDeleted: true,
        deletedAt: serverTimestamp(),
        lastEditedBy: currentUser?.uid || '',
        lastUpdated: serverTimestamp(),
      })
    })
    batch.commit().catch((err) => {
      console.error('Delete failed:', err)
      if (err.code === 'permission-denied') {
        addToast('Permission denied: Anda tidak memiliki akses untuk menghapus data di Line ini.', 'error')
      }
    })
    setSelectedRows(new Set())
    setDeleteTargetIds([])
    setShowDeleteModal(false)
  }

  // ---- Row selection ----
  function toggleRowSelection(id) {
    setSelectedRows(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  function toggleSelectAll() {
    if (selectedRows.size === rows.length && rows.length > 0) {
      setSelectedRows(new Set())
    } else {
      setSelectedRows(new Set(rows.map(r => r.id)))
    }
  }

  // ---- Request delete (shows confirmation modal) ----
  function requestDelete(ids) {
    setDeleteTargetIds(ids)
    setShowDeleteModal(true)
  }

  async function handleLogout() {
    try {
      await logout()
      navigate('/login')
    } catch (err) {
      console.error('Logout error:', err)
    }
  }

  const roleLabelMap = {
    admin: 'Admin',
    intern: 'Internship',
  }

  // ---- Column filter logic (client-side) ----
  const hasActiveFilters = Object.keys(columnFilters).length > 0

  const filteredRows = useMemo(() => {
    if (!hasActiveFilters) return rows
    return rows.filter(row => {
      return Object.entries(columnFilters).every(([colKey, allowedValues]) => {
        const rawVal = row[colKey]
        const isEmpty = rawVal === null || rawVal === undefined || rawVal === ''
        if (isEmpty) return allowedValues.has(EMPTY_SENTINEL)
        return allowedValues.has(String(rawVal))
      })
    })
  }, [rows, columnFilters, hasActiveFilters])

  function handleFilterApply(colKey, checkedSet) {
    setColumnFilters(prev => {
      const next = { ...prev }
      if (checkedSet === null) {
        delete next[colKey]
      } else {
        next[colKey] = checkedSet
      }
      return next
    })
  }

  function clearAllFilters() {
    setColumnFilters({})
  }

  function openFilter(colKey, e) {
    const rect = e.currentTarget.getBoundingClientRect()
    setFilterAnchorRect(rect)
    setOpenFilterCol(colKey)
  }

  function openFlagMenu(rowId, e) {
    const rect = e.currentTarget.getBoundingClientRect()
    setFlagAnchorRect(rect)
    setOpenFlagRow(rowId)
  }

  function handleSetFlag(rowId, flagValue) {
    const docRef = doc(db, 'components', rowId)
    updateDoc(docRef, {
      flag: flagValue,
      lastEditedBy: currentUser?.uid || '',
      lastUpdated: serverTimestamp(),
    }).catch(err => {
      console.error('Failed to update flag:', err)
      if (err.code === 'permission-denied') {
        addToast('Permission denied: Anda tidak memiliki akses untuk mengedit data di Line ini.', 'error')
      }
    })
  }

  function handleBulkFlag(flagValue) {
    if (!canEdit || selectedRows.size === 0) return
    const batch = writeBatch(db)
    for (const rowId of selectedRows) {
      const docRef = doc(db, 'components', rowId)
      batch.update(docRef, {
        flag: flagValue,
        lastEditedBy: currentUser?.uid || '',
        lastUpdated: serverTimestamp(),
      })
    }
    batch.commit().catch(err => {
      console.error('Failed to bulk update flag:', err)
      if (err.code === 'permission-denied') {
        addToast('Permission denied: Anda tidak memiliki akses untuk mengedit data di Line ini.', 'error')
      }
    })
  }

  function openBulkFlag(e) {
    const rect = e.currentTarget.getBoundingClientRect()
    setBulkFlagAnchorRect(rect)
    setOpenBulkFlagMenu(true)
  }

  function handleBulkFill(colKey, value) {
    if (!canEdit || selectedRows.size === 0) return
    const batch = writeBatch(db)
    for (const rowId of selectedRows) {
      const docRef = doc(db, 'components', rowId)
      batch.update(docRef, {
        [colKey]: value,
        lastEditedBy: currentUser?.uid || '',
        lastUpdated: serverTimestamp(),
      })
    }
    batch.commit().then(() => {
      addToast(`${selectedRows.size} baris berhasil diperbarui.`, 'success')
    }).catch(err => {
      console.error('Failed to bulk fill column:', err)
      if (err.code === 'permission-denied') {
        addToast('Permission denied: Anda tidak memiliki akses untuk mengedit data di Line ini.', 'error')
      }
    })
    setShowBulkFillModal(false)
  }

  function handleFindReplace(colKey, findText, replaceText, matches) {
    if (!canEdit || matches.length === 0) return
    const batch = writeBatch(db)
    for (const match of matches) {
      const docRef = doc(db, 'components', match.id)
      batch.update(docRef, {
        [colKey]: match.newVal,
        lastEditedBy: currentUser?.uid || '',
        lastUpdated: serverTimestamp(),
      })
    }
    batch.commit().then(() => {
      addToast(`${matches.length} baris berhasil diperbarui.`, 'success')
    }).catch(err => {
      console.error('Failed to find and replace:', err)
      if (err.code === 'permission-denied') {
        addToast('Permission denied: Anda tidak memiliki akses untuk mengedit data di Line ini.', 'error')
      }
    })
    setShowFindReplaceModal(false)
  }

  async function handleAddLocation(e, locName) {
    e.preventDefault()
    if (!canEdit || !locName.trim()) return
    
    const trimmedName = locName.trim()
    const id = trimmedName.toLowerCase().replace(/[^a-z0-9]+/g, '-')
    
    // Check duplicate
    const exists = locations.find(l => l.name.toLowerCase() === trimmedName.toLowerCase() || l.id === id)
    if (exists) {
      addToast(`Lokasi '${trimmedName}' sudah ada di Line ini.`, 'error')
      return
    }

    const docRef = doc(db, 'locations', id)
    
    try {
      await setDoc(docRef, {
        name: locName.trim(),
        line: lineId,
        createdBy: currentUser?.uid || '',
        createdAt: serverTimestamp()
      })
      addToast('Location berhasil ditambahkan.', 'success')
      setActiveLocation(id)
      setShowAddLocationModal(false)
    } catch (err) {
      console.error('Failed to add location:', err)
      if (err.code === 'permission-denied') {
        addToast('Permission denied: Anda tidak memiliki akses untuk menambah lokasi di Line ini.', 'error')
      } else {
        addToast('Gagal menambah lokasi.', 'error')
      }
    }
  }

  // Total table width for min-width
  const FLAG_WIDTH = 32
  const ROW_NUM_WIDTH = 40
  const CHECKBOX_WIDTH = 40
  const ACTION_WIDTH = 80
  const totalWidth = (canEdit ? CHECKBOX_WIDTH : 0) + FLAG_WIDTH + ROW_NUM_WIDTH + COLUMNS.reduce((sum, c) => sum + c.width, 0) + (canEdit ? ACTION_WIDTH : 0)

  // ---- Unknown line ----
  if (!locations.length) {
    return (
      <div style={{ minHeight: '100svh', background: '#f8f9fa', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center' }}>
          <p style={{ fontSize: '16px', fontWeight: 600, color: '#1f2328' }}>Line tidak ditemukan</p>
          <p style={{ fontSize: '14px', color: '#5f6368', margin: '8px 0 16px' }}>
            "{lineId}" bukan Line yang valid.
          </p>
          <button className="btn-secondary" onClick={() => navigate('/')}>← Kembali ke Dashboard</button>
        </div>
      </div>
    )
  }

  return (
    <div style={{ minHeight: '100svh', background: '#f8f9fa' }}>
      {/* ---- Header ---- */}
      <header style={{
        background: '#ffffff',
        borderBottom: '1px solid #dadce0',
        position: 'sticky',
        top: 0,
        zIndex: 20,
      }}>
        <div style={{
          maxWidth: '1400px',
          margin: '0 auto',
          padding: '0 16px',
          height: '48px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}>
          {/* Left: back + logo + title */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <button
              onClick={() => navigate('/')}
              className="btn-secondary"
              style={{
                padding: '4px 10px',
                fontSize: '13px',
                color: '#5f6368',
                gap: '4px',
              }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M19 12H5M12 19l-7-7 7-7" />
              </svg>
              Dashboard
            </button>
            <div style={{
              width: '1px',
              height: '24px',
              background: '#dadce0',
            }} />
            <h1 style={{
              margin: 0,
              fontSize: '16px',
              fontWeight: 600,
              color: '#1f2328',
              lineHeight: 1.3,
            }}>
              {lineName}
            </h1>
          </div>

          {/* Right: user info + logout */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div style={{ textAlign: 'right' }}>
              <p style={{ margin: 0, fontSize: '13px', fontWeight: 600, color: '#1f2328', lineHeight: 1.2 }}>
                {currentUser?.displayName || currentUser?.email?.split('@')[0] || 'User'}
              </p>
              <p style={{ margin: 0, fontSize: '12px', color: '#5f6368', lineHeight: 1.3 }}>
                {roleLabelMap[userRole] || userRole || 'User'}
              </p>
            </div>
            <button
              onClick={handleLogout}
              className="btn-secondary"
              style={{ padding: '6px 12px', fontSize: '13px', color: '#5f6368' }}
            >
              Keluar
            </button>
          </div>
        </div>
      </header>

      {/* ---- Sync Status Bar ---- */}
      <SyncStatusBar />

      {/* ---- Main Content ---- */}
      <main style={{ maxWidth: '1400px', margin: '0 auto' }}>

        {/* ---- Permission warning for wrong-line interns ---- */}
        {!canEdit && userRole === 'intern' && (
          <div className="permission-banner">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
            <span>
              Read-only — Anda hanya memiliki akses edit ke{' '}
              <strong>{formatLineName(userLineId)}</strong>, bukan {lineName}.
            </span>
          </div>
        )}

        {/* ---- Location Tabs ---- */}
        <div className="location-tabs" style={{ background: '#ffffff', display: 'flex', alignItems: 'center' }}>
          {locations.map((loc) => (
            <button
              key={loc.id}
              className={`location-tab ${activeLocation === loc.id ? 'location-tab--active' : ''}`}
              onClick={() => setActiveLocation(loc.id)}
            >
              {loc.name}
            </button>
          ))}
          {canEdit && (
            <button 
              onClick={() => setShowAddLocationModal(true)}
              style={{
                background: 'transparent',
                border: 'none',
                color: 'var(--color-secondary)',
                fontWeight: 600,
                fontSize: '13px',
                padding: '8px 16px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '4px'
              }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="12" y1="5" x2="12" y2="19" />
                <line x1="5" y1="12" x2="19" y2="12" />
              </svg>
              Tambah Lokasi
            </button>
          )}
        </div>

        {/* ---- Toolbar ---- */}
        <div className="grid-toolbar">
          {canEdit ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
              {/* Add single row */}
              <button
                className="btn-secondary"
                style={{ padding: '6px 14px', fontSize: '13px', gap: '6px' }}
                onClick={handleAddRow}
                disabled={addingRow}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="12" y1="5" x2="12" y2="19" />
                  <line x1="5" y1="12" x2="19" y2="12" />
                </svg>
                {addingRow ? 'Menambahkan...' : 'Tambah Baris'}
              </button>

              {/* Bulk add */}
              <button
                className="btn-secondary"
                style={{ padding: '6px 14px', fontSize: '13px', gap: '6px' }}
                onClick={() => setShowBulkAddModal(true)}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                  <line x1="12" y1="8" x2="12" y2="16" />
                  <line x1="8" y1="12" x2="16" y2="12" />
                </svg>
                Tambah Sekaligus
              </button>

              {/* Find and Replace */}
              <button
                className="btn-secondary"
                style={{ padding: '6px 14px', fontSize: '13px', gap: '6px' }}
                onClick={() => setShowFindReplaceModal(true)}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="11" cy="11" r="8" />
                  <line x1="21" y1="21" x2="16.65" y2="16.65" />
                </svg>
                Cari & Ganti
              </button>

              {/* Bulk delete — only visible when rows are selected */}
              {selectedRows.size > 0 && (
                <button
                  className="btn-danger"
                  style={{ padding: '6px 14px', fontSize: '13px', gap: '6px' }}
                  onClick={() => requestDelete([...selectedRows])}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="3 6 5 6 21 6" />
                    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                  </svg>
                  Hapus {selectedRows.size} Terpilih
                </button>
              )}

              {/* Bulk flag — only visible when rows are selected */}
              {selectedRows.size > 0 && (
                <button
                  className="btn-secondary"
                  style={{ padding: '6px 14px', fontSize: '13px', gap: '6px' }}
                  onClick={openBulkFlag}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z" />
                    <line x1="4" y1="22" x2="4" y2="15" />
                  </svg>
                  Tandai {selectedRows.size} Terpilih
                </button>
              )}

              {/* Bulk fill column — only visible when rows are selected */}
              {selectedRows.size > 0 && (
                <button
                  className="btn-secondary"
                  style={{ padding: '6px 14px', fontSize: '13px', gap: '6px' }}
                  onClick={() => setShowBulkFillModal(true)}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 20h9" />
                    <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
                  </svg>
                  Isi Kolom Massal
                </button>
              )}

              {/* Clear all filters */}
              {hasActiveFilters && (
                <button
                  className="btn-secondary"
                  style={{ padding: '6px 14px', fontSize: '13px', gap: '6px', color: '#1a73e8' }}
                  onClick={clearAllFilters}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="18" y1="6" x2="6" y2="18" />
                    <line x1="6" y1="6" x2="18" y2="18" />
                  </svg>
                  Hapus Semua Filter
                </button>
              )}

              <span style={{ fontSize: '12px', color: '#80868b', marginLeft: '4px' }}>
                {activeLocationName} — {hasActiveFilters ? `${filteredRows.length} / ${rows.length}` : `${rows.length}`} baris
              </span>
            </div>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
              <span style={{ fontSize: '13px', color: '#5f6368' }}>
                {activeLocationName} — {hasActiveFilters ? `${filteredRows.length} / ${rows.length}` : `${rows.length}`} baris
              </span>
              {hasActiveFilters && (
                <button
                  className="btn-secondary"
                  style={{ padding: '4px 10px', fontSize: '12px', gap: '4px', color: '#1a73e8' }}
                  onClick={clearAllFilters}
                >
                  Hapus Filter
                </button>
              )}
            </div>
          )}
        </div>

        {/* ---- Data Grid ---- */}
        <div className="data-grid-wrapper">
          {loading ? (
            <div className="grid-empty-state">
              <div className="animate-spin" style={{
                width: '24px',
                height: '24px',
                border: '3px solid #e8eaed',
                borderTop: '3px solid #1a73e8',
                borderRadius: '50%',
                margin: '0 auto 12px',
              }} />
              <p>Memuat data...</p>
            </div>
          ) : rows.length === 0 ? (
            <div className="grid-empty-state">
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#dadce0" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ margin: '0 auto 12px', display: 'block' }}>
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                <polyline points="14 2 14 8 20 8" />
                <line x1="16" y1="13" x2="8" y2="13" />
                <line x1="16" y1="17" x2="8" y2="17" />
              </svg>
              <p style={{ fontWeight: 600, color: '#1f2328' }}>Belum ada data</p>
              <p>Lokasi <strong>{activeLocationName}</strong> belum memiliki baris data.</p>
              {canEdit && (
                <button
                  className="btn-primary"
                  style={{ marginTop: '12px', padding: '8px 20px', fontSize: '13px' }}
                  onClick={handleAddRow}
                  disabled={addingRow}
                >
                  + Tambah Baris Pertama
                </button>
              )}
            </div>
          ) : (
            <table className="data-grid" style={{ minWidth: `${totalWidth}px` }}>
              <thead>
                <tr>
                  {canEdit && (
                    <th className="grid-checkbox-col" style={{ width: `${CHECKBOX_WIDTH}px` }}>
                      <input
                        type="checkbox"
                        checked={filteredRows.length > 0 && selectedRows.size === filteredRows.length}
                        onChange={toggleSelectAll}
                        title="Pilih semua"
                      />
                    </th>
                  )}
                  <th className="grid-flag-col" style={{ width: `${FLAG_WIDTH}px` }}></th>
                  <th className="row-num" style={{ width: `${ROW_NUM_WIDTH}px` }}>#</th>
                  {COLUMNS.map((col) => {
                    const isActive = colKey => colKey in columnFilters
                    return (
                      <th key={col.key} style={{ width: `${col.width}px` }}>
                        <div className="th-filter-wrapper">
                          <span>{col.label}</span>
                          <button
                            className={`filter-icon-btn ${isActive(col.key) ? 'filter-icon-btn--active' : ''}`}
                            title={`Filter ${col.label}`}
                            onClick={(e) => openFilter(col.key, e)}
                          >
                            <svg width="12" height="12" viewBox="0 0 24 24" fill={isActive(col.key) ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
                            </svg>
                          </button>
                        </div>
                      </th>
                    )
                  })}
                  {canEdit && (
                    <th className="grid-action-col" style={{ width: `${ACTION_WIDTH}px` }}>Aksi</th>
                  )}
                </tr>
              </thead>
              <tbody>
                {filteredRows.map((row, idx) => {
                  const isSelected = selectedRows.has(row.id)
                  const hasFlag = !!row.flag
                  
                  let trClass = ''
                  if (isSelected && hasFlag) trClass = `row-flag-${row.flag} row-selected-flagged`
                  else if (isSelected) trClass = 'row-selected'
                  else if (hasFlag) trClass = `row-flag-${row.flag}`

                  return (
                  <tr key={row.id} className={trClass}>
                    {canEdit && (
                      <td className="grid-checkbox-col">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => toggleRowSelection(row.id)}
                        />
                      </td>
                    )}
                    <td className="grid-flag-col">
                      <button 
                        className={`row-flag-btn ${row.flag ? `row-flag-btn--${row.flag}` : ''}`}
                        onClick={(e) => canEdit && openFlagMenu(row.id, e)}
                        title={row.flag === 'question' ? 'Perlu Ditanyakan' : row.flag === 'skip' ? 'Dilewati' : canEdit ? 'Beri Tanda' : ''}
                        disabled={!canEdit}
                      >
                        <svg width="14" height="14" viewBox="0 0 24 24" 
                          fill={row.flag ? "currentColor" : "none"} 
                          stroke="currentColor" 
                          strokeWidth="2" 
                          strokeLinecap="round" strokeLinejoin="round"
                        >
                          <path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z" />
                          <line x1="4" y1="22" x2="4" y2="15" />
                        </svg>
                      </button>
                    </td>
                    <td className="row-num">
                      <div className="grid-cell-display grid-cell-display--readonly" style={{ justifyContent: 'center', padding: '6px 4px' }}>
                        {idx + 1}
                      </div>
                    </td>
                    {COLUMNS.map((col) => (
                      <EditableCell
                        key={col.key}
                        value={row[col.key]}
                        field={col.key}
                        rowId={row.id}
                        type={col.type}
                        canEdit={canEdit}
                        onSave={handleSaveCell}
                        wide={col.wide}
                      />
                    ))}
                    {canEdit && (
                      <td className="grid-action-col">
                        <div style={{ display: 'flex', gap: '4px', justifyContent: 'center' }}>
                          <button
                            className="action-btn"
                            title="Duplikat baris"
                            onClick={() => handleDuplicate(row)}
                          >
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                              <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                            </svg>
                          </button>
                          <button
                            className="action-btn action-btn--danger"
                            title="Hapus baris"
                            onClick={() => requestDelete([row.id])}
                          >
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <polyline points="3 6 5 6 21 6" />
                              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                            </svg>
                          </button>
                        </div>
                      </td>
                    )}
                  </tr>
                  )
                })}
              </tbody>
            </table>
          )}
        </div>

        {/* ---- Column Filter Dropdown ---- */}
        {openFilterCol && (
          <ColumnFilterDropdown
            colKey={openFilterCol}
            rows={rows}
            currentFilter={columnFilters[openFilterCol] || null}
            onApply={handleFilterApply}
            onClose={() => setOpenFilterCol(null)}
            anchorRect={filterAnchorRect}
          />
        )}

        {/* ---- Modals & Popovers ---- */}
        {showAddLocationModal && (
          <AddLocationModal
            onConfirm={handleAddLocation}
            onCancel={() => setShowAddLocationModal(false)}
          />
        )}
        {showFindReplaceModal && (
          <FindReplaceModal
            rows={rows}
            columns={COLUMNS}
            onConfirm={handleFindReplace}
            onCancel={() => setShowFindReplaceModal(false)}
          />
        )}
        {showBulkFillModal && (
          <BulkFillModal
            count={selectedRows.size}
            columns={COLUMNS}
            onConfirm={handleBulkFill}
            onCancel={() => setShowBulkFillModal(false)}
          />
        )}
        {openBulkFlagMenu && (
          <RowFlagPopover
            currentFlag={null} // No current flag state for bulk actions
            onSelect={(flagVal) => { handleBulkFlag(flagVal); setOpenBulkFlagMenu(false) }}
            onClose={() => setOpenBulkFlagMenu(false)}
            anchorRect={bulkFlagAnchorRect}
          />
        )}
        {openFlagRow && (
          <RowFlagPopover
            currentFlag={rows.find(r => r.id === openFlagRow)?.flag || null}
            onSelect={(flagVal) => handleSetFlag(openFlagRow, flagVal)}
            onClose={() => setOpenFlagRow(null)}
            anchorRect={flagAnchorRect}
          />
        )}
        {showBulkAddModal && (
          <BulkAddModal
            locationName={activeLocationName}
            onConfirm={handleBulkAdd}
            onCancel={() => setShowBulkAddModal(false)}
          />
        )}
        {showDeleteModal && (
          <ConfirmDeleteModal
            count={deleteTargetIds.length}
            locationName={activeLocationName}
            onConfirm={handleDelete}
            onCancel={() => { setShowDeleteModal(false); setDeleteTargetIds([]) }}
          />
        )}
      </main>
    </div>
  )
}
