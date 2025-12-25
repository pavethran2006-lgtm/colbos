import React, { useEffect, useState } from 'react'

export default function Settings() {
  const [settings, setSettings] = useState({ name: '', email: '', mobile: '', notifyEmail: true, notifySms: false, theme: 'dark', textColor: '#e6eef8', fontSize: '16' })
  const [status, setStatus] = useState(null)

  async function load() {
    try {
      const res = await fetch('/api/settings', { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } })
      const d = await res.json()
      setSettings((s) => ({ ...s, ...d.settings }))
    } catch (e) {
      setStatus('Failed to load settings')
    }
  }

  useEffect(() => { load() }, [])

  // apply UI changes immediately
  useEffect(() => {
    if (settings.textColor) document.documentElement.style.setProperty('--app-text-color', settings.textColor)
    if (settings.fontSize) document.documentElement.style.fontSize = settings.fontSize + 'px'
    if (settings.theme === 'light') document.body.classList.add('theme-light')
    else document.body.classList.remove('theme-light')
  }, [settings.textColor, settings.fontSize, settings.theme])

  async function save(e) {
    e.preventDefault(); setStatus('Saving...')
    try {
      const res = await fetch('/api/settings', { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${localStorage.getItem('token')}` }, body: JSON.stringify(settings) })
      if (!res.ok) throw new Error('Save failed')
      setStatus('Saved')
    } catch (e) {
      setStatus('Save failed')
    }
  }

  return (
    <div className="settings-page">
      <div className="page-center">
        <h3>Settings</h3>
        <form onSubmit={save} className="settings-form">
          <label>Name<input value={settings.name} onChange={(e) => setSettings((s) => ({ ...s, name: e.target.value }))} /></label>
          <label>Email<input value={settings.email} onChange={(e) => setSettings((s) => ({ ...s, email: e.target.value }))} /></label>
          <label>Mobile<input value={settings.mobile} onChange={(e) => setSettings((s) => ({ ...s, mobile: e.target.value }))} /></label>
          <label><input type="checkbox" checked={settings.notifyEmail} onChange={(e) => setSettings((s) => ({ ...s, notifyEmail: e.target.checked }))} /> Email notifications</label>
          <label><input type="checkbox" checked={settings.notifySms} onChange={(e) => setSettings((s) => ({ ...s, notifySms: e.target.checked }))} /> SMS notifications</label>

          <label>Theme
            <div className="segmented" style={{ marginTop: 6 }}>
              <button type="button" className={settings.theme === 'dark' ? 'active' : ''} onClick={() => setSettings((s) => ({ ...s, theme: 'dark' }))}>Dark</button>
              <button type="button" className={settings.theme === 'light' ? 'active' : ''} onClick={() => setSettings((s) => ({ ...s, theme: 'light' }))}>Light</button>
            </div>
          </label>

          <label>Text color<input type="color" value={settings.textColor} onChange={(e) => setSettings((s) => ({ ...s, textColor: e.target.value }))} /></label>

          <label>Base font size (px)<input type="number" min="12" max="24" value={settings.fontSize} onChange={(e) => setSettings((s) => ({ ...s, fontSize: e.target.value }))} /></label>

          <button type="submit" className="btn-primary">Save settings</button>
        </form>
        <div style={{ marginTop: 12 }}>Preview: <span style={{ color: settings.textColor }}>This text uses your chosen color</span></div>
        <div style={{ marginTop: 6 }}>{status}</div>
      </div>
    </div>
  )
}
