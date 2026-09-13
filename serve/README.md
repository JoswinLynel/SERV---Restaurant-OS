# SERVÉ
**The Smarter Way to Dine**

A premium, multi-tenant restaurant ordering and management platform designed with a focus on Michelin-star hospitality and Apple-level product design.

## Features

- **Customer QR Ordering Experience**: A sleek, elegant mobile-first ordering interface that allows guests to browse visually rich menus, customize dishes with modifiers, and order directly from their table.
- **Kitchen Display System (KDS)**: Real-time, Kanban-style order management for the kitchen staff to track and update order statuses instantly.
- **Point of Sale (POS) & Floor Management**: A visual floor plan and table management system integrated seamlessly with billing and payment collection.
- **Multi-Tenant Architecture**: Robust Supabase PostgreSQL schema with Row Level Security (RLS) designed to support multiple restaurant organizations from a single backend.
- **Real-Time Synchronization**: Built on Supabase Realtime to ensure immediate updates across the customer view, kitchen, and POS.

## Tech Stack
- **Framework**: Next.js 16 (App Router)
- **Styling**: Tailwind CSS v4 (Custom Design System tokens)
- **Database**: Supabase / PostgreSQL
- **Icons**: Lucide React

## Getting Started

1. Set up your Supabase project and apply the schema in `supabase/migrations`.
2. Apply the seed data to test with the "Aurelia" demo restaurant.
3. Configure your local environment variables in `.env.local`:
   ```bash
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```
4. Install dependencies:
   ```bash
   npm install
   ```
5. Run the development server:
   ```bash
   npm run dev
   ```

## Design System

The application uses a custom set of brand tokens configured in `app/globals.css`:
- **Warm Ivory**: Backgrounds and light surfaces (`--color-brand-ivory`)
- **Charcoal**: Typography and borders (`--color-brand-charcoal`)
- **Near Black**: Buttons, primary actions, and deep contrast elements (`--color-brand-nearblack`)
- **Champagne Gold**: Accents, active states, and highlights (`--color-brand-gold`)

Typography relies on `Inter` (sans) for readability and `Playfair Display` (serif) for sophisticated headings.

---
*Created as a wholly independent, modern platform for elevated dining.*
