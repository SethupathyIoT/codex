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

## Google Sheets Sync (Apps Script)

Use the provided Apps Script (`apps-script/Code.gs`) to store synced records in a Google Sheet and
expose them via a web app endpoint.

### 1) Create the Google Sheet

Create a new Google Sheet and add a single tab named `records` with the following header row:

```
__backendId | type | timestamp | businessId | payload | updatedBy
```

> Note: You can also create one tab per record type (`company`, `employee`, `bill`, `payment`, `foodItem`, `settings`),
> but the included script assumes the single `records` tab with the `type` column.

### 2) Add the Apps Script

1. Open **Extensions → Apps Script**.
2. Replace the default `Code.gs` contents with `apps-script/Code.gs` from this repo.
3. Update `CONFIG.authToken` with a shared secret string.

The script implements:

* `doPost(e)` to upsert records by `__backendId`
* `doGet(e)` to return records filtered by `businessId` and optional `since` timestamp
* Basic auth by checking an `X-Api-Token` header (or `?token=...` fallback)

### 3) Deploy as a Web App

1. Click **Deploy → New deployment**.
2. Select **Web app**.
3. **Execute as:** you.
4. **Who has access:** anyone with the link.
5. Click **Deploy**, then copy the web app URL.

### 4) Configure the app

Set the following environment variables (e.g., in `.env.local`):

```
VITE_API_URL=<your web app URL>
VITE_API_TOKEN=<shared secret token>
```
