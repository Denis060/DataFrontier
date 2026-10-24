# DataFrontier — Everyday Data Science

> A full-stack publishing platform for practical data-science content — articles, cheat sheets, events, jobs and a newsletter — built with Next.js and Supabase. **Live:** [datafrontier.vercel.app](https://datafrontier.vercel.app)

![Next.js](https://img.shields.io/badge/Next.js-16-black.svg) ![Supabase](https://img.shields.io/badge/Supabase-Postgres%20%2B%20Auth-3ECF8E.svg) ![TypeScript](https://img.shields.io/badge/TypeScript-strict-3178C6.svg)

## Overview

DataFrontier is a community publication where data practitioners can read and write hands-on tutorials. It includes a writer workflow, an editorial/admin area and community features — a real product, not a template.

## Problem / Motivation

Most data-science content is either academic or shallow. The goal is a focused place for practical, example-driven articles, with tools for contributors to publish and for readers to find content, events and jobs.

## Approach & tech stack

- **Frontend:** Next.js 16 (App Router), React, TypeScript, Tailwind CSS v4
- **Backend:** Supabase (Postgres, Auth, Storage) with SQL migrations and row-level security
- **Editor:** Tiptap rich-text editor for authors
- **Email:** Resend for newsletter / transactional mail
- **Testing:** Playwright end-to-end tests
- **Hosting:** Vercel

## Key features

- Articles with author profiles and role-based permissions (writers, editors, admins)
- `/write` authoring flow and `/admin` moderation dashboard
- Cheat sheets, events and jobs boards
- Site search and RSS feed
- Newsletter sign-up and delivery
- Database access policies enforced with Supabase RLS

## How to run

```bash
npm install
cp .env.example .env.local   # add your own Supabase + Resend keys
npm run dev                  # http://localhost:3000
npm run test:e2e             # Playwright e2e tests
```

---

## About the author

**Ibrahim Denis Fofanah** — Data Scientist · ML / GenAI (RAG, agents) · BI & analytics · MS Data Science, Pace University (2025)

[LinkedIn](https://www.linkedin.com/in/ibrahim-denis-fofanah/) · [Email](mailto:ibrahim.fofanah.ds@gmail.com) · [Live RAG portfolio project](https://moijey-copilot.vercel.app) · [GitHub](https://github.com/Denis060)
