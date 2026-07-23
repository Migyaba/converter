/** Public marketing landing — cinematic sales funnel for Convert. */

import { PLANS } from '../plans.js';

export function landingPage({ user = null } = {}) {
  const free = PLANS.free;
  const standard = PLANS.standard;
  const pro = PLANS.pro;
  const primaryHref = user ? '/app' : '/register';
  const primaryLabel = user ? 'Ouvrir l’espace' : 'Commencer gratuitement';
  const secondaryHref = user ? '/app' : '/login';
  const secondaryLabel = user ? 'Tableau de bord' : 'Se connecter';

  const nav = user
    ? `<nav class="lnav" aria-label="Compte">
         <a href="/app">Espace</a>
         ${user.role === 'admin' ? '<a href="/admin">Admin</a>' : ''}
         <form method="post" action="/logout"><button type="submit" class="linkish">Déconnexion</button></form>
       </nav>`
    : `<nav class="lnav" aria-label="Navigation">
         <a href="#preuve">Preuve</a>
         <a href="#tarifs">Tarifs</a>
         <a href="/login">Connexion</a>
         <a class="cta-nav" href="/register">Essayer</a>
       </nav>`;

  return `<!doctype html>
<html lang="fr">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>Convert. — HTML vers Elementor</title>
<meta name="description" content="Transformez vos pages HTML en modèles Elementor importables. Styles, containers et images inclus." />
<link rel="preconnect" href="https://fonts.googleapis.com" />
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
<link href="https://fonts.googleapis.com/css2?family=Syne:wght@600;700;800&family=Instrument+Serif:ital@0;1&family=IBM+Plex+Sans:wght@400;500;600&display=swap" rel="stylesheet" />
<style>
  :root {
    --ink: #0b1219;
    --ink-2: #1c2834;
    --soft: #44505c;
    --muted: #6b7785;
    --line: #d9e0e8;
    --line-soft: rgba(255,255,255,.1);
    --paper: #eef2f6;
    --paper-2: #e4eaf1;
    --white: #ffffff;
    --accent: #0f5f8a;
    --accent-deep: #0a4463;
    --cyan: #3db8e8;
    --cyan-dim: rgba(61,184,232,.16);
    --hero-0: #071018;
    --hero-1: #0d2a3d;
    --hero-2: #12425f;
    --font-brand: "Syne", sans-serif;
    --font-display: "Instrument Serif", Georgia, serif;
    --font-ui: "IBM Plex Sans", sans-serif;
    --ease: cubic-bezier(.22, 1, .36, 1);
  }

  *, *::before, *::after { box-sizing: border-box; }
  html { scroll-behavior: smooth; }
  body {
    margin: 0;
    font-family: var(--font-ui);
    color: var(--ink);
    background: var(--paper);
    line-height: 1.5;
    -webkit-font-smoothing: antialiased;
    text-rendering: optimizeLegibility;
  }
  a { color: inherit; text-decoration: none; }
  button { font: inherit; }
  .wrap { width: min(1180px, calc(100% - 48px)); margin-inline: auto; }

  .btn {
    appearance: none;
    border: 1px solid transparent;
    border-radius: 5px;
    padding: 14px 22px;
    font-family: var(--font-brand);
    font-weight: 700;
    font-size: 14px;
    letter-spacing: -0.015em;
    cursor: pointer;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    transition: transform .2s var(--ease), background .2s ease, border-color .2s ease, color .2s ease;
  }
  .btn:hover { transform: translateY(-2px); }
  .btn:active { transform: none; }
  .btn-light { background: var(--white); color: var(--ink); }
  .btn-light:hover { background: #f2f7fb; }
  .btn-ghost {
    background: transparent;
    color: rgba(255,255,255,.9);
    border-color: rgba(255,255,255,.28);
  }
  .btn-ghost:hover { border-color: rgba(255,255,255,.65); background: rgba(255,255,255,.05); }
  .btn-accent { background: var(--accent); color: #fff; }
  .btn-accent:hover { background: var(--accent-deep); }
  .btn-outline {
    background: transparent;
    color: var(--ink);
    border-color: var(--line);
  }
  .btn-outline:hover { border-color: var(--accent); color: var(--accent); }
  .btn .chev { transition: transform .2s var(--ease); }
  .btn:hover .chev { transform: translateX(3px); }

  /* ========== HERO ========== */
  .hero {
    position: relative;
    min-height: 100vh;
    min-height: 100dvh;
    display: grid;
    grid-template-rows: auto 1fr;
    color: #f4f8fb;
    overflow: hidden;
    background:
      radial-gradient(1200px 700px at 78% 18%, rgba(61,184,232,.18), transparent 55%),
      radial-gradient(900px 600px at 8% 100%, rgba(15,95,138,.35), transparent 50%),
      linear-gradient(145deg, var(--hero-0) 0%, var(--hero-1) 48%, var(--hero-2) 100%);
  }
  .hero::before {
    content: "";
    position: absolute;
    inset: 0;
    background-image:
      linear-gradient(rgba(255,255,255,.03) 1px, transparent 1px),
      linear-gradient(90deg, rgba(255,255,255,.03) 1px, transparent 1px);
    background-size: 64px 64px;
    mask-image: radial-gradient(ellipse 80% 70% at 70% 40%, #000 20%, transparent 75%);
    pointer-events: none;
  }

  .top {
    position: relative;
    z-index: 5;
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 22px 0 0;
  }
  .logo {
    font-family: var(--font-brand);
    font-weight: 800;
    font-size: 18px;
    letter-spacing: -0.04em;
    color: rgba(244,248,251,.75);
  }
  .logo span { color: var(--cyan); }
  .lnav {
    display: flex;
    align-items: center;
    gap: 22px;
    font-size: 13px;
    font-weight: 500;
  }
  .lnav a { color: rgba(244,248,251,.72); }
  .lnav a:hover { color: #fff; }
  .cta-nav {
    color: var(--ink) !important;
    background: var(--white);
    padding: 8px 14px;
    border-radius: 5px;
    font-weight: 600;
  }
  .cta-nav:hover { background: #eef6fb !important; color: var(--ink) !important; }
  .linkish {
    border: 0; background: none; padding: 0; cursor: pointer;
    color: rgba(244,248,251,.72);
  }
  .linkish:hover { color: #fff; }

  .hero-body {
    position: relative;
    z-index: 2;
    display: grid;
    grid-template-columns: minmax(280px, 0.88fr) minmax(300px, 1.12fr);
    gap: clamp(36px, 5vw, 72px);
    align-items: center;
    padding: 40px 0 56px;
  }

  .hero-copy {
    position: relative;
    z-index: 4;
    isolation: isolate;
    min-width: 0;
    width: max-content;
    max-width: 100%;
  }

  .brand {
    font-family: var(--font-brand);
    font-weight: 800;
    font-size: clamp(52px, 7.5vw, 88px);
    letter-spacing: -0.055em;
    line-height: .9;
    margin: 0 0 22px;
    white-space: nowrap;
    animation: rise .7s var(--ease) both;
  }
  .brand span { color: var(--cyan); }
  .hero h1 {
    font-family: var(--font-display);
    font-weight: 400;
    font-size: clamp(26px, 3vw, 36px);
    line-height: 1.18;
    letter-spacing: -0.02em;
    margin: 0 0 14px;
    max-width: none;
    animation: rise .7s var(--ease) .07s both;
  }
  .hero-lead {
    margin: 0 0 28px;
    font-size: 16px;
    color: rgba(244,248,251,.68);
    max-width: none;
    animation: rise .7s var(--ease) .12s both;
  }
  .hero-cta {
    display: flex;
    flex-wrap: wrap;
    gap: 12px;
    animation: rise .7s var(--ease) .18s both;
  }

  /* Product stage — fully contained, never overlaps copy */
  .stage {
    position: relative;
    z-index: 1;
    min-width: 0;
    height: min(520px, 68vh);
    padding: 8px;
    overflow: hidden;
    animation: rise .85s var(--ease) .15s both;
  }
  .stage-glow {
    position: absolute;
    inset: 8% 0 0 20%;
    background: radial-gradient(circle at 60% 40%, rgba(61,184,232,.22), transparent 62%);
    pointer-events: none;
  }
  .stage-inner {
    position: relative;
    height: 100%;
    display: grid;
    grid-template-columns: 0.92fr 1.2fr;
    gap: 14px;
    align-items: center;
  }
  .panel {
    position: relative;
    border-radius: 10px;
    overflow: hidden;
    border: 1px solid rgba(255,255,255,.14);
    background: rgba(8,18,28,.82);
    min-width: 0;
  }
  .panel-chrome {
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 10px 12px;
    border-bottom: 1px solid rgba(255,255,255,.08);
    background: rgba(255,255,255,.03);
  }
  .dot { width: 7px; height: 7px; border-radius: 50%; background: rgba(255,255,255,.22); flex-shrink: 0; }
  .panel-title {
    margin-left: 8px;
    font-size: 11px;
    color: rgba(255,255,255,.45);
    font-weight: 500;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  .panel-html {
    align-self: center;
    animation: floatY 8s ease-in-out infinite;
  }
  .panel-html pre {
    margin: 0;
    padding: 14px 14px 16px;
    font-family: ui-monospace, "SF Mono", Menlo, Consolas, monospace;
    font-size: clamp(10px, 1.1vw, 12px);
    line-height: 1.65;
    color: #9eb4c4;
    white-space: pre;
    overflow: hidden;
  }
  .panel-html .t { color: var(--cyan); }
  .panel-html .a { color: #7d93a5; }
  .panel-html .s { color: #e8c27a; }

  .panel-out {
    height: 100%;
    max-height: 100%;
    background: #f5f8fb;
    color: var(--ink);
    border-color: rgba(255,255,255,.4);
    display: flex;
    flex-direction: column;
    animation: floatY 9s ease-in-out .4s infinite reverse;
  }
  .panel-out .panel-chrome {
    background: #e8eef4;
    border-bottom-color: var(--line);
  }
  .panel-out .dot { background: #b8c4d0; }
  .panel-out .panel-title { color: var(--muted); }
  .out-body { padding: 12px; flex: 1; display: flex; flex-direction: column; gap: 8px; min-height: 0; }
  .out-nav {
    display: flex;
    gap: 8px;
    font-size: 10px;
    font-weight: 600;
    color: var(--muted);
    text-transform: uppercase;
    letter-spacing: .06em;
  }
  .out-nav span:first-child { color: var(--accent); }
  .out-hero {
    flex: 1;
    min-height: 100px;
    border-radius: 6px;
    background: linear-gradient(135deg, #0d2a3d 0%, #1a5578 55%, #2a7aa3 100%);
    padding: 16px;
    color: #fff;
    display: flex;
    flex-direction: column;
    justify-content: flex-end;
    gap: 4px;
  }
  .out-hero strong {
    font-family: var(--font-brand);
    font-size: 17px;
    letter-spacing: -0.03em;
  }
  .out-hero small { opacity: .7; font-size: 11px; }
  .out-grid {
    display: grid;
    grid-template-columns: 1.2fr .8fr;
    gap: 8px;
  }
  .out-card {
    background: #fff;
    border: 1px solid var(--line);
    border-radius: 6px;
    padding: 10px;
  }
  .out-card .lbl {
    font-size: 10px;
    font-weight: 600;
    color: var(--accent);
    text-transform: uppercase;
    letter-spacing: .05em;
    margin-bottom: 6px;
  }
  .out-card .line {
    height: 7px;
    border-radius: 3px;
    background: #e4eaf1;
    margin-bottom: 5px;
  }
  .out-card .line.w60 { width: 60%; }
  .out-card .line.w80 { width: 80%; }
  .out-btn {
    margin-top: 6px;
    display: inline-block;
    background: var(--accent);
    color: #fff;
    font-family: var(--font-brand);
    font-size: 11px;
    font-weight: 700;
    padding: 7px 10px;
    border-radius: 4px;
  }
  .out-meta {
    display: flex;
    justify-content: space-between;
    align-items: center;
    font-size: 10px;
    color: var(--muted);
  }
  .badge-ok {
    color: #1a7a52;
    background: #e4f5ec;
    padding: 3px 8px;
    border-radius: 4px;
    font-weight: 600;
  }

  .bridge {
    position: absolute;
    left: 50%;
    top: 50%;
    z-index: 3;
    width: 44px;
    height: 44px;
    margin: -22px 0 0 -22px;
    border-radius: 50%;
    background: var(--cyan);
    color: var(--hero-0);
    display: grid;
    place-items: center;
    font-family: var(--font-brand);
    font-weight: 800;
    font-size: 16px;
    border: 3px solid rgba(7,16,24,.55);
    animation: pulse 2.8s ease-in-out infinite;
  }

  @keyframes rise {
    from { opacity: 0; transform: translateY(22px); }
    to { opacity: 1; transform: none; }
  }
  @keyframes floatY {
    0%, 100% { transform: translateY(0); }
    50% { transform: translateY(-8px); }
  }
  @keyframes pulse {
    0%, 100% { transform: scale(1); }
    50% { transform: scale(1.05); }
  }

  /* ========== SECTIONS ========== */
  section { padding: 100px 0; position: relative; }
  .kicker {
    display: inline-flex;
    align-items: center;
    gap: 10px;
    font-family: var(--font-brand);
    font-size: 11px;
    font-weight: 700;
    letter-spacing: .16em;
    text-transform: uppercase;
    color: var(--accent);
    margin: 0 0 14px;
  }
  .kicker::before {
    content: "";
    width: 18px;
    height: 2px;
    background: var(--cyan);
  }
  .title {
    font-family: var(--font-brand);
    font-weight: 800;
    font-size: clamp(30px, 4.2vw, 48px);
    letter-spacing: -0.045em;
    line-height: 1.05;
    margin: 0 0 14px;
    max-width: 14ch;
  }
  .lead {
    margin: 0;
    font-size: 17px;
    color: var(--soft);
    max-width: 42ch;
  }

  /* Proof / before-after */
  .proof { background: var(--white); }
  .proof-frame {
    margin-top: 48px;
    display: grid;
    grid-template-columns: 1fr auto 1fr;
    gap: 0;
    align-items: stretch;
    border: 1px solid var(--line);
    border-radius: 12px;
    overflow: hidden;
    background: var(--paper);
  }
  .proof-side { padding: 28px; min-height: 280px; }
  .proof-side h3 {
    font-family: var(--font-brand);
    font-size: 13px;
    font-weight: 700;
    letter-spacing: .08em;
    text-transform: uppercase;
    margin: 0 0 18px;
    color: var(--muted);
  }
  .proof-before {
    background: #0b1620;
    color: #9eb4c4;
    font-family: ui-monospace, Menlo, Consolas, monospace;
    font-size: 12.5px;
    line-height: 1.7;
  }
  .proof-before h3 { color: var(--cyan); }
  .proof-before .t { color: var(--cyan); }
  .proof-mid {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 56px;
    background: var(--white);
    border-left: 1px solid var(--line);
    border-right: 1px solid var(--line);
    font-family: var(--font-brand);
    font-weight: 800;
    font-size: 20px;
    color: var(--accent);
  }
  .proof-after { background: var(--white); }
  .proof-ui .block {
    border: 1px solid var(--line);
    border-radius: 6px;
    padding: 12px 14px;
    margin-bottom: 10px;
  }
  .proof-ui .block.hero-b {
    background: linear-gradient(120deg, #0d2a3d, #1a5a80);
    color: #fff;
    border: 0;
    min-height: 88px;
    display: flex;
    flex-direction: column;
    justify-content: flex-end;
  }
  .proof-ui .block.hero-b strong {
    font-family: var(--font-brand);
    font-size: 16px;
    letter-spacing: -0.03em;
  }
  .proof-ui .row { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
  .proof-ui .chip {
    font-size: 11px;
    font-weight: 600;
    color: var(--accent);
    margin-bottom: 4px;
  }

  /* How */
  .how { background: var(--paper); }
  .steps {
    margin-top: 52px;
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 20px;
  }
  .step {
    padding: 28px 24px 32px;
    background: var(--white);
    border: 1px solid var(--line);
    border-radius: 10px;
    position: relative;
    overflow: hidden;
  }
  .step::after {
    content: "";
    position: absolute;
    left: 0; top: 0; bottom: 0;
    width: 3px;
    background: linear-gradient(180deg, var(--cyan), var(--accent));
    opacity: 0;
    transition: opacity .25s ease;
  }
  .step:hover::after { opacity: 1; }
  .step .n {
    font-family: var(--font-brand);
    font-weight: 800;
    font-size: 42px;
    letter-spacing: -0.06em;
    line-height: 1;
    color: transparent;
    -webkit-text-stroke: 1.5px rgba(15,95,138,.35);
    margin-bottom: 18px;
  }
  .step h3 {
    font-family: var(--font-brand);
    font-weight: 700;
    font-size: 20px;
    letter-spacing: -0.03em;
    margin: 0 0 8px;
  }
  .step p { margin: 0; color: var(--soft); font-size: 14.5px; max-width: 28ch; }

  /* Value */
  .value {
    background: var(--ink);
    color: #f4f8fb;
    overflow: hidden;
  }
  .value .kicker { color: var(--cyan); }
  .value .kicker::before { background: var(--cyan); }
  .value .lead { color: rgba(244,248,251,.62); }
  .value-head {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 40px;
    align-items: end;
    margin-bottom: 48px;
  }
  .value-list {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 0;
    border-top: 1px solid rgba(255,255,255,.12);
  }
  .value-item {
    padding: 28px 28px 28px 0;
    border-bottom: 1px solid rgba(255,255,255,.12);
  }
  .value-item:nth-child(odd) { padding-right: 36px; border-right: 1px solid rgba(255,255,255,.12); }
  .value-item:nth-child(even) { padding-left: 36px; }
  .value-item h3 {
    font-family: var(--font-brand);
    font-size: 18px;
    font-weight: 700;
    letter-spacing: -0.03em;
    margin: 0 0 8px;
  }
  .value-item p {
    margin: 0;
    color: rgba(244,248,251,.58);
    font-size: 14.5px;
    max-width: 36ch;
  }

  /* Pricing */
  .pricing { background: var(--paper-2); }
  .plans {
    margin-top: 40px;
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 16px;
    max-width: 980px;
  }
  .plan {
    background: var(--white);
    border: 1px solid var(--line);
    border-radius: 12px;
    padding: 32px 28px;
    display: flex;
    flex-direction: column;
  }
  .plan.featured {
    background: var(--ink);
    color: #f4f8fb;
    border-color: var(--ink);
    position: relative;
  }
  .plan.featured::before {
    content: "Recommandé";
    position: absolute;
    top: 18px;
    right: 18px;
    font-size: 10px;
    font-weight: 700;
    letter-spacing: .08em;
    text-transform: uppercase;
    color: var(--ink);
    background: var(--cyan);
    padding: 4px 8px;
    border-radius: 3px;
  }
  .plan h3 {
    font-family: var(--font-brand);
    font-size: 15px;
    font-weight: 700;
    letter-spacing: .04em;
    text-transform: uppercase;
    margin: 0;
    opacity: .7;
  }
  .plan .price {
    font-family: var(--font-brand);
    font-size: 48px;
    font-weight: 800;
    letter-spacing: -0.05em;
    margin: 14px 0 6px;
    line-height: 1;
  }
  .plan .price small {
    font-size: 14px;
    font-weight: 500;
    letter-spacing: 0;
    opacity: .55;
  }
  .plan ul {
    list-style: none;
    margin: 22px 0 28px;
    padding: 0;
    flex: 1;
  }
  .plan li {
    padding: 10px 0;
    border-top: 1px solid var(--line);
    font-size: 14px;
    color: var(--soft);
  }
  .plan.featured li {
    border-top-color: rgba(255,255,255,.12);
    color: rgba(244,248,251,.72);
  }
  .plan li:last-child { border-bottom: 1px solid var(--line); }
  .plan.featured li:last-child { border-bottom-color: rgba(255,255,255,.12); }
  .plan .btn { width: 100%; }
  .plan.featured .btn-light:hover { background: #fff; }
  .note { margin: 16px 0 0; font-size: 12px; color: var(--muted); max-width: 52ch; }

  /* Close */
  .close {
    background:
      radial-gradient(800px 400px at 50% 0%, rgba(61,184,232,.2), transparent 60%),
      linear-gradient(180deg, var(--hero-1), var(--hero-0));
    color: #f4f8fb;
    text-align: center;
    padding: 110px 0;
  }
  .close h2 {
    font-family: var(--font-brand);
    font-weight: 800;
    font-size: clamp(32px, 5vw, 56px);
    letter-spacing: -0.05em;
    margin: 0 auto 14px;
    max-width: 12ch;
    line-height: 1.05;
  }
  .close p {
    margin: 0 auto 32px;
    color: rgba(244,248,251,.65);
    max-width: 34ch;
    font-size: 17px;
  }
  .close .hero-cta { justify-content: center; }

  footer {
    padding: 22px 0;
    background: var(--hero-0);
    border-top: 1px solid rgba(255,255,255,.08);
    color: rgba(244,248,251,.45);
    font-size: 13px;
  }
  footer .wrap {
    display: flex;
    justify-content: space-between;
    gap: 12px;
    flex-wrap: wrap;
    align-items: center;
  }
  footer .logo { color: rgba(244,248,251,.8); }
  footer .logo span { color: var(--cyan); }
  footer .legal-links {
    display: flex;
    flex-wrap: wrap;
    gap: 14px 18px;
    align-items: center;
  }
  footer .legal-links a {
    color: rgba(244,248,251,.5);
    text-decoration: none;
    font-size: 13px;
  }
  footer .legal-links a:hover { color: rgba(244,248,251,.9); }

  .reveal {
    opacity: 0;
    transform: translateY(18px);
    transition: opacity .6s var(--ease), transform .6s var(--ease);
  }
  .reveal.in { opacity: 1; transform: none; }

  @media (max-width: 960px) {
    .hero-body { grid-template-columns: 1fr; padding: 28px 0 48px; }
    .stage { height: 380px; max-width: 560px; width: 100%; margin-inline: auto; }
    .lnav a:not(.cta-nav) { display: none; }
    .proof-frame { grid-template-columns: 1fr; }
    .proof-mid { width: auto; height: 48px; border: 0; border-top: 1px solid var(--line); border-bottom: 1px solid var(--line); }
    .steps, .value-list, .plans, .value-head { grid-template-columns: 1fr; }
    .value-item:nth-child(odd),
    .value-item:nth-child(even) {
      padding: 22px 0;
      border-right: 0;
    }
    section { padding: 72px 0; }
  }

  @media (max-width: 560px) {
    .wrap { width: min(100% - 28px, 1180px); }
    .brand { font-size: 48px; white-space: normal; }
    .stage-inner { grid-template-columns: 1fr; gap: 10px; }
    .bridge { display: none; }
    .panel-html { display: none; }
    .panel-out { height: 100%; }
  }

  @media (prefers-reduced-motion: reduce) {
    *, *::before, *::after { animation: none !important; transition: none !important; }
    .reveal { opacity: 1; transform: none; }
  }
</style>
</head>
<body>
  <header class="hero">
    <div class="wrap top">
      <a class="logo" href="/">Convert<span>.</span></a>
      ${nav}
    </div>

    <div class="wrap hero-body">
      <div class="hero-copy">
        <p class="brand">Convert<span>.</span></p>
        <h1>Vos pages HTML deviennent des modèles Elementor.</h1>
        <p class="hero-lead">Uploadez. Convertissez. Importez dans WordPress — structure, styles et images inclus.</p>
        <div class="hero-cta">
          <a class="btn btn-light" href="${primaryHref}">${primaryLabel} <span class="chev" aria-hidden="true">→</span></a>
          <a class="btn btn-ghost" href="${user ? '#preuve' : secondaryHref}">${user ? 'Voir la preuve' : secondaryLabel}</a>
        </div>
      </div>

      <div class="stage" aria-hidden="true">
        <div class="stage-glow"></div>
        <div class="stage-inner">
          <div class="panel panel-html">
            <div class="panel-chrome"><span class="dot"></span><span class="dot"></span><span class="dot"></span><span class="panel-title">index.html</span></div>
            <pre><span class="t">&lt;section</span> <span class="a">class=</span><span class="s">"hero"</span><span class="t">&gt;</span>
  <span class="t">&lt;h1&gt;</span>Maison Victor<span class="t">&lt;/h1&gt;</span>
  <span class="t">&lt;p&gt;</span>Écrins sur mesure<span class="t">&lt;/p&gt;</span>
  <span class="t">&lt;a</span> <span class="a">class=</span><span class="s">"btn"</span><span class="t">&gt;</span>Découvrir<span class="t">&lt;/a&gt;</span>
<span class="t">&lt;/section&gt;</span></pre>
          </div>
          <div class="bridge">→</div>
          <div class="panel panel-out">
            <div class="panel-chrome"><span class="dot"></span><span class="dot"></span><span class="dot"></span><span class="panel-title">page.elementor.json</span></div>
            <div class="out-body">
              <div class="out-nav"><span>Container</span><span>Heading</span><span>Button</span></div>
              <div class="out-hero">
                <strong>Maison Victor</strong>
                <small>Écrins sur mesure · widget heading</small>
              </div>
              <div class="out-grid">
                <div class="out-card">
                  <div class="lbl">text-editor</div>
                  <div class="line"></div>
                  <div class="line w80"></div>
                  <div class="line w60"></div>
                </div>
                <div class="out-card">
                  <div class="lbl">button</div>
                  <span class="out-btn">Découvrir</span>
                </div>
              </div>
              <div class="out-meta">
                <span>ZIP prêt</span>
                <span class="badge-ok">Importable</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </header>

  <section class="proof" id="preuve">
    <div class="wrap">
      <p class="kicker reveal">La preuve</p>
      <h2 class="title reveal">Même page. Format Elementor.</h2>
      <p class="lead reveal">Ce que vous voyez à gauche devient le modèle que vous importez à droite.</p>
      <div class="proof-frame reveal">
        <div class="proof-side proof-before">
          <h3>HTML source</h3>
          <div><span class="t">&lt;div</span> class="hero"<span class="t">&gt;</span></div>
          <div>&nbsp;&nbsp;<span class="t">&lt;h1&gt;</span>Maison Victor<span class="t">&lt;/h1&gt;</span></div>
          <div>&nbsp;&nbsp;<span class="t">&lt;p&gt;</span>Patrimoine &amp; instruments<span class="t">&lt;/p&gt;</span></div>
          <div>&nbsp;&nbsp;<span class="t">&lt;a</span> class="btn"<span class="t">&gt;</span>Voir<span class="t">&lt;/a&gt;</span></div>
          <div><span class="t">&lt;/div&gt;</span></div>
          <div style="margin-top:18px;opacity:.55">+ CSS · images base64 · flex</div>
        </div>
        <div class="proof-mid" aria-hidden="true">→</div>
        <div class="proof-side proof-after proof-ui">
          <h3>Sortie Elementor</h3>
          <div class="block hero-b">
            <strong>Maison Victor</strong>
            <span style="opacity:.7;font-size:12px">container · min-height · flex</span>
          </div>
          <div class="row">
            <div class="block"><div class="chip">heading</div>Maison Victor</div>
            <div class="block"><div class="chip">button</div>Voir</div>
          </div>
          <div class="block"><div class="chip">text-editor</div>Patrimoine &amp; instruments</div>
        </div>
      </div>
    </div>
  </section>

  <section class="how" id="comment">
    <div class="wrap">
      <p class="kicker reveal">Process</p>
      <h2 class="title reveal">Trois gestes. Zéro reconstruction.</h2>
      <p class="lead reveal">Vous gardez le contrôle de l’import WordPress — aucun plugin chez le client.</p>
      <div class="steps">
        <article class="step reveal">
          <div class="n">01</div>
          <h3>Chargez le HTML</h3>
          <p>Page autoportée, export ou prototype. Glissez-déposez dans Convert.</p>
        </article>
        <article class="step reveal">
          <div class="n">02</div>
          <h3>Récupérez le ZIP</h3>
          <p>Modèle JSON, assets extraits, rapport de conversion.</p>
        </article>
        <article class="step reveal">
          <div class="n">03</div>
          <h3>Importez</h3>
          <p>Elementor → Modèles. Containers Flexbox, et c’est en ligne.</p>
        </article>
      </div>
    </div>
  </section>

  <section class="value" id="valeur">
    <div class="wrap">
      <div class="value-head">
        <div>
          <p class="kicker reveal">Produit</p>
          <h2 class="title reveal">Pensé pour la production.</h2>
        </div>
        <p class="lead reveal">Pas un export approximatif — un pipeline validé contre les contrôles Elementor.</p>
      </div>
      <div class="value-list">
        <div class="value-item reveal">
          <h3>Styles &amp; responsive</h3>
          <p>Typo, couleurs, flex, grid, padding — breakpoints tablet et mobile inclus.</p>
        </div>
        <div class="value-item reveal">
          <h3>Images extraites</h3>
          <p>Les data-URI deviennent de vrais fichiers, prêts pour la médiathèque.</p>
        </div>
        <div class="value-item reveal">
          <h3>Validation des contrôles</h3>
          <p>Chaque valeur filtre via une knowledge base Elementor embarquée.</p>
        </div>
        <div class="value-item reveal">
          <h3>Espace équipe</h3>
          <p>Comptes, historique, quotas. Admin pour piloter les accès.</p>
        </div>
      </div>
    </div>
  </section>

  <section class="pricing" id="tarifs">
    <div class="wrap">
      <p class="kicker reveal">Tarifs</p>
      <h2 class="title reveal">Choisissez votre rythme.</h2>
      <p class="lead reveal">Sans carte bancaire pour le plan Free.</p>
      <div class="plans">
        <div class="plan reveal">
          <h3>${free.label}</h3>
          <div class="price">${free.priceLabel.replace(' ', '&nbsp;')} <small>${free.priceSuffix}</small></div>
          <ul>
            <li>${free.monthlyQuota} conversions / mois</li>
            ${free.features.map((f) => `<li>${f}</li>`).join('')}
          </ul>
          <a class="btn btn-outline" href="${user ? '/app' : '/register?plan=free'}">${user ? 'Ouvrir l’espace' : 'Créer un compte'}</a>
        </div>
        <div class="plan featured reveal">
          <h3>${standard.label}</h3>
          <div class="price">${standard.priceLabel.replace(' ', '&nbsp;')} <small>${standard.priceSuffix}</small></div>
          <ul>
            <li>${standard.monthlyQuota} conversions / mois</li>
            ${standard.features.map((f) => `<li>${f}</li>`).join('')}
          </ul>
          <a class="btn btn-light" href="${user ? '/app' : '/register?plan=standard'}">${user ? 'Passer en Standard' : 'Choisir Standard'} <span class="chev" aria-hidden="true">→</span></a>
        </div>
        <div class="plan reveal">
          <h3>${pro.label}</h3>
          <div class="price">${pro.priceLabel.replace(' ', '&nbsp;')} <small>${pro.priceSuffix}</small></div>
          <ul>
            <li>${pro.monthlyQuota} conversions / mois</li>
            ${pro.features.map((f) => `<li>${f}</li>`).join('')}
          </ul>
          <a class="btn btn-outline" href="${user ? '/app' : '/register?plan=pro'}">${user ? 'Passer en Pro' : 'Choisir Pro'}</a>
        </div>
      </div>
      <p class="note reveal">Paiement Stripe bientôt. Un admin peut activer Standard ou Pro manuellement en attendant.</p>
    </div>
  </section>

  <section class="close">
    <div class="wrap">
      <h2 class="reveal">Arrêtez de reconstruire.</h2>
      <p class="reveal">Compte en une minute. Première conversion juste après.</p>
      <div class="hero-cta reveal">
        <a class="btn btn-light" href="${primaryHref}">${primaryLabel} <span class="chev" aria-hidden="true">→</span></a>
      </div>
    </div>
  </section>

  <footer>
    <div class="wrap">
      <a class="logo" href="/">Convert<span>.</span></a>
      <nav class="legal-links" aria-label="Liens légaux">
        <a href="/mentions-legales">Mentions légales</a>
        <a href="/confidentialite">Confidentialité</a>
        <a href="/cgu">CGU</a>
        <a href="/cgv">CGV</a>
      </nav>
    </div>
  </footer>

  <script>
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (!reduce) {
      const io = new IntersectionObserver((entries) => {
        for (const e of entries) if (e.isIntersecting) e.target.classList.add('in');
      }, { threshold: 0.12, rootMargin: '0px 0px -5% 0px' });
      document.querySelectorAll('.reveal').forEach((el) => io.observe(el));
    } else {
      document.querySelectorAll('.reveal').forEach((el) => el.classList.add('in'));
    }
  </script>
</body>
</html>`;
}
