import React, { useState, useRef, useEffect } from 'react'
import Sidebar from './Sidebar'
import BoardList from './BoardList'
import BoardView from './BoardView'
import Repos from './Repos'
import Codespaces from './Codespaces'
import Whiteboard from './Whiteboard'
import Chat from './Chat'
import Settings from './Settings'
import Tasks from './Tasks'

export default function Dashboard({ user }) {
  const [view, setView] = useState('boards')
  const [selectedBoard, setSelectedBoard] = useState(null)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const mainRef = useRef(null)

  useEffect(() => {
    function onFull() {
      setIsFullscreen(Boolean(document.fullscreenElement))
    }
    document.addEventListener('fullscreenchange', onFull)
    return () => document.removeEventListener('fullscreenchange', onFull)
  }, [])

  async function toggleFullscreen() {
    try {
      if (!document.fullscreenElement) {
        const el = mainRef.current || document.documentElement
        if (el.requestFullscreen) await el.requestFullscreen()
        else if (el.webkitRequestFullscreen) el.webkitRequestFullscreen()
      } else {
        if (document.exitFullscreen) await document.exitFullscreen()
        else if (document.webkitExitFullscreen) document.webkitExitFullscreen()
      }
    } catch (e) {
      console.error('Fullscreen failed', e)
    }
  }

  return (
    <div className="dashboard">
      <Sidebar view={view} setView={setView} />
      <div className="main-area" ref={mainRef}>
        <div className="topbar">
          <div>Welcome{user?.name ? `, ${user.name}` : ''}</div>
          <div>
            <button className="btn-link" onClick={toggleFullscreen}>{isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}</button>
            <button className="btn-link" onClick={() => { localStorage.removeItem('token'); location.reload() }}>Log out</button>
          </div>
        </div>

        {/* Page header: shows current view title and a consistent Back button for non-board views */}
        <div className="page-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            {view !== 'boards' && <button className="btn-back" onClick={() => setView('boards')}>← Back</button>}
            <h3 style={{ margin: 0 }}>{({ boards: 'Boards', board: 'Board', repositories: 'Repositories', codespaces: 'Codespaces', tasks: 'Tasks', whiteboard: 'Whiteboard', chat: 'Chat', settings: 'Settings' })[view]}</h3>
          </div>
          <div style={{ opacity: 0.9, fontSize: 13 }}>
            {view === 'codespaces' ? 'Open a codespace and edit files. Hit Back to return to your boards.' : ''}
          </div>
        </div>

        <div className="content">
          {view === 'boards' && <BoardList onOpen={(b) => { setSelectedBoard(b); setView('board') }} />}
          {view === 'board' && selectedBoard && <BoardView board={selectedBoard} onBack={() => setView('boards')} />}
          {view === 'repositories' && <Repos />}
          {view === 'codespaces' && <Codespaces onBack={() => setView('boards')} />}
          {view === 'tasks' && <Tasks />}
          {view === 'whiteboard' && <Whiteboard id="team" />}
          {view === 'chat' && <Chat room="team" />}
          {view === 'settings' && <Settings />}
        </div>
      </div>
    </div>
  )
}
