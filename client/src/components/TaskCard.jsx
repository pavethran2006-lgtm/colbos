import React from 'react'

export default function TaskCard({ task }) {
  return (
    <div className="task-card">
      <div className="task-title">{task.title}</div>
      <div className="task-meta">{task.assignee ? `@${task.assignee}` : 'Unassigned'}</div>
    </div>
  )
}
