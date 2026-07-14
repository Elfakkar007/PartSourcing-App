import { useRegisterSW } from 'virtual:pwa-register/react'

function UpdatePrompt() {
    const { needRefresh, updateServiceWorker } = useRegisterSW()

    if (!needRefresh) return null

    return (
        <div style={{ position: 'fixed', bottom: 20, right: 20, background: '#333', color: '#fff', padding: 12, borderRadius: 8 }}>
            Versi baru tersedia!
            <button onClick={() => updateServiceWorker(true)}>Refresh</button>
        </div>
    )
}

export default UpdatePrompt