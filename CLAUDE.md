# Projex - Automated Projection & Deliverable Engine

## Project Overview
Multi-tenant SaaS platform for automated financial projection and professional deliverable generation for consulting firms.

## Tech Stack
- **Frontend:** Next.js 15 (App Router), React 19, Tailwind CSS, shadcn/ui, Recharts
- **Backend:** Convex (DB + Server Functions + Storage + Cron)
- **Auth:** Clerk Organizations (multi-tenant)
- **AI:** Claude API (Sonnet) for deliverable generation
- **Email:** Resend
- **PDF:** react-pdf
- **Deploy:** Vercel

## Project Structure
```
src/
  app/              # Next.js App Router pages
  components/       # React components (shadcn/ui based)
  lib/              # Utilities and helpers
convex/
  schema.ts         # Convex schema definition
  functions/        # Convex server functions (queries, mutations, actions)
```

## Key Commands
- `npm run dev` - Start dev server
- `npx convex dev` - Start Convex dev server
- `npm run build` - Production build
- `npm test` - Run tests

## Multi-Tenant Architecture
- All tables include `orgId` field for tenant isolation
- Clerk Organizations manages org membership
- Every query/mutation filters by the authenticated user's orgId
- Super Admin can access all organizations

## Business Logic
- Projection engine replicates Excel formulas (see docs/project-overview.md)
- Factor de Estacionalidad (FE) = Monthly Sales / (Annual Sales / 12)
- Budget distribution: remaining budget * (service weight / sum of active weights)
- Commissions calculated as % of monthly sales (proportional)

## BMAD Workflow
- Planning artifacts: `_bmad-output/planning-artifacts/`
- Implementation artifacts: `_bmad-output/implementation-artifacts/`
- Use bmad-automate CLI for story execution
