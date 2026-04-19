import { startTransition, useDeferredValue, useMemo, useState } from 'react'
import './App.css'

const meetingPresets = [
  {
    id: 'product',
    label: 'Product Sync',
    title: 'Monday product sync',
    attendees: ['Amina', 'Rayan', 'Imran', 'Zoya'],
    transcript: `Amina: The onboarding funnel is losing users after the workspace step.
Rayan: I can redesign the checklist and ship the new empty state by Thursday.
Imran: We also need analytics on invite clicks and activation time.
Zoya: I will interview five new users this week and share clips in Slack.
Amina: Let's review metrics again on Friday at 3 PM and decide whether to expand the rollout.`,
  },
  {
    id: 'sales',
    label: 'Sales Review',
    title: 'Enterprise pipeline review',
    attendees: ['Hassan', 'Nida', 'Sara'],
    transcript: `Hassan: The Atlas deal is blocked on security documents and pricing approval.
Nida: I will send the updated security packet today and book a follow-up for Wednesday.
Sara: Finance needs a discount justification before approving the custom contract.
Hassan: Let's keep legal out until the buyer confirms redlines.
Nida: I will own the weekly status email so the client sees momentum.`,
  },
  {
    id: 'ops',
    label: 'Ops Standup',
    title: 'Operations incident review',
    attendees: ['Bilal', 'Maha', 'Omar'],
    transcript: `Bilal: Yesterday's outage came from the failed cache warmup job after deploy.
Maha: I can add an alert and a rollback checklist before the next release.
Omar: Support needs a customer-ready incident summary by noon.
Bilal: We'll freeze non-critical deploys until we verify the recovery steps.
Maha: I will run the postmortem and present preventive fixes tomorrow morning.`,
  },
]

const highlightStats = [
  { value: '92%', label: 'less follow-up drift' },
  { value: '4.8x', label: 'faster action capture' },
  { value: '11', label: 'signals tracked per meeting' },
]

const workflowSteps = [
  'Ingest transcript',
  'Detect decisions',
  'Assign owners',
  'Schedule follow-ups',
]

const integrationPills = [
  'Zoom',
  'Google Meet',
  'Teams',
  'Slack',
  'Notion',
  'Linear',
]

function buildInsights(transcript, attendees) {
  const names = attendees.map((person) => person.toLowerCase())
  const lines = transcript
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)

  const actions = lines
    .filter((line) => /\b(i will|can|need to|let's|we'll|ship|send|review|book)\b/i.test(line))
    .slice(0, 5)
    .map((line, index) => {
      const owner = attendees.find((person) =>
        line.toLowerCase().startsWith(person.toLowerCase()),
      ) ?? attendees[index % attendees.length]

      const due =
        line.match(/\b(today|tomorrow|thursday|friday|wednesday|noon|this week|next release)\b/i)?.[0] ??
        ['Today', 'Tomorrow', 'Thu', 'Fri', 'This week'][index % 5]

      return {
        id: `${owner}-${index}`,
        owner,
        due,
        title: line.replace(/^[^:]+:\s*/, ''),
        status: index === 0 ? 'High impact' : index === 1 ? 'In progress' : 'Queued',
      }
    })

  const decisions = lines
    .filter((line) => /\b(decide|review|freeze|blocked|rollout|approval)\b/i.test(line))
    .slice(0, 3)
    .map((line) => line.replace(/^[^:]+:\s*/, ''))

  const risks = lines
    .filter((line) => /\b(blocked|outage|failed|needs|freeze)\b/i.test(line))
    .slice(0, 3)
    .map((line) => line.replace(/^[^:]+:\s*/, ''))

  const summary = lines
    .slice(0, 3)
    .map((line) => line.replace(/^[^:]+:\s*/, ''))
    .join(' ')

  const mentions = names.reduce((count, name) => {
    return count + (transcript.toLowerCase().match(new RegExp(name, 'g'))?.length ?? 0)
  }, 0)

  return {
    summary,
    actions,
    decisions,
    risks,
    metrics: {
      actionCount: actions.length,
      speakerCount: attendees.length,
      mentionCount: mentions,
    },
  }
}

function App() {
  const [selectedPreset, setSelectedPreset] = useState(meetingPresets[0])
  const [transcript, setTranscript] = useState(meetingPresets[0].transcript)
  const [isGenerating, setIsGenerating] = useState(false)
  const [generatedMeeting, setGeneratedMeeting] = useState(() =>
    buildInsights(meetingPresets[0].transcript, meetingPresets[0].attendees),
  )

  const deferredTranscript = useDeferredValue(transcript)
  const liveMetrics = useMemo(() => {
    const words = deferredTranscript.trim() ? deferredTranscript.trim().split(/\s+/).length : 0
    const lines = deferredTranscript.trim() ? deferredTranscript.trim().split('\n').length : 0
    const actionSignals = (deferredTranscript.match(/\b(will|need|review|ship|send|follow-up|next)\b/gi) ?? []).length

    return { words, lines, actionSignals }
  }, [deferredTranscript])

  const handlePreset = (preset) => {
    setSelectedPreset(preset)
    setTranscript(preset.transcript)
    startTransition(() => {
      setGeneratedMeeting(buildInsights(preset.transcript, preset.attendees))
    })
  }

  const handleGenerate = () => {
    setIsGenerating(true)

    window.setTimeout(() => {
      startTransition(() => {
        setGeneratedMeeting(buildInsights(transcript, selectedPreset.attendees))
        setIsGenerating(false)
      })
    }, 1100)
  }

  return (
    <main className="shell">
      <div className="ambient ambient-left" />
      <div className="ambient ambient-right" />

      <section className="hero-panel">
        <nav className="topbar">
          <div className="brand">
            <div className="brand-mark">MN</div>
            <div>
              <p className="eyebrow">Meeting Intelligence Suite</p>
              <h1>Meeting to Action Notes</h1>
            </div>
          </div>

          <div className="topbar-actions">
            <span className="status-pill">
              <span className="status-dot" />
              Live workspace
            </span>
            <button type="button" className="ghost-button">
              Publish notes
            </button>
          </div>
        </nav>

        <div className="hero-grid">
          <div className="hero-copy">
            <p className="section-tag">Turn conversations into momentum</p>
            <h2>
              A cinematic workspace that converts messy meeting chatter into clear
              owners, deadlines, and next moves.
            </h2>
            <p className="hero-text">
              Built for modern teams that need instant clarity after product syncs,
              client calls, and operational reviews. Paste a transcript, simulate
              AI extraction, and watch action lanes assemble in real time.
            </p>

            <div className="hero-actions">
              <button type="button" className="primary-button" onClick={handleGenerate}>
                Generate action notes
              </button>
              <button type="button" className="secondary-button">
                Watch workflow
              </button>
            </div>

            <div className="stats-row">
              {highlightStats.map((stat) => (
                <article key={stat.label} className="stat-card">
                  <strong>{stat.value}</strong>
                  <span>{stat.label}</span>
                </article>
              ))}
            </div>
          </div>

          <div className="hero-visual">
            <div className="orbital-ring orbital-ring-a" />
            <div className="orbital-ring orbital-ring-b" />
            <div className="visual-card main-visual-card">
              <div className="visual-card-header">
                <span>Signal engine</span>
                <span>{selectedPreset.title}</span>
              </div>
              <div className="visual-wave">
                <span />
                <span />
                <span />
                <span />
                <span />
                <span />
              </div>
              <div className="workflow-list">
                {workflowSteps.map((step, index) => (
                  <div key={step} className="workflow-item">
                    <span>{`0${index + 1}`}</span>
                    <p>{step}</p>
                  </div>
                ))}
              </div>
            </div>
            <div className="visual-card floating-card">
              <p>Focus score</p>
              <strong>87</strong>
              <span>Teams aligned around owners and dates</span>
            </div>
          </div>
        </div>
      </section>

      <section className="workspace-grid">
        <article className="panel transcript-panel">
          <div className="panel-header">
            <div>
              <p className="section-tag">Transcript Lab</p>
              <h3>Drop in the meeting and shape the narrative</h3>
            </div>
            <div className="preset-row">
              {meetingPresets.map((preset) => (
                <button
                  key={preset.id}
                  type="button"
                  className={preset.id === selectedPreset.id ? 'preset-chip active' : 'preset-chip'}
                  onClick={() => handlePreset(preset)}
                >
                  {preset.label}
                </button>
              ))}
            </div>
          </div>

          <label className="transcript-box">
            <span className="input-label">Meeting transcript</span>
            <textarea
              value={transcript}
              onChange={(event) => setTranscript(event.target.value)}
              placeholder="Paste a meeting transcript here..."
            />
          </label>

          <div className="metrics-row">
            <div>
              <span>Words</span>
              <strong>{liveMetrics.words}</strong>
            </div>
            <div>
              <span>Lines</span>
              <strong>{liveMetrics.lines}</strong>
            </div>
            <div>
              <span>Action signals</span>
              <strong>{liveMetrics.actionSignals}</strong>
            </div>
          </div>
        </article>

        <article className="panel intelligence-panel">
          <div className="panel-header">
            <div>
              <p className="section-tag">Action Engine</p>
              <h3>See the meeting resolved into decisions and tasks</h3>
            </div>
            <button type="button" className="primary-button compact" onClick={handleGenerate}>
              {isGenerating ? 'Analyzing...' : 'Run extraction'}
            </button>
          </div>

          <div className={isGenerating ? 'processing-card active' : 'processing-card'}>
            <div className="processing-bar" />
            <div>
              <p>Inference status</p>
              <strong>{isGenerating ? 'Parsing ownership and deadlines...' : 'Ready to synthesize'}</strong>
            </div>
          </div>

          <div className="summary-card">
            <p className="section-tag">AI summary</p>
            <h4>{selectedPreset.title}</h4>
            <p>{generatedMeeting.summary}</p>
          </div>

          <div className="insight-grid">
            <div className="mini-panel">
              <span>Actions</span>
              <strong>{generatedMeeting.metrics.actionCount}</strong>
            </div>
            <div className="mini-panel">
              <span>Speakers</span>
              <strong>{generatedMeeting.metrics.speakerCount}</strong>
            </div>
            <div className="mini-panel">
              <span>Mentions</span>
              <strong>{generatedMeeting.metrics.mentionCount}</strong>
            </div>
          </div>
        </article>
      </section>

      <section className="action-board">
        <div className="section-heading">
          <div>
            <p className="section-tag">Execution board</p>
            <h3>Every important follow-up, already organized</h3>
          </div>
          <div className="integration-strip">
            {integrationPills.map((item) => (
              <span key={item}>{item}</span>
            ))}
          </div>
        </div>

        <div className="board-grid">
          <article className="panel lane">
            <p className="lane-title">Action items</p>
            <div className="lane-stack">
              {generatedMeeting.actions.map((action) => (
                <div key={action.id} className="action-card">
                  <div className="action-meta">
                    <span>{action.owner}</span>
                    <span>{action.due}</span>
                  </div>
                  <h4>{action.title}</h4>
                  <p>{action.status}</p>
                </div>
              ))}
            </div>
          </article>

          <article className="panel lane">
            <p className="lane-title">Key decisions</p>
            <div className="note-stack">
              {generatedMeeting.decisions.map((decision) => (
                <div key={decision} className="note-card">
                  <span>Decision</span>
                  <p>{decision}</p>
                </div>
              ))}
            </div>
          </article>

          <article className="panel lane">
            <p className="lane-title">Risks to watch</p>
            <div className="note-stack">
              {generatedMeeting.risks.map((risk) => (
                <div key={risk} className="note-card warning">
                  <span>Risk</span>
                  <p>{risk}</p>
                </div>
              ))}
            </div>
          </article>
        </div>
      </section>
    </main>
  )
}

export default App
