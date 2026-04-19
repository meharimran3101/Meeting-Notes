import { startTransition, useDeferredValue, useMemo, useState } from 'react'
import './App.css'

const meetingPresets = [
  {
    id: 'launch',
    label: 'Launch Review',
    title: 'Q3 launch readiness review',
    team: 'Growth + Product',
    attendees: ['Amina', 'Rayan', 'Imran', 'Zoya'],
    transcript: `Amina: We are still seeing a sharp drop after users finish the workspace step.
Rayan: I will redesign the onboarding checklist and hand off final screens by Thursday evening.
Imran: Analytics still needs invite click tracking and activation time events before launch.
Zoya: I will interview five brand new users this week and post the clips in Slack.
Amina: We should review the updated funnel numbers on Friday at 3 PM before expanding rollout.`,
  },
  {
    id: 'pipeline',
    label: 'Pipeline Call',
    title: 'Enterprise pipeline blocker call',
    team: 'Sales',
    attendees: ['Hassan', 'Nida', 'Sara'],
    transcript: `Hassan: The Atlas deal is blocked on the security packet and pricing approval.
Nida: I will send the updated security documentation today and book a follow-up for Wednesday morning.
Sara: Finance needs a short discount justification before signing off on the custom contract.
Hassan: Let's keep legal on standby until the buyer confirms the redlines.
Nida: I will own the weekly status email so the client can see visible momentum.`,
  },
  {
    id: 'incident',
    label: 'Incident Retro',
    title: 'Ops incident review',
    team: 'Operations',
    attendees: ['Bilal', 'Maha', 'Omar'],
    transcript: `Bilal: Yesterday's outage started after the cache warmup job failed right after deploy.
Maha: I can add an alert, a rollback checklist, and a smoke-test gate before the next release.
Omar: Support needs a customer-ready incident summary by noon.
Bilal: We should freeze non-critical deploys until recovery steps are verified end to end.
Maha: I will run the postmortem and present preventive fixes tomorrow morning.`,
  },
]

const featureRail = [
  'Transcript import',
  'Live AI extraction',
  'Owner detection',
  'Follow-up draft',
]

const integrations = ['Zoom', 'Meet', 'Teams', 'Slack', 'Notion', 'Linear']

function buildFallbackInsights(transcript, attendees, title) {
  const lines = transcript
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)

  const actionItems = lines
    .filter((line) => /\b(i will|we should|can|needs|review|book|send|add|freeze)\b/i.test(line))
    .slice(0, 5)
    .map((line, index) => {
      const owner =
        attendees.find((person) => line.toLowerCase().startsWith(person.toLowerCase())) ??
        attendees[index % attendees.length] ??
        'Unassigned'
      const due =
        line.match(/\b(today|tomorrow|thursday|friday|wednesday|noon|this week|next release)\b/i)?.[0] ??
        ['Today', 'Tomorrow', 'This week', 'Fri', 'Next release'][index % 5]

      return {
        id: `${owner}-${index}`,
        title: line.replace(/^[^:]+:\s*/, ''),
        owner,
        due,
        priority: index === 0 ? 'Critical' : index === 1 ? 'High' : 'Normal',
      }
    })

  const keyDecisions = lines
    .filter((line) => /\b(review|freeze|blocked|launch|rollout|standby)\b/i.test(line))
    .slice(0, 3)
    .map((line) => line.replace(/^[^:]+:\s*/, ''))

  const risks = lines
    .filter((line) => /\b(blocked|failed|needs|drop|outage|freeze)\b/i.test(line))
    .slice(0, 3)
    .map((line) => line.replace(/^[^:]+:\s*/, ''))

  const tags = Array.from(
    new Set(
      (transcript.match(/\b(launch|analytics|customer|pricing|incident|support|rollout|security)\b/gi) ?? []).map(
        (item) => item.toLowerCase(),
      ),
    ),
  ).slice(0, 4)

  return {
    headline: `${title} distilled into clear next steps`,
    summary: lines
      .slice(0, 3)
      .map((line) => line.replace(/^[^:]+:\s*/, ''))
      .join(' '),
    actionItems,
    keyDecisions,
    risks,
    tags,
    followUpEmail: `Team, here is the recap from ${title}. Top priorities: ${actionItems
      .slice(0, 2)
      .map((item) => `${item.owner} owns "${item.title}"`)
      .join('; ')}. Main risks: ${risks.join('; ') || 'none identified'}.`,
    confidence: 0.62,
  }
}

function normalizeAnalysis(payload, fallbackBase) {
  if (!payload) {
    return fallbackBase
  }

  return {
    headline: payload.headline || fallbackBase.headline,
    summary: payload.summary || fallbackBase.summary,
    actionItems: Array.isArray(payload.actionItems) && payload.actionItems.length
      ? payload.actionItems.map((item, index) => ({
          id: item.id || `${item.owner || 'item'}-${index}`,
          title: item.title || fallbackBase.actionItems[index]?.title || 'Action item',
          owner: item.owner || fallbackBase.actionItems[index]?.owner || 'Unassigned',
          due: item.due || fallbackBase.actionItems[index]?.due || 'TBD',
          priority: item.priority || fallbackBase.actionItems[index]?.priority || 'Normal',
        }))
      : fallbackBase.actionItems,
    keyDecisions:
      Array.isArray(payload.keyDecisions) && payload.keyDecisions.length
        ? payload.keyDecisions
        : fallbackBase.keyDecisions,
    risks: Array.isArray(payload.risks) && payload.risks.length ? payload.risks : fallbackBase.risks,
    tags: Array.isArray(payload.tags) && payload.tags.length ? payload.tags : fallbackBase.tags,
    followUpEmail: payload.followUpEmail || fallbackBase.followUpEmail,
    confidence: typeof payload.confidence === 'number' ? payload.confidence : fallbackBase.confidence,
  }
}

function App() {
  const [selectedPreset, setSelectedPreset] = useState(meetingPresets[0])
  const [transcript, setTranscript] = useState(meetingPresets[0].transcript)
  const [analysis, setAnalysis] = useState(() =>
    buildFallbackInsights(
      meetingPresets[0].transcript,
      meetingPresets[0].attendees,
      meetingPresets[0].title,
    ),
  )
  const [status, setStatus] = useState('idle')
  const [source, setSource] = useState('local')
  const [note, setNote] = useState('Ready to analyze with AI.')

  const deferredTranscript = useDeferredValue(transcript)
  const liveStats = useMemo(() => {
    const trimmed = deferredTranscript.trim()
    const words = trimmed ? trimmed.split(/\s+/).length : 0
    const lines = trimmed ? trimmed.split('\n').length : 0
    const signalCount = (trimmed.match(/\b(will|should|need|review|send|add|follow-up|launch|blocked)\b/gi) ?? []).length

    return { words, lines, signalCount }
  }, [deferredTranscript])

  const applyPreset = (preset) => {
    const fallback = buildFallbackInsights(preset.transcript, preset.attendees, preset.title)
    setSelectedPreset(preset)
    setTranscript(preset.transcript)
    setSource('local')
    setNote('Preset loaded. Run AI analysis when you are ready.')
    startTransition(() => {
      setAnalysis(fallback)
    })
  }

  const analyzeMeeting = async () => {
    const fallback = buildFallbackInsights(transcript, selectedPreset.attendees, selectedPreset.title)
    setStatus('loading')
    setNote('Running live analysis and extracting ownership...')

    try {
      const response = await fetch('/api/analyze-meeting', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: selectedPreset.title,
          team: selectedPreset.team,
          attendees: selectedPreset.attendees,
          transcript,
        }),
      })

      if (!response.ok) {
        const errorPayload = await response.json().catch(() => ({}))
        throw new Error(errorPayload.error || 'Live analysis failed')
      }

      const payload = await response.json()

      startTransition(() => {
        setAnalysis(normalizeAnalysis(payload.analysis, fallback))
        setSource(payload.source || 'live')
        setStatus('success')
        setNote(
          payload.source === 'live'
            ? 'Live AI analysis complete.'
            : 'Fallback analysis used because live AI is not configured.',
        )
      })
    } catch (error) {
      startTransition(() => {
        setAnalysis(fallback)
        setSource('fallback')
        setStatus('success')
        setNote(`${error.message}. Showing the local fallback version instead.`)
      })
    }
  }

  return (
    <main className="app-shell">
      <div className="noise" />

      <section className="hero">
        <header className="masthead">
          <div className="brand-lockup">
            <div className="brand-mark">MA</div>
            <div>
              <p className="micro-copy">Meeting intelligence, rebuilt</p>
              <h1>Meeting to Action Notes</h1>
            </div>
          </div>

          <div className="status-cluster">
            <span className={source === 'live' ? 'source-pill live' : 'source-pill'}>
              {source === 'live' ? 'Live AI' : source === 'fallback' ? 'Fallback mode' : 'Local preview'}
            </span>
            <button type="button" className="primary-button compact" onClick={analyzeMeeting}>
              {status === 'loading' ? 'Analyzing...' : 'Analyze meeting'}
            </button>
          </div>
        </header>

        <div className="hero-grid">
          <div className="hero-copy">
            <p className="section-label">Turn discussion into decisions</p>
            <h2>Less shiny dashboard, more command center for what the meeting actually means.</h2>
            <p className="lede">
              Paste a transcript and the app creates a concise summary, clear owners,
              visible risks, and a follow-up draft your team can actually send.
            </p>

            <div className="feature-rail">
              {featureRail.map((item) => (
                <span key={item}>{item}</span>
              ))}
            </div>

            <p className="status-note">{note}</p>
          </div>

          <aside className="hero-sidecard">
            <p className="section-label">Live canvas</p>
            <div className="signal-graph" aria-hidden="true">
              <span />
              <span />
              <span />
              <span />
              <span />
              <span />
              <span />
            </div>
            <div className="side-metrics">
              <article>
                <span>Words</span>
                <strong>{liveStats.words}</strong>
              </article>
              <article>
                <span>Lines</span>
                <strong>{liveStats.lines}</strong>
              </article>
              <article>
                <span>Signals</span>
                <strong>{liveStats.signalCount}</strong>
              </article>
            </div>
          </aside>
        </div>
      </section>

      <section className="workspace">
        <article className="capture-panel">
          <div className="panel-topline">
            <div>
              <p className="section-label">Capture</p>
              <h3>Transcript workspace</h3>
            </div>
            <div className="preset-list">
              {meetingPresets.map((preset) => (
                <button
                  key={preset.id}
                  type="button"
                  className={preset.id === selectedPreset.id ? 'preset-button active' : 'preset-button'}
                  onClick={() => applyPreset(preset)}
                >
                  <span>{preset.label}</span>
                  <strong>{preset.team}</strong>
                </button>
              ))}
            </div>
          </div>

          <label className="transcript-field">
            <span className="field-label">Paste meeting transcript</span>
            <textarea
              value={transcript}
              onChange={(event) => setTranscript(event.target.value)}
              placeholder="Paste your call notes, transcript, or raw meeting text..."
            />
          </label>

          <div className="integration-row">
            {integrations.map((item) => (
              <span key={item}>{item}</span>
            ))}
          </div>
        </article>

        <article className="results-panel">
          <div className="panel-topline">
            <div>
              <p className="section-label">Output</p>
              <h3>{analysis.headline}</h3>
            </div>
            <div className="confidence-card">
              <span>Confidence</span>
              <strong>{Math.round(analysis.confidence * 100)}%</strong>
            </div>
          </div>

          <div className="summary-block">
            <p className="field-label">Summary</p>
            <p>{analysis.summary}</p>
          </div>

          <div className="chips">
            {analysis.tags.map((tag) => (
              <span key={tag}>{tag}</span>
            ))}
          </div>

          <div className="results-grid">
            <section className="column-card actions-column">
              <div className="column-heading">
                <p className="field-label">Action items</p>
                <span>{analysis.actionItems.length} items</span>
              </div>

              <div className="stack">
                {analysis.actionItems.map((item) => (
                  <article key={item.id} className="action-item">
                    <div className="meta-row">
                      <span>{item.owner}</span>
                      <span>{item.due}</span>
                    </div>
                    <h4>{item.title}</h4>
                    <p>{item.priority}</p>
                  </article>
                ))}
              </div>
            </section>

            <section className="column-card">
              <div className="column-heading">
                <p className="field-label">Key decisions</p>
              </div>

              <div className="stack">
                {analysis.keyDecisions.map((item) => (
                  <article key={item} className="note-item">
                    <span>Decision</span>
                    <p>{item}</p>
                  </article>
                ))}
              </div>
            </section>

            <section className="column-card">
              <div className="column-heading">
                <p className="field-label">Risks</p>
              </div>

              <div className="stack">
                {analysis.risks.map((item) => (
                  <article key={item} className="note-item risk">
                    <span>Risk</span>
                    <p>{item}</p>
                  </article>
                ))}
              </div>
            </section>
          </div>

          <section className="follow-up-card">
            <div className="column-heading">
              <p className="field-label">Follow-up draft</p>
              <span>Email-ready recap</span>
            </div>
            <p>{analysis.followUpEmail}</p>
          </section>
        </article>
      </section>
    </main>
  )
}

export default App
