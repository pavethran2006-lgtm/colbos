import React from 'react'

export default function Sidebar({ view, setView }) {
  return (
    <aside className="sidebar" aria-label="Main navigation">
      <div className="sidebar-brand">✅ <strong>Colbos</strong></div>
      <ul className="sidebar-nav">
        <li className={view === 'boards' ? 'active' : ''} onClick={() => setView('boards')}>📋 Boards</li>
        <li className={view === 'repositories' ? 'active' : ''} onClick={() => setView('repositories')}>📦 Repositories</li>
        <li className={view === 'codespaces' ? 'active' : ''} onClick={() => setView('codespaces')}>🧑‍💻 Codespaces</li>
        <li className={view === 'tasks' ? 'active' : ''} onClick={() => setView('tasks')}>🗂️ Tasks</li>
        <li className={view === 'whiteboard' ? 'active' : ''} onClick={() => setView('whiteboard')}>🖊️ Whiteboard</li>
        <li className={view === 'chat' ? 'active' : ''} onClick={() => setView('chat')}>💬 Chat</li>
        <li className={view === 'settings' ? 'active' : ''} onClick={() => setView('settings')}>⚙️ Settings</li>
      </ul>
      <div className="sidebar-footer">Made with ❤</div>
    </aside>
  )
}
