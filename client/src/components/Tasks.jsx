import React, { useEffect, useState } from 'react'

const STORAGE_KEY = 'colbos_tasks'

export default function Tasks() {
  const [tasks, setTasks] = useState([])
  const [title, setTitle] = useState('')
  const [assignee, setAssignee] = useState('')
  const [filter, setFilter] = useState('all')

  useEffect(() => { load() }, [])

  function load() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      let arr = raw ? JSON.parse(raw) : []
      // auto-cancel tasks older than 1 day
      const now = Date.now()
      arr = arr.map((t) => {
        if (t.status !== 'cancelled' && now - (t.createdAt || 0) > 24 * 60 * 60 * 1000) return { ...t, status: 'cancelled' }
        return t
      })
      setTasks(arr)
      localStorage.setItem(STORAGE_KEY, JSON.stringify(arr))
    } catch (e) {
      setTasks([])
    }
  }

  function save(arr) {
    setTasks(arr)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(arr))
  }

  function add(e) {
    e.preventDefault()
    if (!title) return
    const newTask = { id: Date.now(), title, assignee: assignee || null, status: 'active', createdAt: Date.now() }
    const arr = [newTask, ...tasks]
    save(arr)
    setTitle('')
    setAssignee('')
  }

  function toggleCancel(id) {
    const arr = tasks.map((t) => t.id === id ? { ...t, status: t.status === 'cancelled' ? 'active' : 'cancelled' } : t)
    save(arr)
  }

  return (
    <div className="tasks-page">
      <h3>Tasks</h3>

      <div className="form-row" style={{ justifyContent: 'center', marginBottom: 12 }}>
        <select className="select-custom select-large" value={filter} onChange={(e) => setFilter(e.target.value)}>
          <option value="all">All</option>
          <option value="active">Active</option>
          <option value="cancelled">Cancelled</option>
        </select>
      </div>

      <form onSubmit={add} className="task-form">
        <div className="form-row" style={{ justifyContent: 'center', marginBottom: 12 }}>
          <input placeholder="Task title" value={title} onChange={(e) => setTitle(e.target.value)} style={{ minWidth: 320 }} />
          <input placeholder="Assignee (optional)" value={assignee} onChange={(e) => setAssignee(e.target.value)} style={{ minWidth: 200 }} />
          <button type="submit" className="btn-primary">Add Task</button>
        </div>
      </form>

      <div className="tasks-list">
        {tasks.length === 0 && <div style={{ color: '#9fb3d9' }}>No tasks yet — add one above.</div>}
        {tasks.filter((t) => (filter === 'all') || (filter === 'active' && t.status === 'active') || (filter === 'cancelled' && t.status === 'cancelled')).map((t) => (
          <div key={t.id} className={`task-card ${t.status === 'cancelled' ? 'cancelled' : ''}`}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div className="task-title">{t.title}</div>
                <div className="task-meta">{t.assignee ? `@${t.assignee}` : 'Unassigned'} — {t.status}</div>
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button onClick={() => toggleCancel(t.id)} className="btn-secondary">{t.status === 'cancelled' ? 'Restore' : 'Cancel'}</button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
