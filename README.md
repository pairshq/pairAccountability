# PairAccountability

**Progress happens together.**

A social-first accountability app that helps individuals and groups stay consistent with their personal, professional, financial, and wellness goals through shared commitments, structured check-ins, and supportive accountability.

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ 
- npm or yarn
- Expo CLI (`npm install -g expo-cli`)
- A Supabase account (free tier works great)

### 1. Install Dependencies

```bash
npm install
```

### 2. Set Up Supabase

1. Create a new project at [supabase.com](https://supabase.com)
2. Go to the SQL Editor and run the migration file:
   - Copy the contents of `supabase/migrations/001_initial_schema.sql`
   - Paste and run in the SQL Editor
3. Go to Project Settings > API to get your credentials

### 3. Configure Environment

Create a `.env` file from the example:

```bash
cp .env.example .env
```

Edit `.env` with your Supabase credentials:

```env
EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
```

### 4. Run the App

```bash
# Start Expo development server
npm start

# Or run directly on a platform
npm run ios     # iOS Simulator
npm run android # Android Emulator
npm run web     # Web browser
```

## 📱 Features

### Core MVP Features

- ✅ **User Accounts** - Email authentication with profile management
- ✅ **Goals** - Create goals with categories, frequency, and accountability type
- ✅ **Check-Ins** - Daily/weekly check-ins with optional reflections
- ✅ **Pair Accountability** - Partner with someone for mutual accountability
- ✅ **Group Accountability** - Share goals with groups
- ✅ **Streak Tracking** - Visual streak counters for motivation
- ✅ **Real-time Chat** - Instant messaging in groups
- ✅ **Dark Mode** - Full dark mode support

### Categories

- Personal
- Fitness
- Study
- Professional
- Financial
- Wellness

## 🎨 Design System

The app follows a minimal, Todoist-inspired design philosophy:

- **Primary Accent**: `#FAB300` (Golden Yellow)
- **Font**: Inter (system-ui fallback)
- **Principles**: Clean, calm, supportive, no visual clutter

## 📁 Project Structure

```
PairAccountability/
├── app/                    # Expo Router screens
│   ├── (auth)/             # Authentication screens
│   ├── (tabs)/             # Main tab navigation
│   ├── goal/               # Goal detail screens
│   └── group/              # Group detail screens
├── components/             # Reusable UI components
│   └── ui/                 # Core UI primitives
├── lib/                    # Utilities and configs
│   ├── supabase.ts         # Supabase client
│   └── constants.ts        # App constants
├── stores/                 # Zustand state management
├── types/                  # TypeScript types
├── hooks/                  # Custom React hooks
└── supabase/
    └── migrations/         # Database schema
```

## 🛠 Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | Expo (React Native) |
| Styling | NativeWind (Tailwind CSS) |
| Navigation | Expo Router |
| State | Zustand |
| Database | Supabase (PostgreSQL) |
| Auth | Supabase Auth |
| Real-time | Supabase Realtime |
| Icons | Lucide React Native |

## 📋 Database Schema

- `profiles` - User profiles with timezone support
- `goals` - User goals with category, frequency, accountability type
- `check_ins` - Daily/weekly check-in records
- `accountability_pairs` - Partner relationships
- `groups` - Group details with invite codes
- `group_members` - Group membership
- `group_messages` - Real-time chat messages
- `notifications` - In-app notification queue

## 🔒 Security

- Row Level Security (RLS) enabled on all tables
- Users can only access their own data
- Partners can view shared goals and check-ins
- Group members can view group content

## 📝 License

MIT

---

Built with ❤️ for accountability partners everywhere.

