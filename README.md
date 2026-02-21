# CampusReclaim – Lost & Found Web App

A fully responsive college campus Lost & Found platform built with **HTML, CSS, JavaScript** and **Supabase** (Auth + PostgreSQL + Storage).

---

## 🚀 Quick Setup

### Step 1 – Create a Supabase Project

1. Go to [supabase.com](https://supabase.com) and create a free account.
2. Click **New Project**, fill in project name, database password, and region.
3. Wait for the project to be ready (~1–2 minutes).

### Step 2 – Run the SQL Schema

1. In your Supabase Dashboard, go to **SQL Editor → New Query**.
2. Open `supabase_schema.sql` from this folder.
3. Paste the entire contents and click **Run**.
4. You should see all tables (`profiles`, `items`, `claims`) created, along with the `item-images` storage bucket and all RLS policies.

### Step 3 – Add Your Credentials

1. In Supabase Dashboard, go to **Project Settings → API**.
2. Copy your **Project URL** and **anon public** key.
3. Open `js/supabase.js` and replace:
   ```js
   const SUPABASE_URL = 'YOUR_SUPABASE_URL';
   const SUPABASE_ANON_KEY = 'YOUR_SUPABASE_ANON_KEY';
   ```
   with your actual values.

### Step 4 – Run the App

Open `index.html` with **VS Code Live Server** (recommended) or any local HTTP server. Do **not** open it directly as a `file://` URL — Supabase requires HTTP.

> **VS Code**: Right-click `index.html` → "Open with Live Server"

---

## 📁 Project Structure

```
lostandfound/
├── index.html              # Auth page (Login / Sign Up)
├── dashboard.html          # Main dashboard
├── supabase_schema.sql     # Run this in Supabase SQL Editor
│
├── css/
│   ├── styles.css          # Global design system
│   ├── auth.css            # Auth page styles
│   └── dashboard.css       # Dashboard styles
│
└── js/
    ├── supabase.js         # ← Add your credentials here
    ├── utils.js            # Helper utilities
    ├── auth.js             # Login / Signup / Logout
    ├── items.js            # Item CRUD + image upload
    ├── claims.js           # Claim requests logic
    ├── leaderboard.js      # Points leaderboard
    └── dashboard.js        # Dashboard UI controller
```

---

## ✨ Features

| Feature | Details |
|---|---|
| 🔐 Auth | Email + password sign up / login via Supabase Auth |
| 📍 Report Lost | Name, description, category, date, location, image upload |
| 🎯 Report Found | Same fields – report an item you found |
| 🃏 Item Cards | Image, type badge, status badge, meta info, actions |
| 🔎 Search | Real-time search by name, description, location |
| 🏷️ Filters | Filter by category and status |
| 🙋 Claims | Any user can claim a found item; owner approves/rejects |
| 🏆 Points | Finder earns **+10 points** when a claim is approved |
| 📊 Leaderboard | Users ranked by total points |
| 📱 Responsive | Works on desktop, tablet, and mobile |

---

## 🗄️ Database Schema

### `profiles`
| Column | Type | Notes |
|---|---|---|
| id | uuid | FK → auth.users |
| username | text | unique |
| avatar_url | text | optional |
| points | int | default 0 |
| created_at | timestamptz | |

### `items`
| Column | Type | Notes |
|---|---|---|
| id | uuid | PK |
| user_id | uuid | FK → profiles |
| type | text | 'lost' or 'found' |
| name | text | |
| description | text | |
| category | text | |
| date_occurred | date | |
| location | text | |
| image_url | text | Supabase Storage URL |
| status | text | Open / Pending / Resolved |
| created_at | timestamptz | |

### `claims`
| Column | Type | Notes |
|---|---|---|
| id | uuid | PK |
| item_id | uuid | FK → items |
| claimer_id | uuid | FK → profiles |
| owner_id | uuid | FK → profiles |
| status | text | Pending / Approved / Rejected |
| created_at | timestamptz | |

---

## 🔧 Troubleshooting

- **"Invalid API Key"** – Double-check your `SUPABASE_URL` and `SUPABASE_ANON_KEY` in `js/supabase.js`.
- **Images not uploading** – Make sure the `item-images` bucket exists and is public. Re-run the SQL schema.
- **Can't sign in after signup** – Supabase requires email confirmation by default. Disable it in: Authentication → Settings → Email confirmations → Off (for development).
- **RLS errors** – Make sure you ran the full SQL schema including the policy section.
