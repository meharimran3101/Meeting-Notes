import type { Config, Context } from '@netlify/functions'
import OpenAI from 'openai'

const analysisSchema = {
  type: 'object',
  additionalProperties: false,
  properties: {
    headline: { type: 'string' },
    summary: { type: 'string' },
    actionItems: {
      type: 'array',
      items: {
        type: 'object',
        additionalProperties: false,
        properties: {
          title: { type: 'string' },
          owner: { type: 'string' },
          due: { type: 'string' },
          priority: { type: 'string' },
        },
        required: ['title', 'owner', 'due', 'priority'],
      },
    },
    keyDecisions: {
      type: 'array',
      items: { type: 'string' },
    },
    risks: {
      type: 'array',
      items: { type: 'string' },
    },
    tags: {
      type: 'array',
      items: { type: 'string' },
    },
    followUpEmail: { type: 'string' },
    confidence: { type: 'number' },
  },
  required: [
    'headline',
    'summary',
    'actionItems',
    'keyDecisions',
    'risks',
    'tags',
    'followUpEmail',
    'confidence',
  ],
} as const

const buildPrompt = ({
  title,
  team,
  attendees,
  transcript,
}: {
  title: string
  team: string
  attendees: string[]
  transcript: string
}) => {
  return [
    `Meeting title: ${title}`,
    `Team: ${team}`,
    `Attendees: ${attendees.join(', ')}`,
    'Task: analyze the meeting and produce concise action-oriented notes.',
    'Return clear owners, deadlines, decisions, risks, a short headline, a short summary, tags, and a follow-up email draft.',
    'If an owner or due date is unclear, infer the most likely option and use "TBD" only when necessary.',
    '',
    'Transcript:',
    transcript,
  ].join('\n')
}

export default async (req: Request, _context: Context) => {
  if (req.method !== 'POST') {
    return Response.json({ error: 'Method not allowed' }, { status: 405 })
  }

  try {
    const body = (await req.json()) as {
      title?: string
      team?: string
      attendees?: string[]
      transcript?: string
    }

    const transcript = body.transcript?.trim()

    if (!transcript) {
      return Response.json({ error: 'Transcript is required' }, { status: 400 })
    }

    const apiKey = Netlify.env.get('OPENAI_API_KEY')

    if (!apiKey) {
      return Response.json(
        {
          error: 'OPENAI_API_KEY is not configured in Netlify environment variables',
        },
        { status: 503 },
      )
    }

    const client = new OpenAI({ apiKey })
    const model = Netlify.env.get('OPENAI_MODEL') || 'gpt-5-mini'

    const response = await client.responses.create({
      model,
      instructions:
        'You convert meetings into crisp execution notes for busy teams. Be specific, concise, and action-focused.',
      input: buildPrompt({
        title: body.title || 'Untitled meeting',
        team: body.team || 'General',
        attendees: body.attendees || [],
        transcript,
      }),
      text: {
        format: {
          type: 'json_schema',
          name: 'meeting_analysis',
          strict: true,
          schema: analysisSchema,
        },
      },
    })

    const outputText = response.output_text?.trim()

    if (!outputText) {
      return Response.json({ error: 'Model returned an empty response' }, { status: 502 })
    }

    return Response.json(
      {
        source: 'live',
        model,
        analysis: JSON.parse(outputText),
      },
      { status: 200 },
    )
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unexpected analysis error'

    return Response.json({ error: message }, { status: 500 })
  }
}

export const config: Config = {
  path: '/api/analyze-meeting',
}
