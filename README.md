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

Create a `.env` file in the root directory:

```env
EXPO_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
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

- **User Accounts** - Email authentication with profile management
- **Goals** - Create goals with categories, frequency, and accountability type
- **Check-Ins** - Daily/weekly check-ins with optional reflections
- **Pair Accountability** - Partner with someone for mutual accountability
- **Group Accountability** - Share goals with groups
- **Streak Tracking** - Visual streak counters for motivation
- **Real-time Chat** - Instant messaging in groups

## 🛠 Tech Stack

- **Frontend**: Expo (React Native)
- **Styling**: NativeWind (Tailwind CSS)
- **Navigation**: Expo Router
- **State**: Zustand
- **Database**: Supabase (PostgreSQL)
- **Auth**: Supabase Auth
- **Real-time**: Supabase Realtime

## 📝 License

MIT

---

Built with ❤️ for accountability partners everywhere.
