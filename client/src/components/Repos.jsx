import React, { useEffect, useState } from 'react'

export default function Repos() {
  const [repos, setRepos] = useState([])
  const [name, setName] = useState('')
  const [desc, setDesc] = useState('')
  const [selectedRepoId, setSelectedRepoId] = useState(null)
  const [error, setError] = useState(null)

  async function load() {
    try {
      const res = await fetch('/api/repos', { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } })
      const data = await res.json()
      setRepos(data.repos || [])
    } catch (e) {
      setError('Failed to load repos')
    }
  }

  useEffect(() => { load() }, [])

  async function create(e) {
    e.preventDefault(); setError(null)
    try {
      const res = await fetch('/api/repos', { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${localStorage.getItem('token')}` }, body: JSON.stringify({ name, description: desc }) })
      if (!res.ok) throw new Error('Create failed')
      setName(''); setDesc('')
      await load()
    } catch (e) {
      setError('Failed to create repo')
    }
  }

  return (
    <div className="repos-page">
      <h3>Repositories</h3>
      <div className="form-row" style={{ justifyContent: 'center', marginBottom: 12 }}>
        <select className="select-custom select-large" onChange={(e) => setSelectedRepoId(e.target.value)} value={selectedRepoId || ''}>
          <option value="">Select repo</option>
          {repos.map((r) => <option key={r.id} value={r.id}>{r.name}</option>)}
        </select>
      </div>

      <form className="repo-form" onSubmit={create}>
        <div className="form-row" style={{ justifyContent: 'center' }}>
          <input placeholder="Name" value={name} onChange={(e) => setName(e.target.value)} style={{ minWidth: 220 }} />
          <input placeholder="Description" value={desc} onChange={(e) => setDesc(e.target.value)} style={{ minWidth: 300 }} />
          <button type="submit" className="btn-primary">Create repository</button>
        </div>
        {error && <div className="error">{error}</div>}
      </form>
      <div className="repos-list">
        {repos.map((r) => (
          <div key={r.id} className={`repo-card ${selectedRepoId === r.id ? 'active' : ''}`}>
            <div className="repo-name">{r.name}</div>
            <div className="repo-desc">{r.description}</div>
            <div className="repo-meta">owner: {r.ownerId}</div>
          </div>
        ))}
      </div>
    </div>
  )
}
