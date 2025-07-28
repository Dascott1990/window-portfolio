# Windows OS Portfolio Environment

*A browser-based simulation of classic and modern Windows interfaces, engineered for UI/UX fidelity and performance.*

[![Live Demo](https://img.shields.io/badge/demo-live-green?style=flat-square)](https://window-portfolio.vercel.app/welcome)
[![License](https://img.shields.io/badge/license-MIT-blue?style=flat-square)](LICENSE)

## Overview
A functional desktop environment replicating Windows UI paradigms in the browser. Built to demonstrate:
- **System-accurate interactions** (window management, sound feedback, context menus)
- **Performance-optimized rendering** (60fps animations, lazy-loaded components)
- **Design rigor** (pixel-perfect TailwindCSS implementation, reduced motion alternatives)

Targets 100% compatibility with modern browsers while consuming <150KB of initial JS.

## Live Demo
[Production Deployment](https://windowportfolio-five.vercel.app/welcome)

## Tech Stack
- **Core**: React 18 + Next.js 14 (App Router)
- **Styling**: TailwindCSS + CSS Grid/Flexbox (zero custom CSS)
- **Animation**: Framer Motion (optimized with `will-change`)
- **State**: React Context + Zustand for window management
- **Build**: Vite-powered Next.js compiler

## Features
### UI Systems
- Draggable/resizable windows with collision detection
- Start menu with nested navigation
- System tray with clock and status indicators

### Engineering Details
- **Audio subsystem**: Event-triggered WAV playback (22kHz samples)
- **Responsive scaling**: Dynamic viewport units for consistent sizing
- **Accessibility**: Full keyboard navigation, reduced motion toggle

## Design Philosophy
1. **Constraint-Driven Development**
   - No unnecessary dependencies (1 animation library, zero CSS files)
   - Static analysis-optimized bundle (90+ Lighthouse performance score)

2. **UI/UX First Principles**
   - Input latency <50ms for all interactions
   - Memory usage capped at 30MB for background processes

## Getting Started
\`\`\`bash
git clone https://github.com/Dascott1990/window-portfolio.git
cd window-portfolio
npm install
npm run dev
\`\`\`

Production build:
\`\`\`bash
npm run build && npm start
\`\`\`

## License
MIT © 2025 Dascott
See [LICENSE](LICENSE) for details.
