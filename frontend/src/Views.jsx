import React, { Component, useState, useEffect, useMemo, useRef } from 'react';
import {
  Search,
  Flame,
  Filter,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  Check,
  CheckCircle2,
  X,
  Clock,
  Trophy,
  Star,
  Lock,
  ExternalLink,
  RefreshCw,
  Award,
  Clock3,
  MapPin,
  Pencil
} from 'lucide-react';

export const API = import.meta.env.VITE_API_URL || 'http://localhost:8000/api'
export const authHeaders = () => {
  const t = localStorage.getItem('codearena-token')
  return t ? { Authorization: `Bearer ${t}` } : {}
}

export function AuthModal({ onClose, onAuth }) {
  const [mode, setMode] = useState('login')
  const [f, setF] = useState({ name: '', email: '', password: '' })
  const [err, setErr] = useState('')
  const [busy, setBusy] = useState(false)
  const set = k => e => setF({ ...f, [k]: e.target.value })

  async function submit(e) {
    e.preventDefault()
    setBusy(true); setErr('')
    try {
      const body = mode === 'login' ? { email: f.email, password: f.password } : f
      const r = await fetch(`${API}/auth/${mode}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
      const d = await r.json()
      if (!r.ok) throw new Error(typeof d.detail === 'string' ? d.detail : 'Please check the details you entered.')
      onAuth(d.token, d.name)
    } catch (e2) { setErr(e2.message === 'Failed to fetch' ? 'Backend not connected. Start the FastAPI server on port 8000.' : e2.message) } finally { setBusy(false) }
  }

  return (
    <div className="modal-back" onClick={onClose}>
      <form className="modal" onClick={e => e.stopPropagation()} onSubmit={submit}>
        <h2>{mode === 'login' ? 'Log in' : 'Create account'}</h2>
        <p className="page-sub">Log in to submit solutions, earn points and appear on the leaderboard.</p>
        {mode === 'register' && <label>Display name<input value={f.name} onChange={set('name')} placeholder="2-20 letters or numbers" autoFocus required /></label>}
        <label>Email<input type="email" value={f.email} onChange={set('email')} autoFocus={mode === 'login'} required /></label>
        <label>Password<input type="password" value={f.password} onChange={set('password')} placeholder={mode === 'register' ? 'At least 8 characters' : ''} required /></label>
        {err && <div className="error-box">{err}</div>}
        <button className="submit-btn modal-btn" disabled={busy}>{busy ? 'Please wait…' : mode === 'login' ? 'Log in' : 'Sign up'}</button>
        <button type="button" className="link-btn" onClick={() => { setMode(mode === 'login' ? 'register' : 'login'); setErr('') }}>
          {mode === 'login' ? 'New here? Create an account' : 'Already have an account? Log in'}
        </button>
      </form>
    </div>
  )
}
const PTS = { Easy: 10, Medium: 20, Hard: 30 }
const langName = { python: 'Python', java: 'Java', c: 'C' }

class Boundary extends Component {
  state = { failed: false }
  static getDerivedStateFromError() { return { failed: true } }
  render() {
    return this.state.failed
      ? <div className="guide"><div className="error-box">Something went wrong showing this tab. Reload the page and try again.</div></div>
      : this.props.children
  }
}

export function GuidePane(props) {
  return <Boundary key={`${props.kind}:${props.problemId}`}><GuideInner {...props} /></Boundary>
}

function GuideInner({ kind, problemId, language, solvedCount }) {
  const key = `${kind}:${problemId}:${solvedCount}`
  const [res, setRes] = useState({ key: '' })
  useEffect(() => {
    let live = true
    fetch(`${API}/problems/${problemId}/${kind === 'editorial' ? 'editorial' : 'solution'}`, { headers: authHeaders() })
      .then(async r => { const d = await r.json(); if (!r.ok) throw { status: r.status, msg: d.detail }; return d })
      .then(d => live && setRes({ key, data: d }))
      .catch(e => live && setRes({ key, err: e.status ? e : { msg: 'Backend not connected. Start the FastAPI server on port 8000.' } }))
    return () => { live = false }
  }, [key])

  const { data, err } = res.key === key ? res : {}
  if (err && (err.status === 401 || err.status === 403)) return (
    <div className="guide"><div className="lock-box"><Lock size={22} /><strong>Solution locked</strong><span>{err.msg}</span></div></div>)
  if (err) return <div className="guide"><div className="error-box">{err.msg}</div></div>
  if (!data) return <div className="loading">Loading…</div>
  if (kind === 'editorial') return (
    <div className="guide">
      <h3>Approach</h3><p>{data.approach}</p>
      <h3>Hints</h3>
      {data.hints.map((h, i) => <details key={i}><summary>Hint {i + 1}</summary><p>{h}</p></details>)}
      <h3>Complexity</h3><p>{data.complexity}</p>
    </div>)
  const code = data.solutions[language] || data.solutions.python
  return (
    <div className="guide">
      <h3>Sample solution</h3>
      {!data.solutions[language] && <p className="page-sub">Showing the Python solution. Other languages are coming soon.</p>}
      <pre className="mcq-code">{code}</pre>
    </div>)
}

export function DailyTimer({ start, solved }) {
  const [now, setNow] = useState(Date.now())
  const wasSolved = useRef(solved)
  const endAt = useRef(null)
  if (solved && !wasSolved.current && endAt.current === null) endAt.current = Date.now()
  useEffect(() => {
    if (solved) return
    const t = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(t)
  }, [solved])
  if (wasSolved.current) return <span className="daily-timer"><CheckCircle2 size={13} /> Already solved</span>
  const sec = Math.max(0, Math.floor(((endAt.current ?? now) - start) / 1000))
  const mmss = `${String(Math.floor(sec / 60)).padStart(2, '0')}:${String(sec % 60).padStart(2, '0')}`
  return <span className={`daily-timer ${solved ? 'done' : ''}`}><Clock3 size={13} /> {solved ? `Solved in ${mmss}` : mmss}</span>
}

export function McqPane({ mcq, ensureUser, onDone, timer, solved }) {
  const [choice, setChoice] = useState(null)
  const [res, setRes] = useState(null)
  const [busy, setBusy] = useState(false)
  useEffect(() => { setChoice(null); setRes(null) }, [mcq.id])

  async function check() {
    const user = ensureUser()
    if (!user || choice === null) return
    setBusy(true)
    try {
      const r = await fetch(`${API}/mcqs/${mcq.id}/answer`, {
        method: 'POST', headers: { 'Content-Type': 'application/json', ...authHeaders() },
        body: JSON.stringify({ choice })
      })
      const d = await r.json()
      if (!r.ok) throw new Error(d.detail || 'Could not check the answer')
      setRes(d); onDone()
    } catch (e) { setRes({ error: e.message }) } finally { setBusy(false) }
  }

  return (
    <section className="left-panel mcq-pane">
      <div className="panel-tabs"><span className="panel-tab active">Multiple choice</span>{timer && <DailyTimer key={mcq.id} start={timer.start} solved={solved} />}</div>
      <div className="description-scroll">
        <div className="tag-row">
          <span className={`difficulty-pill ${mcq.difficulty.toLowerCase()}`}>{mcq.difficulty}</span>
          <span className="tag">{langName[mcq.lang]}</span><span className="tag">{mcq.topic}</span>
          <span className="tag">{PTS[mcq.difficulty]} pts</span>
        </div>
        <h1 className="mcq-q">{mcq.question}</h1>
        {mcq.code && <pre className="mcq-code">{mcq.code}</pre>}
        <div className="mcq-options">
          {mcq.options.map((o, i) => {
            let cls = 'mcq-opt'
            if (res && !res.error) { if (i === res.correct_index) cls += ' right'; else if (i === choice) cls += ' wrong' }
            else if (i === choice) cls += ' picked'
            return <button key={i} className={cls} disabled={!!res && !res.error} onClick={() => setChoice(i)}>{o}</button>
          })}
        </div>
        {!res && <button className="submit-btn mcq-submit" disabled={busy || choice === null} onClick={check}>Check answer</button>}
        {res?.error && <div className="error-box">{res.error}</div>}
        {res && !res.error && <div className={`verdict ${res.correct ? 'accepted' : 'failed'}`}>
          <div><strong>{res.correct ? 'Correct' : 'Not quite'}</strong></div>
          <span>{res.correct ? (res.points_awarded ? `+${res.points_awarded} points` : 'Already solved, no new points') : 'Try the next one'}</span>
        </div>}
        {res && !res.error && <p className="mcq-explain">{res.explanation}</p>}
      </div>
    </section>
  )
}

export function DailyPage({ onOpen, me }) {
  const [daily, setDaily] = useState(null)
  const [err, setErr] = useState('')
  useEffect(() => {
    fetch(`${API}/daily`).then(r => r.json()).then(setDaily).catch(() => setErr('Backend not connected. Start the FastAPI server on port 8000.'))
  }, [])
  const done = it => (it.kind === 'mcq' ? me?.mcqs : me?.problems)?.includes(it.id)
  return (
    <div className="page">
      <span className="eyebrow">TODAY</span><h2>Daily challenges</h2>
      <p className="page-sub">One new question at each level. They change every day.</p>
      {err && <div className="error-box">{err}</div>}
      <div className="daily-grid">
        {daily && Object.entries(daily).map(([level, it]) => (
          <button key={level} className="daily-card" onClick={() => onOpen(it.kind, it.id, true)}>
            <span className={`difficulty-pill ${level.toLowerCase()}`}>{level}</span>
            <strong>{it.kind === 'problem' ? it.title : 'Multiple choice'}</strong>
            <span className="daily-sub">{it.kind === 'problem' ? 'Coding challenge' : it.title}</span>
            <span className="daily-foot">{it.topic} · {PTS[level]} pts {done(it) && <CheckCircle2 size={14} className="solved-icon" />}</span>
          </button>
        ))}
      </div>
    </div>
  )
}

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
const dayKey = d => d.toLocaleDateString('en-CA')

function Ring({ solved, total }) {
  const C = 2 * Math.PI * 42
  const frac = total ? solved / total : 0
  return (
    <svg viewBox="0 0 100 100" className="ring" role="img" aria-label={`${solved} of ${total} solved`}>
      <circle cx="50" cy="50" r="42" className="ring-bg" />
      <circle cx="50" cy="50" r="42" className="ring-fg" strokeDasharray={`${frac * C} ${C}`} transform="rotate(-90 50 50)" />
      <text x="50" y="50" textAnchor="middle" className="ring-n">{solved}</text>
      <text x="50" y="65" textAnchor="middle" className="ring-t">/ {total} solved</text>
    </svg>
  )
}

function PointsChart({ history }) {
  if (history.length < 2) return <p className="page-sub">Solve a few more questions to see your points grow.</p>
  let run = 0
  const pts = history.map(h => (run += h.points))
  const W = 300, H = 80, max = pts[pts.length - 1]
  const xy = pts.map((v, i) => `${(i / (pts.length - 1)) * W},${H - (v / max) * (H - 8) - 4}`).join(' ')
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="chart" preserveAspectRatio="none" role="img" aria-label="Points over time">
      <polygon points={`0,${H} ${xy} ${W},${H}`} className="chart-area" />
      <polyline points={xy} className="chart-line" />
    </svg>
  )
}

function polar(r, deg) { const a = deg * Math.PI / 180; return [100 + r * Math.cos(a), 100 + r * Math.sin(a)] }
function arcPath(a0, a1, r = 82) {
  const [x0, y0] = polar(r, a0), [x1, y1] = polar(r, a1)
  return `M ${x0.toFixed(2)} ${y0.toFixed(2)} A ${r} ${r} 0 ${a1 - a0 > 180 ? 1 : 0} 1 ${x1.toFixed(2)} ${y1.toFixed(2)}`
}

function Gauge({ by, solved, total }) {
  const GAP = 4
  const levels = [['Easy', '#00b8a3'], ['Medium', '#ffc01e'], ['Hard', '#ff375f']]
  const sum = levels.reduce((n, [d]) => n + by[d].total, 0) || 1
  const usable = 270 - GAP * 2
  let cur = 135
  return (
    <svg viewBox="0 0 200 200" className="gauge" role="img" aria-label={`${solved} of ${total} solved`}>
      {levels.map(([d, color]) => {
        const len = usable * by[d].total / sum
        const a0 = cur, a1 = cur + len
        cur = a1 + GAP
        const f = by[d].total ? by[d].solved / by[d].total : 0
        return <g key={d}><path d={arcPath(a0, a1)} stroke={color} className="g-bg" />{f > 0 && <path d={arcPath(a0, a0 + len * f)} stroke={color} className="g-fg" />}</g>
      })}
      <text x="100" y="100" textAnchor="middle" className="g-n">{solved}<tspan className="g-t">/{total}</tspan></text>
      <text x="100" y="124" textAnchor="middle" className="g-s">Solved</text>
    </svg>
  )
}

function EditProfileModal({ profile, onClose, onSaved }) {
  const [location, setLocation] = useState(profile.location || '')
  const [bio, setBio] = useState(profile.bio || '')
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState('')
  useEffect(() => {
    const esc = e => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', esc)
    return () => document.removeEventListener('keydown', esc)
  }, [onClose])
  async function save(e) {
    e.preventDefault()
    setBusy(true); setErr('')
    try {
      const r = await fetch(`${API}/profile`, { method: 'POST', headers: { 'Content-Type': 'application/json', ...authHeaders() }, body: JSON.stringify({ location, bio }) })
      const d = await r.json()
      if (!r.ok) throw new Error(typeof d.detail === 'string' ? d.detail : 'Could not save your profile.')
      onSaved()
    } catch (e2) { setErr(e2.message === 'Failed to fetch' ? 'Backend not connected. Start the FastAPI server on port 8000.' : e2.message) } finally { setBusy(false) }
  }
  return (
    <div className="modal-back" onClick={onClose}>
      <form className="modal" onClick={e => e.stopPropagation()} onSubmit={save}>
        <h2>Edit Profile</h2>
        <label>Location<input value={location} onChange={e => setLocation(e.target.value)} maxLength={60} placeholder="For example: India" autoFocus /></label>
        <label>About you<textarea value={bio} onChange={e => setBio(e.target.value)} maxLength={200} rows={4} placeholder="A short line about you (200 characters)" /></label>
        {err && <div className="error-box">{err}</div>}
        <button className="submit-btn modal-btn" disabled={busy}>{busy ? 'Saving…' : 'Save'}</button>
        <button type="button" className="link-btn" onClick={onClose}>Cancel</button>
      </form>
    </div>
  )
}

export function ProgressPage({ me, user, onRefresh }) {
  const [editing, setEditing] = useState(false)
  if (!user) return <div className="page"><h2>Dashboard</h2><p className="page-sub">Log in (top right) to see your dashboard.</p></div>
  if (!me) return <div className="page"><p className="page-sub">Loading…</p></div>

  const today = new Date(); today.setHours(0, 0, 0, 0)
  const counts = me.activity || {}
  const start = new Date(today); start.setDate(start.getDate() - ((today.getDay() + 6) % 7) - 52 * 7)
  const cells = Array.from({ length: 53 * 7 }, (_, i) => {
    const d = new Date(start); d.setDate(start.getDate() + i)
    const k = dayKey(d), n = counts[k] || 0
    return { k, n, future: d > today, month: d.getMonth(), first: i % 7 === 0 }
  })
  const weeks = cells.filter(c => c.first)
  const lvl = n => (n === 0 ? 0 : n === 1 ? 1 : n <= 3 ? 2 : n <= 5 ? 3 : 4)
  const inYear = cells.reduce((n, c) => n + (c.future ? 0 : c.n), 0)
  const ago = day => { const n = Math.round((today - new Date(day + 'T00:00:00')) / 864e5); return n <= 0 ? 'Today' : n === 1 ? 'Yesterday' : `${n} days ago` }
  const totalAll = me.totals.problems + me.totals.mcqs
  const solvedAll = me.history.length
  const recent = [...me.history].reverse().slice(0, 8)
  const D = me.by_difficulty
  const earned = me.badges.filter(b => b.earned)
  const locked = me.badges.find(b => !b.earned)
  const joined = me.profile.joined ? new Date(me.profile.joined + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', year: 'numeric' }) : null

  return (
    <div className="page wide dash">
      {editing && <EditProfileModal profile={me.profile} onClose={() => setEditing(false)} onSaved={() => { setEditing(false); if (onRefresh) onRefresh() }} />}
      <aside className="card db-profile">
        <div className="db-id">
          <div className="avatar big">{me.name[0].toUpperCase()}</div>
          <div><h2>{me.name}</h2><p className="db-member">CodeArena member{joined ? ` · Joined ${joined}` : ''}</p></div>
        </div>
        <button className="db-edit" onClick={() => setEditing(true)}><Pencil size={14} /> Edit Profile</button>
        {me.profile.location && <p className="db-line"><MapPin size={14} /> {me.profile.location}</p>}
        {me.profile.bio && <p className="db-bio">{me.profile.bio}</p>}

        <h3 className="db-h">Leaderboard</h3>
        <div className="db-grid2">
          <div><strong>{me.rank ? `#${me.rank}` : '-'}</strong><span>Rank of {me.players}</span></div>
          <div><strong>{me.points}</strong><span>Points</span></div>
        </div>
        <h3 className="db-h">Streak</h3>
        <div className="db-grid3">
          <div><strong><Flame size={15} /> {me.streak}</strong><span>Current</span></div>
          <div><strong>{me.best_streak}</strong><span>Longest</span></div>
          <div><strong>{me.days.length}</strong><span>Active days</span></div>
        </div>
        <h3 className="db-h">Languages</h3>
        {me.languages.length === 0 && <p className="page-sub">None yet</p>}
        {me.languages.map(l => <div key={l.lang} className="kv"><span className="tag">{langName[l.lang]}</span><em>{l.count} solved</em></div>)}
        <h3 className="db-h">Skills</h3>
        <div className="skill-tags">
          {me.skills.length === 0 && <p className="page-sub">None yet</p>}
          {me.skills.map(k => <span key={k.topic} className="tag">{k.topic} <b>x{k.count}</b></span>)}
        </div>
      </aside>

      <div className="dash-main">
        <div className="card solved-card">
          <Gauge by={D} solved={solvedAll} total={totalAll} />
          <div className="diff-list">
            {['Easy', 'Medium', 'Hard'].map(d => (
              <div key={d} className={`diff-row ${d.toLowerCase()}`}><span>{d === 'Medium' ? 'Med.' : d}</span><strong>{D[d].solved}<em>/{D[d].total}</em></strong></div>
            ))}
          </div>
        </div>

        <div className="card">
          <div className="card-head"><strong>Submissions</strong></div>
          <div className="db-grid3">
            <div><strong>{me.submissions.total}</strong><span>Total submissions</span></div>
            <div><strong>{me.submissions.accepted}</strong><span>Accepted</span></div>
            <div><strong>{me.submissions.rate}%</strong><span>Acceptance rate</span></div>
          </div>
        </div>

        <div className="card">
          <div className="db-badge-top">
            <div><span className="muted-label">Badges</span><div className="badge-count">{earned.length}</div>
              <div className="earned-row">{earned.map(b => <span key={b.id} className="tag" title={b.desc}><Award size={12} /> {b.name}</span>)}</div></div>
            {locked && <Award size={64} className="locked-icon" />}
          </div>
          {locked && <div className="locked"><span className="muted-label">Locked Badge</span><strong>{locked.name}</strong><em>{locked.desc}</em></div>}
        </div>

        <div className="card">
          <div className="card-head"><strong>{inYear}</strong> submissions in the past year
            <span className="head-right">Total active days: <b>{me.days.length}</b> &nbsp; Max streak: <b>{me.best_streak}</b></span></div>
          <div className="heat-wrap">
            <div className="heat">{cells.map(c => <i key={c.k} title={`${c.k}: ${c.n} submission${c.n === 1 ? '' : 's'}`} className={`l${c.future ? 0 : lvl(c.n)} ${c.future ? 'future' : ''}`} />)}</div>
            <div className="heat-months">{weeks.map((w, i) => <span key={w.k}>{i === 0 || w.month !== weeks[i - 1].month ? MONTHS[w.month] : ''}</span>)}</div>
          </div>
        </div>

        <div className="card">
          <div className="card-head"><strong>Points history</strong><span className="head-right">{me.points} pts</span></div>
          <PointsChart history={me.history} />
        </div>

        <div className="card">
          <div className="card-head"><strong>Recent solves</strong></div>
          {recent.length === 0 && <p className="page-sub">Nothing solved yet. Open Problems or Daily to start.</p>}
          {recent.map((h, i) => (
            <div key={i} className="recent-row"><CheckCircle2 size={14} className="solved-icon" /><span className="t">{h.title}</span><span className={`tag ${h.difficulty}`}>{h.difficulty}</span><em>{ago(h.day)}</em></div>
          ))}
        </div>
      </div>
    </div>
  )
}

export function ProblemSetPage({ problems, mcqs, me, solvedLocal, onOpen, onDaily, onLogin, user }) {
  const [q, setQ] = useState('')
  const [diff, setDiff] = useState('All')
  const [status, setStatus] = useState('All')
  const [type, setType] = useState('All')
  const [topic, setTopic] = useState('All')
  const items = [
    ...problems.map(p => ({ kind: 'problem', id: p.id, title: p.title, difficulty: p.difficulty, acc: p.acceptance, topics: p.topics, tlabel: 'Coding', lang: null })),
    ...mcqs.map(m => ({ kind: 'mcq', id: m.id, title: `${m.topic}: ${m.question}`, difficulty: m.difficulty, acc: null, topics: [m.topic], tlabel: `MCQ · ${langName[m.lang]}`, lang: m.lang })),
  ].map((it, i) => ({ ...it, n: i + 1, done: it.kind === 'problem' ? !!(me?.problems?.includes(it.id) || solvedLocal.includes(it.id)) : !!me?.mcqs?.includes(it.id) }))
  const freq = {}
  items.forEach(it => it.topics.forEach(t => { freq[t] = (freq[t] || 0) + 1 }))
  const topTopics = Object.keys(freq).sort((a, b) => freq[b] - freq[a]).slice(0, 12)
  const shown = items.filter(it =>
    (diff === 'All' || it.difficulty === diff) &&
    (status === 'All' || (status === 'Solved') === it.done) &&
    (type === 'All' || (type === 'Coding' ? it.kind === 'problem' : it.lang === type)) &&
    (topic === 'All' || it.topics.includes(topic)) &&
    it.title.toLowerCase().includes(q.toLowerCase()))
  const pick = () => {
    const todo = items.filter(it => !it.done)
    const pool = todo.length ? todo : items
    if (pool.length) { const it = pool[Math.floor(Math.random() * pool.length)]; onOpen(it.kind, it.id) }
  }
  const by = d => ({ solved: items.filter(it => it.difficulty === d && it.done).length, total: items.filter(it => it.difficulty === d).length })

  return (
    <div className="ps-wrap">
      <div className="ps">
        <section>
          <div className="chip-row">
            {['All', ...topTopics].map(t => <button key={t} className={`topic-pill ${topic === t ? 'on' : ''}`} onClick={() => setTopic(t)}>{t === 'All' ? 'All Topics' : t}</button>)}
          </div>
          <div className="ps-controls">
            <input value={q} onChange={e => setQ(e.target.value)} placeholder="Search questions" aria-label="Search questions" />
            <select value={diff} onChange={e => setDiff(e.target.value)} aria-label="Difficulty"><option value="All">Difficulty</option><option>Easy</option><option>Medium</option><option>Hard</option></select>
            <select value={status} onChange={e => setStatus(e.target.value)} aria-label="Status"><option value="All">Status</option><option>Solved</option><option>Todo</option></select>
            <select value={type} onChange={e => setType(e.target.value)} aria-label="Type"><option value="All">Type</option><option value="Coding">Coding</option><option value="python">Python MCQ</option><option value="java">Java MCQ</option><option value="c">C MCQ</option></select>
            <button className="pick-btn" onClick={pick}>Pick One</button>
          </div>
          <table className="ps-table">
            <thead><tr><th>Status</th><th>Title</th><th>Type</th><th>Acceptance</th><th>Difficulty</th></tr></thead>
            <tbody>
              {shown.map(it => (
                <tr key={it.kind + it.id} onClick={() => onOpen(it.kind, it.id)}>
                  <td>{it.done ? <CheckCircle2 size={16} className="solved-icon" /> : null}</td>
                  <td><button className="ps-link">{it.n}. {it.title}</button></td>
                  <td className="ps-type">{it.tlabel}</td>
                  <td className="ps-acc">{it.acc || '-'}</td>
                  <td className={`ps-diff ${it.difficulty}`}>{it.difficulty === 'Medium' ? 'Med.' : it.difficulty}</td>
                </tr>))}
            </tbody>
          </table>
          {shown.length === 0 && <div className="ps-empty">No questions match these filters.</div>}
        </section>
        <aside className="ps-side">
          <div className="card">
            <div className="solved-card">
              <Ring solved={items.filter(it => it.done).length} total={items.length} />
              <div className="diff-list">
                {['Easy', 'Medium', 'Hard'].map(d => { const x = by(d); return <div key={d} className={`diff-row ${d.toLowerCase()}`}><span>{d === 'Medium' ? 'Med.' : d}</span><strong>{x.solved}<em>/{x.total}</em></strong></div> })}
              </div>
            </div>
            {user
              ? <div className="side-stats"><div><strong><Flame size={15} /> {me?.streak ?? 0}</strong><span>Day streak</span></div><div><strong>{me?.points ?? 0}</strong><span>Points</span></div></div>
              : <button className="side-btn alt" onClick={onLogin}>Log in to track progress</button>}
            <button className="side-btn" onClick={onDaily}>Daily challenges</button>
          </div>
        </aside>
      </div>
    </div>
  )
}

export function LeaderboardPage({ user }) {
  const [rows, setRows] = useState(null)
  const [err, setErr] = useState('')
  useEffect(() => {
    fetch(`${API}/leaderboard`).then(r => r.json()).then(setRows).catch(() => setErr('Backend not connected. Start the FastAPI server on port 8000.'))
  }, [])
  return (
    <div className="page">
      <span className="eyebrow">RANKING</span><h2><Trophy size={18} /> Leaderboard</h2>
      {err && <div className="error-box">{err}</div>}
      {rows && rows.length === 0 && <p className="page-sub">No scores yet. Solve a problem to be first.</p>}
      {rows && rows.length > 0 && <table className="board">
        <thead><tr><th>#</th><th>Student</th><th>Solved</th><th>Points</th></tr></thead>
        <tbody>{rows.map((r, i) => <tr key={r.name} className={r.name === user ? 'me' : ''}><td>{i + 1}</td><td>{r.name}</td><td>{r.solved}</td><td>{r.points}</td></tr>)}</tbody>
      </table>}
    </div>
  )
}


// External LeetCode metadata catalog. Only metadata is displayed; statements,
// examples, solutions, and test cases are intentionally not downloaded or stored.
const LEETCODE_METADATA_CSV =
  'https://huggingface.co/datasets/kaysss/leetcode-problem-set/resolve/main/data.csv'
function parseCsvLine(line) {
  const cells = []
  let value = '', quoted = false
  for (let i = 0; i < line.length; i++) {
    const ch = line[i]
    if (ch === '"') {
      if (quoted && line[i + 1] === '"') { value += '"'; i++ }
      else quoted = !quoted
    } else if (ch === ',' && !quoted) {
      cells.push(value); value = ''
    } else value += ch
  }
  cells.push(value)
  return cells
}

function parseLeetCodeCsv(csv) {
  const lines = csv.replace(/^\\uFEFF/, '').split(/\\r?\\n/).filter(Boolean)
  if (lines.length < 2) return []
  const headers = parseCsvLine(lines[0])
  const at = name => headers.indexOf(name)
  const fields = {
    id: at('frontendQuestionId'), title: at('title'), slug: at('titleSlug'),
    difficulty: at('difficulty'), tags: at('topicTags'), paid: at('paidOnly'),
    acceptance: at('acRate')
  }
  if (fields.title < 0 || fields.slug < 0) throw new Error('The metadata source format has changed.')
  return lines.slice(1).map(line => {
    const c = parseCsvLine(line)
    let topics = []
    try { topics = JSON.parse(c[fields.tags] || '[]') } catch {}
    return {
      id: c[fields.id] || '',
      title: c[fields.title] || '',
      slug: c[fields.slug] || '',
      difficulty: c[fields.difficulty] || 'Unknown',
      topics: Array.isArray(topics) ? topics.map(t => typeof t === 'string' ? t : t.name).filter(Boolean) : [],
      paid: String(c[fields.paid] || '').toLowerCase() === 'true',
      acceptance: c[fields.acceptance] || ''
    }
  }).filter(p => p.title && p.slug)
}

export function LeetCodeCatalogPage() {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [query, setQuery] = useState('')
  const [difficulty, setDifficulty] = useState('All')
  const [topic, setTopic] = useState('All')
  const [access, setAccess] = useState('All')
  const [page, setPage] = useState(1)
  const pageSize = 50

  useEffect(() => {
    let alive = true
    fetch(LEETCODE_METADATA_CSV)
      .then(r => { if (!r.ok) throw new Error(`Metadata source returned ${r.status}.`); return r.text() })
      .then(text => {
        const parsed = parseLeetCodeCsv(text)
        if (!parsed.length) throw new Error('No problem metadata was found in the source.')
        if (alive) { setItems(parsed); setError(''); setLoading(false) }
      })
      .catch(() => {
        if (alive) {
          setError('Could not load the external catalog. Check your internet connection or try again later.')
          setLoading(false)
        }
      })
    return () => { alive = false }
  }, [])

  const topics = useMemo(() => [...new Set(items.flatMap(p => p.topics))].sort(), [items])
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return items.filter(p =>
      (!q || p.title.toLowerCase().includes(q) || p.id.toLowerCase().includes(q) || p.topics.some(t => t.toLowerCase().includes(q))) &&
      (difficulty === 'All' || p.difficulty === difficulty) &&
      (topic === 'All' || p.topics.includes(topic)) &&
      (access === 'All' || (access === 'Free' ? !p.paid : p.paid))
    )
  }, [items, query, difficulty, topic, access])

  useEffect(() => { setPage(1) }, [query, difficulty, topic, access])
  const pageCount = Math.max(1, Math.ceil(filtered.length / pageSize))
  const shown = filtered.slice((page - 1) * pageSize, page * pageSize)
  const counts = useMemo(() => ({
    Easy: items.filter(p => p.difficulty === 'Easy').length,
    Medium: items.filter(p => p.difficulty === 'Medium').length,
    Hard: items.filter(p => p.difficulty === 'Hard').length
  }), [items])

  return <main className="page wide leetcode-catalog">
    <span className="eyebrow">EXTERNAL PROBLEM LIBRARY</span>
    <div className="lc-heading">
      <div><h1>LeetCode Problem Catalog</h1><p className="page-sub">Search problem metadata and open the original question on LeetCode.</p></div>
      <a className="lc-source-link" href="https://leetcode.com/problemset/" target="_blank" rel="noreferrer">Official problemset ↗</a>
    </div>
    <div className="lc-stats">
      <div><strong>{loading ? '…' : items.length.toLocaleString()}</strong><span>Metadata entries</span></div>
      <div><strong>{counts.Easy}</strong><span>Easy</span></div>
      <div><strong>{counts.Medium}</strong><span>Medium</span></div>
      <div><strong>{counts.Hard}</strong><span>Hard</span></div>
    </div>
    <div className="lc-controls">
      <label className="lc-search"><Search size={17}/><input value={query} onChange={e => setQuery(e.target.value)} placeholder="Search title, number, or topic…"/></label>
      <select value={difficulty} onChange={e => setDifficulty(e.target.value)} aria-label="Difficulty filter"><option value="All">All difficulties</option><option>Easy</option><option>Medium</option><option>Hard</option></select>
      <select value={topic} onChange={e => setTopic(e.target.value)} aria-label="Topic filter"><option value="All">All topics</option>{topics.map(t => <option key={t}>{t}</option>)}</select>
      <select value={access} onChange={e => setAccess(e.target.value)} aria-label="Access filter"><option value="All">All access types</option><option value="Free">Free</option><option value="Premium">Premium</option></select>
    </div>
    {loading && <div className="loading">Loading problem metadata…</div>}
    {error && <div className="error-box lc-error">{error}<button className="utility-action" onClick={() => {setLoading(true);setError('');setItems([]);fetch(LEETCODE_METADATA_CSV).then(r=>{if(!r.ok)throw new Error();return r.text()}).then(t=>{const x=parseLeetCodeCsv(t);if(!x.length)throw new Error();setItems(x);setLoading(false)}).catch(()=>{setError('Still unable to load the catalog. Try again later.');setLoading(false)})}}>Retry</button></div>}
    {!loading && !error && <>
      <div className="lc-results-head"><span>{filtered.length.toLocaleString()} matching problems</span><span>Showing {filtered.length ? (page - 1) * pageSize + 1 : 0}–{Math.min(page * pageSize, filtered.length)}</span></div>
      <div className="lc-table-wrap"><table className="lc-table">
        <thead><tr><th>#</th><th>Problem</th><th>Topics</th><th>Acceptance</th><th>Difficulty</th><th>Access</th><th></th></tr></thead>
        <tbody>{shown.map((p, i) => <tr key={`${p.id}-${p.slug}`}>
          <td className="lc-id">{p.id || '—'}</td>
          <td className="lc-title">{p.title}</td>
          <td><div className="lc-tags">{p.topics.slice(0, 3).map(t => <button key={t} onClick={() => setTopic(t)}>{t}</button>)}</div></td>
          <td>{p.acceptance ? `${Number(p.acceptance).toFixed(1)}%` : '—'}</td>
          <td><span className={`lc-difficulty ${p.difficulty.toLowerCase()}`}>{p.difficulty}</span></td>
          <td><span className={p.paid ? 'lc-premium' : 'lc-free'}>{p.paid ? 'Premium' : 'Free'}</span></td>
          <td><a className="lc-open" href={`https://leetcode.com/problems/${encodeURIComponent(p.slug)}/`} target="_blank" rel="noreferrer">Open ↗</a></td>
        </tr>)}</tbody>
      </table></div>
      {filtered.length === 0 && <div className="ps-empty">No problems match these filters.</div>}
      <div className="lc-pagination"><button disabled={page <= 1} onClick={() => setPage(p => Math.max(1,p-1))}>← Previous</button><span>Page {page} of {pageCount}</span><button disabled={page >= pageCount} onClick={() => setPage(p => Math.min(pageCount,p+1))}>Next →</button></div>
    </>}
    <p className="lc-attribution">Catalog metadata is provided by the kaysss/leetcode-problem-set dataset on Hugging Face (MIT-licensed dataset). CodeArena is independent and is not affiliated with or endorsed by LeetCode. Problem content remains on LeetCode.</p>
  </main>
}

