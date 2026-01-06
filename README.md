# 21Management - Multi-Game Esports Team Management Platform

## Overview

21Management is a comprehensive esports team management platform built with Next.js, supporting multiple competitive games including **Valorant** and **CS2**.

## Tech Stack

- **Frontend**: Next.js 16.0.7, React 18.3.1, TypeScript
- **Database**: Supabase (PostgreSQL)
- **Styling**: Tailwind CSS
- **i18n**: next-intl (English & French)
- **Deployment**: Vercel

## Multi-Game Support

The platform supports multiple esports titles with game-specific configurations:

### Supported Games

| Game | Roles | Features |
|------|-------|----------|
| **Valorant** | Duelist, Initiator, Controller, Sentinel, Flex | Agent Pool, Valorant Tracker |
| **CS2** | Entry Fragger, AWPer, Support, Lurker, IGL, Flex | Weapon Pool, CS Stats |

### Game Configuration Architecture

```
lib/types/games.ts           # Central game configuration
├── GameType                 # 'valorant' | 'cs2'
├── GAME_CONFIGS             # Full game configurations
│   ├── valorant
│   │   ├── roles            # ValorantRole[]
│   │   ├── ranks            # ValorantRank[]
│   │   ├── characters       # Agent list
│   │   └── maps             # ValorantMap[]
│   └── cs2
│       ├── roles            # CS2Role[]
│       ├── ranks            # CS2Rank[]
│       ├── characters       # Weapon list
│       └── maps             # CS2Map[]
└── Helper functions
    ├── getGameConfig()
    ├── isValidRole()
    └── getRolesForGame()
```

### Database Schema

The following tables support multi-game functionality:

```sql
-- Teams have a game type
teams.game: game_type ('valorant' | 'cs2')

-- Player profiles
profiles.game: game_type
profiles.character_pool: text[]      -- Agents/Weapons
profiles.tracker_url: text           -- Game stats URL

-- Tryouts/Scouts
profiles_tryouts.game: game_type
profiles_tryouts.character_pool: text[]

-- Match History
match_history.game: game_type
```

## Project Structure

```
21Management/
├── app/                        # Next.js App Router
│   ├── dashboard/
│   │   ├── admin/             # Admin panel
│   │   ├── manager/           # Team manager views
│   │   └── player/            # Player views
│   ├── api/                   # API routes
│   └── availability/          # Public availability forms
├── components/
│   ├── GameSelector.tsx       # Game selection component
│   ├── TeamForm.tsx           # Team creation/editing
│   ├── PlayerForm.tsx         # Player management
│   ├── TryoutForm.tsx         # Tryout/Scout forms
│   └── UserForm.tsx           # User management
├── lib/
│   ├── types/
│   │   ├── games.ts           # Game configurations
│   │   └── database.ts        # Database types
│   ├── supabase/              # Supabase client
│   └── i18n/                  # Internationalization
├── database/
│   └── migrations/            # SQL migrations
└── messages/                  # i18n translations
    ├── en.json
    └── fr.json
```

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn
- Supabase account

### Installation

```bash
# Clone the repository
git clone <repo-url>
cd 21Management

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env.local
# Edit .env.local with your Supabase credentials

# Run database migrations
# (See database/migrations/ for SQL files)

# Start development server
npm run dev
```

### Environment Variables

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

## Features

### Admin Dashboard
- User management (players, managers, admins)
- Team creation and configuration
- Tryout/Scout database management
- Statistics and analytics
- Match history tracking

### Manager Dashboard
- Team roster management
- Player recruitment (tryouts)
- Schedule management
- Team communication

### Player Dashboard
- Profile management
- Availability submission
- Team schedule view

## Multi-Game Implementation Guide

### Adding a New Game

1. **Update types** in `lib/types/games.ts`:
```typescript
export type GameType = 'valorant' | 'cs2' | 'newgame'

// Add game config
export const GAME_CONFIGS = {
  // ... existing configs
  newgame: {
    id: 'newgame',
    name: 'New Game',
    shortName: 'NG',
    roles: [...],
    ranks: [...],
    characters: [...],
    maps: [...]
  }
}
```

2. **Run SQL migration**:
```sql
ALTER TYPE game_type ADD VALUE 'newgame';
```

3. **Update translations** in `messages/en.json` and `messages/fr.json`

4. **Update UI components** to handle the new game's specific features

## Branches

- `main` - Production-ready code
- `feature/multi-game-cs2-support` - Multi-game support implementation

## License

Private - 21 Esports Organization

## Contributors

- 21 Esports Team
