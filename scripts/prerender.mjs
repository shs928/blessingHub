import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { resolve, dirname } from 'node:path'
import { render } from '../.prerender/entry-server.js'

const content = JSON.parse(await readFile(new URL('../src/content.json', import.meta.url), 'utf8'))
const template = await readFile(new URL('../dist/index.html', import.meta.url), 'utf8')
const escape = (text) =>
  text
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
const pages = [
  {
    path: '',
    title: 'Blessing Hub · 让好工具与好知识相遇',
    description:
      '我的项目与知识聚合站。在这里发现实用工具、探索学习资料，关注正在生长的课程与项目。',
  },
  {
    path: 'projects',
    title: '所有项目 · Blessing Hub',
    description: '在 Blessing Hub 发现我的项目与实用工具，快速访问 Sub2API 等独立项目。',
  },
  {
    path: 'resources',
    title: '知识与资料 · Blessing Hub',
    description: '阅读使用指南，下载学习整理清单，探索持续生长的知识库。',
  },
  {
    path: 'courses',
    title: '学习与课程 · Blessing Hub',
    description: 'AI 实践、开发学习与成长方法，了解 Blessing Hub 正在筹备的学习内容。',
  },
  {
    path: 'favorites',
    title: '我的收藏 · Blessing Hub',
    description: '把喜欢的项目留在手边。收藏保存在你的浏览器中。',
    noindex: true,
  },
  {
    path: 'about',
    title: '关于本站 · Blessing Hub',
    description: '了解 Blessing Hub 的初衷与最新更新。创造有用的东西，分享值得学的知识。',
  },
  ...content.resources.map((resource) => ({
    path: `resources/${resource.id}`,
    title: `${resource.title} · Blessing Hub`,
    description: resource.description,
  })),
  {
    path: '404',
    title: '页面不存在 · Blessing Hub',
    description: '这个页面暂时不存在。',
    noindex: true,
  },
]

for (const page of pages) {
  const canonical = `${content.site.url}/${page.path ? page.path + '/' : ''}`
  let html = template.replace(
    '<div id="root"></div>',
    `<div id="root">${render(page.path || 'home')}</div>`,
  )
  html = html
    .replace(/<title>.*?<\/title>/, `<title>${escape(page.title)}</title>`)
    .replace(
      /(<meta name="description" content=")[^"]*("\s*\/>)/,
      `$1${escape(page.description)}$2`,
    )
    .replace(/(<meta property="og:title" content=")[^"]*("\s*\/>)/, `$1${escape(page.title)}$2`)
    .replace(
      /(<meta property="og:description" content=")[^"]*("\s*\/>)/,
      `$1${escape(page.description)}$2`,
    )
    .replace(/(<link rel="canonical" href=")[^"]*("\s*\/>)/, `$1${canonical}$2`)
  if (page.noindex)
    html = html.replace('</head>', '<meta name="robots" content="noindex,follow" /></head>')
  const output = resolve(
    'dist',
    page.path === '404' ? '404.html' : page.path,
    page.path === '404' ? '' : 'index.html',
  )
  await mkdir(dirname(output), { recursive: true })
  await writeFile(output, html)
}

await writeFile(
  new URL('../dist/sitemap.xml', import.meta.url),
  `<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${pages
    .filter((page) => !page.noindex)
    .map(
      (page) =>
        `<url><loc>${content.site.url}/${page.path ? page.path + '/' : ''}</loc><lastmod>${content.site.releaseDate}</lastmod></url>`,
    )
    .join('')}</urlset>`,
)
console.log(`Pre-rendered ${pages.length} pages with per-page metadata`)
