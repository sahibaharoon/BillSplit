# BillSplit — A Smart Bill Splitting App

BillSplit is a modern web application designed to simplify group expense management. Whether it’s a trip with friends, a shared apartment, or a team lunch — effortlessly track, split, and settle shared expenses.

---

##  Features

-  **User Authentication** — Secure sign-up/login using Supabase Auth.
-  **Group Management** — Create groups, invite members, and manage memberships.
-  **Expense Tracking** — Add shared expenses within groups and assign who paid for what.
-  **Balance Calculation** — Automatically calculate how much each member owes or is owed.
-  **Friend Invites** — Send invite links to add friends directly into groups.
-  **Edge Functions** — Supabase Edge Functions handle complex balance calculations for fast and secure computations.

---

##  Tech Stack

### 💻 Frontend
- **React.js** — Functional, component-based UI.
- **TailwindCSS** *(optional)* — For modern, responsive styling.
- **React Router** — Client-side routing.

### 🔙 Backend
- **Supabase** — Backend-as-a-Service with:
  - Authentication (email/password)
  - Database (PostgreSQL)
  - Edge Functions (for balance logic)
  - Storage (if you handle profile images)

### ⚙️ Additional Tools
- **PostgreSQL** via Supabase for relational data storage.
- **Supabase Edge Functions** using Deno to handle advanced server-side logic like balance computation.

---

## Database Schema (Supabase)

Here are some of the core tables:

### `users`
| Column         | Type    | Description                   |
|----------------|---------|-------------------------------|
| id             | UUID    | Primary Key (from Auth)       |
| name           | Text    | User's full name              |
| email          | Text    | User's email                  |

### `groups`
| Column         | Type    | Description                   |
|----------------|---------|-------------------------------|
| id             | UUID    | Group ID                      |
| name           | Text    | Group name                    |
| created_by     | UUID    | User ID of group creator      |

### `group_members`
| Column         | Type    | Description                   |
|----------------|---------|-------------------------------|
| group_id       | UUID    | Foreign key to `groups`       |
| user_id        | UUID    | Foreign key to `users`        |

### `expenses`
| Column         | Type    | Description                   |
|----------------|---------|-------------------------------|
| id             | UUID    | Expense ID                    |
| group_id       | UUID    | Associated group              |
| description    | Text    | What the expense was for      |
| amount         | Float   | Total amount                  |
| paid_by        | UUID    | User ID who paid              |
| split_between  | Array   | List of user IDs to split     |
| created_at     | Timestamptz | Date of entry             |

### `balances`
| Column         | Type    | Description                   |
|----------------|---------|-------------------------------|
| group_id       | UUID    | Group ID                      |
| user_id        | UUID    | Who owes                      |
| owes_to        | UUID    | Who is owed                   |
| amount         | Float   | How much is owed              |

---

## 📁 Project Structure


```bash
├── public
├── src
│   ├── components
│   ├── pages
│   ├── hooks
│   ├── services
│   └── App.jsx
├── supabase
│   └── functions
├── .env
├── .gitignore
├── README.md
├── bun.lockb
├── components.json
├── eslint.config.js
├── group-settle-flow.zip
├── index.html
├── package-lock.json
├── package.json
├── postcss.config.js
├── tailwind.config.ts
├── tsconfig.app.json
├── tsconfig.json
├── tsconfig.node.json
└── vite.config.ts
```

---

## ⚡ Supabase Edge Function: `calculateBalances`

This function is triggered:
- After every new expense is created.
- Recalculates net balance of each member.
- Reduces complex logic on the frontend and improves performance.

```ts
// Pseudo-code of the function
for each group:
  get all expenses
  for each member:
    compute what they paid and what they owe
    update balances table
