import React, { useEffect, useState } from 'react'
import JSZip from 'jszip'

export default function CodespaceEditor({ codespace, onClose, onBackToDashboard }) {
  const rootRef = React.useRef(null)
  const [files, setFiles] = useState([])
  const [selected, setSelected] = useState(null)
  const [content, setContent] = useState('')
  const [language, setLanguage] = useState('plaintext')
  const [newName, setNewName] = useState('')
  const [status, setStatus] = useState(null)
  const LANG_LABELS = { plaintext: 'Plaintext', javascript: 'JavaScript', typescript: 'TypeScript', python: 'Python', java: 'Java', c: 'C', cpp: 'C++', go: 'Go', ruby: 'Ruby' }
  const loadingPyodideRef = React.useRef(null)

  async function ensurePyodide() {
    if (window.pyodide) return window.pyodide
    if (loadingPyodideRef.current) return loadingPyodideRef.current
    loadingPyodideRef.current = (async () => {
      const script = document.createElement('script')
      script.src = 'https://cdn.jsdelivr.net/pyodide/v0.23.4/full/pyodide.js'
      document.head.appendChild(script)
      await new Promise((resolve, reject) => { script.onload = resolve; script.onerror = reject })
      // loadPyodide is exposed by the script
      // eslint-disable-next-line no-undef
      window.pyodide = await loadPyodide({ indexURL: 'https://cdn.jsdelivr.net/pyodide/v0.23.4/full/' })
      return window.pyodide
    })()
    return loadingPyodideRef.current
  }

  async function load() {
    try {
      const res = await fetch(`/api/codespaces/${codespace.id}/files`, { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } })
      const data = await res.json()
      setFiles(data.files || [])
      if (!selected && data.files && data.files[0]) {
        pickFile(data.files[0])
      }
    } catch (e) {
      setStatus('Failed to load files')
    }
  }

  useEffect(() => { load() }, [])

  function pickFile(f) {
    setSelected(f.name)
    setContent(f.content || '')
    setLanguage(f.language || 'plaintext')
  }

  const [runOutput, setRunOutput] = useState([])
  const [runnerIframe, setRunnerIframe] = useState(null)
  const [previewSrc, setPreviewSrc] = useState(null)

  async function save() {
    setStatus('Saving...')
    try {
      const res = await fetch(`/api/codespaces/${codespace.id}/files`, { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${localStorage.getItem('token')}` }, body: JSON.stringify({ name: selected, content, language }) })
      if (!res.ok) throw new Error('Save failed')
      setStatus('Saved')
      await load()
    } catch (e) {
      setStatus('Save failed')
    }
  }

  async function runServer() {
    setStatus('Running on server...')
    setRunOutput([])
    try {
      const res = await fetch('/api/run', { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${localStorage.getItem('token')}` }, body: JSON.stringify({ language, code: content }) })
      const d = await res.json()
      if (d.error) {
        setRunOutput([{ type: 'error', text: d.error }])
        setStatus('Error')
        return
      }
      const lines = []
      if (d.stdout) lines.push({ type: 'log', text: d.stdout })
      if (d.stderr) lines.push({ type: 'error', text: d.stderr })
      setRunOutput(lines)
      setStatus('Finished')
    } catch (e) {
      setRunOutput([{ type: 'error', text: String(e) }])
      setStatus('Error')
    }
  }

  function previewHtml() {
    const html = content
    const src = `<!doctype html><html><head><meta charset="utf-8"></head><body>${html}</body></html>`
    setPreviewSrc(src)
    setStatus('Preview ready')
  }

  function clearRun() {
    setRunOutput([])
  }

  function stopRun() {
    if (runnerIframe) {
      runnerIframe.remove()
      setRunnerIframe(null)
      setStatus('Stopped')
      window.removeEventListener('message', handleMessage)
    }
  }

  function handleMessage(e) {
    if (!e.data) return
    const { type, msg } = e.data
    if (type === 'log') setRunOutput((r) => [...r, { type: 'log', text: msg }])
    if (type === 'error') setRunOutput((r) => [...r, { type: 'error', text: msg }])
  }

  function runCode() {
    clearRun()
    setStatus('Running...')
    const code = content || ''

    if (language === 'javascript') {
      window.addEventListener('message', handleMessage)
      const iframe = document.createElement('iframe')
      iframe.style.display = 'none'
      iframe.sandbox = 'allow-scripts'
      const escaped = `\n;(async function(){try{${code}}catch(e){parent.postMessage({type:'error',msg: String(e.message||e)},'*')}})()`
      iframe.srcdoc = `<!doctype html><html><body><script>\nwindow.onerror=function(m,u,l){parent.postMessage({type:'error',msg:m+' at '+l},'*')};\nconsole.log=function(){parent.postMessage({type:'log',msg: Array.from(arguments).join(' ')},'*')};\n${escaped} <\/script></body></html>`
      document.body.appendChild(iframe)
      setRunnerIframe(iframe)
      return
    }

    if (language === 'python') {
      (async () => {
        setStatus('Loading Python runtime...')
        try {
          await ensurePyodide()
          setStatus('Running Python...')
          const wrapped = `import sys, io\nbuf = io.StringIO()\nsys.stdout = buf\nsys.stderr = buf\ntry:\n${code.split('\n').map((l) => '  ' + l).join('\n')}\nexcept Exception as e:\n  import traceback; traceback.print_exc()\nbuf.getvalue()`
          const out = await window.pyodide.runPythonAsync(wrapped)
          setRunOutput(out ? [{ type: 'log', text: String(out) }] : [{ type: 'log', text: '' }])
          setStatus('Finished')
        } catch (e) {
          setRunOutput([{ type: 'error', text: String(e) }])
          setStatus('Error')
        }
      })()
      return
    }

    setRunOutput([{ type: 'error', text: 'Run only supported for JavaScript and Python in this demo. Save or download file to run locally for other languages.' }])
    setStatus('Run not supported for this language')
  }

  React.useEffect(() => {
    // cleanup on unmount
    function onKey(e) {
      if (e.key === 'Escape') {
        // if in fullscreen exit, else close editor
        if (document.fullscreenElement) document.exitFullscreen()
        else onClose()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => {
      stopRun()
      window.removeEventListener('keydown', onKey)
    }
  }, [])

  function enterFullscreen() {
    if (rootRef.current) {
      if (rootRef.current.requestFullscreen) rootRef.current.requestFullscreen()
      else if (rootRef.current.webkitRequestFullscreen) rootRef.current.webkitRequestFullscreen()
    }
  }


  async function createFile(e) {
    e.preventDefault()
    if (!newName) return setStatus('File name required')
    try {
      const res = await fetch(`/api/codespaces/${codespace.id}/files`, { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${localStorage.getItem('token')}` }, body: JSON.stringify({ name: newName, content: '', language: 'plaintext' }) })
      if (!res.ok) throw new Error('Create failed')
      setNewName('')
      await load()
    } catch (e) {
      setStatus('Create failed')
    }
  }

  function downloadFile() {
    if (!selected) return setStatus('No file selected')
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' })
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = selected
    a.click()
    URL.revokeObjectURL(a.href)
  }

  async function downloadAll() {
    try {
      const zip = new JSZip()
      const filesRes = await fetch(`/api/codespaces/${codespace.id}/files`, { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } })
      const d = await filesRes.json()
      const filesArr = d.files || []
      filesArr.forEach((f) => zip.file(f.name, f.content || ''))
      const blob = await zip.generateAsync({ type: 'blob' })
      const a = document.createElement('a')
      a.href = URL.createObjectURL(blob)
      a.download = `codespace-${codespace.id}.zip`
      a.click()
      URL.revokeObjectURL(a.href)
      setStatus('Downloaded archive')
    } catch (e) {
      setStatus('Download failed')
    }
  }

  async function remove(name) {
    if (!confirm('Delete file ' + name + '?')) return
    try {
      const res = await fetch(`/api/codespaces/${codespace.id}/files/${encodeURIComponent(name)}`, { method: 'DELETE', headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } })
      if (!res.ok) throw new Error('Delete failed')
      await load()
      setSelected(null)
      setContent('')
    } catch (e) {
      setStatus('Delete failed')
    }
  }

  return (
    <div className="codespace-editor" ref={rootRef}>
      <div className="editor-left">
        <div className="editor-header">Codespace #{codespace.id} — {codespace.status}</div>
        <div className="files-list">
          {files.map((f) => (
            <div key={f.name} className={`file-item ${selected === f.name ? 'active' : ''}`} onClick={() => pickFile(f)}>
              {f.name}
            </div>
          ))}
        </div>
        <form className="create-file" onSubmit={createFile}>
          <input placeholder="new-file.js" value={newName} onChange={(e) => setNewName(e.target.value)} />
          <button type="submit">New file</button>
        </form>
        <div style={{ padding: 8 }}>{status}</div>
        <div style={{ display: 'flex', gap: 12, padding: 8, justifyContent: 'center', alignItems: 'center' }}>
          <button onClick={() => { if (typeof onBackToDashboard === 'function') onBackToDashboard(); else onClose(); }} className="btn-primary">Back to Dashboard</button>
          <button onClick={enterFullscreen} className="btn-secondary">Fullscreen</button>
          <button onClick={downloadFile} className="btn-secondary">Download file</button>
          <button onClick={downloadAll} className="btn-primary">Download All</button>
          <button onClick={onClose} className="btn-secondary">Close</button>
        </div>
      </div>
      <div className="editor-right">
        {selected ? (
          <>
                  <div className="editor-toolbar">
              <div className="form-row" style={{ alignItems: 'center' }}>
                <select className="select-custom" value={language} onChange={(e) => setLanguage(e.target.value)}>
                  <option value="plaintext">Plaintext</option>
                  <option value="javascript">JavaScript</option>
                  <option value="typescript">TypeScript</option>
                  <option value="python">Python</option>
                  <option value="java">Java</option>
                  <option value="c">C</option>
                  <option value="cpp">C++</option>
                  <option value="go">Go</option>
                  <option value="ruby">Ruby</option>
                </select>
                <span className="lang-badge">{LANG_LABELS[language]}</span>
                <div style={{ marginLeft: 12, fontSize: 12, color: '#9fb3d9' }}>
                  {['javascript','python'].includes(language) ? 'Run in browser supported' : 'Save/download to run locally (server runner can be added)'}
                </div>
              </div>
              <button onClick={save} className="btn-primary">Save</button>
              <button onClick={() => remove(selected)} className="btn-danger">Delete</button>
              <button onClick={runCode} className="btn-run">Run (client)</button>
              <button onClick={runServer} className="btn-primary">Run (server)</button>
              <button onClick={stopRun} className="btn-danger">Stop</button>
              {(language === 'plaintext' || (selected && selected.endsWith('.html'))) && <button onClick={previewHtml} className="btn-secondary">Preview</button>}
            </div>
            <textarea className="code-textarea" value={content} onChange={(e) => setContent(e.target.value)} spellCheck={false} />
            <div className="run-output">
              <div className="run-output-header">Console output</div>
              <div className="run-output-body">
                {runOutput.map((r, i) => (
                  <div key={i} className={`run-line ${r.type}`}>{r.text}</div>
                ))}
              </div>
              <div style={{ padding: 8 }}>
                <button onClick={clearRun} className="btn-secondary">Clear</button>
              </div>
            </div>
            {previewSrc && (
              <div style={{ marginTop: 12 }}>
                <div style={{ marginBottom: 6, fontWeight:700 }}>HTML Preview</div>
                <iframe style={{ width: '100%', height: 320, borderRadius: 8, border: '1px solid rgba(255,255,255,0.04)' }} srcDoc={previewSrc} sandbox="allow-scripts allow-forms" />
              </div>
            )}
          </>
        ) : (
          <div style={{ padding: 20 }}>Select a file to edit or create a new one.</div>
        )}
      </div>
    </div>
  )
}
