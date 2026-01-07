<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/drive/1fyHFX8XL4E4tNycanx-CmcYcM3EKvQ3k

## Run Locally

**Prerequisites:**  Node.js


1. Install dependencies:
   `npm install`
2. Set the `GEMINI_API_KEY` in [.env.local](.env.local) to your Gemini API key
3. Run the app:
   `npm run dev`

## Supabase Sync

Use Supabase to store synced records in a `records` table and read them back into the app.

### 1) Create the table

Create a `records` table with the following columns:

```
__backendId (text, primary key)
type (text)
timestamp (bigint)
businessId (text, nullable)
payload (jsonb)
```

### 2) Configure the app

Set the following environment variables (e.g., in `.env.local`):

```
VITE_SUPABASE_URL=<your Supabase project URL>
VITE_SUPABASE_ANON_KEY=<your anon key>
VITE_SUPABASE_TABLE=records
```

> Ensure your Supabase policies allow inserts and reads for the configured key.
