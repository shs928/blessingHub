import React, { useEffect, useMemo, useRef, useState } from 'react'
import { createRoot } from 'react-dom/client'
import {
  ArrowDownToLine,
  ArrowLeft,
  ArrowRight,
  ArrowUpRight,
  BookOpen,
  Bookmark,
  Check,
  ChevronRight,
  CircleHelp,
  Code2,
  Command,
  Compass,
  Copy,
  ExternalLink,
  FileText,
  FolderOpen,
  GraduationCap,
  Grid2X2,
  Menu,
  Moon,
  Plus,
  Radio,
  Rss,
  Search,
  SlidersHorizontal,
  Sparkles,
  Sun,
  Terminal,
  X,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import content from './content.json'
import './styles.css'

type Project = (typeof content.projects)[number]
type Resource = (typeof content.resources)[number]
type View = 'home' | 'projects' | 'resources' | 'courses' | 'favorites' | 'about'
const icons: Record<string, LucideIcon> = {
  compass: Compass,
  file: FileText,
  sparkles: Sparkles,
  code: Code2,
  book: BookOpen,
}
const navigation: { id: View; label: string; icon: LucideIcon }[] = [
  { id: 'home', label: '发现首页', icon: Compass },
  { id: 'projects', label: '所有项目', icon: Grid2X2 },
  { id: 'resources', label: '知识与资料', icon: BookOpen },
  { id: 'courses', label: '学习与课程', icon: GraduationCap },
]

function storageGet(key: string) {
  try {
    return localStorage.getItem(key)
  } catch {
    return null
  }
}
function initialFavorites(): string[] {
  try {
    const value: unknown = JSON.parse(storageGet('blessing-favorites') || '[]')
    return Array.isArray(value)
      ? value.filter(
          (id): id is string =>
            typeof id === 'string' && content.projects.some((project) => project.id === id),
        )
      : []
  } catch {
    return []
  }
}
function useRoute(initialRoute?: string) {
  const [route, setRoute] = useState(
    () => initialRoute ?? (window.location.pathname.replace(/^\/+|\/+$/g, '') || 'home'),
  )
  useEffect(() => {
    const onHash = () => {
      setRoute(window.location.pathname.replace(/^\/+|\/+$/g, '') || 'home')
      window.scrollTo({ top: 0, behavior: 'instant' })
    }
    window.addEventListener('popstate', onHash)
    return () => window.removeEventListener('popstate', onHash)
  }, [])
  return route
}

function Brand({ compact = false }: { compact?: boolean }) {
  return (
    <a
      className={`brand ${compact ? 'brand-compact' : ''}`}
      href="/"
      aria-label="Blessing Hub 首页"
    >
      <span className="brand-symbol">
        <span />
        <span />
        <span />
        <span />
      </span>
      <span>
        Blessing<span className="brand-light"> Hub</span>
        <small>让好工具与好知识相遇</small>
      </span>
    </a>
  )
}

function Modal({
  children,
  onClose,
  label,
  className = '',
}: {
  children: React.ReactNode
  onClose: () => void
  label: string
  className?: string
}) {
  const ref = useRef<HTMLDialogElement>(null)
  useEffect(() => {
    const el = ref.current
    el?.showModal()
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      el?.close()
      document.body.style.overflow = previousOverflow
    }
  }, [])
  return (
    <dialog
      ref={ref}
      className={`modal ${className}`}
      aria-label={label}
      onCancel={(event) => {
        event.preventDefault()
        onClose()
      }}
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose()
      }}
    >
      <div className="modal-inner">{children}</div>
    </dialog>
  )
}

export function App({ initialRoute }: { initialRoute?: string }) {
  const route = useRoute(initialRoute)
  const [rawView, resourceId] = route.split('/')
  const validView = ['home', 'projects', 'resources', 'courses', 'favorites', 'about'].includes(
    rawView,
  )
  const view: View = validView ? (rawView as View) : 'home'
  const article =
    view === 'resources' && resourceId
      ? content.resources.find((resource) => resource.id === resourceId)
      : undefined
  const [favorites, setFavorites] = useState<string[]>(initialFavorites)
  const [theme, setTheme] = useState(() =>
    storageGet('blessing-theme') === 'dark' ? 'dark' : 'light',
  )
  const [searchOpen, setSearchOpen] = useState(false)
  const [rssOpen, setRssOpen] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [isMobile, setIsMobile] = useState(false)
  const [detail, setDetail] = useState<Project | null>(null)
  const [toast, setToast] = useState('')
  const [filter, setFilter] = useState('全部项目')
  const [projectSearch, setProjectSearch] = useState('')
  const [resourceFilter, setResourceFilter] = useState('全部资料')

  useEffect(() => {
    document.documentElement.dataset.theme = theme
    try {
      localStorage.setItem('blessing-theme', theme)
    } catch {
      /* Theme still works for this session. */
    }
  }, [theme])
  useEffect(() => {
    const media = window.matchMedia('(max-width: 760px)')
    const update = () => setIsMobile(media.matches)
    update()
    media.addEventListener('change', update)
    return () => media.removeEventListener('change', update)
  }, [])
  useEffect(() => {
    if (mobileOpen && isMobile) document.getElementById('sidebar-close')?.focus()
  }, [mobileOpen, isMobile])
  useEffect(() => {
    const handler = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault()
        setSearchOpen((current) => !current)
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [])
  useEffect(() => {
    setMobileOpen(false)
  }, [route])
  useEffect(() => {
    document.title = `${article?.title || navigation.find((item) => item.id === view)?.label || (view === 'favorites' ? '我的收藏' : '关于本站')} · Blessing Hub`
  }, [view, article])
  useEffect(() => {
    if (!toast) return
    const timer = window.setTimeout(() => setToast(''), 2800)
    return () => window.clearTimeout(timer)
  }, [toast])

  function toggleFavorite(id: string) {
    const isSaved = favorites.includes(id)
    const next = isSaved ? favorites.filter((item) => item !== id) : [...favorites, id]
    setFavorites(next)
    try {
      localStorage.setItem('blessing-favorites', JSON.stringify(next))
      setToast(isSaved ? '已从收藏中移除' : '已加入我的收藏')
    } catch {
      setToast('已更新本次浏览的收藏；当前浏览器无法持久保存')
    }
  }
  async function copyRss() {
    try {
      await navigator.clipboard.writeText(`${content.site.url}/feed.xml`)
      setToast('RSS 订阅地址已复制')
    } catch {
      setToast('请选中并复制弹窗中的 RSS 地址')
    }
  }
  const projects = content.projects.filter(
    (project) =>
      (filter === '全部项目' || project.category === filter) &&
      `${project.name} ${project.description} ${project.tags.join(' ')}`
        .toLowerCase()
        .includes(projectSearch.toLowerCase()),
  )

  function ProjectCard({ project }: { project: Project }) {
    const saved = favorites.includes(project.id)
    return (
      <article className="project-card">
        <div className="project-card-top">
          <span className="project-icon">
            <Terminal size={25} strokeWidth={1.8} />
          </span>
          <button
            className={`icon-button bookmark-button ${saved ? 'saved' : ''}`}
            aria-label={saved ? `取消收藏 ${project.name}` : `收藏 ${project.name}`}
            aria-pressed={saved}
            onClick={() => toggleFavorite(project.id)}
          >
            <Bookmark size={18} fill={saved ? 'currentColor' : 'none'} />
          </button>
        </div>
        <div className="project-name-row">
          <h3>
            <button onClick={() => setDetail(project)}>{project.name}</button>
          </h3>
          <span className="status-dot">已上线</span>
        </div>
        <p>{project.description}</p>
        <div className="tags">
          {project.tags.map((tag) => (
            <span key={tag}>{tag}</span>
          ))}
        </div>
        <div className="project-card-footer">
          <span>
            <span className="tiny-dot" />
            {project.category}
          </span>
          <a href={project.url} target="_blank" rel="noopener noreferrer">
            访问项目
            <ArrowUpRight size={17} />
          </a>
        </div>
      </article>
    )
  }
  function ResourceCard({ resource }: { resource: Resource }) {
    const Icon = icons[resource.icon] || FileText
    return (
      <a className="resource-card" href={`/resources/${resource.id}`}>
        <span className={`resource-art ${resource.icon}`}>
          <Icon size={30} strokeWidth={1.4} />
          <span className="art-line" />
          <span className="art-dot" />
        </span>
        <div className="resource-card-body">
          <span className="eyebrow">
            {resource.category}
            <span className="muted-dot">·</span>
            {resource.type}
          </span>
          <h3>{resource.title}</h3>
          <p>{resource.description}</p>
          <span className="resource-read">
            {resource.download ? '查看并下载' : '开始阅读'}
            <ArrowUpRight size={16} />
          </span>
        </div>
      </a>
    )
  }
  const sectionHeading = (eyebrow: string, title: string, description: string) => (
    <div className="page-heading">
      <span className="eyebrow orange-text">{eyebrow}</span>
      <h1>
        {title}
        <span className="orange-text">.</span>
      </h1>
      <p>{description}</p>
    </div>
  )
  const empty = (title: string, description: string, icon: LucideIcon = Search) => {
    const Icon = icon
    return (
      <div className="empty-state">
        <span>
          <Icon size={28} />
        </span>
        <h3>{title}</h3>
        <p>{description}</p>
        <a className="button button-dark" href="/projects">
          探索项目
          <ArrowRight size={16} />
        </a>
      </div>
    )
  }

  return (
    <div className="app-shell">
      {mobileOpen && (
        <button
          className="sidebar-backdrop"
          onClick={() => setMobileOpen(false)}
          aria-label="关闭导航"
        />
      )}
      <aside
        id="main-sidebar"
        aria-label="侧栏导航"
        inert={isMobile && !mobileOpen}
        className={`sidebar ${mobileOpen ? 'open' : ''}`}
      >
        <button
          id="sidebar-close"
          className="icon-button sidebar-close"
          aria-label="关闭侧栏导航"
          onClick={() => setMobileOpen(false)}
        >
          <X size={20} />
        </button>
        <Brand />
        <div className="sidebar-section-label">你的探索，从这里开始</div>
        <nav aria-label="主要导航">
          {navigation.map(({ id, label, icon: Icon }) => (
            <a
              key={id}
              href={id === 'home' ? '/' : `/${id}/`}
              className={`nav-link ${view === id ? 'active' : ''}`}
              aria-current={view === id ? 'page' : undefined}
            >
              <Icon size={19} />
              <span>{label}</span>
              {id === 'projects' && (
                <span className="nav-count">
                  {content.projects.length.toString().padStart(2, '0')}
                </span>
              )}
              {id === 'courses' && <span className="nav-soon">SOON</span>}
            </a>
          ))}
        </nav>
        <div className="nav-divider" />
        <a
          className={`nav-link ${view === 'favorites' ? 'active' : ''}`}
          href="/favorites"
          aria-current={view === 'favorites' ? 'page' : undefined}
        >
          <Bookmark size={19} />
          <span>我的收藏</span>
          {favorites.length > 0 && <span className="nav-count">{favorites.length}</span>}
        </a>
        <div className="sidebar-bottom">
          <div className="sidebar-note">
            <span className="note-sparkle">✳</span>
            <h4>好东西，慢慢积累。</h4>
            <p>
              工具、知识，还有新的可能。
              <br />
              这个小站正在持续生长。
            </p>
            <button onClick={() => setRssOpen(true)}>
              订阅更新
              <ArrowUpRight size={15} />
            </button>
          </div>
          <a className={`nav-link ${view === 'about' ? 'active' : ''}`} href="/about">
            <CircleHelp size={18} />
            <span>关于这个小站</span>
            <ArrowUpRight size={15} />
          </a>
          <div className="sidebar-copyright">
            © 2026 Blessing Hub
            <span className="tiny-dot" />
            保持好奇
          </div>
        </div>
      </aside>

      <div className="main-shell" inert={isMobile && mobileOpen}>
        <header className="topbar">
          <div className="topbar-left">
            <button
              className="icon-button mobile-menu"
              aria-expanded={mobileOpen}
              aria-controls="main-sidebar"
              onClick={() => setMobileOpen(true)}
              aria-label="打开导航"
            >
              <Menu size={22} />
            </button>
            <span className="breadcrumb">
              工作与学习的灵感入口
              <ChevronRight size={13} />
              <strong>
                {navigation.find((item) => item.id === view)?.label ||
                  (view === 'favorites' ? '我的收藏' : '关于本站')}
              </strong>
            </span>
          </div>
          <div className="topbar-actions">
            <button
              className="search-trigger"
              aria-label="全站搜索"
              onClick={() => setSearchOpen(true)}
            >
              <Search size={16} />
              <span>搜索项目、资料…</span>
              <kbd>⌘ K</kbd>
            </button>
            <span className="topbar-separator" />
            <button
              className="icon-button"
              aria-label={theme === 'light' ? '切换深色模式' : '切换浅色模式'}
              onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}
            >
              {theme === 'light' ? <Moon size={19} /> : <Sun size={19} />}
            </button>
            <a className="avatar" href="/about" aria-label="关于 Blessing Hub">
              B<span />
            </a>
          </div>
        </header>

        <main id="main-content" className="main-content">
          {!validView || (resourceId && !article) ? (
            <>
              {sectionHeading(
                'PAGE NOT FOUND',
                '好像走进了一条小岔路',
                '这个页面暂时不存在，回到首页继续探索吧。',
              )}
              <a className="button button-dark" href="/">
                返回首页
                <ArrowLeft size={16} />
              </a>
            </>
          ) : view === 'home' ? (
            <>
              <div className="welcome-line">
                <span>
                  <span className="tiny-dot" />
                  一处汇聚，连接更多可能
                </span>
                <span>独立创造 · 持续分享</span>
              </div>
              <section className="hero" aria-labelledby="hero-title">
                <div className="hero-copy">
                  <span className="hero-eyebrow">
                    <span />A LITTLE HUB. ENDLESS POSSIBILITIES.
                  </span>
                  <h1 id="hero-title">
                    好工具，好知识。
                    <br />
                    <span>让探索</span>发生<span className="hero-period">.</span>
                  </h1>
                  <p>
                    欢迎来到 Blessing Hub。这里汇聚我的项目、实用工具与学习分享，
                    <br className="desktop-break" />
                    让每一次好奇，都有一个值得出发的入口。
                  </p>
                  <div className="hero-actions">
                    <a className="button button-orange" href="/projects">
                      探索我的项目
                      <ArrowUpRight size={17} />
                    </a>
                    <a className="button button-quiet" href="/resources">
                      逛逛知识库
                      <ArrowRight size={16} />
                    </a>
                  </div>
                  <div className="hero-footnote">
                    <span className="little-avatars">
                      <i>B</i>
                      <i>✳</i>
                      <i>↗</i>
                    </span>
                    <span>创造一点，分享一点，进步一点。</span>
                  </div>
                </div>
                <div
                  className="hero-art"
                  role="img"
                  aria-label="Blessing Hub 连接项目、知识与学习的插画"
                >
                  <div className="art-grid" />
                  <div className="orbit orbit-one" />
                  <div className="orbit orbit-two" />
                  <svg
                    className="orbit-connections"
                    viewBox="0 0 460 340"
                    fill="none"
                    aria-hidden="true"
                  >
                    <path
                      d="M120 92 230 171 353 88M230 171 352 257M230 171 103 260"
                      stroke="currentColor"
                      strokeWidth="1.5"
                      strokeDasharray="4 5"
                    />
                  </svg>
                  <span className="art-star star-one">✳</span>
                  <span className="art-star star-two">+</span>
                  <div className="hub-center">
                    <span className="hub-symbol">
                      <span />
                      <span />
                      <span />
                      <span />
                    </span>
                    <strong>Blessing Hub</strong>
                    <small>CONNECT THE POSSIBILITIES</small>
                  </div>
                  <div className="orbit-node node-code">
                    <span>
                      <Code2 size={23} />
                    </span>
                    <div>
                      <strong>好用的项目</strong>
                      <small>BUILD & CREATE</small>
                    </div>
                  </div>
                  <div className="orbit-node node-book">
                    <span>
                      <BookOpen size={22} />
                    </span>
                    <div>
                      <strong>值得学的知识</strong>
                      <small>LEARN & GROW</small>
                    </div>
                  </div>
                  <div className="orbit-node node-spark">
                    <Sparkles size={21} />
                    <span>新的灵感，正在发生</span>
                  </div>
                  <div className="art-coordinate">
                    EST. 2026<span>01 / ∞</span>
                  </div>
                </div>
              </section>
              <div className="quick-links">
                <a href="/projects">
                  <span className="quick-icon orange-bg">
                    <Grid2X2 size={21} />
                  </span>
                  <div>
                    <strong>发现好项目</strong>
                    <span>{content.projects.length} 个项目，随时启程</span>
                  </div>
                  <ArrowUpRight size={18} />
                </a>
                <a href="/resources">
                  <span className="quick-icon green-bg">
                    <FolderOpen size={21} />
                  </span>
                  <div>
                    <strong>知识与资料</strong>
                    <span>阅读、下载，把知识带走</span>
                  </div>
                  <ArrowUpRight size={18} />
                </a>
                <a href="/courses">
                  <span className="quick-icon purple-bg">
                    <GraduationCap size={23} />
                  </span>
                  <div>
                    <strong>让学习有方向</strong>
                    <span>学习路径与课程，筹备中</span>
                  </div>
                  <ArrowUpRight size={18} />
                </a>
              </div>

              <section className="section">
                <div className="section-title">
                  <div>
                    <span className="section-overline">MADE TO BE USEFUL</span>
                    <h2>
                      从一个好项目开始
                      <span className="inline-count">
                        {content.projects.length.toString().padStart(2, '0')}
                      </span>
                    </h2>
                    <p>把想法做成工具，让工具真正派上用场。</p>
                  </div>
                  <a className="text-link" href="/projects">
                    所有项目
                    <ArrowRight size={16} />
                  </a>
                </div>
                <div className="home-project-grid">
                  {content.projects
                    .filter((project) => project.featured)
                    .map((project) => (
                      <ProjectCard key={project.id} project={project} />
                    ))}
                  <div className="next-project">
                    <div className="next-project-art">
                      <span />
                      <Plus size={27} strokeWidth={1.4} />
                      <span />
                    </div>
                    <span className="eyebrow">THE NEXT CHAPTER</span>
                    <h3>下一个好想法，正在路上。</h3>
                    <p>
                      这里会不断加入新的项目。
                      <br />
                      保持好奇，下次见面多一点惊喜。
                    </p>
                    <button className="text-link" onClick={() => setRssOpen(true)}>
                      关注后续更新
                      <ArrowUpRight size={16} />
                    </button>
                    <span className="next-project-number">02</span>
                  </div>
                </div>
              </section>

              <section className="section resources-section">
                <div className="section-title">
                  <div>
                    <span className="section-overline">COLLECT LESS. LEARN MORE.</span>
                    <h2>
                      给好奇心，补充一点养分<span className="small-star">✳</span>
                    </h2>
                    <p>读一点，动手做一点，让收藏变成自己的知识。</p>
                  </div>
                  <a className="text-link" href="/resources">
                    进入知识库
                    <ArrowRight size={16} />
                  </a>
                </div>
                <div className="resource-grid">
                  {content.resources.map((resource) => (
                    <ResourceCard key={resource.id} resource={resource} />
                  ))}
                </div>
              </section>
              <section className="learning-banner">
                <div className="learning-banner-art">
                  <GraduationCap size={39} strokeWidth={1.2} />
                  <span>✳</span>
                </div>
                <div>
                  <span className="eyebrow">A LITTLE BETTER, EVERY DAY</span>
                  <h2>学习这件事，慢慢来，也持续向前。</h2>
                  <p>AI 实践、开发学习与成长方法，正在整理成更有方向的内容。</p>
                </div>
                <a href="/courses">
                  看看学习计划
                  <ArrowUpRight size={17} />
                </a>
              </section>
              <section className="updates-section">
                <div>
                  <Radio size={17} />
                  <h3>小站新鲜事</h3>
                  <span className="update-version">V1.0</span>
                </div>
                <a href="/about">
                  <span className="update-date">10.29</span>
                  <span>Blessing Hub 上线，新的连接从这里开始。</span>
                  <ArrowRight size={16} />
                </a>
              </section>
            </>
          ) : view === 'projects' ? (
            <>
              {sectionHeading(
                'THE PROJECT COLLECTION',
                '把想法，变成好用的东西',
                '我的项目都在这里。找到你需要的工具，也发现一些新的可能。',
              )}
              <div className="filter-bar">
                <div className="filter-chips">
                  {[
                    '全部项目',
                    ...new Set(content.projects.map((project) => project.category)),
                  ].map((category) => (
                    <button
                      key={category}
                      className={filter === category ? 'selected' : ''}
                      onClick={() => setFilter(category)}
                    >
                      {category}
                      {category === '全部项目' && <span>{content.projects.length}</span>}
                    </button>
                  ))}
                </div>
                <label className="inline-search">
                  <Search size={16} />
                  <input
                    aria-label="筛选项目"
                    placeholder="查找项目…"
                    value={projectSearch}
                    onChange={(event) => setProjectSearch(event.target.value)}
                  />
                </label>
              </div>
              <div className="results-note">
                <span>{projects.length} 个项目</span>
                <span>
                  <SlidersHorizontal size={13} />
                  按推荐顺序
                </span>
              </div>
              <div className="projects-grid">
                {projects.map((project) => (
                  <ProjectCard key={project.id} project={project} />
                ))}
              </div>
              {projects.length === 0 && (
                <div className="empty-state">
                  <Search size={30} />
                  <h3>暂时没有匹配的项目</h3>
                  <p>试试其他关键词，或者查看所有项目。</p>
                  <button
                    className="button button-dark"
                    onClick={() => {
                      setFilter('全部项目')
                      setProjectSearch('')
                    }}
                  >
                    清除筛选
                  </button>
                </div>
              )}
              <div className="collection-note">
                <Plus size={20} />
                <div>
                  <strong>这是一个持续生长的项目集合</strong>
                  <p>更多项目会在准备好后加入。每个入口，都通往一个独立的项目站点。</p>
                </div>
                <button className="text-link" onClick={() => setRssOpen(true)}>
                  订阅更新
                  <ArrowUpRight size={16} />
                </button>
              </div>
            </>
          ) : view === 'resources' && article ? (
            <>
              <a className="back-link" href="/resources">
                <ArrowLeft size={16} />
                返回知识与资料
              </a>
              <article className="article-page">
                <div className="article-meta">
                  <span className="pill">{article.category}</span>
                  <span>{article.date.replaceAll('-', '.')}</span>
                  <span>{article.type}</span>
                </div>
                <h1>{article.title}</h1>
                <p className="article-lead">{article.description}</p>
                <div className="article-content">
                  {article.sections.map((section, index) => (
                    <section key={section.heading}>
                      <span className="article-number">0{index + 1}</span>
                      <h2>{section.heading}</h2>
                      <p>{section.body}</p>
                    </section>
                  ))}
                </div>
                {article.download && (
                  <div className="download-box">
                    <span className="quick-icon green-bg">
                      <ArrowDownToLine size={23} />
                    </span>
                    <div>
                      <h3>把清单带走，从今天开始</h3>
                      <p>Markdown 文件 · 免费下载 · 可自由编辑</p>
                    </div>
                    <a className="button button-dark" href={article.download} download>
                      下载清单
                      <ArrowDownToLine size={16} />
                    </a>
                  </div>
                )}
                <div className="article-end">
                  <span>✳</span>
                  <p>愿每一次探索，都有一点收获。</p>
                  <a href="/projects" className="text-link">
                    再看看好用的项目
                    <ArrowRight size={16} />
                  </a>
                </div>
              </article>
            </>
          ) : view === 'resources' ? (
            <>
              {sectionHeading(
                'A GROWING KNOWLEDGE GARDEN',
                '好知识，值得留一份',
                '从一份指南、一张清单开始。让知识可以阅读，也能带走。',
              )}
              <div className="filter-bar">
                <div className="filter-chips">
                  {['全部资料', '在线阅读', '免费下载'].map((category) => (
                    <button
                      className={resourceFilter === category ? 'selected' : ''}
                      key={category}
                      onClick={() => setResourceFilter(category)}
                    >
                      {category}
                    </button>
                  ))}
                </div>
                <span className="muted-label">持续整理中</span>
              </div>
              <div className="resource-grid resource-page-grid">
                {content.resources
                  .filter(
                    (resource) => resourceFilter === '全部资料' || resource.type === resourceFilter,
                  )
                  .map((resource) => (
                    <ResourceCard key={resource.id} resource={resource} />
                  ))}
              </div>
              <div className="resource-coming">
                <BookOpen size={25} />
                <h3>知识库，正在一点点变丰富。</h3>
                <p>
                  未来会逐步加入 AI 实践、开发笔记与更多学习资料。
                  <br />
                  每一份内容准备好后，都会出现在这里。
                </p>
                <button className="text-link" onClick={() => setRssOpen(true)}>
                  用 RSS 关注更新
                  <ArrowUpRight size={16} />
                </button>
              </div>
            </>
          ) : view === 'courses' ? (
            <>
              {sectionHeading(
                'LEARN WITH A DIRECTION',
                '不止于收藏，开始真正学会',
                '把零散的知识连成路径。学习内容与课程正在筹备，先看看接下来的方向。',
              )}
              <div className="planning-notice">
                <span className="pulse-dot" />
                <span>内容筹备中</span>
                <p>以下为内容规划，尚未开放报名或付费。正式发布后会更新具体内容。</p>
              </div>
              <div className="course-grid">
                {content.plans.map((plan, index) => {
                  const Icon = icons[plan.icon]
                  return (
                    <article className={`course-card course-${index}`} key={plan.id}>
                      <div className="course-art">
                        <span className="course-art-number">0{index + 1}</span>
                        <Icon size={52} strokeWidth={1} />
                        <span className="course-art-word">
                          {['EXPLORE', 'CREATE', 'GROW'][index]}
                        </span>
                      </div>
                      <div className="course-body">
                        <span className="eyebrow">{plan.category}</span>
                        <h2>{plan.title}</h2>
                        <p>{plan.description}</p>
                        <span className="coming-label">
                          <span className="tiny-dot" />
                          {plan.status}
                        </span>
                      </div>
                    </article>
                  )
                })}
              </div>
              <div className="course-bottom">
                <div>
                  <h2>在下一段旅程开始前，先迈出一小步。</h2>
                  <p>看看已经上线的项目，或者下载一份学习清单。</p>
                </div>
                <a className="button button-dark" href="/resources">
                  从知识库开始
                  <ArrowRight size={16} />
                </a>
              </div>
            </>
          ) : view === 'favorites' ? (
            <>
              {sectionHeading(
                'YOUR PERSONAL SHORTLIST',
                '把好用的，留在手边',
                '你的浏览器收藏夹。这里的收藏仅保存在当前浏览器中。',
              )}
              {favorites.length ? (
                <>
                  <div className="results-note">
                    <span>{favorites.length} 个收藏</span>
                    <span>
                      <Bookmark size={13} />
                      保存在此设备
                    </span>
                  </div>
                  <div className="projects-grid">
                    {content.projects
                      .filter((project) => favorites.includes(project.id))
                      .map((project) => (
                        <ProjectCard key={project.id} project={project} />
                      ))}
                  </div>
                </>
              ) : (
                empty(
                  '留一个位置，给喜欢的项目',
                  '点击项目卡片上的书签，就能在这里快速找到它。',
                  Bookmark,
                )
              )}
            </>
          ) : (
            <>
              {sectionHeading(
                'A SMALL PLACE FOR BIG CURIOSITY',
                '你好，这里是 Blessing Hub',
                '一个属于我的项目入口，也是一个与大家分享知识、保持好奇的地方。',
              )}
              <div className="about-layout">
                <section className="about-story">
                  <span className="about-mark">✳</span>
                  <h2>
                    创造一些有用的东西。
                    <br />
                    分享一些值得学的知识。
                  </h2>
                  <p>
                    做项目的过程中，总有一些工具值得留下，也有一些经验值得分享。Blessing Hub
                    把这些零散的入口汇聚起来，让你更容易找到我的项目，也发现接下来想学的东西。
                  </p>
                  <p>
                    这里从一个项目开始。接下来，我会持续整理学习资料、分享实践过程，并逐步加入课程内容。小站会慢慢长大，但希望每个来到这里的人，都能带走一点有用的东西。
                  </p>
                  <div className="about-principles">
                    <span>
                      <Check size={15} />
                      实用优先
                    </span>
                    <span>
                      <Check size={15} />
                      持续分享
                    </span>
                    <span>
                      <Check size={15} />
                      保持好奇
                    </span>
                  </div>
                </section>
                <aside className="about-facts">
                  <span className="eyebrow">AT A GLANCE</span>
                  <div>
                    <strong>{content.projects.length.toString().padStart(2, '0')}</strong>
                    <span>已收录项目</span>
                  </div>
                  <div>
                    <strong>{content.resources.length.toString().padStart(2, '0')}</strong>
                    <span>知识与资料</span>
                  </div>
                  <div>
                    <strong>∞</strong>
                    <span>还未发生的可能</span>
                  </div>
                  <small>从 2026 年 10 月开始</small>
                </aside>
              </div>
              <section className="changelog">
                <div className="section-title">
                  <div>
                    <span className="section-overline">THE CHANGELOG</span>
                    <h2>一步一步，记录生长</h2>
                  </div>
                  <button className="text-link" onClick={() => setRssOpen(true)}>
                    <Rss size={15} />
                    订阅更新
                  </button>
                </div>
                {content.updates.map((update) => (
                  <div className="changelog-item" key={update.title}>
                    <time>{update.date.replaceAll('-', '.')}</time>
                    <div>
                      <span className="pill">{update.label}</span>
                      <h3>{update.title}</h3>
                      <p>{update.description}</p>
                    </div>
                  </div>
                ))}
              </section>
              <div className="privacy-note">
                <Bookmark size={19} />
                <div>
                  <strong>关于本地数据</strong>
                  <p>
                    收藏和主题偏好仅保存在你的浏览器中。本站没有用户登录、付费或邮件订阅功能。访问独立项目时，请参考对应项目的服务与隐私说明。
                  </p>
                </div>
              </div>
            </>
          )}
        </main>
        <footer className="footer">
          <span>
            <span className="footer-logo">✳</span>Blessing Hub
            <span className="footer-tagline">创造、学习，与更多可能相遇。</span>
          </span>
          <div>
            <a href="/about">关于本站</a>
            <button onClick={() => setRssOpen(true)}>
              <Rss size={13} />
              RSS 订阅
            </button>
            <span>
              保持好奇，持续生长
              <ArrowUpRight size={13} />
            </span>
          </div>
        </footer>
      </div>

      {searchOpen && <SearchModal onClose={() => setSearchOpen(false)} />}
      {detail && (
        <Modal onClose={() => setDetail(null)} label={`${detail.name} 项目详情`}>
          <div className="detail-top">
            <span className="project-icon">
              <Terminal size={28} />
            </span>
            <button className="icon-button" aria-label="关闭详情" onClick={() => setDetail(null)}>
              <X size={21} />
            </button>
          </div>
          <span className="eyebrow orange-text">{detail.eyebrow}</span>
          <h2 className="detail-title">
            {detail.name}
            <span className="status-dot">已上线</span>
          </h2>
          <p className="detail-description">{detail.detail}</p>
          <div className="tags">
            {detail.tags.map((tag) => (
              <span key={tag}>{tag}</span>
            ))}
          </div>
          <div className="detail-url">
            <ExternalLink size={16} />
            {detail.url.replace('https://', '')}
          </div>
          <div className="modal-actions">
            <a
              className="button button-orange"
              href={detail.url}
              target="_blank"
              rel="noopener noreferrer"
            >
              访问项目
              <ArrowUpRight size={17} />
            </a>
            <button className="button button-outline" onClick={() => toggleFavorite(detail.id)}>
              <Bookmark size={16} fill={favorites.includes(detail.id) ? 'currentColor' : 'none'} />
              {favorites.includes(detail.id) ? '已收藏' : '收藏项目'}
            </button>
          </div>
        </Modal>
      )}
      {rssOpen && (
        <Modal onClose={() => setRssOpen(false)} label="订阅 Blessing Hub 更新">
          <div className="detail-top">
            <span className="quick-icon orange-bg">
              <Rss size={25} />
            </span>
            <button
              className="icon-button"
              aria-label="关闭订阅说明"
              onClick={() => setRssOpen(false)}
            >
              <X size={21} />
            </button>
          </div>
          <span className="eyebrow orange-text">GOOD THINGS, ON YOUR TERMS</span>
          <h2 className="detail-title">把小站更新，带到你的阅读器。</h2>
          <p className="detail-description">
            复制下方地址，添加到你常用的 RSS
            阅读器。新项目与新内容会通过这个订阅源发布，无需留下邮箱。
          </p>
          <div className="rss-address">
            <input
              aria-label="RSS 订阅地址"
              value={`${content.site.url}/feed.xml`}
              readOnly
              onFocus={(event) => event.target.select()}
            />
            <button className="icon-button" aria-label="复制 RSS 地址" onClick={copyRss}>
              <Copy size={17} />
            </button>
          </div>
          <div className="modal-actions">
            <button className="button button-orange" onClick={copyRss}>
              复制订阅地址
              <Copy size={16} />
            </button>
            <a
              className="button button-outline"
              href="/feed.xml"
              target="_blank"
              rel="noopener noreferrer"
            >
              打开 RSS
              <ArrowUpRight size={16} />
            </a>
          </div>
        </Modal>
      )}
      {toast && (
        <div className="toast" role="status">
          <Check size={17} />
          {toast}
        </div>
      )}
    </div>
  )
}

type SearchResult = {
  title: string
  description: string
  label: string
  href: string
  icon: LucideIcon
}
function SearchModal({ onClose }: { onClose: () => void }) {
  const [query, setQuery] = useState('')
  const [activeIndex, setActiveIndex] = useState(0)
  const allResults = useMemo<SearchResult[]>(
    () => [
      ...content.projects.map((project) => ({
        title: project.name,
        description: `${project.description} ${project.tags.join(' ')}`,
        label: '项目',
        href: '/projects',
        icon: Terminal,
      })),
      ...content.resources.map((resource) => ({
        title: resource.title,
        description: resource.description,
        label: resource.category,
        href: `/resources/${resource.id}`,
        icon: FileText,
      })),
      ...content.plans.map((plan) => ({
        title: plan.title,
        description: plan.description,
        label: '筹备中',
        href: '/courses',
        icon: GraduationCap,
      })),
    ],
    [],
  )
  const results = allResults.filter((result) =>
    `${result.title} ${result.description} ${result.label}`
      .toLowerCase()
      .includes(query.trim().toLowerCase()),
  )
  const safeIndex = Math.min(activeIndex, Math.max(0, results.length - 1))
  const resultRefs = useRef<(HTMLAnchorElement | null)[]>([])
  useEffect(() => {
    resultRefs.current[safeIndex]?.scrollIntoView({ block: 'nearest' })
  }, [safeIndex])
  return (
    <Modal onClose={onClose} label="全站搜索" className="search-modal">
      <div className="search-input-row">
        <Search size={22} />
        <input
          autoFocus
          aria-label="搜索全站"
          placeholder="搜索项目、资料、学习方向…"
          value={query}
          onChange={(event) => {
            setQuery(event.target.value)
            setActiveIndex(0)
          }}
          onKeyDown={(event) => {
            if (event.key === 'ArrowDown') {
              event.preventDefault()
              setActiveIndex((current) => (current + 1) % Math.max(results.length, 1))
            }
            if (event.key === 'ArrowUp') {
              event.preventDefault()
              setActiveIndex(
                (current) => (current - 1 + results.length) % Math.max(results.length, 1),
              )
            }
            if (event.key === 'Enter' && results[safeIndex]) {
              event.preventDefault()
              window.location.assign(results[safeIndex].href)
              onClose()
            }
          }}
        />
        <button className="icon-button" onClick={onClose} aria-label="关闭搜索">
          <X size={20} />
        </button>
      </div>
      <div className="search-results">
        <span className="search-results-label">
          {query ? `${results.length} 个搜索结果` : '从这里开始探索'}
        </span>
        {results.map((result, index) => (
          <a
            ref={(element) => {
              resultRefs.current[index] = element
            }}
            className={index === safeIndex ? 'search-result active' : 'search-result'}
            key={result.title}
            href={result.href}
            onClick={onClose}
            onMouseEnter={() => setActiveIndex(index)}
          >
            <span className="search-result-icon">
              <result.icon size={20} />
            </span>
            <span>
              <strong>{result.title}</strong>
              <small>{result.label}</small>
            </span>
            <ArrowUpRight size={17} />
          </a>
        ))}
        {!results.length && (
          <div className="search-empty">
            <Search size={28} />
            <h3>没有找到相关内容</h3>
            <p>试试「AI」「指南」或「学习」。</p>
          </div>
        )}
      </div>
      <div className="search-footer">
        <span>
          <kbd>↑</kbd>
          <kbd>↓</kbd>选择<kbd>↵</kbd>打开
        </span>
        <span>
          <kbd>esc</kbd>关闭
          <Command size={12} />K 随时搜索
        </span>
      </div>
    </Modal>
  )
}

if (typeof document !== 'undefined') {
  createRoot(document.getElementById('root')!).render(
    <React.StrictMode>
      <App />
    </React.StrictMode>,
  )
}
