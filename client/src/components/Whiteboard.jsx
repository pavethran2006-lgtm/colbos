import React, { useRef, useEffect, useState } from 'react'

export default function Whiteboard({ id = 'default' }) {
  const canvasRef = useRef(null)
  const [tool, setTool] = useState('pen') // pen, line, eraser
  const [isDrawing, setIsDrawing] = useState(false)
  const [startPos, setStartPos] = useState(null)
  const [ctx, setCtx] = useState(null)
  const [color, setColor] = useState('#000000')
  const [size, setSize] = useState(3)

  // Load existing board and handle resize
  useEffect(() => {
    const canvas = canvasRef.current
    function resize() {
      const data = canvas.toDataURL()
      canvas.width = canvas.clientWidth
      canvas.height = canvas.clientHeight
      const c = canvas.getContext('2d')
      c.lineJoin = 'round'
      c.lineCap = 'round'
      setCtx(c)
      if (data) {
        const img = new Image()
        img.onload = () => c.drawImage(img, 0, 0, canvas.width, canvas.height)
        img.src = data
      }
    }

    resize()
    window.addEventListener('resize', resize)

    fetch(`/api/whiteboards/${id}`, { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } })
      .then((r) => r.json())
      .then((d) => {
        if (d.board && d.board.image) {
          const img = new Image()
          img.onload = () => ctx?.drawImage(img, 0, 0, canvas.width, canvas.height)
          img.src = d.board.image
        }
      })

    return () => window.removeEventListener('resize', resize)
  }, [id])

  function getPos(e) {
    const rect = canvasRef.current.getBoundingClientRect()
    return { x: e.clientX - rect.left, y: e.clientY - rect.top }
  }

  function onMouseDown(e) {
    const pos = getPos(e)
    setStartPos(pos)
    setIsDrawing(true)
    if (tool === 'pen' || tool === 'eraser') {
      ctx.beginPath()
      ctx.moveTo(pos.x, pos.y)
    }
  }

  function onMouseMove(e) {
    if (!isDrawing) return
    const pos = getPos(e)
    if (tool === 'pen') {
      ctx.strokeStyle = color
      ctx.lineWidth = size
      ctx.lineTo(pos.x, pos.y)
      ctx.stroke()
    } else if (tool === 'eraser') {
      ctx.globalCompositeOperation = 'destination-out'
      ctx.lineWidth = size * 2
      ctx.lineTo(pos.x, pos.y)
      ctx.stroke()
      ctx.globalCompositeOperation = 'source-over'
    }
  }

  function onMouseUp(e) {
    setIsDrawing(false)
    const pos = getPos(e)
    if (tool === 'line' && startPos) {
      ctx.strokeStyle = color
      ctx.lineWidth = size
      ctx.beginPath()
      ctx.moveTo(startPos.x, startPos.y)
      ctx.lineTo(pos.x, pos.y)
      ctx.stroke()
    }
  }

  async function save() {
    const data = canvasRef.current.toDataURL('image/png')
    await fetch(`/api/whiteboards/${id}`, { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${localStorage.getItem('token')}` }, body: JSON.stringify({ payload: { image: data } }) })
    alert('Whiteboard saved')
  }

  function clearCanvas() {
    const canvas = canvasRef.current
    ctx.clearRect(0, 0, canvas.width, canvas.height)
  }

  function download() {
    const a = document.createElement('a')
    a.href = canvasRef.current.toDataURL('image/png')
    a.download = `whiteboard-${id}.png`
    a.click()
  }

  function enterFullscreen() {
    const el = canvasRef.current
    if (el.requestFullscreen) el.requestFullscreen()
    else if (el.webkitRequestFullscreen) el.webkitRequestFullscreen()
  }

  return (
    <div className="whiteboard-page">
      <div className="whiteboard-toolbar">
        <div className="segmented" role="tablist" aria-label="Tool selection">
          <button type="button" className={tool === 'pen' ? 'active' : ''} onClick={() => setTool('pen')}>Pen</button>
          <button type="button" className={tool === 'line' ? 'active' : ''} onClick={() => setTool('line')}>Line</button>
          <button type="button" className={tool === 'eraser' ? 'active' : ''} onClick={() => setTool('eraser')}>Eraser</button>
        </div>
        <input type="color" value={color} onChange={(e) => setColor(e.target.value)} />
        <input type="range" min={1} max={40} value={size} onChange={(e) => setSize(Number(e.target.value))} />
        {tool === 'eraser' && <div className="eraser-info">Eraser size: {size}</div>}
        <button onClick={save}>Save</button>
        <button onClick={clearCanvas}>Clear</button>
        <button onClick={download}>Download</button>
        <button onClick={enterFullscreen}>Fullscreen</button>
      </div>
      <div className="whiteboard-canvas-wrap">
        <canvas ref={canvasRef} className="whiteboard-canvas" onMouseDown={onMouseDown} onMouseMove={onMouseMove} onMouseUp={onMouseUp} />
      </div>
    </div>
  )
}
