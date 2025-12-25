import React from 'react'
import { motion } from 'framer-motion'

const DEFAULT_BOARDS = [
  { id: 1, title: 'Product Roadmap', description: 'Plan features and releases', createdAt: Date.now(), status: 'active' },
  { id: 2, title: 'Marketing', description: 'Campaigns and content', createdAt: Date.now() - (26 * 60 * 60 * 1000), status: 'active' },
  { id: 3, title: 'Design Sprint', description: 'Design tasks and feedback', createdAt: Date.now(), status: 'active' }
]

function loadBoards() {
  try {
    const raw = localStorage.getItem('colbos_boards')
    let boards = raw ? JSON.parse(raw) : DEFAULT_BOARDS
    // auto-cancel if older than 1 day
    const now = Date.now()
    let changed = false
    boards = boards.map((b) => {
      if (b.status !== 'cancelled' && now - (b.createdAt || 0) > 24 * 60 * 60 * 1000) { changed = true; return { ...b, status: 'cancelled' } }
      return b
    })
    if (changed) localStorage.setItem('colbos_boards', JSON.stringify(boards))
    return boards
  } catch (e) { return DEFAULT_BOARDS }
}

export default function BoardList({ onOpen }) {
  const [boards, setBoards] = React.useState(loadBoards())
  const [newTitle, setNewTitle] = React.useState('')
  const [newDesc, setNewDesc] = React.useState('')

  function addBoard(e) {
    e.preventDefault()
    if (!newTitle) return
    const b = { id: Date.now(), title: newTitle, description: newDesc, createdAt: Date.now(), status: 'active' }
    const next = [b, ...boards]
    localStorage.setItem('colbos_boards', JSON.stringify(next))
    setBoards(next)
    setNewTitle('')
    setNewDesc('')
  }

  return (
    <div className="boards-page">
      <h3>Boards</h3>

      <form onSubmit={addBoard} style={{ marginBottom: 12 }}>
        <div className="form-row" style={{ justifyContent: 'center' }}>
          <input placeholder="Board title" value={newTitle} onChange={(e) => setNewTitle(e.target.value)} style={{ minWidth: 240 }} />
          <input placeholder="Short description" value={newDesc} onChange={(e) => setNewDesc(e.target.value)} style={{ minWidth: 320 }} />
          <button type="submit" className="btn-primary">Add Board</button>
        </div>
      </form>

      <div className="boards-grid">
        {boards.map((b) => (
          <motion.div key={b.id} className={`board-card ${b.status === 'cancelled' ? 'cancelled' : ''}`} whileHover={{ scale: 1.02 }} onClick={() => onOpen(b)}>
            <h4>{b.title}</h4>
            <p>{b.description}</p>
            <div style={{ fontSize: 12, color: '#9fb3d9' }}>Created: {new Date(b.createdAt).toLocaleString()} • {b.status}</div>
          </motion.div>
        ))}
      </div>
    </div>
  )
}
