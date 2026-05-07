# PantryPilot - Smart Meal Planning & Inventory

A modern kitchen management application built with Next.js, MySQL, and AI.

## Features
- **Inventory Management**: Real-time tracking of food stock in Aiven MySQL.
- **AI Meal Planning**: Smart suggestions based on your pantry contents.
- **Recipe Extraction**: Import recipes from any URL using Genkit AI.
- **Shopping Lists**: Automatic generation of shopping lists for low-stock items.
- **Analytics**: Insights into consumption patterns and waste reduction.

## Tech Stack
- **Framework**: Next.js 15 (App Router)
- **Database**: Aiven MySQL (SSL Enabled)
- **Media**: Cloudinary
- **AI**: Genkit with Google Gemini
- **UI**: Shadcn UI, Tailwind CSS

## Database Setup
Run the `schema.sql` file in your MySQL environment to create the necessary tables.

## Deployment Instructions
```bash
echo "# meal-planner" >> README.md
git init
git add README.md
git commit -m "first commit"
git branch -M main
git remote add origin https://github.com/Emmanuel-Mukumbwa/meal-planner.git
git push -u origin main
```
