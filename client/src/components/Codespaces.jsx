import React, { useEffect, useState } from 'react'

import CodespaceEditor from './CodespaceEditor'

export default function Codespaces({ onBack }) {
  const [codespaces, setCodespaces] = useState([])
  const [repos, setRepos] = useState([])
  const [selectedRepo, setSelectedRepo] = useState('')
  const [error, setError] = useState(null)
  const [editing, setEditing] = useState(null)

  async function load() {
    try {
      const [r1, r2] = await Promise.all([
        fetch('/api/repos', { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } }).then((r) => r.json()),
        fetch('/api/codespaces', { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } }).then((r) => r.json())
      ])
      setRepos(r1.repos || [])
      setCodespaces(r2.codespaces || [])
    } catch (e) {
      setError('Failed to load')
    }
  }

  useEffect(() => { load() }, [])

  async function create(e) {
    e.preventDefault(); setError(null)
    try {
      const res = await fetch('/api/codespaces', { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${localStorage.getItem('token')}` }, body: JSON.stringify({ repoId: selectedRepo }) })
      if (!res.ok) throw new Error('Create failed')
      await load()
    } catch (e) {
      setError('Failed to create codespace')
    }
  }

  async function toggle(id, action) {
    try {
      const res = await fetch(`/api/codespaces/${id}/${action}`, { method: 'POST', headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } })
      if (!res.ok) throw new Error('Action failed')
      await load()
    } catch (e) {
      setError('Action failed')
    }
  }

  return (
    <div className="codespaces-page">
      <div className="page-center">
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, justifyContent: 'center' }}>
          <h3 style={{ margin: 0, fontSize: 26 }}>Codespaces</h3>
          <button className="btn-link" onClick={() => onBack && onBack()}>Back to Dashboard</button>
        </div>
        <form onSubmit={create} className="codespace-form" style={{ marginTop: 12 }}>
          <div className="form-row">
            <select className="select-custom" value={selectedRepo} onChange={(e) => setSelectedRepo(e.target.value)}>
              <option value="">Select repo</option>
              {repos.map((r) => <option key={r.id} value={r.id}>{r.name}</option>)}
            </select>
            <button type="submit" className="btn-primary">Create Codespace</button>
          </div>
          {error && <div className="error">{error}</div>}
        </form>

      <div className="codespaces-list">
        {codespaces.map((c) => {
          const repo = repos.find((r) => r.id === c.repoId)
          return (
          <div key={c.id} className={`codespace-card ${editing && editing.id === c.id ? 'active' : ''}`}>
            <div>
              <div style={{ fontWeight: 700 }}>Codespace #{c.id} — <span style={{ color: '#9fb3d9' }}>{repo ? repo.name : c.repoId}</span></div>
              <div className="meta">Status: {c.status}</div>
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              {c.status === 'stopped' ? <button onClick={() => toggle(c.id, 'start')} className="btn-primary">Start</button> : <button onClick={() => toggle(c.id, 'stop')} className="btn-secondary">Stop</button>}
              <button onClick={() => setEditing(c)} className="btn-secondary">Open Editor</button>
            </div>
          </div>
        )})}
      </div>

      </div>

      {editing && <div className="modal"><CodespaceEditor codespace={editing} onClose={() => { setEditing(null); load() }} onBackToDashboard={() => { setEditing(null); load(); onBack && onBack(); }} /></div>}
    </div>
  )
}
