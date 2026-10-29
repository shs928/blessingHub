import { readFile, writeFile } from 'node:fs/promises'

const { site, updates } = JSON.parse(
  await readFile(new URL('../src/content.json', import.meta.url), 'utf8'),
)
const escape = (value) =>
  value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
const rss = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom"><channel>
<title>${escape(site.name)} 更新</title><link>${site.url}</link><description>${escape(site.tagline)}</description><language>zh-CN</language>
<atom:link href="${site.url}/feed.xml" rel="self" type="application/rss+xml"/>
${updates.map((update, index) => `<item><title>${escape(update.title)}</title><link>${escape(site.url + update.href)}</link><description>${escape(update.description)}</description><guid isPermaLink="false">blessing-hub-${update.date}-${index}</guid><pubDate>${new Date(update.date + 'T12:00:00+08:00').toUTCString()}</pubDate></item>`).join('\n')}
</channel></rss>`
await writeFile(new URL('../dist/feed.xml', import.meta.url), rss)
await writeFile(new URL('../public/feed.xml', import.meta.url), rss)
console.log('RSS generated from src/content.json')
