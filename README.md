
# PantryPilot - Smart Meal Planning & Inventory

PantryPilot is a modern kitchen management application built with Next.js 15, Aiven MySQL, and Genkit AI. It helps you track your groceries, import recipes from any URL, and manage your kitchen efficiently to reduce waste.

## 🚀 Key Features
- **Real-time Inventory**: Managed via Aiven MySQL with low-stock alerts.
- **AI Recipe Importer**: Paste any URL to extract ingredients and steps using Google Gemini.
- **Smart Meal Suggester**: AI logic that checks your pantry before recommending recipes.
- **Freezer Leftovers Tracking**: Record cooked meals, categorize them (Meat, Soup, etc.), and monitor their storage duration with automated alerts to ensure you eat them before they expire.
- **Auto-Restock Shopping List**: One-click generation of shopping lists based on low-stock items.
- **Analytics Dashboard**: Track waste, savings, and consumption habits in Malawi Kwacha (MK).

## 🛠 Tech Stack
- **Framework**: Next.js 15 (App Router)
- **Database**: Aiven MySQL (SSL Enabled)
- **Media**: Cloudinary
- **AI Engine**: Google Gemini via Genkit
- **UI**: Shadcn UI + Tailwind CSS

## 📋 Database Setup
1. Log in to your Aiven MySQL console.
2. Execute the commands found in `schema.sql` to create the `pantry_pilot` database and required tables (including the new `leftovers` table).

## 📦 Sync with GitHub
If you have already initialized your repo, run these commands to push your changes:

```bash
git add .
git commit -m "Add Freezer Leftovers tracking and Malawi Kwacha currency support"
git remote add origin https://github.com/Emmanuel-Mukumbwa/meal-planner.git
git push -u origin main
```

## ⚙️ Environment Variables (Vercel Setup)
When hosting on Vercel, ensure you add the following variables in the dashboard:
- `DB_HOST`, `DB_USER`, `DB_PASS`, `DB_NAME`, `DB_PORT`, `DB_SSL_CA`
- `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`
- `GOOGLE_GENAI_API_KEY`
