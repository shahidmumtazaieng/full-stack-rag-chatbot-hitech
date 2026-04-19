import type { NextPage } from 'next'
import dynamic from 'next/dynamic'
import Head from 'next/head'
import { useEffect, useState } from 'react'

const ChatWidget = dynamic(() => import('../components/ChatWidget'), {
  ssr: false,
  loading: () => null,
})

const Home: NextPage = () => {
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40)
    window.addEventListener('scroll', onScroll)
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <>
      <Head>
        <title>Hitech Steel Industries — Built for Tomorrow</title>
        <meta name="description" content="Premium structural steel, engineered to exacting standards. AI-powered support available 24/7." />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link href="https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=DM+Sans:wght@300;400;500&display=swap" rel="stylesheet" />
      </Head>

      <style>{`
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

        :root {
          --red: #E30613;
          --red-dark: #A8040E;
          --navy: #003087;
          --gold: #C8930A;
          --bg: #0E0F11;
          --bg2: #141618;
          --surface: #1C1E22;
          --border: rgba(255,255,255,0.07);
          --text: #F0F1F3;
          --muted: #8A8F9A;
          --font-display: 'Syne', sans-serif;
          --font-body: 'DM Sans', sans-serif;
        }

        html { scroll-behavior: smooth; }

        body {
          background: var(--bg);
          color: var(--text);
          font-family: var(--font-body);
          -webkit-font-smoothing: antialiased;
          overflow-x: hidden;
        }

        /* ── NAV ── */
        nav {
          position: fixed;
          top: 0; left: 0; right: 0;
          z-index: 9000;
          padding: 0 48px;
          height: 72px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          transition: background 0.3s, border-color 0.3s;
        }
        nav.scrolled {
          background: rgba(14,15,17,0.92);
          backdrop-filter: blur(16px);
          border-bottom: 1px solid var(--border);
        }
        .nav-logo {
          display: flex;
          align-items: center;
          gap: 10px;
          font-family: var(--font-display);
          font-size: 18px;
          font-weight: 700;
          letter-spacing: -0.02em;
          text-decoration: none;
          color: var(--text);
        }
        .nav-logo .dot { color: var(--red); }
        .nav-logo-icon {
          width: 32px; height: 32px;
          background: linear-gradient(135deg, var(--red), var(--red-dark));
          border-radius: 8px;
          display: flex; align-items: center; justify-content: center;
        }
        .nav-links {
          display: flex;
          gap: 36px;
          list-style: none;
        }
        .nav-links a {
          font-size: 13px;
          font-weight: 500;
          color: var(--muted);
          text-decoration: none;
          letter-spacing: 0.04em;
          text-transform: uppercase;
          transition: color 0.2s;
        }
        .nav-links a:hover { color: var(--text); }
        .nav-cta {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 10px 20px;
          background: var(--red);
          color: white;
          border: none;
          border-radius: 8px;
          font-size: 13px;
          font-weight: 600;
          font-family: var(--font-body);
          cursor: pointer;
          text-decoration: none;
          transition: background 0.2s, transform 0.2s;
        }
        .nav-cta:hover { background: var(--red-dark); transform: translateY(-1px); }

        /* ── HERO ── */
        .hero {
          min-height: 100vh;
          display: flex;
          flex-direction: column;
          justify-content: center;
          padding: 120px 48px 80px;
          position: relative;
          overflow: hidden;
        }
        .hero::before {
          content: '';
          position: absolute;
          inset: 0;
          background:
            radial-gradient(ellipse 800px 600px at 70% 50%, rgba(227,6,19,0.06) 0%, transparent 70%),
            radial-gradient(ellipse 600px 400px at 20% 80%, rgba(0,48,135,0.08) 0%, transparent 60%);
          pointer-events: none;
        }
        .hero-grid-bg {
          position: absolute;
          inset: 0;
          background-image:
            linear-gradient(rgba(255,255,255,0.025) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,0.025) 1px, transparent 1px);
          background-size: 60px 60px;
          mask-image: radial-gradient(ellipse 80% 60% at 60% 50%, black, transparent);
          pointer-events: none;
        }

        .hero-eyebrow {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          background: rgba(227,6,19,0.1);
          border: 1px solid rgba(227,6,19,0.2);
          color: #F87171;
          font-size: 11px;
          font-weight: 600;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          padding: 6px 14px;
          border-radius: 99px;
          margin-bottom: 32px;
          width: fit-content;
          animation: fadeUp 0.6s ease both;
        }
        .hero-eyebrow .pulse {
          width: 6px; height: 6px;
          background: var(--red);
          border-radius: 50%;
          animation: pulseRed 1.8s ease-in-out infinite;
        }
        @keyframes pulseRed {
          0%,100% { opacity: 1; transform: scale(1); }
          50%      { opacity: 0.4; transform: scale(0.7); }
        }

        .hero-title {
          font-family: var(--font-display);
          font-size: clamp(52px, 7vw, 96px);
          font-weight: 800;
          line-height: 1.0;
          letter-spacing: -0.04em;
          max-width: 820px;
          animation: fadeUp 0.7s 0.1s ease both;
        }
        .hero-title .accent {
          background: linear-gradient(135deg, var(--red) 0%, #FF4455 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }
        .hero-title .rule {
          display: block;
          color: var(--muted);
          font-weight: 400;
        }

        .hero-sub {
          font-size: 18px;
          font-weight: 300;
          color: var(--muted);
          max-width: 520px;
          line-height: 1.7;
          margin-top: 28px;
          animation: fadeUp 0.7s 0.2s ease both;
        }

        .hero-actions {
          display: flex;
          gap: 16px;
          margin-top: 44px;
          flex-wrap: wrap;
          animation: fadeUp 0.7s 0.3s ease both;
        }
        .btn-primary {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 15px 28px;
          background: var(--red);
          color: white;
          border: none;
          border-radius: 10px;
          font-size: 15px;
          font-weight: 600;
          font-family: var(--font-body);
          cursor: pointer;
          text-decoration: none;
          transition: all 0.2s;
          box-shadow: 0 8px 24px rgba(227,6,19,0.35);
        }
        .btn-primary:hover { background: var(--red-dark); transform: translateY(-2px); box-shadow: 0 12px 32px rgba(227,6,19,0.45); }
        .btn-secondary {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 15px 28px;
          background: transparent;
          color: var(--text);
          border: 1px solid var(--border);
          border-radius: 10px;
          font-size: 15px;
          font-weight: 500;
          font-family: var(--font-body);
          cursor: pointer;
          text-decoration: none;
          transition: all 0.2s;
        }
        .btn-secondary:hover { border-color: rgba(255,255,255,0.2); background: rgba(255,255,255,0.04); }

        .hero-stats {
          display: flex;
          gap: 48px;
          margin-top: 72px;
          padding-top: 48px;
          border-top: 1px solid var(--border);
          animation: fadeUp 0.7s 0.4s ease both;
        }
        .stat-item {}
        .stat-num {
          font-family: var(--font-display);
          font-size: 36px;
          font-weight: 800;
          letter-spacing: -0.03em;
          background: linear-gradient(135deg, var(--text), var(--muted));
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }
        .stat-num span { color: var(--red); -webkit-text-fill-color: var(--red); }
        .stat-label {
          font-size: 13px;
          color: var(--muted);
          margin-top: 4px;
          letter-spacing: 0.02em;
        }

        /* ── PRODUCTS SECTION ── */
        section {
          padding: 100px 48px;
        }
        .section-label {
          font-size: 11px;
          font-weight: 700;
          letter-spacing: 0.14em;
          text-transform: uppercase;
          color: var(--red);
          margin-bottom: 12px;
        }
        .section-title {
          font-family: var(--font-display);
          font-size: clamp(32px, 4vw, 52px);
          font-weight: 800;
          letter-spacing: -0.03em;
          line-height: 1.1;
          margin-bottom: 16px;
        }
        .section-sub {
          font-size: 16px;
          color: var(--muted);
          max-width: 540px;
          line-height: 1.7;
          font-weight: 300;
        }

        .products-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
          gap: 2px;
          margin-top: 56px;
          border: 1px solid var(--border);
          border-radius: 16px;
          overflow: hidden;
        }
        .product-card {
          padding: 36px 32px;
          background: var(--surface);
          border: 1px solid var(--border);
          margin: -1px;
          transition: background 0.2s;
          position: relative;
          overflow: hidden;
        }
        .product-card::after {
          content: '';
          position: absolute;
          bottom: 0; left: 0; right: 0;
          height: 2px;
          background: linear-gradient(90deg, var(--red), transparent);
          opacity: 0;
          transition: opacity 0.3s;
        }
        .product-card:hover { background: #222428; }
        .product-card:hover::after { opacity: 1; }
        .product-icon {
          width: 48px; height: 48px;
          background: rgba(227,6,19,0.1);
          border-radius: 12px;
          display: flex; align-items: center; justify-content: center;
          margin-bottom: 20px;
        }
        .product-icon svg { width: 22px; height: 22px; color: var(--red); stroke: var(--red); }
        .product-card h3 {
          font-family: var(--font-display);
          font-size: 18px;
          font-weight: 700;
          margin-bottom: 10px;
          letter-spacing: -0.02em;
        }
        .product-card p {
          font-size: 14px;
          color: var(--muted);
          line-height: 1.65;
          font-weight: 300;
        }
        .product-tag {
          display: inline-block;
          margin-top: 16px;
          font-size: 11px;
          font-weight: 600;
          color: var(--red);
          background: rgba(227,6,19,0.1);
          padding: 4px 10px;
          border-radius: 99px;
          letter-spacing: 0.04em;
        }

        /* ── AI BANNER ── */
        .ai-banner {
          background: var(--surface);
          border: 1px solid var(--border);
          border-radius: 20px;
          padding: 56px 64px;
          display: flex;
          align-items: center;
          gap: 48px;
          position: relative;
          overflow: hidden;
        }
        .ai-banner::before {
          content: '';
          position: absolute;
          top: -80px; right: -80px;
          width: 300px; height: 300px;
          border-radius: 50%;
          background: radial-gradient(circle, rgba(227,6,19,0.12), transparent 70%);
          pointer-events: none;
        }
        .ai-banner-icon {
          width: 72px; height: 72px;
          background: linear-gradient(135deg, var(--red), var(--red-dark));
          border-radius: 18px;
          display: flex; align-items: center; justify-content: center;
          flex-shrink: 0;
          box-shadow: 0 12px 32px rgba(227,6,19,0.3);
        }
        .ai-banner-icon svg { width: 32px; height: 32px; stroke: white; }
        .ai-banner-text { flex: 1; }
        .ai-banner-text h3 {
          font-family: var(--font-display);
          font-size: 26px;
          font-weight: 700;
          letter-spacing: -0.02em;
          margin-bottom: 10px;
        }
        .ai-banner-text p {
          font-size: 15px;
          color: var(--muted);
          line-height: 1.65;
          font-weight: 300;
        }
        .ai-badge {
          display: flex;
          align-items: center;
          gap: 6px;
          background: rgba(74,222,128,0.1);
          border: 1px solid rgba(74,222,128,0.2);
          color: #4ADE80;
          font-size: 12px;
          font-weight: 600;
          padding: 8px 16px;
          border-radius: 99px;
          white-space: nowrap;
          flex-shrink: 0;
        }
        .ai-badge .dot-live {
          width: 8px; height: 8px;
          background: #4ADE80;
          border-radius: 50%;
          animation: pulseGreen 1.5s ease-in-out infinite;
        }
        @keyframes pulseGreen {
          0%,100% { opacity: 1; } 50% { opacity: 0.3; }
        }

        /* ── FOOTER ── */
        footer {
          padding: 40px 48px;
          border-top: 1px solid var(--border);
          display: flex;
          align-items: center;
          justify-content: space-between;
          flex-wrap: wrap;
          gap: 16px;
        }
        footer p { font-size: 13px; color: var(--muted); }
        footer a { color: var(--red); text-decoration: none; }

        /* ── ANIMATIONS ── */
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(24px); }
          to   { opacity: 1; transform: translateY(0); }
        }

        @media (max-width: 768px) {
          nav { padding: 0 24px; }
          .nav-links { display: none; }
          .hero { padding: 100px 24px 60px; }
          .hero-stats { gap: 28px; flex-wrap: wrap; }
          section { padding: 72px 24px; }
          .ai-banner { padding: 36px 28px; flex-direction: column; align-items: flex-start; gap: 24px; }
          footer { padding: 28px 24px; }
        }
      `}</style>

      {/* NAV */}
      <nav className={scrolled ? 'scrolled' : ''}>
        <a href="#" className="nav-logo">
          <div className="nav-logo-icon">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 2L2 7l10 5 10-5-10-5z"/>
              <path d="M2 17l10 5 10-5"/>
              <path d="M2 12l10 5 10-5"/>
            </svg>
          </div>
          HITECH<span className="dot">.</span>STEEL
        </a>
        <ul className="nav-links">
          <li><a href="#products">Products</a></li>
          <li><a href="#about">About</a></li>
          <li><a href="#services">Services</a></li>
          <li><a href="#contact">Contact</a></li>
        </ul>
        <a href="#contact" className="nav-cta">
          Request Quote
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M5 12h14M12 5l7 7-7 7"/>
          </svg>
        </a>
      </nav>

      {/* HERO */}
      <div className="hero">
        <div className="hero-grid-bg" />
        <div className="hero-eyebrow">
          <span className="pulse" />
          Now with AI-Powered Support
        </div>
        <h1 className="hero-title">
          Steel Built for<br />
          <span className="accent">Tomorrow's</span>
          <span className="rule">World.</span>
        </h1>
        <p className="hero-sub">
          Premium structural steel, engineered to exacting standards.
          Delivering strength, precision, and reliability to projects across the region.
        </p>
        <div className="hero-actions">
          <a href="#products" className="btn-primary">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 2L2 7l10 5 10-5-10-5z"/>
              <path d="M2 17l10 5 10-5"/>
              <path d="M2 12l10 5 10-5"/>
            </svg>
            Explore Products
          </a>
          <a href="#contact" className="btn-secondary">
            Get in Touch
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M5 12h14M12 5l7 7-7 7"/>
            </svg>
          </a>
        </div>
        <div className="hero-stats">
          <div className="stat-item">
            <div className="stat-num">40<span>+</span></div>
            <div className="stat-label">Years in Business</div>
          </div>
          <div className="stat-item">
            <div className="stat-num">500<span>+</span></div>
            <div className="stat-label">Products Available</div>
          </div>
          <div className="stat-item">
            <div className="stat-num">2K<span>+</span></div>
            <div className="stat-label">Happy Clients</div>
          </div>
          <div className="stat-item">
            <div className="stat-num">24<span>/7</span></div>
            <div className="stat-label">AI Support</div>
          </div>
        </div>
      </div>

      {/* PRODUCTS */}
      <section id="products">
        <div className="section-label">Our Products</div>
        <h2 className="section-title">Industrial-Grade<br />Steel Solutions</h2>
        <p className="section-sub">
          From structural beams to precision tubing — our comprehensive range meets the demands
          of construction, manufacturing, and infrastructure.
        </p>
        <div className="products-grid">
          {[
            {
              icon: <><rect x="2" y="3" width="20" height="14" rx="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></>,
              name: 'Structural Beams',
              desc: 'I-beams, H-beams, and channel sections for heavy-load structural applications.',
              tag: 'In Stock',
            },
            {
              icon: <><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="3"/></>,
              name: 'Steel Pipes & Tubes',
              desc: 'Seamless and welded tubes in circular, square, and rectangular profiles.',
              tag: 'Custom Sizes',
            },
            {
              icon: <><path d="M2 20h20M4 20V10L12 4l8 6v10"/></>,
              name: 'Flat Sheets & Plates',
              desc: 'Hot and cold-rolled steel sheets for fabrication and construction use.',
              tag: 'Multiple Grades',
            },
            {
              icon: <><line x1="12" y1="2" x2="12" y2="22"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></>,
              name: 'Reinforcement Bar',
              desc: 'High-strength deformed bars for concrete reinforcement in civil projects.',
              tag: 'Grade 60 / 75',
            },
          ].map((p, i) => (
            <div className="product-card" key={i}>
              <div className="product-icon">
                <svg viewBox="0 0 24 24" fill="none" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  {p.icon}
                </svg>
              </div>
              <h3>{p.name}</h3>
              <p>{p.desc}</p>
              <span className="product-tag">{p.tag}</span>
            </div>
          ))}
        </div>
      </section>

      {/* AI CHAT BANNER */}
      <section id="contact" style={{ paddingTop: 0 }}>
        <div className="ai-banner">
          <div className="ai-banner-icon">
            <svg viewBox="0 0 24 24" fill="none" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
            </svg>
          </div>
          <div className="ai-banner-text">
            <h3>Talk to Our AI Assistant — Right Now</h3>
            <p>
              Click the red button in the bottom-right corner to instantly connect with our AI assistant.
              Get product info, pricing quotes, and technical support — available 24/7, no waiting.
            </p>
          </div>
          <div className="ai-badge">
            <span className="dot-live" />
            Online Now
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer>
        <p>© 2025 Hitech Steel Industries. All rights reserved.</p>
        <p><a href="#">Privacy Policy</a> · <a href="#">Terms of Service</a></p>
      </footer>

      {/* CHAT WIDGET */}
      <ChatWidget
        apiUrl="https://hitechsa.netlify.app/"
        primaryColor="#E30613"
        secondaryColor="#003087"
        position="bottom-right"
      />
    </>
  )
}

export default Home
