# Client Health Monitor

A professional performance-tracking platform built for high-stakes coaching and leadership oversight. This system automates client prioritization through predictive scoring logic and role-based data views.

## 🏗 Architecture & Tech Stack



* **Framework:** Next.js (App Router)
* **Database & Auth:** Supabase
* **Logic Layer:** Server-side sorting and predictive filtering.
* **Client-side:** Responsive, role-based dashboards.

## 📸 Dashboards

### Coach Interface
Focused on tactical day-to-day management. 
> *Logic: Sorted by `Last Score` (DESC), then `Last Input Date` (ASC) to surface overdue clients.*

![Coach Dashboard Screenshot Placeholder](path/to/coach-screenshot.png)

### Leadership Interface
A strategic bird's-eye view of organizational health.
> *Logic: Categorized by client risk zones (Priority 1: Score ≤ 2).*

![Leadership Dashboard Screenshot Placeholder](path/to/leadership-screenshot.png)

## 🛠 Features & Implementation

### Role-Based Prioritization
The core engine segments data based on the following functional constraints:
* **Priority 1:** Real-time filtering for clients with current or predictive scores **≤ 2**.
* **Priority 2:** All active clients not currently in the "Red Zone."

### Server-side Operations
* **Migrations:** Structured PostgreSQL schemas handled via Supabase CLI.
* **Seeding:** Comprehensive test seed scripts to simulate varied client health scenarios.
* **Data Integrity:** Row Level Security (RLS) policies ensuring data is partitioned by role and coach ID.

## 🚀 Local Development

### 1. Environment Configuration
Create a `.env.local` file with the following keys:

| Key | Description |
| :--- | :--- |
| `NEXT_PUBLIC_SUPABASE_URL` | Your Supabase Project URL |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Your Supabase Publishable Key |

### 2. Database Setup
```bash
# Apply migrations
supabase migration up