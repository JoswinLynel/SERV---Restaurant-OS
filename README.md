# SERVÉ

### The smarter way to dine.

SERVÉ is a premium restaurant ordering, POS, kitchen, and management platform designed to modernise the entire dining experience.

The goal is simple: make ordering easier for guests, operations easier for staff, and restaurants more profitable.

---

## ✦ Vision

SERVÉ brings the complete restaurant experience into one connected platform:

**Guest → QR Menu → Order → Payment → Kitchen → POS → Service → Analytics**

Customers can scan a table QR code, browse the restaurant's menu, customise items, place an order, pay securely, and follow the status of their order.

Restaurant teams receive orders in real time through the kitchen and POS interfaces while management gains visibility through a central dashboard.

---

## ✦ Core Features

### Customer Ordering

- Table QR-code ordering
- Mobile-first menu
- Categories and menu sections
- Food and drink descriptions
- Images and pricing
- Item customisation
- Add-ons and modifiers
- Special requests
- Order notes
- Cart management
- Order status tracking
- Dine-in ordering
- Takeaway ordering

### Payments

- Secure online payments
- Stripe integration
- Card payments
- Apple Pay
- Google Pay
- Payment status tracking
- Automatic payment/order reconciliation

### Kitchen Display

- Real-time incoming orders
- Order queue
- Preparation status
- Item-level status
- Priority indicators
- Ready-for-service workflow
- Completed order history

### POS

- Restaurant order management
- Cash payments
- Card payments
- Order lookup
- Table orders
- Takeaway orders
- Refund workflows
- Payment reconciliation
- Staff access controls

### Table Management

- Restaurant floor plan
- Table numbers
- Table status
- QR codes per table
- Occupancy tracking
- Active orders by table
- Table session management

### Menu Management

- Categories
- Menu items
- Prices
- Images
- Modifiers
- Availability
- Dietary information
- Item descriptions
- Menu publishing controls

### Restaurant Dashboard

- Revenue overview
- Orders
- Average order value
- Popular menu items
- Sales trends
- Payment information
- Operational insights
- Restaurant configuration

### Staff Management

- Staff accounts
- Role-based permissions
- Admin access
- Manager access
- Kitchen access
- POS access
- Secure authentication

### Multi-Location Support

Designed to support restaurant groups operating multiple venues from one platform.

- Multiple restaurants
- Location-specific menus
- Location-specific staff
- Location-specific tables
- Location-specific orders
- Centralised management

### Customer Experience

Future-ready customer functionality can include:

- Customer profiles
- Order history
- Loyalty
- Rewards
- Promotions
- Personalised recommendations
- Customer communication

---

# ✦ Technology

SERVÉ is designed as a modern full-stack SaaS application.

### Frontend

- Next.js
- React
- TypeScript
- Tailwind CSS
- Responsive design

### Backend

- Next.js server architecture
- Supabase
- PostgreSQL
- Supabase Auth
- Supabase Storage
- Supabase Realtime

### Payments

- Stripe

### Infrastructure

- Vercel-compatible deployment
- Cloud-hosted PostgreSQL
- Realtime event infrastructure
- Secure environment configuration

---

# ✦ Architecture

SERVÉ uses a multi-tenant SaaS architecture.

A simplified flow:

```text
Customer
   │
   ▼
QR Code
   │
   ▼
SERVÉ Customer App
   │
   ├── Menu
   ├── Cart
   ├── Order
   └── Payment
          │
          ▼
      Order System
       │       │
       ▼       ▼
    Kitchen    POS
       │       │
       └───┬───┘
           ▼
       Restaurant
        Dashboard
```

The system is designed so that an order can move through the restaurant workflow in real time without requiring staff to manually re-enter information.

---

# ✦ Data Architecture

The platform is intended to use a relational PostgreSQL data model.

Core entities include:

```text
Organisation
Restaurant
Location
User
Staff
Role
Permission
Table
QR Code
Menu
Menu Category
Menu Item
Modifier
Order
Order Item
Payment
Kitchen Ticket
Customer
Customer Address
Loyalty Account
Promotion
Audit Log
```

The exact production schema should evolve during implementation based on the application's requirements.

---

# ✦ Security

Security is a core requirement of SERVÉ.

The application should implement:

- Secure authentication
- Role-based access control
- Tenant isolation
- Server-side authorisation
- Protected API routes
- Input validation
- Secure payment processing
- Environment-variable secrets
- Database access policies
- Audit logging for sensitive actions
- Protection against common web vulnerabilities
- GDPR-conscious data handling

SERVÉ should never store raw card details. Payment information should be handled through the payment provider.

---

# ✦ Independent Product & Intellectual Property

SERVÉ is intended to be an independently developed commercial software product.

The implementation, branding, visual identity, user interface, database design, documentation, and original assets should be created independently for SERVÉ.

SERVÉ may be informed by general restaurant-industry workflows and publicly available concepts, but it should not copy another project's:

- Source code
- UI implementation
- Database schema
- Branding
- Logos
- Text
- Images
- Proprietary assets
- Project-specific architecture

Third-party libraries and dependencies remain subject to their respective licences.

---

# ✦ Licence

SERVÉ is an independent commercial software project.

**Copyright © 2026 SERVÉ. All rights reserved.**

Unless explicitly stated otherwise, the SERVÉ source code, branding, designs, documentation, and original assets are proprietary and may not be copied, modified, distributed, sublicensed, or commercially exploited without written permission.

Third-party libraries and dependencies remain subject to their respective licences.

> Note: The final legal ownership and licence wording should be reviewed by appropriate legal counsel before commercial distribution.

---

# ✦ Development Setup

## Requirements

Install:

- Node.js
- npm
- Git
- A Supabase project
- A Stripe account for payment testing

---

## Environment Variables

Create a local environment file:

```bash
.env.local
```

Example:

```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=

STRIPE_SECRET_KEY=
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=
STRIPE_WEBHOOK_SECRET=
```

Never commit production secrets to source control.

---

# ✦ Local Development

Install dependencies:

```bash
npm install
```

Start the development server:

```bash
npm run dev
```

The application should then be available at:

```text
http://localhost:3000
```

---

# ✦ Production Build

Run:

```bash
npm run build
```

Then:

```bash
npm start
```

Before deployment, production configuration, database policies, payment webhooks, authentication, and environment variables should be verified.

---

# ✦ Design Philosophy

SERVÉ is designed around **premium hospitality rather than generic restaurant software**.

The visual direction should feel like:

> **Michelin-star hospitality meets Apple-level product design.**

### Visual Principles

- Dark luxury aesthetic
- Near-black and charcoal surfaces
- Warm ivory typography
- Restrained champagne/gold accents
- Elegant serif display typography
- Clean modern sans-serif interface typography
- High-quality food photography
- Generous whitespace
- Minimal visual clutter
- Subtle borders
- Refined shadows
- Limited use of rounded containers
- Smooth, purposeful animation

The interface should feel sophisticated, calm, premium, and trustworthy.

Avoid:

- Generic SaaS dashboards
- Excessive gradients
- Excessive rounded cards
- Visual clutter
- Cheap-looking colours
- Overly playful restaurant UI
- Unnecessary animations

---

# ✦ Product Experience

SERVÉ should feel consistent across three primary experiences.

## Guest

Fast, elegant, mobile-first.

The customer should be able to:

```text
Scan
  ↓
Browse
  ↓
Choose
  ↓
Customise
  ↓
Order
  ↓
Pay
  ↓
Track
```

## Restaurant Staff

Fast, clear, operational.

Staff should immediately understand:

- What has been ordered
- Which table ordered it
- What needs preparing
- What is ready
- What has been paid
- What needs attention

## Management

Insight-driven.

Managers should be able to understand:

- Sales
- Orders
- Customers
- Menu performance
- Restaurant performance
- Staff activity
- Operational trends

---

# ✦ SaaS Model

SERVÉ is intended to operate as a restaurant SaaS platform.

A potential commercial model may include:

- Initial setup fee
- Monthly subscription
- Optional transaction/platform fee
- Optional hardware
- Premium features
- Multi-location plans

Final pricing should be determined after validating the product with restaurants and understanding the operating costs.

---

# ✦ Roadmap

## Phase 1 — Foundation

- [ ] Project architecture
- [ ] Authentication
- [ ] Multi-tenant database
- [ ] Restaurant onboarding
- [ ] User roles
- [ ] Core UI system
- [ ] Design system

## Phase 2 — Restaurant Setup

- [ ] Restaurant profile
- [ ] Locations
- [ ] Tables
- [ ] QR generation
- [ ] Menu management
- [ ] Categories
- [ ] Modifiers
- [ ] Item availability

## Phase 3 — Customer Ordering

- [ ] QR entry
- [ ] Mobile menu
- [ ] Cart
- [ ] Modifiers
- [ ] Order placement
- [ ] Order status
- [ ] Customer account

## Phase 4 — Payments

- [ ] Stripe integration
- [ ] Card payments
- [ ] Apple Pay
- [ ] Google Pay
- [ ] Payment confirmation
- [ ] Webhooks
- [ ] Refund workflow

## Phase 5 — Kitchen

- [ ] Kitchen display
- [ ] Realtime orders
- [ ] Order status
- [ ] Preparation workflow
- [ ] Ready notifications

## Phase 6 — POS

- [ ] POS interface
- [ ] Table orders
- [ ] Takeaway orders
- [ ] Cash payments
- [ ] Card payments
- [ ] Order history
- [ ] Refunds

## Phase 7 — Management

- [ ] Dashboard
- [ ] Sales analytics
- [ ] Menu analytics
- [ ] Customer analytics
- [ ] Staff management
- [ ] Audit logs

## Phase 8 — Growth

- [ ] Loyalty
- [ ] Promotions
- [ ] Customer profiles
- [ ] Multi-location management
- [ ] Advanced reporting
- [ ] AI-powered insights

---

# ✦ Future AI Features

SERVÉ can eventually incorporate AI to help restaurants make better operational decisions.

Potential capabilities include:

### AI Menu Insights

Identify:

- Best-selling dishes
- Underperforming dishes
- Menu trends
- Potential pricing opportunities

### AI Demand Forecasting

Predict:

- Busy periods
- Expected order volume
- Popular items
- Staffing requirements

### AI Recommendations

Suggest:

- Menu combinations
- Upsells
- Add-ons
- Personalised recommendations

### AI Restaurant Assistant

A management assistant could answer questions such as:

```text
"What were our best-selling dishes this week?"

"Which table generated the highest order value?"

"What time was our busiest period yesterday?"

"Which menu items are declining in sales?"
```

---

# ✦ Target Market

SERVÉ is initially designed for:

- Independent restaurants
- Premium restaurants
- Casual dining
- Fine dining
- Cafés
- Bars
- Restaurant groups
- Hospitality businesses

The platform should be flexible enough to support both independent venues and multi-location operators.

---

# ✦ Quality Standards

Before production release, every major feature should be tested for:

- Functional correctness
- Mobile responsiveness
- Accessibility
- Security
- Performance
- Error handling
- Payment reliability
- Realtime reliability
- Data isolation
- User permissions
- GDPR considerations

Production releases should not rely solely on manual testing.

---

# ✦ Project Status

**Status: Active development**

SERVÉ is being developed as an independent commercial restaurant technology platform.

The architecture, product design, implementation, and branding are intended to evolve through real-world restaurant testing and customer feedback.

---

## SERVÉ

**The smarter way to dine.**

Premium hospitality technology for the modern restaurant.
