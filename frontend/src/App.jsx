import { useEffect, useMemo, useState } from 'react'
import Editor from '@monaco-editor/react'
import {
  Code2, Search, ChevronDown, ChevronRight, CheckCircle2, Circle,
  Play, Send, ListFilter, BookOpen, TerminalSquare, PanelLeftClose,
  PanelRightClose, RotateCcw, Clock3, Cpu, Menu, Flame, Bell, UserRound,
  Heart, Bookmark, NotebookPen, Settings, Sun, Moon, LogOut,
  ShoppingBag, Sparkles, Trophy, MessageSquare, Video, ClipboardCheck,
  Crown, List, X, CircleHelp, CalendarDays
} from 'lucide-react'
import { API, authHeaders, AuthModal, DailyTimer, GuidePane, McqPane, ProblemSetPage, DailyPage, ProgressPage, LeaderboardPage, LeetCodeCatalogPage } from './Views.jsx'

const languageNames = {
  python: 'Python 3',
  java: 'Java',
  c: 'C'
}

export default function App() {
  const [problems, setProblems] = useState([])
  const [activeId, setActiveId] = useState('sum-two-integers')
  const [problem, setProblem] = useState(null)
  const [language, setLanguage] = useState('python')
  const [code, setCode] = useState('')
  const [query, setQuery] = useState('')
  const [difficulty, setDifficulty] = useState('All')
  const [showProblems, setShowProblems] = useState(true)
  const [bottomTab, setBottomTab] = useState('testcase')
  const [customInput, setCustomInput] = useState('')
  const [result, setResult] = useState(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [view, setView] = useState('problemset')
  const [profileOpen, setProfileOpen] = useState(false)
  const [notificationsOpen, setNotificationsOpen] = useState(false)
  const [interviewOpen, setInterviewOpen] = useState(false)
  const [lightMode, setLightMode] = useState(false)
  const [dismissedNotice, setDismissedNotice] = useState(false)
  const [mcqs, setMcqs] = useState([])
  const [mcqId, setMcqId] = useState(null)
  const [user, setUser] = useState(() => (localStorage.getItem('codearena-token') && localStorage.getItem('codearena-user')) || '')
  const [showAuth, setShowAuth] = useState(false)
  const [timer, setTimer] = useState(null)
  const [leftTab, setLeftTab] = useState('description')
  const [me, setMe] = useState(null)
  const [solved, setSolved] = useState(() => {
    try { return JSON.parse(localStorage.getItem('codearena-solved') || '[]') } catch { return [] }
  })

  useEffect(() => {
    fetch(`${API}/problems`)
      .then(r => { if (!r.ok) throw new Error('Could not load problems'); return r.json() })
      .then(setProblems)
      .catch(() => setError('Backend not connected. Start the FastAPI server on port 8000.'))
  }, [])

  function refreshMe(name = user) {
    if (!name) { setMe(null); return }
    fetch(`${API}/me`, { headers: authHeaders() }).then(r => {
      if (r.status === 401) { clearLogin(); return null }
      return r.ok ? r.json() : null
    }).then(setMe).catch(() => {})
  }
  function clearLogin() {
    localStorage.removeItem('codearena-token'); localStorage.removeItem('codearena-user')
    setUser(''); setMe(null)
  }
  function logout() {
    fetch(`${API}/auth/logout`, { method: 'POST', headers: authHeaders() }).catch(() => {})
    clearLogin()
  }
  function onAuth(token, name) {
    localStorage.setItem('codearena-token', token); localStorage.setItem('codearena-user', name)
    setUser(name); setShowAuth(false)
  }
  function ensureUser() {
    if (user) return user
    setShowAuth(true)
    return ''
  }
  function openItem(kind, id, fromDaily = false) {
    setTimer(fromDaily ? { kind, id, start: Date.now() } : null)
    setLeftTab('description')
    setView('problems')
    setShowProblems(false)
    setProfileOpen(false); setNotificationsOpen(false); setInterviewOpen(false)
    if (kind === 'mcq') setMcqId(id); else { setMcqId(null); setActiveId(id) }
  }
  useEffect(() => { refreshMe() }, [user])
  useEffect(() => {
    fetch(`${API}/mcqs`).then(r => r.json()).then(setMcqs).catch(() => {})
  }, [])

  useEffect(() => {
    if (!activeId) return
    setResult(null)
    setError('')
    fetch(`${API}/problems/${activeId}`)
      .then(r => { if (!r.ok) throw new Error('Problem could not be loaded'); return r.json() })
      .then(p => {
        setProblem(p)
        setCustomInput(p.sample_input || '')
        setCode(p.starter_code?.[language] || '')
      })
      .catch(e => setError(e.message))
  }, [activeId])

  useEffect(() => {
    if (problem?.starter_code?.[language]) setCode(problem.starter_code[language])
    setResult(null)
  }, [language])

  useEffect(() => {
    localStorage.setItem('codearena-solved', JSON.stringify(solved))
  }, [solved])

  const filteredProblems = useMemo(() => problems.filter(p => {
    const matchesQuery = p.title.toLowerCase().includes(query.toLowerCase()) ||
      p.topics?.some(t => t.toLowerCase().includes(query.toLowerCase()))
    return matchesQuery && (difficulty === 'All' || p.difficulty === difficulty)
  }), [problems, query, difficulty])

  async function execute(mode) {
    if (!problem || busy) return
    const who = mode === 'submit' ? ensureUser() : user
    if (mode === 'submit' && !who) { setBottomTab('result'); return }
    setBusy(true)
    setError('')
    setResult(null)
    setBottomTab('result')
    try {
      const response = await fetch(`${API}/execute`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...authHeaders() },
        body: JSON.stringify({
          problem_id: activeId,
          language,
          source_code: code,
          mode,
          custom_input: mode === 'run' ? customInput : ''
        })
      })
      const data = await response.json()
      if (!response.ok) throw new Error(data.detail || 'Execution failed')
      setResult(data)
      if (mode === 'submit' && data.verdict === 'Accepted') {
        setSolved(old => old.includes(activeId) ? old : [...old, activeId])
        refreshMe(who)
      }
    } catch (e) {
      setError(e.message || 'Could not execute code')
    } finally {
      setBusy(false)
    }
  }

  function selectProblem(id) {
    setMcqId(null)
    setLeftTab('description')
    setActiveId(id)
    setShowProblems(false)
  }

  useEffect(() => {
    if (!profileOpen && !notificationsOpen && !interviewOpen) return
    const closeAll = () => { setProfileOpen(false); setNotificationsOpen(false); setInterviewOpen(false) }
    const onDown = e => { if (!e.target.closest || !e.target.closest('.nav-menu-wrap')) closeAll() }
    const onKey = e => { if (e.key === 'Escape') closeAll() }
    document.addEventListener('mousedown', onDown)
    document.addEventListener('keydown', onKey)
    return () => { document.removeEventListener('mousedown', onDown); document.removeEventListener('keydown', onKey) }
  }, [profileOpen, notificationsOpen, interviewOpen])

  const go = (nextView) => {
    setView(nextView)
    setProfileOpen(false)
    setNotificationsOpen(false)
    setInterviewOpen(false)
  }

  const profileItems = [
    { label: 'My Lists', icon: List, view: 'lists' },
    { label: 'Favorites', icon: Heart, view: 'favorites' },
    { label: 'Notebook', icon: NotebookPen, view: 'notebook' },
    { label: 'Progress', icon: Trophy, view: 'progress' },
    { label: 'Points', icon: Flame, view: 'progress', hint: `${me?.points ?? 0} pts` },
    { label: 'Daily Challenge', icon: CalendarDays, view: 'daily' },
    { label: 'Leaderboard', icon: Trophy, view: 'leaderboard', hint: me?.rank ? `#${me.rank}` : undefined },
    { label: 'Try New Features', icon: Sparkles, view: 'features' },
    { label: 'Orders', icon: ShoppingBag, view: 'orders' },
    { label: 'My Playgrounds', icon: Code2, view: 'playgrounds' },
    { label: 'Settings', icon: Settings, view: 'settings' },
  ]

  return (
    <div className={`app-shell ${lightMode ? 'light-mode' : ''}`}>
      <header className="topbar">
        <button className="brand brand-button" onClick={() => go('problemset')} aria-label="CodeArena home">
          <div className="brand-icon"><Code2 size={21} /></div>
          <span>Code<span className="brand-accent">Arena</span></span>
          <span className="beta">BETA</span>
        </button>
        <nav className="top-links" aria-label="Main navigation">
          <button className={`top-link ${['problemset','problems'].includes(view) ? 'active' : ''}`} onClick={() => go('problemset')}><BookOpen size={15}/>Problems</button>
          <button className={`top-link ${view === 'leetcodeCatalog' ? 'active' : ''}`} onClick={() => go('leetcodeCatalog')}><Search size={15}/>LeetCode Catalog</button>
          <button className={`top-link ${view === 'contest' ? 'active' : ''}`} onClick={() => go('contest')}><Trophy size={15}/>Contest</button>
          <button className={`top-link ${view === 'discuss' ? 'active' : ''}`} onClick={() => go('discuss')}><MessageSquare size={15}/>Discuss</button>
          <div className="nav-menu-wrap">
            <button className={`top-link ${['onlineInterview','assessment'].includes(view) ? 'active' : ''}`} onClick={() => {setInterviewOpen(v => !v); setProfileOpen(false); setNotificationsOpen(false)}} aria-expanded={interviewOpen}>Interview <ChevronDown size={13}/></button>
            {interviewOpen && <div className="nav-dropdown interview-dropdown">
              <button onClick={() => go('onlineInterview')}><Video size={16}/><span><strong>Online Interview</strong><small>Practice interview sessions</small></span></button>
              <button onClick={() => go('assessment')}><ClipboardCheck size={16}/><span><strong>Assessment</strong><small>Test your skills</small></span></button>
            </div>}
          </div>
          <button className={`top-link ${view === 'store' ? 'active' : ''}`} onClick={() => go('store')}><ShoppingBag size={15}/>Store</button>
          <button className={`top-link optional-link ${view === 'daily' ? 'active' : ''}`} onClick={() => go('daily')}>Daily</button>
          <button className={`top-link optional-link ${view === 'leaderboard' ? 'active' : ''}`} onClick={() => go('leaderboard')}>Leaderboard</button>
        </nav>
        <div className="top-right">
          <div className="streak"><Flame size={15}/> <span>{me?.streak ?? 0}<span className="streak-label"> day streak</span></span><span className="streak-divider">·</span><strong>{me?.points ?? 0} pts</strong></div>
          <div className="nav-menu-wrap">
            <button className={`header-icon-btn ${notificationsOpen ? 'selected' : ''}`} aria-label="Notifications" title="Notifications" onClick={() => {setNotificationsOpen(v => !v); setProfileOpen(false)}}><Bell size={18}/>{!dismissedNotice && <i className="notification-dot"/>}</button>
            {notificationsOpen && <div className="nav-dropdown notification-dropdown">
              <div className="dropdown-heading"><strong>Notifications</strong><button className="tiny-action" onClick={() => setDismissedNotice(true)}>Mark read</button></div>
              {!dismissedNotice && <div className="notification-item"><span className="notice-icon"><Flame size={16}/></span><span><strong>Keep your streak going</strong><small>Solve a problem today to build your practice habit.</small></span></div>}
              <div className="notification-item"><span className="notice-icon"><Trophy size={16}/></span><span><strong>Your progress lives here</strong><small>Earn points by submitting accepted solutions.</small></span></div>
              {dismissedNotice && <p className="dropdown-empty">You're all caught up.</p>}
            </div>}
          </div>
          {user ? <div className="nav-menu-wrap profile-wrap">
            <button className={`profile-trigger ${profileOpen ? 'selected' : ''}`} onClick={() => {setProfileOpen(v => !v); setNotificationsOpen(false)}} aria-expanded={profileOpen}>
              <span className="avatar">{(me?.name || user || 'V')[0].toUpperCase()}</span><span className="profile-trigger-name">{me?.name || user}</span><ChevronDown size={14}/>
            </button>
            {profileOpen && <div className="nav-dropdown profile-dropdown">
              <button className="profile-menu-head" onClick={() => go('progress')} title="Open your dashboard"><span className="avatar profile-menu-avatar">{(me?.name || user || 'V')[0].toUpperCase()}</span><span><strong>{me?.name || user}</strong><small>CodeArena member · View dashboard</small></span><ChevronRight size={14}/></button>
              <button className="premium-row" onClick={() => go('premium')}><Crown size={16}/><span><strong>CodeArena Premium</strong><small>Explore premium features</small></span><ChevronDown size={13}/></button>
              <div className="dropdown-separator"/>
              {profileItems.map(item => <button key={item.label} onClick={() => go(item.view)}><item.icon size={16}/><span>{item.label}</span>{item.hint && <small className="menu-hint">{item.hint}</small>}</button>)}
              <div className="dropdown-separator"/>
              <button onClick={() => setLightMode(v => !v)}>{lightMode ? <Moon size={16}/> : <Sun size={16}/>}<span>Appearance</span><small className="menu-hint">{lightMode ? 'Light' : 'Dark'}</small></button>
              <button className="signout-row" onClick={() => {setProfileOpen(false); logout()}}><LogOut size={16}/><span>Sign Out</span></button>
            </div>}
          </div> : <button className="name-btn" onClick={() => setShowAuth(true)}>Log in</button>}
        </div>
      </header>

      {showAuth && <AuthModal onClose={() => setShowAuth(false)} onAuth={onAuth}/>}
      {view === 'problemset' && <ProblemSetPage problems={problems} mcqs={mcqs} me={me} solvedLocal={solved} user={user} onOpen={openItem} onDaily={() => go('daily')} onLogin={() => setShowAuth(true)}/>}
      {view === 'leetcodeCatalog' && <LeetCodeCatalogPage />}
      {view === 'daily' && <DailyPage onOpen={openItem} me={me}/>}
      {view === 'progress' && <ProgressPage me={me} user={user} onRefresh={() => refreshMe()}/>}
      {view === 'leaderboard' && <LeaderboardPage user={user}/>}
      {['contest','discuss','store','onlineInterview','assessment','lists','favorites','notebook','orders','playgrounds','settings','features','premium'].includes(view) && <UtilityPage view={view} user={me?.name || user} onNavigate={go} onLogin={() => setShowAuth(true)} />}
      {view === 'problems' && <main className={`workspace ${showProblems ? '' : 'list-hidden'}`}>
        {showProblems && <aside className="problem-sidebar">
          <div className="sidebar-heading">
            <div><span className="eyebrow">PRACTICE</span><h2>Problems</h2></div>
            <button className="icon-btn" title="Hide problem list" onClick={() => setShowProblems(false)}><PanelLeftClose size={17}/></button>
          </div>
          <div className="search-wrap"><Search size={16}/><input value={query} onChange={e => setQuery(e.target.value)} placeholder="Search problems"/></div>
          <div className="filter-row">
            <ListFilter size={15}/>
            <select value={difficulty} onChange={e => setDifficulty(e.target.value)} aria-label="Filter difficulty">
              <option>All</option><option>Easy</option><option>Medium</option><option>Hard</option>
            </select>
            <span className="problem-count">{filteredProblems.length} total</span>
          </div>
          <div className="problem-list">
            {filteredProblems.map((p, i) => <button key={p.id} className={`problem-row ${activeId === p.id ? 'selected' : ''}`} onClick={() => selectProblem(p.id)}>
              <span className="row-number">{String(i + 1).padStart(2, '0')}</span>
              <span className="row-main">
                <span className="row-title">{p.title}</span>
                <span className="row-meta"><span className={`difficulty ${p.difficulty.toLowerCase()}`}>{p.difficulty}</span><span>{p.acceptance} acceptance</span></span>
              </span>
              {solved.includes(p.id) ? <CheckCircle2 className="solved-icon" size={16}/> : <Circle className="unsolved-icon" size={15}/>}
            </button>)}
            {mcqs.filter(m => (difficulty === 'All' || m.difficulty === difficulty) && (m.topic + m.question + m.lang).toLowerCase().includes(query.toLowerCase())).map(m =>
              <button key={m.id} className={`problem-row ${mcqId === m.id ? 'selected' : ''}`} onClick={() => { setMcqId(m.id); setShowProblems(true) }}>
                <span className="row-number">MC</span>
                <span className="row-main"><span className="row-title">{m.question} {m.code.split('\n')[0]}</span><span className="row-meta"><span className={`difficulty ${m.difficulty.toLowerCase()}`}>{m.difficulty}</span><span>{languageNames[m.lang]} · {m.topic}</span></span></span>
                {me?.mcqs?.includes(m.id) ? <CheckCircle2 className="solved-icon" size={16}/> : <Circle className="unsolved-icon" size={15}/>}
              </button>)}
            {filteredProblems.length === 0 && mcqs.length === 0 && <div className="empty-list">No problems found.</div>}
          </div>
          <div className="sidebar-footer"><div className="mini-progress"><span style={{width: `${problems.length ? solved.length / problems.length * 100 : 0}%`}}/></div><span>{solved.length}/{problems.length} solved</span></div>
        </aside>}

        {mcqId && mcqs.find(m => m.id === mcqId) ? <McqPane mcq={mcqs.find(m => m.id === mcqId)} ensureUser={ensureUser} onDone={() => refreshMe()} timer={timer && timer.kind === 'mcq' && timer.id === mcqId ? timer : null} solved={!!me?.mcqs?.includes(mcqId)}/> : <>
        <section className="left-panel">
          <div className="panel-tabs">
            {!showProblems && <button className="icon-btn" onClick={() => setShowProblems(true)} title="Show problem list"><Menu size={17}/></button>}
            <button className={`panel-tab ${leftTab === 'description' ? 'active' : 'muted'}`} onClick={() => setLeftTab('description')}><BookOpen size={15}/> Description</button>
            <button className={`panel-tab ${leftTab === 'editorial' ? 'active' : 'muted'}`} onClick={() => setLeftTab('editorial')}><Code2 size={15}/> Editorial</button>
            <button className={`panel-tab ${leftTab === 'solutions' ? 'active' : 'muted'}`} onClick={() => setLeftTab('solutions')}><MessageIcon/> Solutions</button>
            {timer && timer.kind === 'problem' && timer.id === activeId && <DailyTimer key={activeId} start={timer.start} solved={!!me?.problems?.includes(activeId)}/>}
          </div>
          {problem && leftTab !== 'description' ? <GuidePane kind={leftTab} problemId={activeId} language={language} solvedCount={me?.problems?.length ?? 0}/> : problem ? <div className="description-scroll">
            <div className="problem-title-line"><span className="problem-index">#{problems.findIndex(p => p.id === activeId) + 1}</span><h1>{problem.title}</h1>{solved.includes(activeId) && <CheckCircle2 size={19} className="solved-icon"/>}</div>
            <div className="tag-row"><span className={`difficulty-pill ${problem.difficulty.toLowerCase()}`}>{problem.difficulty}</span><span className="tag"><CheckCircle2 size={13}/> {problem.acceptance} Accepted</span><span className="tag"><Clock3 size={13}/> 3 min</span></div>
            <div className="description-text">{problem.description.split('\n').map((line, i) => {
              if (!line) return <div className="line-gap" key={i}/>
              if (line.startsWith('Example')) return <h3 key={i}>{line}</h3>
              if (line.startsWith('Input:') || line.startsWith('Output:')) return <p key={i}><strong>{line.split(':')[0]}:</strong>{line.substring(line.indexOf(':') + 1)}</p>
              return <p key={i}>{line}</p>
            })}</div>
            <div className="topics"><span className="section-label">TOPICS</span>{problem.topics?.map(t => <span className="topic-chip" key={t}>{t}</span>)}</div>
            <div className="hint-card"><div className="hint-icon">✦</div><div><strong>Quick tip</strong><p>Read the input and output format carefully. Test your solution with edge cases before submitting.</p></div></div>
          </div> : <div className="loading">Loading problem…</div>}
          <div className="description-footer"><button className="subtle-btn" onClick={() => alert('Feedback form coming soon.')}>Report issue</button><div><button className="pager-btn" disabled>← Prev</button><button className="pager-btn" onClick={() => {const i = problems.findIndex(p => p.id === activeId); if (problems[i+1]) selectProblem(problems[i+1].id)}}>Next →</button></div></div>
        </section>

        <section className="right-panel">
          <div className="editor-toolbar">
            <div className="editor-tab"><span className="file-dot"/> <span>Code</span> <span className="file-name">solution.{language === 'python' ? 'py' : language === 'java' ? 'java' : 'c'}</span></div>
            <div className="editor-actions">
              <button className="icon-btn" title="Reset code" onClick={() => setCode(problem?.starter_code?.[language] || '')}><RotateCcw size={15}/></button>
              <span className="toolbar-divider"/>
              <select className="language-select" value={language} onChange={e => setLanguage(e.target.value)} aria-label="Programming language">
                <option value="python">Python 3</option><option value="java">Java</option><option value="c">C</option>
              </select>
              <ChevronDown size={14} className="select-chevron"/>
            </div>
          </div>
          <div className="editor-container">
            <Editor
              height="100%"
              language={language}
              theme="vs-dark"
              value={code}
              onChange={v => setCode(v ?? '')}
              options={{
                minimap: { enabled: false },
                fontSize: 14,
                lineHeight: 23,
                fontFamily: "'JetBrains Mono', Consolas, monospace",
                padding: { top: 18, bottom: 18 },
                scrollBeyondLastLine: false,
                automaticLayout: true,
                tabSize: 4,
                roundedSelection: false,
                renderLineHighlight: 'all',
                cursorBlinking: 'smooth',
                smoothScrolling: true,
                wordWrap: 'on'
              }}
            />
          </div>
          <div className="editor-status"><span><span className="status-dot"/> Ready</span><span>Ln {code.split('\n').length}, Col 1</span><span>UTF-8</span><span>{languageNames[language]}</span></div>
          <div className="bottom-panel">
            <div className="bottom-tabs">
              <button className={bottomTab === 'testcase' ? 'bottom-tab active' : 'bottom-tab'} onClick={() => setBottomTab('testcase')}><TerminalSquare size={15}/> Testcase</button>
              <button className={bottomTab === 'result' ? 'bottom-tab active' : 'bottom-tab'} onClick={() => setBottomTab('result')}><Code2 size={15}/> Test Result {result && <span className="tiny-count">{result.passed}/{result.total}</span>}</button>
              <div className="bottom-spacer"/>
              <button className="icon-btn" title="Collapse panel" onClick={() => setBottomTab(bottomTab === 'hidden' ? 'testcase' : 'hidden')}><PanelRightClose size={15}/></button>
            </div>
            {bottomTab !== 'hidden' && <div className="bottom-content">
              {bottomTab === 'testcase' ? <div className="testcase-editor">
                <label htmlFor="custom-input">Custom input</label>
                <textarea id="custom-input" value={customInput} onChange={e => setCustomInput(e.target.value)} spellCheck="false"/>
                <span className="testcase-help">Run executes this input. Submit checks the problem's test suite.</span>
              </div> : <div className="result-area">
                {busy ? <div className="running"><span className="spinner"/> Running your code against Judge0…</div> :
                  error ? <div className="error-box"><strong>Something went wrong</strong><p>{error}</p></div> :
                  result ? <><div className={`verdict ${result.verdict === 'Accepted' ? 'accepted' : 'failed'}`}><div>{result.verdict === 'Accepted' ? <CheckCircle2 size={22}/> : <Circle size={22}/>}<strong>{result.verdict}</strong></div><span>{result.passed} / {result.total} test cases passed{result.points_awarded ? ` · +${result.points_awarded} pts` : ''}</span></div>
                    <div className="result-cases">{result.results.map((r, i) => <div key={i} className="case-card">
                      <div className="case-heading"><span className={r.passed ? 'case-status pass' : 'case-status fail'}>{r.passed ? <CheckCircle2 size={14}/> : <Circle size={14}/>}</span><strong>Case {r.case}{r.hidden ? ' · Hidden' : ''}</strong><span className={r.passed ? 'case-label pass-text' : 'case-label fail-text'}>{r.status}</span></div>
                      {!r.hidden && <div className="case-grid"><div><span>Input</span><pre>{r.input || '(empty)'}</pre></div>{r.expected !== null && <div><span>Expected</span><pre>{r.expected}</pre></div>}<div><span>Output</span><pre>{r.output || r.error || '(no output)'}</pre></div></div>}
                      {(r.time || r.memory) && <div className="metrics"><span><Clock3 size={12}/> {r.time || '—'} s</span><span><Cpu size={12}/> {r.memory || '—'} KB</span></div>}
                    </div>)}</div>
                  </> : <div className="empty-result"><TerminalSquare size={25}/><strong>Run your code to see results</strong><span>Output and test case details will appear here.</span></div>}
              </div>}
            </div>}
          </div>
          <div className="runbar"><span className="runbar-hint"><span className="keyboard-key">Ctrl</span> + <span className="keyboard-key">Enter</span> to run</span><div className="run-buttons"><button className="run-btn" disabled={busy || !problem} onClick={() => execute('run')}><Play size={15} fill="currentColor"/> Run</button><button className="submit-btn" disabled={busy || !problem} onClick={() => execute('submit')}>{busy ? <span className="spinner small"/> : <Send size={14}/>} Submit</button></div></div>
        </section>
        </>}
      </main>}
      <footer className="site-footer"><span>© 2026 CodeArena</span><span>Built for practice <span className="footer-heart">♥</span></span><span>Execution powered by Judge0</span></footer>
    </div>
  )
}


function UtilityPage({ view, user, onNavigate, onLogin }) {
  const content = {
    contest: { eyebrow: 'COMPETE', title: 'Contests', subtitle: 'Challenge yourself, practice under time limits, and track your progress.', icon: Trophy, cards: [['Weekly Code Sprint', 'Practice timed coding problems and improve your speed.', 'Coming soon'], ['Daily Challenge', 'Keep your momentum with daily coding practice.', 'Open Daily', 'daily']] },
    discuss: { eyebrow: 'COMMUNITY', title: 'Discuss', subtitle: 'Share approaches, ask questions, and learn with other problem-solvers.', icon: MessageSquare, cards: [['Problem discussions', 'Discuss solutions and alternative approaches.', 'Browse Problems', 'problemset'], ['Editorials', 'Review explanations after attempting a problem.', 'Open Problems', 'problemset']] },
    store: { eyebrow: 'STORE', title: 'CodeArena Store', subtitle: 'Your place for learning resources and profile extras.', icon: ShoppingBag, cards: [['Premium plan', 'Explore advanced practice and learning features.', 'Explore Premium', 'premium'], ['Achievement badges', 'Earn badges by solving problems and building streaks.', 'View Progress', 'progress']] },
    onlineInterview: { eyebrow: 'INTERVIEW PREP', title: 'Online Interview', subtitle: 'Prepare for technical interviews with structured practice.', icon: Video, cards: [['Coding round', 'Solve coding problems in the existing editor.', 'Start Practising', 'problemset'], ['Review your progress', 'See solved questions, points, and activity.', 'Open Dashboard', 'progress']] },
    assessment: { eyebrow: 'SKILL CHECK', title: 'Assessment', subtitle: 'Test your knowledge with coding problems and multiple-choice questions.', icon: ClipboardCheck, cards: [['Coding assessment', 'Practice with real coding challenges.', 'View Problems', 'problemset'], ['Concept quiz', 'Use MCQs to revise programming concepts.', 'View Questions', 'problemset']] },
    lists: { eyebrow: 'YOUR WORKSPACE', title: 'My Lists', subtitle: 'Organize questions you want to practise later.', icon: List, cards: [['Practice list', 'Your existing problem library is ready to browse.', 'Browse Problems', 'problemset']] },
    favorites: { eyebrow: 'YOUR WORKSPACE', title: 'Favorites', subtitle: 'A place to keep track of problems you want to revisit.', icon: Heart, cards: [['Find a problem', 'Open the problem set and choose a challenge to work on.', 'Browse Problems', 'problemset']] },
    notebook: { eyebrow: 'YOUR WORKSPACE', title: 'Notebook', subtitle: 'Keep your own notes and coding reminders in one place.', icon: NotebookPen, cards: [['Problem notes', 'Open a problem and jot down your approach in your own notes app.', 'Browse Problems', 'problemset']] },
    orders: { eyebrow: 'ACCOUNT', title: 'Orders', subtitle: 'Your purchases and order history will appear here.', icon: ShoppingBag, cards: [['No orders yet', 'There are no CodeArena store orders to display.', 'Back to Store', 'store']] },
    playgrounds: { eyebrow: 'DEVELOPMENT', title: 'My Playgrounds', subtitle: 'Jump into the existing coding editor to experiment with solutions.', icon: Code2, cards: [['Code playground', 'Choose a problem and experiment with Python, Java, or C.', 'Open Problems', 'problemset']] },
    settings: { eyebrow: 'ACCOUNT', title: 'Settings', subtitle: 'Manage your session and account preferences.', icon: Settings, cards: [['Profile', user ? `Signed in as ${user}.` : 'Sign in to access your account.', user ? 'View Dashboard' : 'Log in', user ? 'progress' : 'login'], ['Appearance', 'Switch between the dark and light interface using the profile menu.', 'Got it', 'settings']] },
    features: { eyebrow: 'WHAT’S NEW', title: 'Try New Features', subtitle: 'Explore the tools available in CodeArena.', icon: Sparkles, cards: [['Daily challenges', 'Build consistency with a daily coding task.', 'Open Daily', 'daily'], ['Progress dashboard', 'Review your streak, points, badges, and solved questions.', 'View Dashboard', 'progress']] },
    premium: { eyebrow: 'MEMBERSHIP', title: 'CodeArena Premium', subtitle: 'Premium is a preview entry for now; no payment is taken here.', icon: Crown, cards: [['More focused practice', 'Continue practising with the existing CodeArena problem set.', 'Browse Problems', 'problemset']] },
  }
  const page = content[view] || content.problemset
  const Icon = page.icon
  return <main className="utility-page page">
    <div className="utility-hero"><span className="eyebrow">{page.eyebrow}</span><div className="utility-title"><span className="utility-icon"><Icon size={23}/></span><h1>{page.title}</h1></div><p className="page-sub">{page.subtitle}</p></div>
    {view === 'settings' && <div className="utility-card settings-note"><Settings size={18}/><span><strong>Account preferences</strong><small>Appearance can be changed from the profile dropdown. Your current sign-in remains connected to the existing backend.</small></span></div>}
    <div className="utility-cards">{page.cards.map(([title, description, action, destination]) => <div className="utility-card" key={title}><div className="utility-card-top"><strong>{title}</strong><span className="utility-card-icon"><Icon size={18}/></span></div><p>{description}</p><button className="utility-action" onClick={() => destination === 'login' ? onLogin() : onNavigate(destination || 'problemset')}>{action}<span>→</span></button></div>)}</div>
    <button className="utility-back" onClick={() => onNavigate('problemset')}>← Back to Problems</button>
  </main>
}

function MessageIcon() {
  return <span className="message-icon">◌</span>
}
