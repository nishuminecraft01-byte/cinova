# CINOVA — Stories. Anytime. Anywhere.

![CINOVA OTT Platform Banner](https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=1920&q=85)

> **CINOVA** is a modern, responsive OTT movie streaming platform engineered with Next.js 14, TypeScript, Tailwind CSS, and Supabase. Crafted with a premium dark cinematic aesthetic, vibrant violet glow accents, and responsive design across desktop, tablet, and mobile devices.

---

## 🌟 Visual Inspiration & Brand Identity

- **Reference Architecture:** Visual inspiration drawn from modern OTT layouts (such as Cineverse).
- **Brand Tagline:** *Stories. Anytime. Anywhere.*
- **Color Palette:**
  - Deep Charcoal / Black Canvas: `#08080c`, `#0f0f17`, `#14141f`
  - Violet / Purple Accents: `#8b5cf6`, `#7c3aed`, `#a855f7`
  - Ambient Glow: Neon violet drop shadows & glassmorphism overlays
- **Legal Compliance:** Integrated exclusively with authorized public-domain masters (Blender Studio open projects) and an explicit rights clearance pipeline for indie creators. Never crawls or scrapes unauthorized sources.

---

## 🚀 Key Modules & Capabilities

### 1. Cinematic Homepage (`/`)
- **Large OTT Hero Banner:** Dynamic multi-slide spotlight carousel featuring slide counters (`01 / 04`), title, match percentage, quality badges (4K UHD, Dolby Atmos), logline synopsis, **Watch Now**, and **More Info** CTAs.
- **Continue Watching Row:** Tracks real-time video progress with visual progress bars and quick resume.
- **Horizontal Movie Carousels:** Responsive horizontal sliders for *Trending on CINOVA*, *Binge-Worthy Web Series*, *Recently Added*, *Critically Acclaimed Features*, and *Cinova Indie Shorts*.
- **Universe Vaults:** Curated visual collection cards with title counts and genre tagging.

### 2. Rich Movie Cards & Quick Actions
- Vertical 2:3 cinematic aspect ratio.
- High-resolution poster with blur skeleton loader.
- Badges: 4K UHD / 1080p, IMDb star rating, release year, duration, language, and genre pills.
- Quick hover action overlay with instant **Watch**, **Add to Watchlist (+)**, and **View Details (i)** buttons.

### 3. Movie Details Page (`/title/[id]`)
- Full-bleed cinematic backdrop hero banner.
- High-definition poster with quality and audio format indicators.
- Complete storyline synopsis, directors, and starring cast list with photo avatars.
- Audio and subtitle track breakdown.
- Episodic accordion for Web Series.
- "More Like This" similar titles recommendation row.
- Instant share title button with clipboard integration.

### 4. Custom OTT Video Player (`/watch/[id]`)
- Dedicated full-viewport theater player.
- Custom styled playback controls:
  - Play / Pause (Spacebar shortcut)
  - 10-second rewind & forward (Arrow keys)
  - Volume slider & mute toggle (`M` key)
  - Fullscreen toggle (`F` key)
  - Scrubbable progress bar with real-time time indicators
  - Playback speed selector (0.75x, 1x, 1.25x, 1.5x)
  - Stream quality selector (4K UHD Master, 1080p FHD, 720p HD, Dynamic Auto)
  - Subtitle toggle overlay
- Automatic watch progress persistence to `localStorage` / Supabase.
- "Up Next on CINOVA" drawer below the player.

### 5. Search Engine & Multi-Filter (`/search`)
- Live debounced keyword search across titles, descriptions, cast, directors, and genres.
- Filter by Format: *All Formats*, *Movies*, *Web Series*, *Short Films*.
- Filter by Genre, Language, and Release Year.
- Sorting by: *Most Popular*, *Newest Releases*, *Highest Rated (IMDb)*, *Alphabetical (A-Z)*.

### 6. Creator Studio (`/creator`)
- Submission portal for independent filmmakers:
  - Title, logline, synopsis, genre, language, duration, release year.
  - Authorized video stream link (MP4 / HLS) and poster artwork URL.
  - License type selector (*Exclusive*, *Non-Exclusive Global SVOD*, *Creative Commons*, *Public Domain*).
  - Explicit distribution rights declaration statement and legal confirmation checkbox.
- Real-time submission audit queue tracker with editorial review notes.

### 7. Admin Command Center (`/admin`)
- Role-protected platform management interface:
  - **Overview Metrics:** Total catalog titles, active subscribers, total streaming views, and pending creator submissions.
  - **Film Library Table:** Search, add new title modal, edit metadata, and delete titles.
  - **Creator Review Queue:** Review filmmaker submissions, audit rights statements, and one-click **Approve & Publish** (which immediately pushes the title live to all viewers).
  - **Hero Banner Manager:** Configure which films are pinned to the homepage hero carousel.
  - **Automatic Content Ingestion Simulator:** Automated agent that validates public archives, checks stream health, auto-categorizes genres, and publishes verified records.

### 8. User Profiles & Watchlist (`/profile`)
- User avatar, membership tier (*Ultra 4K*), and active subscription renewal status.
- **My Watchlist:** View and remove saved titles.
- **Continue Watching:** Resumable titles with percent progress indicators.
- **Streaming Preferences:** Select default bitrate and toggle spatial Dolby Atmos audio.
- **Instant Persona Switcher:** Switch between Viewer (*Alex Morgan*), Creator (*David Vance*), and Admin (*Sarah Chen*) with a single click.

### 9. Monetization & Memberships (`/pricing`)
- Three-tier membership structure:
  - **CINOVA Free:** Ad-supported 720p streaming.
  - **CINOVA Standard ($8.99/mo):** 1080p Full HD, 2 devices, 100% ad-free, offline downloads.
  - **CINOVA Ultra 4K ($14.99/mo):** 4K UHD, HDR10+, Dolby Atmos, 4 devices, creator revenue sharing.
- Monthly vs Annual toggle with 20% savings badge.
- Interactive simulated checkout and tier activation modal.

---

## 🛠️ Technical Stack

- **Framework:** [Next.js 14](https://nextjs.org/) (App Router, Server & Client Components)
- **Language:** [TypeScript](https://www.typescriptlang.org/)
- **Styling:** [Tailwind CSS](https://tailwindcss.com/) with custom dark neon utilities
- **Icons:** [Lucide React](https://lucide.dev/)
- **Database & Auth:** [Supabase](https://supabase.com/) with seamless local fallback
- **Video Origin:** Authorized public-domain HLS/MP4 streams
- **Deployment Target:** [Vercel](https://vercel.com/) / GitHub

---

## 📦 Getting Started Locally

### Prerequisites
- Node.js 18.17+ or 20+ installed.

### 1. Clone & Install Dependencies
```bash
npm install
```

### 2. Configure Environment Variables (Optional)
CINOVA includes an intelligent fallback mechanism that is 100% functional out of the box with realistic mock data and persistent `localStorage`.

If you wish to connect your real Supabase instance, create a `.env.local` file:
```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

Execute the database schema script provided in `src/lib/supabase-schema.sql` inside your Supabase SQL Editor to initialize all tables and Row Level Security policies.

### 3. Run the Development Server
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### 4. Build for Production
```bash
npm run build
npm run start
```

---

## 🌐 Deploy to Vercel

1. Push this repository to GitHub.
2. Import the repository in the [Vercel Dashboard](https://vercel.com/new).
3. (Optional) Add your Supabase environment variables in the Vercel project settings.
4. Click **Deploy**. Vercel will automatically detect Next.js and build the production bundle.
