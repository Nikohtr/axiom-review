import { chromium, type Page } from 'playwright'
import Anthropic from '@anthropic-ai/sdk'
import { writeFile, mkdir } from 'fs/promises'
import { randomUUID } from 'crypto'
import type { NextRequest } from 'next/server'

const client = new Anthropic()

const MOBILE_SYSTEM_PROMPT = `You are a senior mobile UX analyst. You will be given a screenshot captured at 390px viewport width (mobile) and DOM data from a real mobile browser visit.

Identify 2–4 mobile-specific UX issues. Return ONLY valid JSON — no markdown, no code fences — matching this exact shape:
{
  "issues": [
    { "issue": "<short issue name>", "severity": "low"|"medium"|"high", "whyItMatters": "<why this hurts mobile users>", "suggestedFix": "<concrete recommendation>", "selector": "<CSS selector for the problematic element, or null>" }
  ]
}

Focus exclusively on mobile concerns:
- Touch targets too small (< 44×44 CSS px)
- Content overflow or horizontal scroll
- Body text too small to read (< 16px)
- Viewport meta tag missing or misconfigured (causes desktop layout on mobile)
- Tap targets spaced too close together (finger-fat error risk)
- Mobile navigation problems (hamburger menu, sticky headers obscuring content)
- Images not responsive / overflowing
- Desktop-only interactions (hover states, right-click menus)
- Inputs without font-size ≥ 16px (trigger iOS auto-zoom)
- Fixed-width elements breaking the layout

Order by severity descending. Be specific — cite actual element counts, IDs, or text. Only emit a selector you are confident exists on the page.`

const SYSTEM_PROMPT = `You are a senior UX and accessibility analyst. You will be given:
1. A webpage screenshot (for visual UX analysis)
2. Extracted text content (headings, CTAs, meta)
3. A DOM accessibility audit with concrete findings from the live DOM

Analyze the UX quality and accessibility of the page. Return ONLY valid JSON — no markdown, no code fences — matching this exact shape:
{
  "uxSummary": "<2-3 sentence overall assessment>",
  "scores": {
    "accessibility": <integer 0-100>,
    "clarity": <integer 0-100>,
    "usability": <integer 0-100>,
    "overall": <integer 0-100>
  },
  "topIssues": [
    { "issue": "<short issue name>", "severity": "low"|"medium"|"high", "whyItMatters": "<why this problem hurts users>", "suggestedFix": "<concrete recommendation>", "selector": "<CSS selector for the problematic element, or null>" }
  ],
  "accessibilityFindings": [
    { "id": "<kebab-case-id>", "impact": "minor"|"moderate"|"serious"|"critical", "issue": "<what the issue is>", "whyItMatters": "<why this matters for accessibility>", "suggestedFix": "<concrete recommendation>", "selector": "<CSS selector for the problematic element, or null>" }
  ]
}

Score definitions:
- accessibility (0-100): How well the page meets WCAG standards — alt text, labels, contrast, keyboard nav, ARIA correctness.
- clarity (0-100): How clearly the page communicates its purpose — hierarchy, typography, visual noise, CTA prominence.
- usability (0-100): How easy the page is to use — navigation, task flow, error prevention, interaction feedback.
- overall (0-100): Holistic quality score weighted across all three dimensions.

Rules:
- topIssues: 2–4 items focused exclusively on visual design and UX flaws — layout problems, poor hierarchy, confusing navigation, weak CTAs, cluttered UI, inconsistent styling, poor readability. Do NOT include accessibility issues here.
- accessibilityFindings: 2–4 items focused exclusively on accessibility — missing alt text, unlabelled inputs, poor contrast, keyboard traps, ARIA misuse, heading order. Prioritise the DOM audit data — it is ground truth from the real DOM, not visual inference.
- Both lists ordered by severity/impact descending
- Be specific: cite actual element counts, IDs, or text from the audit data
- selector: provide a valid CSS selector (prefer ID or unique attribute) targeting the problematic element. Use null for page-wide or structural issues (missing meta tag, overall heading order, etc.). Only emit a selector you are confident exists on the page.`

async function captureElementScreenshot(page: Page, selector: string, outputPath: string): Promise<boolean> {
  try {
    const element = await page.$(selector)
    if (!element) return false
    const box = await element.boundingBox()
    if (!box) return false
    const viewportSize = page.viewportSize() ?? { width: 1280, height: 900 }
    const padding = 80
    const minW = 480
    const minH = 240
    const rawW = Math.max(minW, box.width + padding * 2)
    const rawH = Math.max(minH, box.height + padding * 2)
    // Center the min-size clip on the element when it's small
    const cx = box.x + box.width / 2
    const cy = box.y + box.height / 2
    const clipX = Math.max(0, Math.min(cx - rawW / 2, viewportSize.width - rawW))
    const clipY = Math.max(0, Math.min(cy - rawH / 2, viewportSize.height - rawH))
    const clipW = Math.min(rawW, viewportSize.width - clipX)
    const clipH = Math.min(rawH, viewportSize.height - clipY)
    await page.screenshot({
      path: outputPath,
      clip: { x: clipX, y: clipY, width: clipW, height: clipH },
    })
    return true
  } catch {
    return false
  }
}

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

  const browser = await chromium.launch({
    args: [
      '--disable-blink-features=AutomationControlled',
      '--no-sandbox',
      '--disable-setuid-sandbox',
    ],
  })
  console.log('[analyze] browser launched')
  try {
    const context = await browser.newContext({
      userAgent:
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
      viewport: { width: 1280, height: 900 },
      locale: 'en-US',
      extraHTTPHeaders: { 'Accept-Language': 'en-US,en;q=0.9' },
    })
    // Hide webdriver property so sites don't detect automation
    await context.addInitScript(() => {
      Object.defineProperty(navigator, 'webdriver', { get: () => undefined })
    })
    const page = await context.newPage()
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 })
    // Wait for network to settle, then give JS-heavy pages extra time to render
    await page.waitForLoadState('networkidle', { timeout: 15000 }).catch(() => {})
    await page.waitForTimeout(3000)

    const pageTitle = await page.title()

    const h1 = await page.$$eval('h1', els =>
      (els as HTMLElement[]).map(e => e.innerText?.trim()).filter(Boolean).slice(0, 3)
    )
    const h2 = await page.$$eval('h2', els =>
      (els as HTMLElement[]).map(e => e.innerText?.trim()).filter(Boolean).slice(0, 5)
    )
    const ctaText = await page.$$eval(
      'button, a[href], [role="button"]',
      els => (els as HTMLElement[]).map(e => e.innerText?.trim()).filter(Boolean).slice(0, 10)
    )
    const metaDesc = await page
      .$eval('meta[name="description"]', el => el.getAttribute('content') ?? '')
      .catch(() => '')

    // Extract DOM-level accessibility signals
    const a11y = await page.evaluate(() => {
      const truncate = (arr: string[], n: number) => arr.slice(0, n)

      const imgsWithoutAlt = truncate(
        Array.from(document.querySelectorAll('img')).filter(
          img => !img.hasAttribute('alt')
        ).map(img => img.src || img.getAttribute('data-src') || '<unknown src>'),
        10
      )

      const inputsWithoutLabel = truncate(
        Array.from(document.querySelectorAll('input, textarea, select')).filter(el => {
          const id = el.getAttribute('id')
          const hasLabel = id ? !!document.querySelector(`label[for="${id}"]`) : false
          const hasAriaLabel = el.hasAttribute('aria-label') || el.hasAttribute('aria-labelledby')
          return !hasLabel && !hasAriaLabel
        }).map(el => `<${el.tagName.toLowerCase()} type="${el.getAttribute('type') ?? ''}" placeholder="${el.getAttribute('placeholder') ?? ''}">`),
        10
      )

      const interactiveWithoutName = truncate(
        Array.from(document.querySelectorAll('button, [role="button"], [role="link"], [role="menuitem"]')).filter(el => {
          const e = el as HTMLElement
          const text = e.innerText?.trim()
          const label = el.getAttribute('aria-label')?.trim()
          const labelledby = el.getAttribute('aria-labelledby')
          return !text && !label && !labelledby
        }).map(el => el.outerHTML.slice(0, 120)),
        10
      )

      const headings = Array.from(document.querySelectorAll('h1,h2,h3,h4,h5,h6'))
      const headingOrder = truncate(
        headings.map(h => `${h.tagName}: ${(h as HTMLElement).innerText?.trim().slice(0, 60)}`),
        15
      )

      const allIds = Array.from(document.querySelectorAll('[id]')).map(el => el.id)
      const idCounts: Record<string, number> = {}
      for (const id of allIds) idCounts[id] = (idCounts[id] ?? 0) + 1
      const duplicateIds = Object.entries(idCounts).filter(([, c]) => c > 1).map(([id]) => id).slice(0, 10)

      const linksWithoutText = truncate(
        Array.from(document.querySelectorAll('a')).filter(a => {
          const text = (a as HTMLElement).innerText?.trim()
          const label = a.getAttribute('aria-label')?.trim()
          return !text && !label
        }).map(a => a.href || a.outerHTML.slice(0, 80)),
        10
      )

      const ariaInvalid = truncate(
        Array.from(document.querySelectorAll('[aria-invalid="true"]')).map(
          el => el.outerHTML.slice(0, 120)
        ),
        5
      )

      return { imgsWithoutAlt, inputsWithoutLabel, interactiveWithoutName, headingOrder, duplicateIds, linksWithoutText, ariaInvalid }
    })
    console.log('[analyze] a11y audit done')

    const rawBuffer = await page.screenshot({ fullPage: true })
    const screenshotBuffer = Buffer.from(rawBuffer)
    console.log('[analyze] screenshot captured, size:', screenshotBuffer.length)

    // Save full-page screenshot
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
      '',
      '=== DOM ACCESSIBILITY AUDIT ===',
      a11y.headingOrder.length
        ? `Heading order:\n${a11y.headingOrder.join('\n')}`
        : 'Heading order: none found',
      a11y.imgsWithoutAlt.length
        ? `Images missing alt (${a11y.imgsWithoutAlt.length}):\n${a11y.imgsWithoutAlt.join('\n')}`
        : 'Images missing alt: none',
      a11y.inputsWithoutLabel.length
        ? `Inputs without label/aria-label (${a11y.inputsWithoutLabel.length}):\n${a11y.inputsWithoutLabel.join('\n')}`
        : 'Inputs without label: none',
      a11y.interactiveWithoutName.length
        ? `Interactive elements without accessible name (${a11y.interactiveWithoutName.length}):\n${a11y.interactiveWithoutName.join('\n')}`
        : 'Interactive elements without name: none',
      a11y.linksWithoutText.length
        ? `Links without text/aria-label (${a11y.linksWithoutText.length}):\n${a11y.linksWithoutText.join('\n')}`
        : 'Links without text: none',
      a11y.duplicateIds.length
        ? `Duplicate IDs: ${a11y.duplicateIds.join(', ')}`
        : 'Duplicate IDs: none',
      a11y.ariaInvalid.length
        ? `Elements with aria-invalid: ${a11y.ariaInvalid.join('\n')}`
        : null,
    ]
      .filter(v => v !== null)
      .join('\n')

    console.log('[analyze] calling Claude...')
    const message = await client.messages.create({
      model: 'claude-opus-4-1-20250805',
      max_tokens: 4096,
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

    console.log('[analyze] Claude responded, stop_reason:', message.stop_reason)
    const rawText = message.content[0].type === 'text' ? message.content[0].text : ''
    console.log('[analyze] raw text:', rawText.slice(0, 200))

    // Strip markdown code fences if Claude added them despite instructions
    const jsonText = rawText.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '').trim()

    let analysis: {
      uxSummary: string
      scores: { accessibility: number; clarity: number; usability: number; overall: number }
      topIssues: Array<{ issue: string; severity: string; whyItMatters: string; suggestedFix: string; selector?: string | null }>
      accessibilityFindings: Array<{ id: string; impact: string; issue: string; whyItMatters: string; suggestedFix: string; selector?: string | null }>
    }

    try {
      analysis = JSON.parse(jsonText)
    } catch {
      return Response.json(
        { error: 'Failed to parse LLM response', raw: rawText },
        { status: 500 }
      )
    }

    // Take element-level screenshots for each issue/finding that has a selector
    // (browser is still open here)
    const enrichedTopIssues = await Promise.all(
      analysis.topIssues.map(async ({ selector, ...issue }) => {
        if (!selector) return issue
        const filename = `${id}-issue-${randomUUID()}.png`
        const saved = await captureElementScreenshot(page, selector, `${screenshotsDir}/${filename}`)
        return saved ? { ...issue, screenshot: `/screenshots/${filename}` } : issue
      })
    )

    const enrichedFindings = await Promise.all(
      analysis.accessibilityFindings.map(async ({ selector, ...finding }) => {
        if (!selector) return finding
        const filename = `${id}-a11y-${randomUUID()}.png`
        const saved = await captureElementScreenshot(page, selector, `${screenshotsDir}/${filename}`)
        return saved ? { ...finding, screenshot: `/screenshots/${filename}` } : finding
      })
    )

    // --- Mobile analysis pass ---
    let mobileAnalysis: { screenshot: string; issues: Array<{ issue: string; severity: string; whyItMatters: string; suggestedFix: string; screenshot?: string }> } | null = null
    try {
      const mobileContext = await browser.newContext({
        userAgent:
          'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1',
        viewport: { width: 390, height: 844 },
        isMobile: true,
        hasTouch: true,
        locale: 'en-US',
        extraHTTPHeaders: { 'Accept-Language': 'en-US,en;q=0.9' },
      })
      await mobileContext.addInitScript(() => {
        Object.defineProperty(navigator, 'webdriver', { get: () => undefined })
      })
      const mobilePage = await mobileContext.newPage()
      await mobilePage.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 })
      await mobilePage.waitForLoadState('networkidle', { timeout: 15000 }).catch(() => {})
      await mobilePage.waitForTimeout(2000)

      const mobileRawBuffer = await mobilePage.screenshot({ fullPage: true })
      const mobileScreenshotBuffer = Buffer.from(mobileRawBuffer)
      const mobileId = randomUUID()
      await writeFile(`${screenshotsDir}/${mobileId}.png`, mobileScreenshotBuffer)
      const mobileScreenshotPath = `/screenshots/${mobileId}.png`

      // Lightweight DOM audit for mobile context
      const mobileAudit = await mobilePage.evaluate(() => {
        const viewportWidth = window.innerWidth
        const hasViewportMeta = !!document.querySelector('meta[name="viewport"]')
        const viewportContent = document.querySelector('meta[name="viewport"]')?.getAttribute('content') ?? ''

        const smallTouchTargets = Array.from(
          document.querySelectorAll('a, button, [role="button"], input[type="submit"], input[type="button"]')
        )
          .filter(el => {
            const rect = (el as HTMLElement).getBoundingClientRect()
            return rect.width > 0 && rect.height > 0 && (rect.width < 44 || rect.height < 44)
          })
          .map(el => (el as HTMLElement).outerHTML.slice(0, 100))
          .slice(0, 8)

        const bodyFontSize = parseFloat(getComputedStyle(document.body).fontSize)
        const overflowingEls = Array.from(document.querySelectorAll('*'))
          .filter(el => (el as HTMLElement).scrollWidth > viewportWidth + 5)
          .map(el => `<${el.tagName.toLowerCase()}> scrollWidth=${(el as HTMLElement).scrollWidth}`)
          .slice(0, 5)

        return { hasViewportMeta, viewportContent, smallTouchTargets, bodyFontSize, overflowingEls }
      })

      const mobileTextContext = [
        `URL: ${url}`,
        `Viewport: 390px (mobile)`,
        `Viewport meta tag present: ${mobileAudit.hasViewportMeta}`,
        mobileAudit.viewportContent ? `Viewport content: ${mobileAudit.viewportContent}` : null,
        `Body font-size: ${mobileAudit.bodyFontSize}px`,
        mobileAudit.smallTouchTargets.length
          ? `Touch targets < 44px (${mobileAudit.smallTouchTargets.length}):\n${mobileAudit.smallTouchTargets.join('\n')}`
          : 'Touch targets: all appear adequately sized',
        mobileAudit.overflowingEls.length
          ? `Overflowing elements (${mobileAudit.overflowingEls.length}):\n${mobileAudit.overflowingEls.join('\n')}`
          : 'Content overflow: none detected',
      ]
        .filter(Boolean)
        .join('\n')

      console.log('[analyze] calling Claude for mobile analysis...')
      const mobileMessage = await client.messages.create({
        model: 'claude-opus-4-1-20250805',
        max_tokens: 2048,
        system: MOBILE_SYSTEM_PROMPT,
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'image',
                source: { type: 'base64', media_type: 'image/png', data: mobileScreenshotBuffer.toString('base64') },
              },
              { type: 'text', text: mobileTextContext },
            ],
          },
        ],
      })

      const mobileRawText = mobileMessage.content[0].type === 'text' ? mobileMessage.content[0].text : ''
      const mobileJsonText = mobileRawText.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '').trim()
      const parsedMobile = JSON.parse(mobileJsonText) as { issues: Array<{ issue: string; severity: string; whyItMatters: string; suggestedFix: string; selector?: string | null }> }

      // Element screenshots for mobile issues
      const enrichedMobileIssues = await Promise.all(
        parsedMobile.issues.map(async ({ selector, ...issue }) => {
          if (!selector) return issue
          const filename = `${mobileId}-mobile-${randomUUID()}.png`
          const saved = await captureElementScreenshot(mobilePage, selector, `${screenshotsDir}/${filename}`)
          return saved ? { ...issue, screenshot: `/screenshots/${filename}` } : issue
        })
      )

      mobileAnalysis = { screenshot: mobileScreenshotPath, issues: enrichedMobileIssues }
      console.log('[analyze] mobile analysis done')
      await mobileContext.close()
    } catch (err) {
      console.error('[analyze] mobile analysis failed:', err)
    }

    return Response.json({
      url,
      screenshot: screenshotPath,
      pageTitle,
      uxSummary: analysis.uxSummary,
      scores: analysis.scores,
      topIssues: enrichedTopIssues,
      accessibilityFindings: enrichedFindings,
      mobileAnalysis,
    })
  } finally {
    await browser.close()
    console.log('[analyze] browser closed')
  }
}
