import { useState, useEffect, useRef, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import {
  collection, query, where, onSnapshot,
  addDoc, updateDoc, doc, serverTimestamp
} from 'firebase/firestore'
import { db } from '../lib/firebase'

/* ------------------------------------------------------------------ */
/*  Column definitions — 11 columns per Spesifikasi §4                */
/*  (Plant & Location excluded — they are navigation context)         */
/* ------------------------------------------------------------------ */
const COLUMNS = [
  { key: 'subMachine',     label: 'Sub-Machine',     width: 140, type: 'text' },
  { key: 'itemCode',       label: 'Item Code',       width: 120, type: 'text' },
  { key: 'category',       label: 'Category',        width: 120, type: 'text' },
  { key: 'part',           label: 'Part',             width: 130, type: 'text' },
  { key: 'description',    label: 'Description',     width: 160, type: 'text' },
  { key: 'spesification',  label: 'Spesification',   width: 160, type: 'text' },
  { key: 'warehouseName',  label: 'Warehouse Name',  width: 140, type: 'text' },
  { key: 'status',         label: 'Status',          width: 120, type: 'select', options: ['', 'Existing', 'Tidak Aktif'] },
  { key: 'qty',            label: 'Qty',             width: 70,  type: 'number' },
  { key: 'foto',           label: 'Foto',            width: 120, type: 'foto' },
  { key: 'qtyWh',          label: 'Qty WH',          width: 80,  type: 'number' },
]

/* ------------------------------------------------------------------ */
/*  Dummy locations — will be replaced by Firestore data later        */
/* ------------------------------------------------------------------ */
const LOCATIONS_BY_LINE = {
  line1: [
    { id: 'boiler-room',   name: 'Boiler Room' },
    { id: 'turbine-hall',   name: 'Turbine Hall' },
    { id: 'control-room',   name: 'Control Room' },
  ],
  line2: [
    { id: 'compressor',       name: 'Compressor' },
    { id: 'electrical-panel', name: 'Electrical Panel' },
    { id: 'generator-room',   name: 'Generator Room' },
  ],
  line3: [
    { id: 'pump-station',    name: 'Pump Station' },
    { id: 'cooling-tower',   name: 'Cooling Tower' },
    { id: 'water-treatment', name: 'Water Treatment' },
  ],
  line4: [
    { id: 'motor-room',   name: 'Motor Room' },
    { id: 'transformer',  name: 'Transformer' },
    { id: 'switchgear',   name: 'Switchgear' },
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
  }
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
function EditableCell({ value, field, rowId, type, canEdit, onSave }) {
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

    try {
      await onSave(rowId, field, newValue)
      // Show save indicator
      setShowSaved(true)
      savedTimerRef.current = setTimeout(() => setShowSaved(false), 1500)
    } catch (err) {
      console.error(`Failed to save ${field}:`, err)
      if (err.code === 'permission-denied') {
        alert('Permission denied: Anda tidak memiliki akses untuk mengedit data Line ini.')
      }
    }
  }

  function handleKeyDown(e) {
    if (e.key === 'Enter') {
      e.preventDefault()
      commitEdit()
    } else if (e.key === 'Escape') {
      setIsEditing(false)
    }
  }

  // --- Render: Edit mode ---
  if (isEditing) {
    if (type === 'select') {
      const options = COLUMNS.find(c => c.key === field)?.options || []
      return (
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
                alert('Permission denied: Anda tidak memiliki akses untuk mengedit data Line ini.')
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
    }

    return (
      <>
        <input
          ref={inputRef}
          type={type === 'number' ? 'number' : 'text'}
          className="grid-cell-input"
          value={editValue}
          onChange={(e) => setEditValue(e.target.value)}
          onBlur={commitEdit}
          onKeyDown={handleKeyDown}
        />
        {showSaved && <SaveIndicator />}
      </>
    )
  }

  // --- Render: Display mode ---

  // Foto column: render as link
  if (type === 'foto' && displayValue) {
    return (
      <div
        className={`grid-cell-display ${!canEdit ? 'grid-cell-display--readonly' : ''}`}
        onClick={canEdit ? startEdit : undefined}
      >
        <a
          href={displayValue}
          target="_blank"
          rel="noopener noreferrer"
          className="grid-cell-link"
          onClick={(e) => e.stopPropagation()}
        >
          {displayValue}
        </a>
        {showSaved && <SaveIndicator />}
      </div>
    )
  }

  // Status column: render as chip
  if (type === 'select' && displayValue) {
    const chipClass = displayValue === 'Existing' ? 'chip-existing' : displayValue === 'Tidak Aktif' ? 'chip-inactive' : ''
    return (
      <div
        className={`grid-cell-display ${!canEdit ? 'grid-cell-display--readonly' : ''}`}
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
  }

  // Default: text/number display
  return (
    <div
      className={`grid-cell-display ${!canEdit ? 'grid-cell-display--readonly' : ''} ${displayValue == null ? 'grid-cell-display--empty' : ''}`}
      onClick={canEdit ? startEdit : undefined}
    >
      <span>{displayValue != null ? displayValue : '—'}</span>
      {showSaved && <SaveIndicator />}
    </div>
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
/*  Main LinePage Component                                           */
/* ------------------------------------------------------------------ */
export default function LinePage() {
  const { lineId } = useParams()
  const navigate = useNavigate()
  const { currentUser, userRole, logout } = useAuth()

  const locations = LOCATIONS_BY_LINE[lineId] || []
  const [activeLocation, setActiveLocation] = useState(locations[0]?.id || '')
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(true)
  const [addingRow, setAddingRow] = useState(false)

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

  // Reset active location when lineId changes
  useEffect(() => {
    const locs = LOCATIONS_BY_LINE[lineId] || []
    if (locs.length > 0) {
      setActiveLocation(locs[0].id)
    }
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
    try {
      await addDoc(
        collection(db, 'components'),
        makeEmptyRow(lineId, activeLocation, currentUser?.uid)
      )
    } catch (err) {
      console.error('Failed to add row:', err)
      if (err.code === 'permission-denied') {
        alert('Permission denied: Anda tidak memiliki akses untuk menambah data di Line ini.')
      }
    } finally {
      setAddingRow(false)
    }
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

  // Total table width for min-width
  const ROW_NUM_WIDTH = 40
  const totalWidth = ROW_NUM_WIDTH + COLUMNS.reduce((sum, c) => sum + c.width, 0)

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
        <div className="location-tabs" style={{ background: '#ffffff' }}>
          {locations.map((loc) => (
            <button
              key={loc.id}
              className={`location-tab ${activeLocation === loc.id ? 'location-tab--active' : ''}`}
              onClick={() => setActiveLocation(loc.id)}
            >
              {loc.name}
            </button>
          ))}
        </div>

        {/* ---- Toolbar ---- */}
        <div className="grid-toolbar">
          {canEdit ? (
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
          ) : (
            <span style={{ fontSize: '13px', color: '#5f6368' }}>
              {activeLocationName} — {rows.length} baris
            </span>
          )}

          {canEdit && (
            <span style={{ fontSize: '12px', color: '#80868b', marginLeft: '8px' }}>
              {activeLocationName} — {rows.length} baris
            </span>
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
                  <th className="row-num" style={{ width: `${ROW_NUM_WIDTH}px` }}>#</th>
                  {COLUMNS.map((col) => (
                    <th key={col.key} style={{ width: `${col.width}px` }}>
                      {col.label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map((row, idx) => (
                  <tr key={row.id}>
                    <td className="row-num">
                      <div className="grid-cell-display grid-cell-display--readonly" style={{ justifyContent: 'center', padding: '6px 4px' }}>
                        {idx + 1}
                      </div>
                    </td>
                    {COLUMNS.map((col) => (
                      <td key={col.key}>
                        <EditableCell
                          value={row[col.key]}
                          field={col.key}
                          rowId={row.id}
                          type={col.type}
                          canEdit={canEdit}
                          onSave={handleSaveCell}
                        />
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </main>
    </div>
  )
}
