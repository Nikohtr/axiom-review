import { chromium } from 'playwright'
import Anthropic from '@anthropic-ai/sdk'
import { writeFile, mkdir } from 'fs/promises'
import { randomUUID } from 'crypto'
import type { NextRequest } from 'next/server'

const client = new Anthropic()

const SYSTEM_PROMPT = `You are a senior UX and accessibility analyst. You will be given a webpage screenshot and key text content extracted from the page.

Analyze the UX quality and accessibility of the page. Return ONLY valid JSON — no markdown, no code fences — matching this exact shape:
{
  "uxSummary": "<2-3 sentence overall assessment>",
  "topIssues": [
    { "title": "<short issue name>", "severity": "low"|"medium"|"high", "evidence": "<what you observed>", "fix": "<concrete recommendation>" }
  ],
  "accessibilityFindings": [
    { "id": "<kebab-case-id>", "impact": "minor"|"moderate"|"serious"|"critical", "description": "<what the issue is and why it matters>" }
  ]
}

Rules:
- topIssues: 3–5 items, ordered by severity descending
- accessibilityFindings: 3–5 items, ordered by impact descending
- Be specific — reference actual content visible in the screenshot`

export async function POST(request: NextRequest) {
  let body: { url?: string }
  try {
    body = await request.json()
  } catch {
    return Response.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const { url } = body
  if (!url) {
    return Response.json({ error: 'url is required' }, { status: 400 })
  }

  let screenshotBuffer: Buffer
  let pageTitle: string
  let h1: string[]
  let h2: string[]
  let ctaText: string[]
  let metaDesc: string

  const browser = await chromium.launch()
  try {
    const page = await browser.newPage()
    await page.setViewportSize({ width: 1280, height: 900 })
    await page.goto(url, { waitUntil: 'networkidle', timeout: 30000 })

    pageTitle = await page.title()

    h1 = await page.$$eval('h1', els =>
      (els as HTMLElement[]).map(e => e.innerText?.trim()).filter(Boolean).slice(0, 3)
    )
    h2 = await page.$$eval('h2', els =>
      (els as HTMLElement[]).map(e => e.innerText?.trim()).filter(Boolean).slice(0, 5)
    )
    ctaText = await page.$$eval(
      'button, a[href], [role="button"]',
      els => (els as HTMLElement[]).map(e => e.innerText?.trim()).filter(Boolean).slice(0, 10)
    )
    metaDesc = await page
      .$eval('meta[name="description"]', el => el.getAttribute('content') ?? '')
      .catch(() => '')

    const rawBuffer = await page.screenshot({ fullPage: true })
    screenshotBuffer = Buffer.from(rawBuffer)
  } finally {
    await browser.close()
  }

  // Save screenshot to /public/screenshots/ for frontend display
  const id = randomUUID()
  const screenshotsDir = `${process.cwd()}/public/screenshots`
  await mkdir(screenshotsDir, { recursive: true })
  await writeFile(`${screenshotsDir}/${id}.png`, screenshotBuffer)
  const screenshotPath = `/screenshots/${id}.png`

  // Build text context for the LLM
  const textContext = [
    `URL: ${url}`,
    `Page title: ${pageTitle}`,
    metaDesc ? `Meta description: ${metaDesc}` : null,
    h1.length ? `H1: ${h1.join(' | ')}` : null,
    h2.length ? `H2: ${h2.join(' | ')}` : null,
    ctaText.length ? `Buttons/CTAs: ${ctaText.join(' | ')}` : null,
  ]
    .filter(Boolean)
    .join('\n')

  const message = await client.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 1024,
    system: SYSTEM_PROMPT,
    messages: [
      {
        role: 'user',
        content: [
          {
            type: 'image',
            source: {
              type: 'base64',
              media_type: 'image/png',
              data: screenshotBuffer.toString('base64'),
            },
          },
          { type: 'text', text: textContext },
        ],
      },
    ],
  })

  const rawText = message.content[0].type === 'text' ? message.content[0].text : ''

  let analysis: {
    uxSummary: string
    topIssues: Array<{ title: string; severity: string; evidence: string; fix: string }>
    accessibilityFindings: Array<{ id: string; impact: string; description: string }>
  }

  try {
    analysis = JSON.parse(rawText)
  } catch {
    return Response.json(
      { error: 'Failed to parse LLM response', raw: rawText },
      { status: 500 }
    )
  }

  return Response.json({
    url,
    screenshot: screenshotPath,
    pageTitle,
    uxSummary: analysis.uxSummary,
    topIssues: analysis.topIssues,
    accessibilityFindings: analysis.accessibilityFindings,
  })
}
