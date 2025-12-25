import React from 'react'
import TaskCard from './TaskCard'

const sampleColumns = [
  { id: 'todo', title: 'To do', tasks: [{ id: 1, title: 'Create onboarding screen', assignee: 'alice' }, { id: 2, title: 'Spec auth flow', assignee: 'bob' }] },
  { id: 'inprogress', title: 'In progress', tasks: [{ id: 3, title: 'Build login UI', assignee: 'carol' }] },
  { id: 'done', title: 'Done', tasks: [{ id: 4, title: 'Initialize repo', assignee: null }] }
]

export default function BoardView({ board, onBack }) {
  const [status, setStatus] = React.useState(board.status || 'active')

  function cancelBoard() {
    setStatus('cancelled')
    try {
      const raw = localStorage.getItem('colbos_boards')
      const arr = raw ? JSON.parse(raw) : []
      const next = arr.map((b) => b.id === board.id ? { ...b, status: 'cancelled' } : b)
      localStorage.setItem('colbos_boards', JSON.stringify(next))
    } catch (e) { }
  }

  const [note, setNote] = React.useState(board.message || '')

  function saveNote() {
    try {
      const raw = localStorage.getItem('colbos_boards')
      const arr = raw ? JSON.parse(raw) : []
      const next = arr.map((b) => b.id === board.id ? { ...b, message: note } : b)
      localStorage.setItem('colbos_boards', JSON.stringify(next))
      setNote(note)
    } catch (e) { }
  }

  return (
    <div className="board-view">
      <div className="board-view-header">
        <button className="btn-link" onClick={onBack}>← Back</button>
        <h3>{board.title}</h3>
        <div style={{ marginLeft: 12, color: '#9fb3d9' }}>{board.description}</div>
      </div>
      <div style={{ marginTop: 8, marginBottom: 12 }}>Status: <strong>{status}</strong> • Created: {new Date(board.createdAt).toLocaleString()}</div>
      <div style={{ marginBottom: 12 }}>
        <button className="btn-secondary" onClick={cancelBoard}>{status === 'cancelled' ? 'Cancelled' : 'Cancel board'}</button>
      </div>
      <div style={{ marginBottom: 12 }}>
        <div style={{ marginBottom: 6, color: '#cfe5ff', fontWeight: 700 }}>Important message</div>
        <textarea value={note} onChange={(e) => setNote(e.target.value)} style={{ width: '100%', minHeight: 100, padding: 8, borderRadius: 8, background: 'rgba(255,255,255,0.02)', color: 'var(--app-text-color)', border: '1px solid rgba(255,255,255,0.03)' }} />
        <div style={{ marginTop: 8 }}><button className="btn-primary" onClick={saveNote}>Save message</button></div>
      </div>
      <div className="columns">
        {sampleColumns.map((col) => (
          <div key={col.id} className="column">
            <h4>{col.title}</h4>
            <div className="column-tasks">
              {col.tasks.map((t) => (
                <TaskCard key={t.id} task={t} />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
