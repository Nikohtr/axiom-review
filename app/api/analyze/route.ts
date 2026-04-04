import { chromium } from 'playwright'
import { writeFile, mkdir } from 'fs/promises'
import { randomUUID } from 'crypto'
import type { NextRequest } from 'next/server'

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

  // TODO: replace stub with real Claude analysis
  return Response.json({
    url,
    screenshot: screenshotPath,
    pageTitle,
    uxSummary: `[STUB] Extracted from page — title: "${pageTitle}", H1: ${h1.join(', ') || 'none'}, meta: "${metaDesc || 'none'}"`,
    topIssues: [
      { title: 'Stub issue 1', severity: 'high', evidence: `CTAs found: ${ctaText.join(', ') || 'none'}`, fix: 'Pending Claude analysis' },
      { title: 'Stub issue 2', severity: 'medium', evidence: `H2s found: ${h2.join(', ') || 'none'}`, fix: 'Pending Claude analysis' },
    ],
    accessibilityFindings: [
      { id: 'stub-finding', impact: 'moderate', description: 'Pending Claude analysis' },
    ],
  })
}
