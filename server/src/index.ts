import express from 'express';
import cors from 'cors';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

const prisma = new PrismaClient();
const app = express();

// Simple request logger for easier debugging
app.use((req, _res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
});

// Use flexible CORS in development; set FRONTEND_ORIGIN env var to lock down in production
const FRONTEND_ORIGIN = process.env.FRONTEND_ORIGIN || true;
app.use(cors({ origin: FRONTEND_ORIGIN, credentials: true }));

app.use(express.json());

const JWT_SECRET = process.env.JWT_SECRET || 'change-this-secret';

app.post('/api/register', async (req, res) => {
  const { email, password, name } = req.body;
  if (!email || !password) return res.status(400).json({ error: 'Missing email or password' });
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) return res.status(400).json({ error: 'User exists' });
  const hashed = await bcrypt.hash(password, 10);
  const user = await prisma.user.create({ data: { email, password: hashed, name } });
  const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: '7d' });
  res.json({ token, user: { id: user.id, email: user.email, name: user.name } });
});

app.post('/api/login', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ error: 'Missing fields' });
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) return res.status(401).json({ error: 'Invalid credentials' });
  const ok = await bcrypt.compare(password, user.password);
  if (!ok) return res.status(401).json({ error: 'Invalid credentials' });
  const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: '7d' });
  res.json({ token, user: { id: user.id, email: user.email, name: user.name } });
});

app.get('/api/me', async (req, res) => {
  const auth = req.headers.authorization;
  if (!auth) return res.status(401).json({ error: 'No token' });
  const token = auth.split(' ')[1];
  try {
    const payload = jwt.verify(token, JWT_SECRET) as any;
    const user = await prisma.user.findUnique({ where: { id: payload.userId } });
    res.json({ user });
  } catch (e) {
    console.error('Auth /api/me error:', e);
    res.status(401).json({ error: 'Invalid token' });
  }
});

// Simple auth middleware to protect endpoints
function authMiddleware(req: any, res: any, next: any) {
  const auth = req.headers.authorization;
  if (!auth) return res.status(401).json({ error: 'No token' });
  const token = auth.split(' ')[1];
  try {
    const payload = jwt.verify(token, JWT_SECRET) as any;
    req.userId = payload.userId;
    next();
  } catch (e) {
    console.error('Auth failed', e);
    res.status(401).json({ error: 'Invalid token' });
  }
}

// In-memory storage for quick demo (replace with DB models in production)
let repoCounter = 1;
const repos: Array<any> = []
let codespaceCounter = 1;
const codespaces: Array<any> = []

// Repositories API
app.get('/api/repos', authMiddleware, (_req, res) => {
  res.json({ repos });
})

app.post('/api/repos', authMiddleware, (req, res) => {
  const { name, description } = req.body;
  if (!name) return res.status(400).json({ error: 'Missing name' });
  const newRepo = { id: repoCounter++, name, description: description || '', ownerId: req.userId, createdAt: new Date().toISOString() };
  repos.push(newRepo);
  res.status(201).json({ repo: newRepo });
})

// Codespaces API (demo stubs)
app.get('/api/codespaces', authMiddleware, (_req, res) => {
  res.json({ codespaces });
})

app.post('/api/codespaces', authMiddleware, (req, res) => {
  const { repoId } = req.body;
  if (!repoId) return res.status(400).json({ error: 'Missing repoId' });
  const repo = repos.find((r) => r.id === Number(repoId));
  if (!repo) return res.status(404).json({ error: 'Repo not found' });
  const newCodespace = { id: codespaceCounter++, repoId: repo.id, ownerId: req.userId, status: 'stopped', createdAt: new Date().toISOString() };
  codespaces.push(newCodespace);
  res.status(201).json({ codespace: newCodespace });
})

app.post('/api/codespaces/:id/start', authMiddleware, (req, res) => {
  const id = Number(req.params.id);
  const cs = codespaces.find((c) => c.id === id);
  if (!cs) return res.status(404).json({ error: 'Codespace not found' });
  cs.status = 'running';
  res.json({ codespace: cs });
})

app.post('/api/codespaces/:id/stop', authMiddleware, (req, res) => {
  const id = Number(req.params.id);
  const cs = codespaces.find((c) => c.id === id);
  if (!cs) return res.status(404).json({ error: 'Codespace not found' });
  cs.status = 'stopped';
  res.json({ codespace: cs });
})

// Codespace file storage (in-memory demo)
const codespaceFiles: Record<number, Array<{ name: string; content: string; language?: string }>> = {}

app.get('/api/codespaces/:id/files', authMiddleware, (req, res) => {
  const id = Number(req.params.id)
  res.json({ files: codespaceFiles[id] || [] })
})

app.post('/api/codespaces/:id/files', authMiddleware, (req, res) => {
  const id = Number(req.params.id)
  const { name, content, language } = req.body
  if (!name) return res.status(400).json({ error: 'Missing file name' })
  codespaceFiles[id] = codespaceFiles[id] || []
  const idx = codespaceFiles[id].findIndex((f) => f.name === name)
  if (idx >= 0) {
    codespaceFiles[id][idx] = { name, content, language }
  } else {
    codespaceFiles[id].push({ name, content, language })
  }
  res.json({ ok: true })
})

app.delete('/api/codespaces/:id/files/:name', authMiddleware, (req, res) => {
  const id = Number(req.params.id)
  const name = req.params.name
  codespaceFiles[id] = (codespaceFiles[id] || []).filter((f) => f.name !== name)
  res.json({ ok: true })
})

// Whiteboard storage (in-memory)
const whiteboards: Record<string, any> = {}

app.get('/api/whiteboards/:id', authMiddleware, (req, res) => {
  const id = req.params.id
  res.json({ board: whiteboards[id] || null })
})

app.post('/api/whiteboards/:id', authMiddleware, (req, res) => {
  const id = req.params.id
  const { payload } = req.body
  whiteboards[id] = payload
  res.json({ ok: true })
})

// Chat messages (in-memory by room)
const chats: Record<string, Array<any>> = {}

app.get('/api/chats/:room', authMiddleware, (req, res) => {
  const room = req.params.room
  res.json({ messages: chats[room] || [] })
})

app.post('/api/chats/:room', authMiddleware, (req, res) => {
  const room = req.params.room
  const { text } = req.body
  const message = { id: Date.now(), text, userId: req.userId, createdAt: new Date().toISOString() }
  chats[room] = chats[room] || []
  chats[room].push(message)
  res.json({ message })
})

// Send email/sms stub (logs only for demo)
app.post('/api/send-email', authMiddleware, (req, res) => {
  const { to, subject, text } = req.body
  console.log('Send email stub:', { to, subject, text })
  // Hook real email provider here (SendGrid, SMTP) in production
  res.json({ ok: true })
})

app.post('/api/send-sms', authMiddleware, (req, res) => {
  const { to, text } = req.body
  console.log('Send SMS stub:', { to, text })
  // Hook SMS provider (Twilio) in production
  res.json({ ok: true })
})

// User settings (in-memory)
const userSettings: Record<number, any> = {}

app.get('/api/settings', authMiddleware, (req, res) => {
  const userId = req.userId
  res.json({ settings: userSettings[userId] || {} })
})

app.post('/api/settings', authMiddleware, (req, res) => {
  const userId = req.userId
  userSettings[userId] = req.body
  res.json({ ok: true })
})

// Code runner endpoint: compiles/runs code in a temporary workspace (demo only — not for production)
import fs from 'fs'
import os from 'os'
import path from 'path'
import { exec as _exec } from 'child_process'
import { promisify } from 'util'
const exec = promisify(_exec)

app.post('/api/run', authMiddleware, async (req, res) => {
  const { language, code } = req.body || {}
  if (!language || !code) return res.status(400).json({ error: 'Missing language or code' })
  if (String(code).length > 20000) return res.status(400).json({ error: 'Code too long' })

  const tmp = await fs.promises.mkdtemp(path.join(os.tmpdir(), 'colbos-run-'))
  try {
    let compileCmd = null
    let runCmd = null

    if (language === 'c') {
      await fs.promises.writeFile(path.join(tmp, 'main.c'), code)
      compileCmd = 'gcc main.c -O2 -std=c11 -o main'
      runCmd = './main'
    } else if (language === 'cpp') {
      await fs.promises.writeFile(path.join(tmp, 'main.cpp'), code)
      compileCmd = 'g++ main.cpp -O2 -std=c++17 -o main'
      runCmd = './main'
    } else if (language === 'java') {
      // Expect a class named Main
      await fs.promises.writeFile(path.join(tmp, 'Main.java'), code)
      compileCmd = 'javac Main.java'
      runCmd = 'java -cp . Main'
    } else if (language === 'python') {
      await fs.promises.writeFile(path.join(tmp, 'script.py'), code)
      runCmd = 'python3 script.py'
    } else if (language === 'javascript') {
      await fs.promises.writeFile(path.join(tmp, 'script.js'), code)
      runCmd = 'node script.js'
    } else {
      return res.status(400).json({ error: 'Language not supported by server runner' })
    }

    if (compileCmd) {
      try {
        await exec(compileCmd, { cwd: tmp, timeout: 10000, maxBuffer: 10 * 1024 * 1024 })
      } catch (e: any) {
        return res.json({ stdout: '', stderr: e.stderr || String(e), exitCode: e.code || 1 })
      }
    }

    try {
      const { stdout, stderr } = await exec(runCmd, { cwd: tmp, timeout: 5000, maxBuffer: 10 * 1024 * 1024 })
      return res.json({ stdout: stdout || '', stderr: stderr || '', exitCode: 0 })
    } catch (e: any) {
      return res.json({ stdout: e.stdout || '', stderr: e.stderr || String(e), exitCode: e.code || 1 })
    }
  } catch (e: any) {
    console.error('Runner error', e)
    return res.status(500).json({ error: 'Runner failed', detail: String(e) })
  } finally {
    // best-effort cleanup
    try { await fs.promises.rm(tmp, { recursive: true, force: true }) } catch (_) {}
  }
})

// Health & root endpoints
app.get('/api/health', (_req, res) => res.json({ status: 'ok', env: process.env.NODE_ENV || 'dev' }))
app.get('/', (_req, res) => res.send('Colbos API is running — use /api/* endpoints'))

// Global error handler
app.use((err: any, _req: any, res: any, _next: any) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

const PORT = Number(process.env.PORT) || 4000;
app.listen(PORT, () => console.log(`Server running on ${PORT}`));
