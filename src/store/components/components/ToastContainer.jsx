import React from 'react'
import { useStore } from '../context/StoreContext'

export default function ToastContainer() {
  const { toasts } = useStore()

  if (!toasts.length) return null

  return (
    <div className="toast-container">
      {toasts.map(t => (
        <div key={t.id} className={`toast toast-${t.type}`}>
          <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2">
            {t.type === 'success' && <><polyline points="20 6 9 17 4 12"/></>}
            {t.type === 'error' && <><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></>}
            {t.type === 'warning' && <><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></>}
          </svg>
          {t.message}
        </div>
      ))}
    </div>
  )
}
