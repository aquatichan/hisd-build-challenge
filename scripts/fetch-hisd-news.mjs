// Pulls the latest district news from the Houston ISD homepage (houstonisd.org, a Finalsite site) into
// src/content/hisd-news.json for the hero's news gallery. Runs automatically before every build (npm "prebuild");
// re-run any time with: node scripts/fetch-hisd-news.mjs
//
// If the fetch fails or the page layout changes, the previous JSON is kept, so builds never break.

import { readFileSync, writeFileSync } from 'node:fs'

const SRC = 'https://www.houstonisd.org/'
const OUT = new URL('../src/content/hisd-news.json', import.meta.url)
const MAX = 8

const decode = (s) =>
  s
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&rsquo;|&lsquo;/g, "'")
    .replace(/&ldquo;|&rdquo;/g, '"')
    .replace(/&mdash;/g, '—')
    .replace(/&ndash;/g, '–')
    .replace(/\s+/g, ' ')
    .trim()

function parse(html) {
  const items = []
  for (const m of html.matchAll(/<article[^>]*data-post-id="(\d+)"[\s\S]*?<\/article>/g)) {
    const block = m[0]
    const href = block.match(/class="fsPostLink fsReadMoreLink"[^>]*href="([^"]+)"/)?.[1]
    const title = block.match(/<div class="fsTitle[^"]*"[^>]*>([\s\S]*?)<\/div>/)?.[1]
    if (!href || !title || !/district-news/.test(href)) continue
    const summary = block.match(/<div class="fsSummary">([\s\S]*?)<\/div>/)?.[1] ?? ''
    // largest raster image the CMS offers (skip SVG collages)
    const sizes = block.match(/data-image-sizes="([^"]+)"/)?.[1]
    let image = ''
    if (sizes) {
      const all = JSON.parse(sizes.replace(/&quot;/g, '"')).sort((a, b) => a.width - b.width)
      const raster = all.filter((x) => !/\.svg$/i.test(x.url))
      const list = raster.length ? raster : all // fall back to the CMS's SVG collage if that's all there is
      image = (list.find((x) => x.width >= 800) || list.at(-1))?.url ?? ''
    }
    const alt = block.match(/<img[^>]*alt="([^"]*)"/)?.[1] ?? ''
    items.push({ id: m[1], title: decode(title), summary: decode(summary), url: href, image, alt: decode(alt) })
    if (items.length >= MAX) break
  }
  return items
}

try {
  const res = await fetch(SRC, { headers: { 'User-Agent': 'Mozilla/5.0 (compatible; site-build)' } })
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  const items = parse(await res.text())
  if (!items.length) throw new Error('no news items found (page layout may have changed)')
  writeFileSync(OUT, JSON.stringify({ source: SRC, fetchedAt: new Date().toISOString(), items }, null, 2) + '\n')
  console.log(`hisd-news: ${items.length} items`)
} catch (err) {
  let kept = 0
  try {
    kept = JSON.parse(readFileSync(OUT, 'utf8')).items.length
  } catch {
    writeFileSync(OUT, JSON.stringify({ source: SRC, fetchedAt: null, items: [] }, null, 2) + '\n')
  }
  console.warn(`hisd-news: fetch failed (${err.message}); keeping ${kept} cached items`)
}
