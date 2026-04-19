import { startTransition, useDeferredValue, useMemo, useState } from 'react'
import { NavLink, Route, Routes } from 'react-router-dom'
import './App.css'

const profile = {
  name: 'Muhammad Imran',
  email: 'mimranaslam500@gmail.com',
  whatsapp: '+923000233611',
  whatsappUrl: 'https://wa.me/923000233611',
  title: 'Cyber Security Specialist and App Developer',
}

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

const capabilities = [
  'Cyber security',
  'Web development',
  'Flutter app development',
  'React app development',
]

const serviceCards = [
  {
    title: 'Secure product thinking',
    text: 'I bring a cyber security mindset into product work so the app experience stays useful without ignoring risk.',
  },
  {
    title: 'Frontend execution',
    text: 'Hands-on experience building responsive web apps, React products, and clean user interfaces that are practical to ship.',
  },
  {
    title: 'Cross-platform delivery',
    text: 'Experience with Flutter app development helps translate one product idea into mobile-ready flows and reusable design logic.',
  },
]

const defaultWhatsappMessage = encodeURIComponent(
  'Hello Muhammad Imran, I want to discuss a project with you.',
)

function BrandGlyph() {
  return (
    <svg
      className="brand-glyph"
      viewBox="0 0 96 96"
      role="img"
      aria-label="Meeting to Action Notes logo"
    >
      <defs>
        <linearGradient id="glyph-core" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#f5d0a9" />
          <stop offset="100%" stopColor="#7ad0c4" />
        </linearGradient>
      </defs>
      <rect x="6" y="6" width="84" height="84" rx="24" className="glyph-frame" />
      <path
        d="M26 61V34l16 18 16-18v27"
        className="glyph-stroke glyph-main"
        pathLength="1"
      />
      <path
        d="M62 61V34l8 10 8-10v27"
        className="glyph-stroke glyph-accent"
        pathLength="1"
      />
      <circle cx="72" cy="25" r="5" className="glyph-dot" />
      <path
        d="M18 72C28 63 38 59 48 59C58 59 68 63 78 72"
        className="glyph-wave"
        pathLength="1"
      />
    </svg>
  )
}

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
    actionItems:
      Array.isArray(payload.actionItems) && payload.actionItems.length
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
    risks:
      Array.isArray(payload.risks) && payload.risks.length
        ? payload.risks
        : fallbackBase.risks,
    tags:
      Array.isArray(payload.tags) && payload.tags.length
        ? payload.tags
        : fallbackBase.tags,
    followUpEmail: payload.followUpEmail || fallbackBase.followUpEmail,
    confidence:
      typeof payload.confidence === 'number'
        ? payload.confidence
        : fallbackBase.confidence,
  }
}

function SiteLayout({ children }) {
  return (
    <main className="site-shell">
      <div className="noise" />
      <header className="site-header">
        <div className="brand-lockup">
          <div className="brand-mark">
            <BrandGlyph />
          </div>
          <div>
            <p className="micro-copy">Meeting intelligence, rebuilt</p>
            <h1>Meeting to Action Notes</h1>
          </div>
        </div>

        <nav className="site-nav" aria-label="Main navigation">
          <NavLink to="/" end>
            Home
          </NavLink>
          <NavLink to="/about">About</NavLink>
          <NavLink to="/about-us">About Us</NavLink>
          <NavLink to="/contact">Contact</NavLink>
        </nav>
      </header>

      {children}

      <footer className="site-footer">
        <div>
          <p className="section-label">Built by</p>
          <h3>{profile.name}</h3>
          <p className="footer-copy">
            {profile.title}. Hands-on experience in cyber security, web development,
            Flutter app development, and React app development.
          </p>
        </div>

        <div className="footer-links">
          <a href={`mailto:${profile.email}`}>{profile.email}</a>
          <a href={profile.whatsappUrl} target="_blank" rel="noreferrer">
            {profile.whatsapp}
          </a>
        </div>
      </footer>
    </main>
  )
}

function HomePage() {
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
    const signalCount =
      trimmed.match(/\b(will|should|need|review|send|add|follow-up|launch|blocked)\b/gi)
        ?.length ?? 0

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
    const fallback = buildFallbackInsights(
      transcript,
      selectedPreset.attendees,
      selectedPreset.title,
    )
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
    <>
      <section className="hero">
        <div className="hero-top">
          <div className="hero-copy">
            <p className="section-label">Turn discussion into decisions</p>
            <h2>One meeting workspace for summaries, follow-ups, risks, and ownership.</h2>
            <p className="lede">
              Paste a transcript and the app creates a concise summary, clear owners,
              visible risks, and a follow-up draft your team can actually send.
            </p>

            <div className="feature-rail">
              {featureRail.map((item) => (
                <span key={item}>{item}</span>
              ))}
            </div>

            <div className="hero-actions">
              <span className={source === 'live' ? 'source-pill live' : 'source-pill'}>
                {source === 'live'
                  ? 'Live AI'
                  : source === 'fallback'
                    ? 'Fallback mode'
                    : 'Local preview'}
              </span>
              <button type="button" className="primary-button" onClick={analyzeMeeting}>
                {status === 'loading' ? 'Analyzing...' : 'Analyze meeting'}
              </button>
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
    </>
  )
}

function AboutPage() {
  return (
    <section className="content-page">
      <div className="page-hero">
        <p className="section-label">About the product</p>
        <h2>Meeting to Action Notes turns unstructured discussion into work the team can execute.</h2>
        <p className="lede">
          The app is designed to reduce note-taking friction after meetings by extracting
          actions, decisions, risks, and a follow-up draft in one flow.
        </p>
      </div>

      <div className="info-grid">
        <article className="info-card">
          <h3>What it does</h3>
          <p>
            It analyzes a transcript, surfaces action items with likely owners and due
            dates, summarizes the meeting, and highlights decisions and risks.
          </p>
        </article>
        <article className="info-card">
          <h3>Why it matters</h3>
          <p>
            Teams often leave calls with vague next steps. This product helps convert
            spoken conversation into accountability and momentum.
          </p>
        </article>
        <article className="info-card">
          <h3>How it runs</h3>
          <p>
            The frontend sends transcript data to a Netlify serverless function, which can
            call OpenAI securely server-side and return structured output for the UI.
          </p>
        </article>
      </div>

      <section className="contact-form-section">
        <div className="form-copy">
          <p className="section-label">Contact us</p>
          <h3>Send a direct message from the About page</h3>
          <p>
            Use the form below to send a project inquiry, or jump straight to WhatsApp
            if you want a faster conversation.
          </p>
          <a
            className="whatsapp-button"
            href={`${profile.whatsappUrl}?text=${defaultWhatsappMessage}`}
            target="_blank"
            rel="noreferrer"
          >
            Contact on WhatsApp
          </a>
        </div>

        <form
          className="contact-form"
          name="contact"
          method="POST"
          data-netlify="true"
          data-netlify-honeypot="bot-field"
        >
          <input type="hidden" name="form-name" value="contact" />
          <input type="hidden" name="bot-field" />

          <label>
            <span className="field-label">Your name</span>
            <input type="text" name="name" placeholder="Enter your name" required />
          </label>

          <label>
            <span className="field-label">Your email</span>
            <input type="email" name="email" placeholder="Enter your email" required />
          </label>

          <label>
            <span className="field-label">Project type</span>
            <input type="text" name="project" placeholder="Web app, Flutter app, security review..." />
          </label>

          <label>
            <span className="field-label">Message</span>
            <textarea
              name="message"
              rows="5"
              placeholder="Tell me what you want to build or improve..."
              required
            />
          </label>

          <button type="submit" className="primary-button">
            Send inquiry
          </button>
        </form>
      </section>
    </section>
  )
}

function AboutUsPage() {
  return (
    <section className="content-page">
      <div className="page-hero">
        <p className="section-label">About us</p>
        <h2>{profile.name}</h2>
        <p className="lede">
          {profile.name} is a cyber security professional with hands-on experience in web
          development, Flutter app development, and React app development.
        </p>
      </div>

      <div className="profile-card">
        <div>
          <p className="field-label">Core strengths</p>
          <div className="chips">
            {capabilities.map((item) => (
              <span key={item}>{item}</span>
            ))}
          </div>
        </div>
        <p>
          This site reflects a practical mix of secure thinking and product delivery.
          The goal is not just to build interfaces, but to create useful tools that can
          solve real problems while staying robust and production-minded.
        </p>
      </div>

      <div className="info-grid">
        {serviceCards.map((card) => (
          <article key={card.title} className="info-card">
            <h3>{card.title}</h3>
            <p>{card.text}</p>
          </article>
        ))}
      </div>
    </section>
  )
}

function ContactPage() {
  return (
    <section className="content-page">
      <div className="page-hero">
        <p className="section-label">Contact</p>
        <h2>Let’s talk about secure products, web apps, Flutter, or React work.</h2>
        <p className="lede">
          You can reach {profile.name} directly by email or WhatsApp using the details below.
        </p>
      </div>

      <div className="contact-grid">
        <article className="contact-card">
          <p className="field-label">Email</p>
          <a href={`mailto:${profile.email}`}>{profile.email}</a>
        </article>
        <article className="contact-card">
          <p className="field-label">WhatsApp</p>
          <a
            href={`${profile.whatsappUrl}?text=${defaultWhatsappMessage}`}
            target="_blank"
            rel="noreferrer"
          >
            {profile.whatsapp}
          </a>
        </article>
        <article className="contact-card">
          <p className="field-label">Name</p>
          <span>{profile.name}</span>
        </article>
      </div>

      <div className="contact-actions">
        <a
          className="whatsapp-button"
          href={`${profile.whatsappUrl}?text=${defaultWhatsappMessage}`}
          target="_blank"
          rel="noreferrer"
        >
          Chat on WhatsApp
        </a>
        <a className="secondary-link" href={`mailto:${profile.email}`}>
          Send email instead
        </a>
      </div>
    </section>
  )
}

function App() {
  return (
    <SiteLayout>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/about" element={<AboutPage />} />
        <Route path="/about-us" element={<AboutUsPage />} />
        <Route path="/contact" element={<ContactPage />} />
      </Routes>
    </SiteLayout>
  )
}

export default App
