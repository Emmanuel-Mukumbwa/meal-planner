
# PantryPilot - Smart Meal Planning & Inventory

PantryPilot is a modern kitchen management application built with Next.js 15, Aiven MySQL, and Genkit AI. It helps you track your groceries, import recipes from any URL, and generate AI-powered meal suggestions based on what you actually have in stock.

## 🚀 Key Features
- **Real-time Inventory**: Managed via Aiven MySQL with low-stock alerts.
- **AI Recipe Importer**: Paste any URL to extract ingredients and steps.
- **Smart Meal Suggester**: AI logic that checks your pantry before recommending recipes.
- **Auto-Restock Shopping List**: One-click generation of shopping lists for low-stock items.
- **Analytics Dashboard**: Track waste, savings, and consumption habits in Malawi Kwacha (MK).

## 🛠 Tech Stack
- **Framework**: Next.js 15 (App Router)
- **Database**: Aiven MySQL (SSL Enabled)
- **Media**: Cloudinary
- **AI Engine**: Google Gemini via Genkit
- **UI**: Shadcn UI + Tailwind CSS

## 📋 Database Setup
1. Log in to your Aiven MySQL console.
2. Execute the commands found in `schema.sql` to create the `pantry_pilot` database and required tables.

## 📦 Push to GitHub
Run these commands in your terminal to sync this project with your repository:

```bash
git init
git add .
git commit -m "Initial commit: Integrated Aiven MySQL, Cloudinary, and Genkit AI"
git branch -M main
git remote add origin https://github.com/Emmanuel-Mukumbwa/meal-planner.git
git push -u origin main
```

## ⚙️ Environment Variables
Ensure your `.env` file contains the following (already configured for you):
- `DB_HOST`, `DB_USER`, `DB_PASS`, `DB_NAME`, `DB_PORT`, `DB_SSL_CA`
- `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`
- `GOOGLE_GENAI_API_KEY` (for AI features)
