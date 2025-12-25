import React, { useEffect, useState } from 'react'

export default function Chat({ room = 'general' }) {
  const [messages, setMessages] = useState([])
  const [text, setText] = useState('')
  const [error, setError] = useState(null)

  async function load() {
    try {
      const res = await fetch(`/api/chats/${room}`, { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } })
      const d = await res.json()
      setMessages(d.messages || [])
    } catch (e) {
      setError('Failed to load chat')
    }
  }

  useEffect(() => { load() }, [room])

  async function send() {
    if (!text) return
    try {
      const res = await fetch(`/api/chats/${room}`, { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${localStorage.getItem('token')}` }, body: JSON.stringify({ text }) })
      const d = await res.json()
      setMessages((m) => [...m, d.message])
      setText('')
    } catch (e) {
      setError('Send failed')
    }
  }

  async function notifyEmail(msg) {
    await fetch('/api/send-email', { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${localStorage.getItem('token')}` }, body: JSON.stringify({ to: 'example@domain.com', subject: `Chat message from ${room}`, text: msg }) })
    alert('Email notification stub sent (check server logs)')
  }

  async function notifySms(msg) {
    await fetch('/api/send-sms', { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${localStorage.getItem('token')}` }, body: JSON.stringify({ to: '+1234567890', text: msg }) })
    alert('SMS notification stub sent (check server logs)')
  }

  return (
    <div className="chat-page">
      <h3>Chat: {room}</h3>
      <div className="messages">
        {messages.map((m) => (
          <div key={m.id} className="message"><div className="msg-user">{m.userId}</div><div className="msg-text">{m.text}</div><div className="msg-time">{new Date(m.createdAt).toLocaleString()}</div></div>
        ))}
      </div>
      <div className="chat-actions">
        <input placeholder="Write a message" value={text} onChange={(e) => setText(e.target.value)} />
        <button onClick={send}>Send</button>
        <button onClick={() => notifyEmail(text)}>Send as Email</button>
        <button onClick={() => notifySms(text)}>Send as SMS</button>
      </div>
      {error && <div className="error">{error}</div>}
    </div>
  )
}
