const fs = require('fs');
const path = require('path');

const workspace = '/Users/apple/Library/CloudStorage/OneDrive-个人/1_Course/2025-2026/《AI破壁计划》';
const mdPath = path.join(workspace, 'docs', '学校数据基座技术实现路线与开发链路.md');
const htmlPath = path.join(workspace, 'docs', '学校数据基座技术实现路线与开发链路.html');

const markdown = fs.readFileSync(mdPath, 'utf8');

const page = String.raw`<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>学校数据基座技术实现路线与开发链路</title>
  <meta name="description" content="面向个性化学习推荐的学校数据基座实施路线、模块拆分、图查询 API 与完整 Agent 开发链路。" />
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
  <link href="https://fonts.googleapis.com/css2?family=Noto+Sans+SC:wght@400;500;700;800&family=Noto+Serif+SC:wght@600;700;900&family=IBM+Plex+Mono:wght@400;500&display=swap" rel="stylesheet" />
  <style>
    :root {
      --bg: #f4efe6;
      --bg-deep: #e9e2d4;
      --paper: rgba(255, 251, 245, 0.76);
      --ink: #182118;
      --muted: #5b675d;
      --line: rgba(24, 33, 24, 0.12);
      --line-strong: rgba(24, 33, 24, 0.22);
      --forest: #0f5f50;
      --copper: #b65a2d;
      --shadow: 0 24px 80px rgba(39, 41, 33, 0.12);
      --shadow-soft: 0 10px 30px rgba(39, 41, 33, 0.08);
      --radius-xl: 32px;
      --radius-lg: 22px;
      --radius-md: 16px;
      --max: 1380px;
      --toc-width: 300px;
    }

    * { box-sizing: border-box; }
    html { scroll-behavior: smooth; }

    body {
      margin: 0;
      font-family: "Noto Sans SC", sans-serif;
      color: var(--ink);
      background:
        radial-gradient(circle at 8% 10%, rgba(15, 95, 80, 0.16), transparent 24rem),
        radial-gradient(circle at 92% 14%, rgba(182, 90, 45, 0.18), transparent 20rem),
        linear-gradient(180deg, var(--bg) 0%, #f0eadf 48%, var(--bg-deep) 100%);
      min-height: 100vh;
      overflow-x: hidden;
    }

    body::before {
      content: "";
      position: fixed;
      inset: 0;
      pointer-events: none;
      background-image:
        linear-gradient(rgba(24, 33, 24, 0.035) 1px, transparent 1px),
        linear-gradient(90deg, rgba(24, 33, 24, 0.035) 1px, transparent 1px);
      background-size: 38px 38px;
      mask-image: linear-gradient(180deg, rgba(0, 0, 0, 0.75), transparent 88%);
      z-index: -2;
    }

    body::after {
      content: "";
      position: fixed;
      inset: 0;
      pointer-events: none;
      background: radial-gradient(circle at center, rgba(255, 255, 255, 0.14), transparent 60%);
      mix-blend-mode: screen;
      z-index: -1;
    }

    a { color: inherit; }

    .page {
      width: min(calc(100% - 28px), var(--max));
      margin: 18px auto 48px;
    }

    .topbar {
      position: sticky;
      top: 14px;
      z-index: 50;
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 18px;
      padding: 14px 18px;
      border: 1px solid rgba(255, 255, 255, 0.46);
      border-radius: 999px;
      backdrop-filter: blur(16px);
      background: rgba(255, 251, 245, 0.68);
      box-shadow: var(--shadow-soft);
      margin-bottom: 22px;
    }

    .brand {
      display: flex;
      align-items: center;
      gap: 14px;
      min-width: 0;
    }

    .brand-mark {
      width: 44px;
      height: 44px;
      border-radius: 15px;
      display: grid;
      place-items: center;
      background: linear-gradient(135deg, var(--forest), #1a7b67);
      color: #f8f5ee;
      font-family: "IBM Plex Mono", monospace;
      font-size: 0.95rem;
      font-weight: 500;
      box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.22);
    }

    .brand-copy {
      display: grid;
      gap: 2px;
      min-width: 0;
    }

    .brand-copy strong {
      font-size: 0.98rem;
      letter-spacing: 0.04em;
    }

    .brand-copy span,
    .meta,
    .hero-lead,
    .metric-note,
    .toc-note,
    .article p,
    .article li,
    .footer-note {
      color: var(--muted);
    }

    .quick-actions {
      display: flex;
      align-items: center;
      gap: 10px;
      flex-wrap: wrap;
      justify-content: flex-end;
    }

    .chip,
    .action {
      border-radius: 999px;
      padding: 10px 14px;
      border: 1px solid var(--line);
      background: rgba(255, 255, 255, 0.56);
      text-decoration: none;
      font-size: 0.9rem;
      transition: transform 180ms ease, border-color 180ms ease, background 180ms ease;
    }

    .chip:hover,
    .action:hover {
      transform: translateY(-1px);
      border-color: var(--line-strong);
      background: rgba(255, 255, 255, 0.8);
    }

    .hero {
      display: grid;
      grid-template-columns: minmax(0, 1.1fr) minmax(340px, 0.9fr);
      gap: 26px;
      align-items: stretch;
      margin-bottom: 28px;
    }

    .hero-card,
    .summary-card,
    .toc-card,
    .visuals,
    .article {
      border: 1px solid rgba(255, 255, 255, 0.55);
      background: var(--paper);
      backdrop-filter: blur(18px);
      border-radius: var(--radius-xl);
      box-shadow: var(--shadow);
    }

    .hero-card {
      padding: 34px 34px 30px;
      position: relative;
      overflow: hidden;
      isolation: isolate;
    }

    .hero-card::before {
      content: "";
      position: absolute;
      inset: auto -5% -30% 45%;
      height: 70%;
      background: radial-gradient(circle, rgba(182, 90, 45, 0.22), transparent 60%);
      pointer-events: none;
      z-index: -1;
    }

    .eyebrow,
    .metric-value,
    .toc-title,
    .article h1,
    .article h2,
    .article h3 {
      font-family: "Noto Serif SC", serif;
    }

    .eyebrow {
      display: inline-flex;
      align-items: center;
      gap: 10px;
      color: var(--forest);
      font-size: 0.88rem;
      letter-spacing: 0.08em;
      text-transform: uppercase;
    }

    .eyebrow::before {
      content: "";
      width: 42px;
      height: 1px;
      background: currentColor;
    }

    .hero h1 {
      margin: 18px 0 18px;
      font-size: clamp(3rem, 6vw, 5.2rem);
      line-height: 0.94;
      letter-spacing: -0.05em;
      max-width: 10ch;
    }

    .hero-lead {
      margin: 0;
      font-size: 1.06rem;
      line-height: 1.88;
      max-width: 45rem;
    }

    .hero-pills {
      display: flex;
      flex-wrap: wrap;
      gap: 10px;
      margin-top: 24px;
    }

    .hero-pills span {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      padding: 10px 14px;
      border-radius: 999px;
      font-size: 0.9rem;
      background: rgba(255, 255, 255, 0.72);
      border: 1px solid rgba(24, 33, 24, 0.1);
    }

    .summary-card {
      padding: 28px;
      display: grid;
      align-content: space-between;
      gap: 18px;
    }

    .summary-head {
      display: flex;
      align-items: baseline;
      justify-content: space-between;
      gap: 16px;
      padding-bottom: 14px;
      border-bottom: 1px solid var(--line);
    }

    .summary-head strong {
      font-size: 1rem;
      letter-spacing: 0.03em;
    }

    .meta {
      font-size: 0.86rem;
    }

    .metrics {
      display: grid;
      grid-template-columns: repeat(2, minmax(0, 1fr));
      gap: 14px;
    }

    .metric {
      padding: 16px;
      border-radius: var(--radius-md);
      background: linear-gradient(180deg, rgba(255, 255, 255, 0.72), rgba(255, 255, 255, 0.44));
      border: 1px solid rgba(24, 33, 24, 0.08);
    }

    .metric-value {
      font-size: 2rem;
      line-height: 1;
      margin-bottom: 8px;
    }

    .metric-label {
      font-size: 0.9rem;
      color: var(--ink);
      margin-bottom: 4px;
      font-weight: 700;
    }

    .metric-note {
      font-size: 0.85rem;
      line-height: 1.6;
    }

    .summary-strip {
      display: grid;
      gap: 12px;
      padding-top: 6px;
    }

    .strip-item {
      padding: 14px 16px;
      border-radius: 18px;
      background: rgba(219, 233, 223, 0.7);
      border: 1px solid rgba(15, 95, 80, 0.12);
    }

    .strip-item strong {
      display: block;
      margin-bottom: 4px;
      font-size: 0.95rem;
      color: var(--ink);
    }

    .layout {
      display: grid;
      grid-template-columns: var(--toc-width) minmax(0, 1fr);
      gap: 24px;
      align-items: start;
    }

    .sidebar {
      position: sticky;
      top: 100px;
    }

    .toc-card {
      padding: 22px 20px;
      box-shadow: var(--shadow-soft);
    }

    .toc-title {
      margin: 0 0 10px;
      font-size: 1.35rem;
      letter-spacing: -0.02em;
    }

    .toc-note {
      margin: 0 0 18px;
      font-size: 0.92rem;
      line-height: 1.7;
    }

    .toc {
      display: grid;
      gap: 6px;
      max-height: calc(100vh - 190px);
      overflow: auto;
      padding-right: 6px;
    }

    .toc a {
      display: block;
      text-decoration: none;
      padding: 10px 12px;
      border-radius: 14px;
      color: var(--muted);
      border: 1px solid transparent;
      transition: background 180ms ease, border-color 180ms ease, color 180ms ease, transform 180ms ease;
    }

    .toc a[data-level="3"] {
      margin-left: 14px;
      font-size: 0.92rem;
      padding-top: 8px;
      padding-bottom: 8px;
    }

    .toc a:hover,
    .toc a.active {
      color: var(--ink);
      background: rgba(255, 255, 255, 0.74);
      border-color: rgba(24, 33, 24, 0.08);
      transform: translateX(2px);
    }

    .article {
      padding: 42px clamp(22px, 3vw, 42px) 52px;
    }

    .visuals {
      margin-bottom: 24px;
      padding: 26px clamp(18px, 2.4vw, 28px) 28px;
      overflow: hidden;
    }

    .doc-shell {
      margin-top: 22px;
    }

    .doc-details {
      border: 1px solid rgba(255, 255, 255, 0.55);
      background: var(--paper);
      backdrop-filter: blur(18px);
      border-radius: var(--radius-xl);
      box-shadow: var(--shadow);
      overflow: hidden;
    }

    .doc-details summary {
      cursor: pointer;
      list-style: none;
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 14px;
      padding: 18px 20px;
      font-weight: 700;
      color: var(--ink);
      background: linear-gradient(180deg, rgba(255, 255, 255, 0.74), rgba(255, 255, 255, 0.42));
    }

    .doc-details summary::-webkit-details-marker {
      display: none;
    }

    .doc-details summary::after {
      content: "展开";
      font-size: 0.88rem;
      color: var(--forest);
      background: rgba(15, 95, 80, 0.08);
      border-radius: 999px;
      padding: 8px 12px;
    }

    .doc-details[open] summary::after {
      content: "收起";
    }

    .visual-header {
      display: flex;
      align-items: end;
      justify-content: space-between;
      gap: 16px;
      margin-bottom: 20px;
      padding-bottom: 16px;
      border-bottom: 1px solid var(--line);
    }

    .visual-header h2,
    .appendix-head h2 {
      margin: 0;
      font-family: "Noto Serif SC", serif;
      font-size: clamp(1.5rem, 2vw, 2rem);
      letter-spacing: -0.03em;
    }

    .visual-header p,
    .appendix-head p,
    .diagram-note,
    .diagram-caption,
    .appendix-meta {
      margin: 0;
      color: var(--muted);
      line-height: 1.7;
      font-size: 0.95rem;
    }

    .visual-grid {
      display: grid;
      grid-template-columns: repeat(12, minmax(0, 1fr));
      gap: 16px;
    }

    .visual-card {
      grid-column: span 6;
      border: 1px solid rgba(24, 33, 24, 0.08);
      border-radius: 24px;
      background: linear-gradient(180deg, rgba(255, 255, 255, 0.78), rgba(255, 255, 255, 0.46));
      padding: 18px;
      box-shadow: var(--shadow-soft);
    }

    .visual-card.wide {
      grid-column: span 12;
    }

    .diagram-kicker,
    .appendix-kicker {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      color: var(--forest);
      text-transform: uppercase;
      letter-spacing: 0.08em;
      font-size: 0.8rem;
      margin-bottom: 10px;
    }

    .diagram-kicker::before,
    .appendix-kicker::before {
      content: "";
      width: 28px;
      height: 1px;
      background: currentColor;
    }

    .visual-card h3 {
      margin: 0 0 8px;
      font-family: "Noto Serif SC", serif;
      font-size: 1.18rem;
      letter-spacing: -0.02em;
    }

    .diagram-note {
      margin-bottom: 16px;
    }

    .flow-row,
    .stack-row,
    .phase-row,
    .lifecycle-row {
      display: grid;
      gap: 12px;
    }

    .flow-row {
      grid-template-columns: repeat(5, minmax(0, 1fr));
      align-items: stretch;
    }

    .stack-row {
      grid-template-columns: 1.1fr 0.8fr 1fr 0.8fr 1fr;
      align-items: center;
    }

    .phase-row {
      grid-template-columns: repeat(3, minmax(0, 1fr));
    }

    .lifecycle-row {
      grid-template-columns: repeat(7, minmax(0, 1fr));
      align-items: stretch;
    }

    .node,
    .phase-card,
    .stage-card,
    .life-card {
      position: relative;
      min-height: 118px;
      border-radius: 20px;
      padding: 16px;
      border: 1px solid rgba(24, 33, 24, 0.1);
      background: rgba(255, 255, 255, 0.82);
    }

    .node strong,
    .phase-card strong,
    .stage-card strong,
    .life-card strong {
      display: block;
      color: var(--ink);
      font-size: 0.98rem;
      margin-bottom: 8px;
    }

    .node span,
    .phase-card span,
    .stage-card span,
    .life-card span {
      display: block;
      font-size: 0.9rem;
      color: var(--muted);
      line-height: 1.65;
    }

    .node.source,
    .life-card.source {
      background: linear-gradient(180deg, rgba(239, 226, 207, 0.9), rgba(255, 255, 255, 0.72));
    }

    .node.state,
    .phase-card.phase-two {
      background: linear-gradient(180deg, rgba(219, 233, 223, 0.84), rgba(255, 255, 255, 0.74));
    }

    .node.agent,
    .phase-card.phase-three {
      background: linear-gradient(180deg, rgba(15, 95, 80, 0.12), rgba(255, 255, 255, 0.7));
    }

    .node.fact,
    .phase-card.phase-one {
      background: linear-gradient(180deg, rgba(182, 90, 45, 0.12), rgba(255, 255, 255, 0.74));
    }

    .arrow {
      display: grid;
      place-items: center;
      color: var(--forest);
      font-size: 1.45rem;
      opacity: 0.75;
    }

    .service-matrix {
      display: grid;
      grid-template-columns: repeat(3, minmax(0, 1fr));
      gap: 12px;
    }

    .north-star {
      padding: 18px 20px;
      border-radius: 22px;
      background:
        radial-gradient(circle at 95% 10%, rgba(182, 90, 45, 0.18), transparent 10rem),
        linear-gradient(135deg, rgba(15, 95, 80, 0.14), rgba(255, 255, 255, 0.74));
      border: 1px solid rgba(24, 33, 24, 0.08);
    }

    .north-star strong {
      display: block;
      font-size: 1.04rem;
      margin-bottom: 8px;
      color: var(--ink);
    }

    .north-star p {
      margin: 0;
      line-height: 1.8;
      color: var(--muted);
    }

    .layer-stack {
      display: grid;
      gap: 10px;
    }

    .layer-card {
      display: grid;
      grid-template-columns: 64px minmax(0, 1fr);
      gap: 14px;
      align-items: start;
      padding: 16px 18px;
      border-radius: 20px;
      border: 1px solid rgba(24, 33, 24, 0.08);
      background: rgba(255, 255, 255, 0.76);
    }

    .layer-no {
      width: 52px;
      height: 52px;
      border-radius: 16px;
      display: grid;
      place-items: center;
      font-family: "Noto Serif SC", serif;
      font-size: 1.25rem;
      color: #f8f5ee;
      background: linear-gradient(135deg, var(--forest), #1a7b67);
      box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.2);
    }

    .layer-body strong,
    .source-card strong,
    .boundary-card strong,
    .step-card strong {
      display: block;
      color: var(--ink);
      margin-bottom: 6px;
    }

    .layer-body span,
    .source-card span,
    .boundary-card li,
    .step-card span {
      display: block;
      line-height: 1.75;
      color: var(--muted);
      font-size: 0.94rem;
    }

    .source-grid {
      display: grid;
      grid-template-columns: repeat(2, minmax(0, 1fr));
      gap: 12px;
    }

    .source-card,
    .boundary-card,
    .step-card {
      padding: 16px;
      border-radius: 18px;
      border: 1px solid rgba(24, 33, 24, 0.08);
      background: rgba(255, 255, 255, 0.76);
    }

    .source-card.source-a { background: linear-gradient(180deg, rgba(239, 226, 207, 0.9), rgba(255,255,255,0.72)); }
    .source-card.source-b { background: linear-gradient(180deg, rgba(219, 233, 223, 0.9), rgba(255,255,255,0.72)); }
    .source-card.source-c { background: linear-gradient(180deg, rgba(15, 95, 80, 0.12), rgba(255,255,255,0.72)); }
    .source-card.source-d { background: linear-gradient(180deg, rgba(182, 90, 45, 0.12), rgba(255,255,255,0.72)); }

    .boundary-grid,
    .step-grid {
      display: grid;
      gap: 14px;
    }

    .boundary-grid {
      grid-template-columns: 1fr 1fr;
    }

    .boundary-card ul {
      margin: 0;
      padding-left: 1.1rem;
    }

    .step-grid {
      grid-template-columns: repeat(6, minmax(0, 1fr));
    }

    .step-card {
      min-height: 156px;
      position: relative;
    }

    .step-card::after {
      content: attr(data-step);
      position: absolute;
      top: 12px;
      right: 12px;
      width: 28px;
      height: 28px;
      display: grid;
      place-items: center;
      border-radius: 999px;
      background: rgba(15, 95, 80, 0.08);
      color: var(--forest);
      font-size: 0.82rem;
      font-weight: 700;
    }

    .service-box {
      padding: 16px;
      border-radius: 18px;
      border: 1px solid rgba(24, 33, 24, 0.08);
      background: rgba(255, 255, 255, 0.74);
    }

    .service-box strong {
      display: block;
      margin-bottom: 8px;
      color: var(--ink);
    }

    .service-box span {
      display: block;
      color: var(--muted);
      line-height: 1.7;
      font-size: 0.9rem;
    }

    .appendix-zone {
      margin-top: 34px;
      padding-top: 10px;
      border-top: 1px dashed rgba(24, 33, 24, 0.16);
    }

    .appendix-head {
      display: grid;
      gap: 8px;
      margin-bottom: 18px;
    }

    .appendix-list {
      display: grid;
      gap: 12px;
    }

    .appendix-item {
      border: 1px solid rgba(24, 33, 24, 0.08);
      border-radius: 20px;
      background: linear-gradient(180deg, rgba(255, 255, 255, 0.78), rgba(255, 255, 255, 0.5));
      overflow: hidden;
    }

    .appendix-item summary {
      cursor: pointer;
      list-style: none;
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 12px;
      padding: 16px 18px;
      font-weight: 700;
      color: var(--ink);
    }

    .appendix-item summary::-webkit-details-marker {
      display: none;
    }

    .appendix-item summary::after {
      content: "+";
      flex: none;
      width: 30px;
      height: 30px;
      display: grid;
      place-items: center;
      border-radius: 999px;
      background: rgba(15, 95, 80, 0.08);
      color: var(--forest);
      font-size: 1.1rem;
      transition: transform 180ms ease;
    }

    .appendix-item[open] summary::after {
      transform: rotate(45deg);
    }

    .appendix-panel {
      padding: 0 18px 18px;
      border-top: 1px solid rgba(24, 33, 24, 0.08);
    }

    .list-paragraph {
      margin-top: 8px;
      color: var(--muted);
      line-height: 1.8;
    }

    .article h1 {
      margin: 0 0 22px;
      font-size: clamp(2.4rem, 4vw, 4rem);
      line-height: 1.04;
      letter-spacing: -0.04em;
    }

    .article h2 {
      margin: 54px 0 18px;
      padding: 18px 20px 14px;
      font-size: clamp(1.45rem, 2vw, 2.05rem);
      line-height: 1.2;
      letter-spacing: -0.03em;
      border-top: 2px solid rgba(15, 95, 80, 0.18);
      border-left: 4px solid var(--forest);
      background: linear-gradient(180deg, rgba(219, 233, 223, 0.36), rgba(255, 255, 255, 0));
      border-radius: 18px;
    }

    .article h3 {
      margin: 32px 0 12px;
      font-size: 1.18rem;
      line-height: 1.35;
      letter-spacing: -0.02em;
      display: flex;
      align-items: center;
      gap: 10px;
    }

    .article h3::before {
      content: "";
      width: 10px;
      height: 10px;
      border-radius: 999px;
      background: linear-gradient(135deg, var(--copper), #d78b60);
      box-shadow: 0 0 0 6px rgba(182, 90, 45, 0.12);
      flex: none;
    }

    .article p {
      margin: 0 0 16px;
      font-size: 1rem;
      line-height: 1.9;
    }

    .article ul,
    .article ol {
      margin: 0 0 18px;
      padding-left: 1.3rem;
    }

    .article li {
      margin: 8px 0;
      line-height: 1.85;
    }

    .article ul ul,
    .article ol ol,
    .article ul ol,
    .article ol ul {
      margin-top: 8px;
      margin-bottom: 10px;
    }

    .article code {
      font-family: "IBM Plex Mono", monospace;
      font-size: 0.92em;
      padding: 0.16em 0.42em;
      border-radius: 8px;
      background: rgba(15, 95, 80, 0.08);
      color: var(--forest);
      word-break: break-word;
    }

    .article strong { color: var(--ink); }

    .article .lead-block {
      padding: 20px 22px;
      border-radius: 18px;
      background: linear-gradient(180deg, rgba(255, 255, 255, 0.84), rgba(255, 255, 255, 0.54));
      border: 1px solid rgba(24, 33, 24, 0.08);
      margin-bottom: 22px;
    }

    .footer-note {
      width: min(calc(100% - 28px), var(--max));
      margin: 18px auto 0;
      padding: 16px 18px 6px;
      font-size: 0.9rem;
      line-height: 1.7;
      text-align: center;
    }

    @media (max-width: 1080px) {
      .hero,
      .layout,
      .flow-row,
      .stack-row,
      .phase-row,
      .lifecycle-row,
      .service-matrix {
        grid-template-columns: 1fr;
      }

      .sidebar {
        position: static;
      }

      .toc {
        max-height: none;
      }
    }

    @media (max-width: 720px) {
      .page {
        width: min(calc(100% - 18px), var(--max));
        margin-top: 10px;
      }

      .topbar {
        border-radius: 24px;
        align-items: flex-start;
        flex-direction: column;
      }

      .quick-actions {
        justify-content: flex-start;
      }

      .hero-card,
      .summary-card,
      .visuals,
      .article,
      .toc-card {
        padding-left: 18px;
        padding-right: 18px;
      }

      .hero h1,
      .article h1 {
        max-width: none;
      }

      .metrics {
        grid-template-columns: 1fr 1fr;
      }
    }
  </style>
</head>
<body>
  <div class="page">
    <header class="topbar">
      <div class="brand">
        <div class="brand-mark">ADF</div>
        <div class="brand-copy">
          <strong>学校数据基座技术实现路线</strong>
          <span>面向个性化学习推荐与 Agent 调用的完整开发链路</span>
        </div>
      </div>
      <div class="quick-actions">
        <a class="chip" href="#toc-anchor">目录导航</a>
        <a class="chip" href="#visual-overview">架构图</a>
        <a class="action" href="#content-anchor">阅读正文</a>
      </div>
    </header>

    <section class="hero">
      <article class="hero-card">
        <div class="eyebrow">Technical Blueprint</div>
        <h1>从多源教学数据到 Agent 调用链路</h1>
        <p class="hero-lead">这份页面对应一份可落地的实施稿，不讨论抽象愿景，直接把学校数据基座拆成实施阶段、系统模块、图查询 API、任务上下文投影和完整推荐闭环。目标不是先做一个炫目的 Agent，而是先把数据主权、关系能力和服务接口做稳。</p>
        <div class="hero-pills">
          <span>统一接入</span>
          <span>标准化处理</span>
          <span>知识关系化</span>
          <span>任务投影化</span>
        </div>
      </article>

      <aside class="summary-card">
        <div class="summary-head">
          <strong>阅读速览</strong>
          <span class="meta">静态 HTML / 本地可直接打开</span>
        </div>
        <div class="metrics">
          <div class="metric">
            <div class="metric-value">3</div>
            <div class="metric-label">实施阶段</div>
            <div class="metric-note">先做最小闭环，再扩课堂协同，最后扩平台能力。</div>
          </div>
          <div class="metric">
            <div class="metric-value">10</div>
            <div class="metric-label">核心模块</div>
            <div class="metric-note">从接入网关到推荐编排，拆出清晰服务边界。</div>
          </div>
          <div class="metric">
            <div class="metric-value">6</div>
            <div class="metric-label">关键里程碑</div>
            <div class="metric-note">按链路验收，不等所有模块做完才看效果。</div>
          </div>
          <div class="metric">
            <div class="metric-value">1</div>
            <div class="metric-label">首要闭环</div>
            <div class="metric-note">作业诊断到个性化补救推荐，是一期唯一必须跑通的链路。</div>
          </div>
        </div>
        <div class="summary-strip">
          <div class="strip-item">
            <strong>设计原则</strong>
            底层先做事实源、关系层和服务接口，Agent 只消费能力，不反过来定义底座。
          </div>
          <div class="strip-item">
            <strong>技术判断</strong>
            一期优先使用 <code>PostgreSQL + pgvector + 对象存储 + 事件总线</code>，图能力服务化，暂不急着上独立图数据库。
          </div>
        </div>
      </aside>
    </section>

    <div class="layout">
      <aside class="sidebar" id="toc-anchor">
        <div class="toc-card">
          <h2 class="toc-title">文档目录</h2>
          <p class="toc-note">左侧目录根据正文自动生成。建议先看“总体实施路线”和“完整 Agent 调用链路”，再进入模块与 API 细节。</p>
          <nav class="toc" id="toc"></nav>
        </div>
      </aside>

      <main id="content-anchor">
        <section class="visuals" id="visual-overview"></section>
        <section class="doc-shell" id="full-doc">
          <details class="doc-details">
            <summary>查看完整技术稿与附录</summary>
            <article class="article" id="article"></article>
          </details>
        </section>
      </main>
    </div>
  </div>

  <div class="footer-note">文档来源于当前工作区中的实施路线 Markdown，并封装为独立静态阅读页，便于浏览、评审和后续继续扩写。</div>

  <script>
    (function () {
      const markdown = __MARKDOWN_SOURCE__;
      const article = document.getElementById("article");
      const toc = document.getElementById("toc");
      const visuals = document.getElementById("visual-overview");
      const slugCounts = new Map();

      function escapeHtml(str) {
        return str
          .replace(/&/g, "&amp;")
          .replace(/</g, "&lt;")
          .replace(/>/g, "&gt;")
          .replace(/"/g, "&quot;")
          .replace(/'/g, "&#39;");
      }

      function inline(text) {
        let out = escapeHtml(text.trim());
        out = out.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");
        out = out.replace(/\`([^\`]+)\`/g, "<code>$1</code>");
        out = out.replace(/\[(.+?)\]\((.+?)\)/g, '<a href="$2" target="_blank" rel="noreferrer">$1</a>');
        return out;
      }

      function slug(text, level) {
        const base = String(text)
          .replace(/<[^>]+>/g, "")
          .trim()
          .toLowerCase()
          .replace(/[^\p{L}\p{N}]+/gu, "-")
          .replace(/^-+|-+$/g, "") || ("section-" + level);
        const count = slugCounts.get(base) || 0;
        slugCounts.set(base, count + 1);
        return count ? base + "-" + count : base;
      }

      function parse(md) {
        const lines = md.replace(/\r\n/g, "\n").split("\n");
        let html = "";
        let paragraph = [];
        let inCodeBlock = false;
        let codeLines = [];
        let codeLang = "";
        const listStack = [];

        function flushParagraph() {
          if (!paragraph.length) return;
          const text = paragraph.join(" ").trim();
          if (text) {
            html += "<p>" + inline(text) + "</p>";
          }
          paragraph = [];
        }

        function closeTopList() {
          const top = listStack.pop();
          if (!top) return;
          if (top.liOpen) html += "</li>";
          html += "</" + top.type + ">";
        }

        function closeAllLists() {
          while (listStack.length) closeTopList();
        }

        function ensureList(indent, type) {
          while (listStack.length) {
            const top = listStack[listStack.length - 1];
            if (indent < top.indent || (indent === top.indent && type !== top.type)) {
              closeTopList();
            } else {
              break;
            }
          }

          if (!listStack.length || indent > listStack[listStack.length - 1].indent) {
            html += "<" + type + ">";
            listStack.push({ type, indent, liOpen: false });
            return;
          }

          const current = listStack[listStack.length - 1];
          if (current.type === type && current.indent === indent && current.liOpen) {
            html += "</li>";
            current.liOpen = false;
          }
        }

        for (let i = 0; i < lines.length; i += 1) {
          const line = lines[i];

          if (line.startsWith("\`\`\`")) {
            flushParagraph();
            closeAllLists();
            if (!inCodeBlock) {
              inCodeBlock = true;
              codeLang = line.slice(3).trim();
              codeLines = [];
            } else {
              html += "<pre><code" + (codeLang ? ' class=\\"language-' + escapeHtml(codeLang) + '\\"' : "") + ">" + escapeHtml(codeLines.join("\\n")) + "</code></pre>";
              inCodeBlock = false;
              codeLang = "";
              codeLines = [];
            }
            continue;
          }

          if (inCodeBlock) {
            codeLines.push(line);
            continue;
          }

          const headingMatch = line.match(/^(#{1,3})\s+(.*)$/);
          if (headingMatch) {
            flushParagraph();
            closeAllLists();
            const level = headingMatch[1].length;
            const text = headingMatch[2].trim();
            const id = slug(text, level);
            html += "<h" + level + ' id="' + id + '">' + inline(text) + "</h" + level + ">";
            continue;
          }

          const listMatch = line.match(/^(\s*)([-*]|\d+\.)\s+(.*)$/);
          if (listMatch) {
            flushParagraph();
            const indent = listMatch[1].length;
            const marker = listMatch[2];
            const text = listMatch[3];
            const type = /\d+\./.test(marker) ? "ol" : "ul";
            ensureList(indent, type);
            const top = listStack[listStack.length - 1];
            html += "<li>" + inline(text);
            top.liOpen = true;
            continue;
          }

          if (!line.trim()) {
            flushParagraph();
            continue;
          }

          if (listStack.length) {
            const current = listStack[listStack.length - 1];
            if (current.liOpen) {
              html += '<div class="list-paragraph">' + inline(line.trim()) + "</div>";
              continue;
            }
          }

          paragraph.push(line.trim());
        }

        flushParagraph();
        closeAllLists();
        return html;
      }

      function injectVisualOverview() {
        visuals.innerHTML = [
          '<div class="visual-header">',
          '  <div>',
          '    <div class="diagram-kicker">Visual Overview</div>',
          '    <h2>一页先讲清楚这套底座到底怎么做</h2>',
          '  </div>',
          '  <p>先回答六个核心问题：为什么要做中间层、数据从哪里来、系统分几层、一期先做什么、核心闭环怎么跑、详细文档放在哪。</p>',
          '</div>',
          '<div class="visual-grid">',
          '  <section class="visual-card wide">',
          '    <div class="diagram-kicker">Core Judgment</div>',
          '    <h3 id="core-judgment">一句话结论</h3>',
          '    <div class="north-star">',
          '      <strong>这套系统不是“把所有数据直接喂给大模型”。</strong>',
          '      <p>正确做法是：先把教师课件、课堂视频、学生作业、考试成绩接入并标准化，再用知识关系层和图查询 API 把它们组织起来，最后按任务投影成最小上下文供 Agent 调用。Agent 负责解释和交互，不直接碰原始事实库。</p>',
          '    </div>',
          '  </section>',
          '  <section class="visual-card wide">',
          '    <div class="diagram-kicker">Four Layers</div>',
          '    <h3 id="four-layers">系统其实只有四层</h3>',
          '    <p class="diagram-note">先把层次切开，后面的数据库、图谱、Agent、推荐逻辑就不会缠在一起。</p>',
          '    <div class="layer-stack">',
          '      <div class="layer-card"><div class="layer-no">1</div><div class="layer-body"><strong>数据输入层</strong><span>教师课件、录播视频、学生作业、考试成绩、课题组材料。这里回答“数据从哪里来”。</span></div></div>',
          '      <div class="layer-card"><div class="layer-no">2</div><div class="layer-body"><strong>标准化处理层</strong><span>对象存储、文档解析、视频转写、作业切题、语义标注。这里回答“原始文件怎么变成可处理对象”。</span></div></div>',
          '      <div class="layer-card"><div class="layer-no">3</div><div class="layer-body"><strong>知识与状态层</strong><span>知识点、前置关系、资源映射、题目映射、学生掌握度、教学进度、图查询 API。这里回答“系统怎么知道学什么、不会什么、资源讲什么”。</span></div></div>',
          '      <div class="layer-card"><div class="layer-no">4</div><div class="layer-body"><strong>任务与 Agent 层</strong><span>任务上下文投影、推荐规划、Agent 解释输出、反馈回写。这里回答“Agent 实际如何被调用”。</span></div></div>',
          '    </div>',
          '  </section>',
          '  <section class="visual-card">',
          '    <div class="diagram-kicker">Inputs</div>',
          '    <h3 id="input-flow">四类输入分别扮演什么角色</h3>',
          '    <p class="diagram-note">不要把所有进入系统的东西都叫“资源”。这四类数据在推荐链路中的职责不同。</p>',
          '    <div class="source-grid">',
          '      <div class="source-card source-a"><strong>内容资源</strong><span>课件、讲义、录播、题解、课题组材料。主要是候选讲解材料。</span></div>',
          '      <div class="source-card source-b"><strong>评测证据</strong><span>作业、错因、批改结果、订正记录。主要决定学生哪里不会。</span></div>',
          '      <div class="source-card source-c"><strong>官方事实</strong><span>考试成绩、学籍、课表、教学进度、权限。主要决定约束条件。</span></div>',
          '      <div class="source-card source-d"><strong>交互反馈</strong><span>推荐点击、完成情况、学习反馈。主要决定系统如何继续修正。</span></div>',
          '    </div>',
          '  </section>',
          '  <section class="visual-card">',
          '    <div class="diagram-kicker">Core Loop</div>',
          '    <h3 id="core-loop">一期先跑通这一条闭环</h3>',
          '    <p class="diagram-note">不要先做大平台，一期只围绕“作业诊断后的补救推荐”打通端到端链路。</p>',
          '    <div class="service-matrix">',
          '      <div class="service-box"><strong>1. 作业提交</strong><span>学生提交作业，系统登记来源和任务上下文。</span></div>',
          '      <div class="service-box"><strong>2. 作业诊断</strong><span>切题、对题、错因识别、生成知识点证据。</span></div>',
          '      <div class="service-box"><strong>3. 状态更新</strong><span>更新学生掌握度，得到薄弱知识点和风险等级。</span></div>',
          '      <div class="service-box"><strong>4. 关系查询</strong><span>查前置知识点、候选资源、课堂进度、教师约束。</span></div>',
          '      <div class="service-box"><strong>5. 任务投影</strong><span>打包成最小上下文包，而不是把整库数据交给 Agent。</span></div>',
          '      <div class="service-box"><strong>6. Agent 输出</strong><span>生成解释、推荐哪段视频、先做哪几道题、学完后的检查任务。</span></div>',
          '    </div>',
          '  </section>',
          '  <section class="visual-card wide">',
          '    <div class="diagram-kicker">Scope</div>',
          '    <h3 id="mvp-boundary">一期只做什么，不做什么</h3>',
          '    <p class="diagram-note">如果一期边界不收住，团队会很快被图谱工程、外部资源、复杂 Agent 编排拖垮。</p>',
          '    <div class="boundary-grid">',
          '      <div class="boundary-card">',
          '        <strong>一期必须做</strong>',
          '        <ul>',
          '          <li>教师课件、录播、学生作业、考试成绩四类数据接入</li>',
          '          <li>统一对象模型和知识点关系模型</li>',
          '          <li>图查询 API 和学生状态 API</li>',
          '          <li>任务上下文投影服务</li>',
          '          <li>作业诊断后的个性化补救推荐</li>',
          '        </ul>',
          '      </div>',
          '      <div class="boundary-card">',
          '        <strong>一期先不做</strong>',
          '        <ul>',
          '          <li>全校全学科超级大图谱</li>',
          '          <li>复杂多 Agent 编排系统</li>',
          '          <li>独立图数据库和多套重型检索基础设施</li>',
          '          <li>开放式互联网资源大规模引入</li>',
          '          <li>把推荐逻辑完全写进 Prompt</li>',
          '        </ul>',
          '      </div>',
          '    </div>',
          '  </section>',
          '  <section class="visual-card wide">',
          '    <div class="diagram-kicker">Execution Plan</div>',
          '    <h3 id="phase-plan">开发顺序也要足够简单</h3>',
          '    <p class="diagram-note">正确顺序不是先写 Agent，而是先把数据和服务骨架做出来，再让 Agent 最后接上。</p>',
          '    <div class="step-grid">',
          '      <div class="step-card" data-step="1"><strong>基础骨架</strong><span>主库、对象存储、事件总线、接入网关、统一鉴权。</span></div>',
          '      <div class="step-card" data-step="2"><strong>内容解析</strong><span>文档解析、视频解析、资源元数据和基础搜索。</span></div>',
          '      <div class="step-card" data-step="3"><strong>学习证据</strong><span>作业上传、错因识别、掌握度更新、学生状态 API。</span></div>',
          '      <div class="step-card" data-step="4"><strong>知识关系</strong><span>知识点、前置关系、资源映射、题目映射、图查询 API。</span></div>',
          '      <div class="step-card" data-step="5"><strong>任务投影</strong><span>上下文模板、推荐规划、资源排序、任务打包。</span></div>',
          '      <div class="step-card" data-step="6"><strong>Agent 接入</strong><span>用结构化结果生成解释、推荐和交互，再回写反馈。</span></div>',
          '    </div>',
          '  </section>',
          '  <section class="visual-card wide">',
          '    <div class="diagram-kicker">Reference</div>',
          '    <h3 id="full-doc-intro">详细技术稿放在后面</h3>',
          '    <p class="diagram-note">如果你现在只想做决策，看到这里已经够了。下面折叠区保留完整实施稿，适合继续拆表结构、API 输入输出和研发联调计划。</p>',
          '  </section>',
          '</div>'
        ].join("");
      }

      function buildToc() {
        toc.innerHTML = [
          '<a href="#core-judgment" data-level="2">一句话结论</a>',
          '<a href="#four-layers" data-level="2">系统四层</a>',
          '<a href="#input-flow" data-level="2">四类输入</a>',
          '<a href="#core-loop" data-level="2">一期闭环</a>',
          '<a href="#mvp-boundary" data-level="2">一期边界</a>',
          '<a href="#phase-plan" data-level="2">开发顺序</a>',
          '<a href="#full-doc" data-level="2">完整技术稿</a>'
        ].join("");
      }

      article.innerHTML = parse(markdown);
      injectVisualOverview();

      const firstParagraph = article.querySelector("p");
      if (firstParagraph) {
        const lead = document.createElement("div");
        lead.className = "lead-block";
        lead.appendChild(firstParagraph.cloneNode(true));
        firstParagraph.replaceWith(lead);
      }

      buildToc();

      const tocLinks = Array.from(toc.querySelectorAll("a"));
      const observed = tocLinks
        .map(function (link) {
          return document.getElementById(link.getAttribute("href").slice(1));
        })
        .filter(Boolean);

      const observer = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          if (!entry.isIntersecting) return;
          const id = entry.target.id;
          tocLinks.forEach(function (link) {
            link.classList.toggle("active", link.getAttribute("href") === "#" + id);
          });
        });
      }, { rootMargin: "-20% 0px -65% 0px", threshold: 0.01 });

      observed.forEach(function (node) {
        observer.observe(node);
      });
    }());
  </script>
</body>
</html>
`;

const html = page.replace('__MARKDOWN_SOURCE__', JSON.stringify(markdown));
fs.writeFileSync(htmlPath, html, 'utf8');
console.log(htmlPath);
