import { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { useNavigate } from 'react-router-dom'

/* ------------------------------------------------------------------ */
/*  Placeholder data — will be replaced by live Firestore queries     */
/* ------------------------------------------------------------------ */
const LINES = [
  { id: 1, name: 'Line 1', totalRows: 142, completedRows: 98, locations: ['Boiler Room', 'Turbine Hall', 'Control Room'] },
  { id: 2, name: 'Line 2', totalRows: 118, completedRows: 67, locations: ['Compressor', 'Electrical Panel', 'Generator Room'] },
  { id: 3, name: 'Line 3', totalRows: 95, completedRows: 41, locations: ['Pump Station', 'Cooling Tower', 'Water Treatment'] },
  { id: 4, name: 'Line 4', totalRows: 130, completedRows: 112, locations: ['Motor Room', 'Transformer', 'Switchgear', 'Battery Room'] },
]

const STATUS_SUMMARY = {
  totalParts: 485,
  existing: 387,
  inactive: 98,
}

const CATEGORIES = [
  { name: 'Motor', count: 68 },
  { name: 'Sensor', count: 54 },
  { name: 'Relay', count: 47 },
  { name: 'Breaker', count: 42 },
  { name: 'Cable', count: 39 },
  { name: 'Contactor', count: 35 },
  { name: 'PLC', count: 28 },
  { name: 'Lainnya', count: 172 },
]

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

function StatCard({ label, value, subtext, accent }) {
  const accentMap = {
    primary: { bg: '#e6f4ea', color: '#188038' },
    secondary: { bg: '#e8f0fe', color: '#1a73e8' },
    warning: { bg: '#fef7e0', color: '#f9ab00' },
    danger: { bg: '#fce8e6', color: '#d93025' },
  }
  const a = accentMap[accent] || accentMap.primary

  return (
    <div className="ds-card" style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
      <div style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: '36px',
        height: '36px',
        borderRadius: '8px',
        background: a.bg,
        flexShrink: 0,
      }}>
        <span style={{ fontSize: '16px', fontWeight: 700, color: a.color }}>{typeof value === 'number' ? '' : value}</span>
        {typeof value === 'number' && (
          <span style={{ fontSize: '14px', fontWeight: 700, color: a.color }}>#</span>
        )}
      </div>
      <div>
        <p style={{ fontSize: '24px', fontWeight: 700, color: '#1f2328', lineHeight: 1.1, margin: 0 }}>
          {typeof value === 'number' ? value.toLocaleString('id-ID') : value}
        </p>
        <p style={{ fontSize: '13px', color: '#5f6368', margin: '2px 0 0' }}>{label}</p>
        {subtext && (
          <p style={{ fontSize: '12px', color: '#80868b', margin: '2px 0 0' }}>{subtext}</p>
        )}
      </div>
    </div>
  )
}

function ProgressCard({ line, isOwnLine, onClick }) {
  const pct = line.totalRows > 0 ? Math.round((line.completedRows / line.totalRows) * 100) : 0

  return (
    <div
      className="ds-card"
      onClick={onClick}
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '12px',
        cursor: onClick ? 'pointer' : 'default',
        transition: 'box-shadow 0.15s',
        ...(isOwnLine ? {
          borderLeft: '3px solid #1a73e8',
          background: '#f8fbff',
        } : {}),
      }}
      onMouseEnter={(e) => { if (onClick) e.currentTarget.style.boxShadow = 'rgba(0,0,0,0.08) 0 2px 8px' }}
      onMouseLeave={(e) => { if (onClick) e.currentTarget.style.boxShadow = 'rgba(0,0,0,0.06) 0 1px 2px' }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <h3 style={{ margin: 0, fontSize: '14px', fontWeight: 600, color: '#1f2328' }}>{line.name}</h3>
          {isOwnLine && (
            <span style={{
              fontSize: '11px',
              fontWeight: 600,
              color: '#1a73e8',
              background: '#e8f0fe',
              borderRadius: '999px',
              padding: '1px 8px',
              lineHeight: 1.4,
            }}>
              Line Kamu
            </span>
          )}
        </div>
        <span style={{ fontSize: '14px', fontWeight: 600, color: pct === 100 ? '#188038' : '#1f2328' }}>
          {pct}%
        </span>
      </div>

      <div className="progress-track">
        <div className="progress-fill" style={{ width: `${pct}%` }} />
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontSize: '12px', color: '#5f6368' }}>
          {line.completedRows} / {line.totalRows} baris lengkap
        </span>
        {pct === 100 && (
          <span className="chip-existing" style={{ fontSize: '11px' }}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
              <path d="M20 6L9 17l-5-5" />
            </svg>
            Selesai
          </span>
        )}
      </div>

      {/* Location checklist */}
      <div style={{
        borderTop: '1px solid #e8eaed',
        paddingTop: '10px',
        display: 'flex',
        flexDirection: 'column',
        gap: '6px',
      }}>
        <p style={{ fontSize: '11px', fontWeight: 600, color: '#80868b', textTransform: 'uppercase', letterSpacing: '0.3px', margin: 0 }}>
          Lokasi
        </p>
        {line.locations.map((loc) => (
          <div key={loc} style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            fontSize: '13px',
            color: '#1f2328',
          }}>
            <div style={{
              width: '16px',
              height: '16px',
              borderRadius: '4px',
              border: '1.5px solid #dadce0',
              background: '#ffffff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}>
              {/* Placeholder — will show check when location complete */}
            </div>
            <span>{loc}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

/* Neutral chart palette — avoids semantic green/amber/red reserved for status */
const CATEGORY_COLORS = [
  '#1a73e8', // Blue
  '#7c3aed', // Violet
  '#0d9488', // Teal
  '#6366f1', // Indigo
  '#0891b2', // Cyan
  '#8b5cf6', // Purple
  '#0e7490', // Dark cyan
  '#4f46e5', // Deep indigo
]

function CategoryBar({ categories }) {
  const max = Math.max(...categories.map(c => c.count))

  return (
    <div className="ds-card" style={{ gridColumn: '1 / -1' }}>
      <h3 style={{ margin: '0 0 16px', fontSize: '14px', fontWeight: 600, color: '#1f2328' }}>
        Breakdown per Category
      </h3>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {categories.map((cat, i) => (
          <div key={cat.name} style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span style={{
              width: '80px',
              flexShrink: 0,
              fontSize: '13px',
              color: '#5f6368',
              textAlign: 'right',
            }}>
              {cat.name}
            </span>
            <div style={{
              flex: 1,
              height: '20px',
              background: '#f1f3f4',
              borderRadius: '4px',
              overflow: 'hidden',
            }}>
              <div style={{
                height: '100%',
                width: `${(cat.count / max) * 100}%`,
                background: CATEGORY_COLORS[i % CATEGORY_COLORS.length],
                borderRadius: '4px',
                transition: 'width 0.4s ease',
              }} />
            </div>
            <span style={{
              width: '36px',
              flexShrink: 0,
              fontSize: '13px',
              fontWeight: 600,
              color: '#1f2328',
              textAlign: 'right',
            }}>
              {cat.count}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}


export default function Dashboard() {
  const { currentUser, userRole, logout } = useAuth()
  const navigate = useNavigate()

  const totalRows = LINES.reduce((s, l) => s + l.totalRows, 0)
  const totalCompleted = LINES.reduce((s, l) => s + l.completedRows, 0)
  const overallPct = totalRows > 0 ? Math.round((totalCompleted / totalRows) * 100) : 0

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
          maxWidth: '1200px',
          margin: '0 auto',
          padding: '0 16px',
          height: '48px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}>
          {/* Left: logo + title */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{
              width: '32px',
              height: '32px',
              borderRadius: '8px',
              background: '#e6f4ea',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#188038" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" />
              </svg>
            </div>
            <h1 style={{
              margin: 0,
              fontSize: '16px',
              fontWeight: 600,
              color: '#1f2328',
              lineHeight: 1.3,
            }}>
              Plant Sourcing
            </h1>
          </div>

          {/* Right: user info + logout */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            {userRole === 'admin' && (
              <button
                onClick={() => navigate('/admin/settings')}
                className="btn-secondary"
                style={{
                  padding: '6px 12px',
                  fontSize: '13px',
                  color: '#1f2328',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" />
                  <circle cx="12" cy="12" r="3" />
                </svg>
                Pengaturan Kolom
              </button>
            )}
            <div style={{ textAlign: 'right' }}>
              <p style={{
                margin: 0,
                fontSize: '13px',
                fontWeight: 600,
                color: '#1f2328',
                lineHeight: 1.2,
              }}>
                {currentUser?.displayName || currentUser?.email?.split('@')[0] || 'User'}
              </p>
              <p style={{
                margin: 0,
                fontSize: '12px',
                color: '#5f6368',
                lineHeight: 1.3,
              }}>
                {roleLabelMap[userRole] || userRole || 'User'}
              </p>
            </div>
            <button
              onClick={handleLogout}
              className="btn-secondary"
              style={{
                padding: '6px 12px',
                fontSize: '13px',
                color: '#5f6368',
              }}
            >
              Keluar
            </button>
          </div>
        </div>
      </header>

      {/* ---- Sync Status Bar ---- */}
      <SyncStatusBar />

      {/* ---- Main Content ---- */}
      <main style={{
        maxWidth: '1200px',
        margin: '0 auto',
        padding: '24px 16px 48px',
      }}>
        {/* Page title */}
        <div style={{ marginBottom: '24px' }}>
          <h2 style={{
            margin: 0,
            fontSize: '20px',
            fontWeight: 600,
            color: '#1f2328',
            lineHeight: 1.3,
            letterSpacing: '-0.1px',
          }}>
            Dashboard
          </h2>
          <p style={{
            margin: '4px 0 0',
            fontSize: '14px',
            color: '#5f6368',
          }}>
            Ringkasan progress sourcing komponen — data berikut masih placeholder
          </p>
        </div>

        {/* ---- Row 1: Stat cards ---- */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '12px',
          marginBottom: '24px',
        }}>
          <StatCard
            label="Total Part"
            value={STATUS_SUMMARY.totalParts}
            accent="primary"
          />
          <StatCard
            label="Existing"
            value={STATUS_SUMMARY.existing}
            subtext={`${Math.round((STATUS_SUMMARY.existing / STATUS_SUMMARY.totalParts) * 100)}% dari total`}
            accent="primary"
          />
          <StatCard
            label="Tidak Aktif"
            value={STATUS_SUMMARY.inactive}
            subtext={`${Math.round((STATUS_SUMMARY.inactive / STATUS_SUMMARY.totalParts) * 100)}% dari total`}
            accent="warning"
          />
          <StatCard
            label="Kelengkapan Data"
            value={`${overallPct}%`}
            subtext={`${totalCompleted} / ${totalRows} baris`}
            accent="secondary"
          />
        </div>

        {/* ---- Overall progress bar ---- */}
        <div className="ds-card" style={{ marginBottom: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '8px' }}>
            <h3 style={{ margin: 0, fontSize: '14px', fontWeight: 600, color: '#1f2328' }}>
              Progress Keseluruhan
            </h3>
            <span style={{ fontSize: '14px', fontWeight: 600, color: '#1f2328' }}>
              {overallPct}%
            </span>
          </div>
          <div className="progress-track" style={{ height: '10px' }}>
            <div className="progress-fill" style={{ width: `${overallPct}%` }} />
          </div>
          <p style={{ fontSize: '12px', color: '#5f6368', marginTop: '6px' }}>
            {totalCompleted} dari {totalRows} baris sudah lengkap (gabungan 4 Line)
          </p>
        </div>

        {/* ---- Row 2: Per-line progress + location checklists ---- */}
        <div style={{ marginBottom: '24px' }}>
          <h3 style={{
            margin: '0 0 12px',
            fontSize: '16px',
            fontWeight: 600,
            color: '#1f2328',
            lineHeight: 1.3,
          }}>
            Progress per Line
          </h3>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
            gap: '12px',
          }}>
            {LINES.map((line) => (
              <ProgressCard
                key={line.id}
                line={line}
                isOwnLine={userRole === 'intern' && currentUser?.assignedLine === line.id}
                onClick={() => navigate(`/line/line${line.id}`)}
              />
            ))}
          </div>
        </div>

        {/* ---- Row 3: Category breakdown ---- */}
        <CategoryBar categories={CATEGORIES} />
      </main>
    </div>
  )
}
