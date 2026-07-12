import { useState, useRef } from 'react'
import * as XLSX from 'xlsx'
import { useNavigate } from 'react-router-dom'
import { useToast } from '../contexts/ToastContext'

const LINE_OPTIONS = [
  { id: 'line1', label: 'Line 1' },
  { id: 'line2', label: 'Line 2' },
  { id: 'line3', label: 'Line 3' },
  { id: 'line4', label: 'Line 4' },
]

export default function ImportExcel() {
  const [step, setStep] = useState(1) // 1: Upload, 2: Mapping & Preview
  const [fileName, setFileName] = useState('')
  const [sheetNames, setSheetNames] = useState([])
  const [sheetMapping, setSheetMapping] = useState({}) 
  const [parsedData, setParsedData] = useState({}) 
  const [previewLine, setPreviewLine] = useState('line1')
  const [isDragging, setIsDragging] = useState(false)
  
  const fileInputRef = useRef(null)
  const { addToast } = useToast()
  const navigate = useNavigate()

  const handleDragOver = (e) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = () => {
    setIsDragging(false)
  }

  const handleDrop = (e) => {
    e.preventDefault()
    setIsDragging(false)
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processFile(e.dataTransfer.files[0])
    }
  }

  const handleFileSelect = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      processFile(e.target.files[0])
    }
  }

  const processFile = (file) => {
    if (!file.name.match(/\.(xlsx|xls|csv)$/i)) {
      addToast('File harus berupa format Excel (.xlsx/.xls) atau CSV', 'error')
      return
    }

    setFileName(file.name)
    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const data = e.target.result
        const workbook = XLSX.read(data, { type: 'binary' })
        
        const names = workbook.SheetNames
        setSheetNames(names)
        
        const initialMapping = {}
        const dataMap = {}
        
        names.forEach(name => {
          // Guess mapping
          const lower = name.toLowerCase()
          let guessed = ''
          if (lower.includes('1') || lower.includes('satu')) guessed = 'line1'
          else if (lower.includes('2') || lower.includes('dua')) guessed = 'line2'
          else if (lower.includes('3') || lower.includes('tiga')) guessed = 'line3'
          else if (lower.includes('4') || lower.includes('empat')) guessed = 'line4'
          initialMapping[name] = guessed

          // Parse data (raw 2D array)
          const sheet = workbook.Sheets[name]
          const sheetData = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '' })
          
          // Batasi header maksimal 13 kolom
          const rawHeaders = sheetData[0] || []
          const headers = rawHeaders.slice(0, 13)
          
          // Batasi tiap baris maksimal 13 kolom, lalu filter baris yang benar-benar kosong
          const rows = []
          for (let i = 1; i < sheetData.length; i++) {
            const rawRow = sheetData[i] || []
            const truncatedRow = rawRow.slice(0, 13)
            
            // Cek apakah truncatedRow punya minimal 1 field terisi
            const hasData = truncatedRow.some(cell => {
              if (cell === null || cell === undefined) return false
              if (typeof cell === 'string') return cell.trim() !== ''
              return true
            })
            
            if (hasData) {
              rows.push(truncatedRow)
            }
          }
          
          dataMap[name] = { headers, rows }
        })

        setSheetMapping(initialMapping)
        setParsedData(dataMap)
        
        // Auto-select first matched line for preview
        const firstMatch = Object.values(initialMapping).find(v => v !== '')
        if (firstMatch) setPreviewLine(firstMatch)
        
        setStep(2)
        addToast('File berhasil diparse', 'success')
      } catch (err) {
        console.error(err)
        addToast('Gagal membaca file Excel', 'error')
      }
    }
    reader.readAsBinaryString(file)
  }

  const handleMappingChange = (sheet, lineId) => {
    setSheetMapping(prev => ({ ...prev, [sheet]: lineId }))
  }

  // Derived state for preview
  // Combine all sheets mapped to the selected previewLine
  const previewSheets = sheetNames.filter(name => sheetMapping[name] === previewLine)
  let combinedHeaders = []
  let combinedRows = []
  
  if (previewSheets.length > 0) {
    // For simplicity of raw preview, just use the headers of the first matched sheet
    combinedHeaders = parsedData[previewSheets[0]]?.headers || []
    previewSheets.forEach(sheet => {
      combinedRows = combinedRows.concat(parsedData[sheet]?.rows || [])
    })
  }

  // Calculate totals
  const totalRowsByLine = { line1: 0, line2: 0, line3: 0, line4: 0 }
  sheetNames.forEach(sheet => {
    const targetLine = sheetMapping[sheet]
    if (targetLine) {
      totalRowsByLine[targetLine] += (parsedData[sheet]?.rows?.length || 0)
    }
  })
  const grandTotal = Object.values(totalRowsByLine).reduce((a, b) => a + b, 0)

  return (
    <div style={{ minHeight: '100svh', background: '#f8f9fa' }}>
      <header style={{ background: '#fff', borderBottom: '1px solid #e1e4e8', padding: '16px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <button className="btn-secondary" style={{ padding: '8px' }} onClick={() => navigate('/')}>
            ←
          </button>
          <div>
            <h1 style={{ fontSize: '20px', fontWeight: 600, color: '#1f2328', margin: 0 }}>Import Data Excel</h1>
            <p style={{ fontSize: '13px', color: '#5f6368', margin: '4px 0 0' }}>Tahap 1 dari 3: Pemilihan File & Preview</p>
          </div>
        </div>
      </header>

      <main style={{ padding: '24px', maxWidth: '1200px', margin: '0 auto' }}>
        
        {step === 1 && (
          <div style={{ background: '#fff', border: '1px solid #d0d7de', borderRadius: '6px', padding: '48px 24px', textAlign: 'center' }}>
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              style={{
                border: `2px dashed ${isDragging ? '#0969da' : '#d0d7de'}`,
                borderRadius: '8px',
                padding: '48px 24px',
                background: isDragging ? '#f3f8ff' : '#fafbfc',
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}
              onClick={() => fileInputRef.current?.click()}
            >
              <input
                type="file"
                ref={fileInputRef}
                style={{ display: 'none' }}
                accept=".xlsx,.xls,.csv"
                onChange={handleFileSelect}
              />
              <div style={{ fontSize: '48px', marginBottom: '16px' }}>📄</div>
              <h3 style={{ margin: '0 0 8px', fontSize: '16px', color: '#1f2328' }}>
                Seret file Excel ke sini, atau klik untuk memilih
              </h3>
              <p style={{ margin: 0, fontSize: '14px', color: '#5f6368' }}>
                Format didukung: .xlsx, .xls
              </p>
            </div>
          </div>
        )}

        {step === 2 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            
            {/* Konfigurasi Sheet */}
            <div style={{ background: '#fff', border: '1px solid #d0d7de', borderRadius: '6px', overflow: 'hidden' }}>
              <div style={{ padding: '16px 24px', borderBottom: '1px solid #e1e4e8', background: '#f6f8fa' }}>
                <h3 style={{ margin: 0, fontSize: '14px', color: '#1f2328' }}>Pemetaan Sheet ke Line</h3>
                <p style={{ margin: '4px 0 0', fontSize: '13px', color: '#5f6368' }}>Sistem mencoba menebak alokasi sheet berdasarkan namanya. Silakan koreksi jika ada yang salah.</p>
              </div>
              <div style={{ padding: '16px 24px', display: 'flex', flexWrap: 'wrap', gap: '16px' }}>
                {sheetNames.map(sheet => (
                  <div key={sheet} style={{ border: '1px solid #d0d7de', borderRadius: '6px', padding: '12px', background: '#fafbfc', minWidth: '200px' }}>
                    <div style={{ fontWeight: 600, fontSize: '13px', marginBottom: '8px', color: '#1f2328' }}>
                      {sheet} <span style={{ color: '#5f6368', fontWeight: 400 }}>({parsedData[sheet]?.rows.length} baris)</span>
                    </div>
                    <select
                      className="grid-cell-input"
                      style={{ padding: '6px 8px', border: '1px solid #d0d7de', borderRadius: '4px', width: '100%', background: '#fff' }}
                      value={sheetMapping[sheet]}
                      onChange={(e) => handleMappingChange(sheet, e.target.value)}
                    >
                      <option value="">-- Abaikan Sheet Ini --</option>
                      {LINE_OPTIONS.map(opt => (
                        <option key={opt.id} value={opt.id}>{opt.label}</option>
                      ))}
                    </select>
                  </div>
                ))}
              </div>
            </div>

            {/* Preview Mentah */}
            <div style={{ background: '#fff', border: '1px solid #d0d7de', borderRadius: '6px', overflow: 'hidden' }}>
              <div style={{ padding: '16px 24px', borderBottom: '1px solid #e1e4e8', display: 'flex', gap: '16px', alignItems: 'center' }}>
                <h3 style={{ margin: 0, fontSize: '14px', color: '#1f2328', marginRight: 'auto' }}>Preview Data Mentah</h3>
                <div style={{ display: 'flex', gap: '8px' }}>
                  {LINE_OPTIONS.map(opt => (
                    <button
                      key={opt.id}
                      onClick={() => setPreviewLine(opt.id)}
                      style={{
                        padding: '6px 12px',
                        border: 'none',
                        background: previewLine === opt.id ? '#0969da' : 'transparent',
                        color: previewLine === opt.id ? '#fff' : '#5f6368',
                        borderRadius: '4px',
                        fontSize: '13px',
                        cursor: 'pointer',
                        fontWeight: previewLine === opt.id ? 600 : 400
                      }}
                    >
                      {opt.label} ({totalRowsByLine[opt.id]})
                    </button>
                  ))}
                </div>
              </div>
              
              <div style={{ padding: '16px 24px', background: '#f6f8fa', fontSize: '13px', color: '#5f6368' }}>
                Menampilkan maksimal 20 baris pertama dari {combinedRows.length} total baris untuk {LINE_OPTIONS.find(l => l.id === previewLine)?.label}.
              </div>

              <div style={{ overflowX: 'auto', maxHeight: '500px', borderTop: '1px solid #e1e4e8' }}>
                {combinedRows.length === 0 ? (
                  <div style={{ padding: '48px', textAlign: 'center', color: '#5f6368' }}>
                    Tidak ada data untuk dirender pada Line ini.
                  </div>
                ) : (
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
                    <thead>
                      <tr>
                        <th style={{ position: 'sticky', top: 0, background: '#f6f8fa', padding: '8px 12px', borderBottom: '1px solid #d0d7de', borderRight: '1px solid #d0d7de', color: '#5f6368', fontWeight: 600, textAlign: 'center', width: '40px' }}>
                          #
                        </th>
                        {combinedHeaders.map((h, i) => (
                          <th key={i} style={{ position: 'sticky', top: 0, background: '#f6f8fa', padding: '8px 12px', borderBottom: '1px solid #d0d7de', borderRight: '1px solid #d0d7de', color: '#1f2328', fontWeight: 600, textAlign: 'left', whiteSpace: 'nowrap' }}>
                            {h || `Column ${i+1}`}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {combinedRows.slice(0, 20).map((row, rIdx) => (
                        <tr key={rIdx} style={{ borderBottom: '1px solid #e1e4e8' }}>
                          <td style={{ padding: '8px 12px', borderRight: '1px solid #e1e4e8', background: '#fafbfc', textAlign: 'center', color: '#5f6368' }}>
                            {rIdx + 1}
                          </td>
                          {combinedHeaders.map((_, cIdx) => (
                            <td key={cIdx} style={{ padding: '8px 12px', borderRight: '1px solid #e1e4e8', whiteSpace: 'nowrap', maxWidth: '300px', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                              {row[cIdx] !== undefined ? String(row[cIdx]) : ''}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </div>

            {/* Action Bar */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 24px', background: '#fff', border: '1px solid #d0d7de', borderRadius: '6px' }}>
              <div style={{ fontSize: '14px', color: '#1f2328' }}>
                Total keseluruhan data yang akan diimpor: <strong>{grandTotal} baris</strong>
              </div>
              <div style={{ display: 'flex', gap: '12px' }}>
                <button
                  className="btn-secondary"
                  onClick={() => {
                    setStep(1)
                    setFileName('')
                    setParsedData({})
                  }}
                  style={{ padding: '8px 16px' }}
                >
                  Batal
                </button>
                <button
                  className="btn-primary"
                  disabled
                  title="Fitur mapping kolom akan ditambahkan di tahap berikutnya"
                  style={{ padding: '8px 16px', opacity: 0.5, cursor: 'not-allowed' }}
                >
                  Lanjut ke Mapping Kolom
                </button>
              </div>
            </div>

          </div>
        )}
      </main>
    </div>
  )
}
