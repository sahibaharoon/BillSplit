# BillSplit — A Smart Bill Splitting App

BillSplit is a modern web application designed to simplify group expense management. Whether it’s a trip with friends, a shared apartment, or a team lunch — effortlessly track, split, and settle shared expenses.

---

## Features

-   **User Authentication** — Secure sign-up/login using Supabase Auth with email/password and Google OAuth providers.
-   **Profile Management** — Users can manage their profile information, including full name, username, and avatar URL.
-   **Group Management** — Create groups for different purposes, invite members via email or a shareable link, and view all your groups in a centralized dashboard.
-   **Expense Tracking** — Add shared expenses within groups, assign who paid, and specify how the cost is split among members. Expenses can be categorized for better organization.
-   **Friend System** — Add friends by email, accept/decline friend requests, and easily add friends to your groups.
-   **Smart Settlement Calculation** — A dedicated edge function calculates the most efficient way to settle all debts within a group, minimizing the number of transactions required.
-   **Edge Functions** — Key business logic, like creating expenses and calculating balances, is handled by secure and performant Supabase Edge Functions.

---

## Tech Stack

### 💻 Frontend
- **React.js** — A JavaScript library for building user interfaces.
- **TypeScript** — For strong typing and improved developer experience.
- **Vite** — Next-generation frontend tooling for a fast development experience.
- **TailwindCSS** — A utility-first CSS framework for modern, responsive styling.
- **React Router** — For client-side routing and navigation.
- **Shadcn UI** — A collection of re-usable UI components.

### 🔙 Backend
- **Supabase** — The primary Backend-as-a-Service, providing:
    - **Authentication**: Manages user sign-up and login.
    - **PostgreSQL Database**: For all relational data storage.
    - **Edge Functions**: Deno-based serverless functions for secure backend logic.

---

## Database Schema (Supabase)

The database consists of several core tables to manage users, groups, and finances. The schema is defined in the migration files.

### `profiles`
Stores public user information linked to the `auth.users` table.

| Column | Type | Description |
| :--- | :--- | :--- |
| **id** | UUID | Primary Key. |
| **user\_id** | UUID | Foreign key to `auth.users`. Unique. |
| **username** | Text | User's unique username. |
| **email** | Text | User's email address. |
| **full\_name** | Text | User's full name (optional). |
| **avatar\_url** | Text | URL for the user's profile picture (optional). |

### `groups`
| Column | Type | Description |
| :--- | :--- | :--- |
| **id** | UUID | Primary Key for the group. |
| **name** | Text | Name of the group. |
| **description**| Text | Optional description for the group. |
| **created\_by** | UUID | The `user_id` of the group's creator. |

### `group_memberships`
Links users to groups and defines their role.

| Column | Type | Description |
| :--- | :--- | :--- |
| **id** | UUID | Primary Key. |
| **group\_id** | UUID | Foreign key to `groups`. |
| **user\_id** | UUID | Foreign key to `profiles`. |
| **role** | Text | User's role in the group (e.g., 'admin', 'member'). |

### `expenses`
| Column | Type | Description |
| :--- | :--- | :--- |
| **id** | UUID | Primary Key for the expense. |
| **group\_id** | UUID | The group this expense belongs to. |
| **paid\_by** | UUID | The `user_id` of the member who paid. |
| **amount** | Decimal | The total amount of the expense. |
| **description**| Text | A description of the expense. |
| **category** | Text | Category of the expense (e.g., 'food', 'transport'). |
| **date** | Date | The date the expense occurred. |

### `expense_splits`
Defines how a single expense is divided among members.

| Column | Type | Description |
| :--- | :--- | :--- |
| **id** | UUID | Primary Key. |
| **expense\_id**| UUID | Foreign key to `expenses`. |
| **user\_id** | UUID | The `user_id` of the member who owes a portion. |
| **amount** | Decimal| The specific amount this user is responsible for. |

### `friends`
Manages the social connections between users.

| Column | Type | Description |
| :--- | :--- | :--- |
| **id** | UUID | Primary Key. |
| **user\_id** | UUID | The `user_id` of the user who initiated the request. |
| **friend\_id** | UUID | The `user_id` of the user receiving the request. |
| **status** | Text | The status of the friendship ('pending', 'accepted', 'blocked'). |

### `settlements`
Tracks the process of settling debts between users.

| Column | Type | Description |
| :--- | :--- | :--- |
| **id** | UUID | Primary Key. |
| **group\_id** | UUID | The group where the settlement occurs. |
| **from\_user** | UUID | The `user_id` of the user who is paying the debt. |
| **to\_user** | UUID | The `user_id` of the user who is receiving the payment. |
| **amount** | Decimal| The amount being settled. |
| **status** | Text | The status of the settlement ('pending', 'completed'). |

### `group_invites`
Stores information for shareable group invitation links.

| Column | Type | Description |
| :--- | :--- | :--- |
| **id** | UUID | Primary Key. |
| **group\_id** | UUID | The group the invite is for. |
| **created\_by** | UUID | The `user_id` of the admin who created the invite. |
| **invite\_code** | Text | The unique code for the invite link. |
| **expires\_at** | Timestamptz| When the invite link is no longer valid. |
| **max\_uses** | Integer | The maximum number of times the invite can be used. |

---

## 📁 Project Structure

```bash
.
├── supabase/
│   ├── functions/
│   │   ├── calculate-settlements/
│   │   ├── create-expense/
│   │   ├── manage-group/
│   │   └── send-friend-email/
│   └── migrations/
├── src/
│   ├── components/
│   │   ├── ui/
│   │   ├── AddExpenseDialog.tsx
│   │   ├── CreateGroupDialog.tsx
│   │   └── ...
│   ├── hooks/
│   │   ├── useAuth.tsx
│   │   ├── useBalance.tsx
│   │   ├── useExpenses.tsx
│   │   └── ...
│   ├── integrations/
│   │   └── supabase/
│   ├── pages/
│   │   ├── Auth.tsx
│   │   ├── Dashboard.tsx
│   │   ├── GroupDetail.tsx
│   │   └── ...
│   ├── lib/
│   └── App.tsx
└── ... (config files)
```

---

### ⚡ Supabase Edge Functions
The application leverages serverless Edge Functions for key backend operations, ensuring security and performance.

#### `calculate-settlements`
-   **Trigger**: Manually called from the app.
-   **Action**: Fetches all expenses for a group, computes the net balance for each member, and calculates the minimum number of transactions required to settle all debts.
-   **Benefit**: Offloads complex and sensitive calculations from the client, ensuring data integrity and a speedy response.

#### `create-expense`
-   **Trigger**: Called when a user submits a new expense.
-   **Action**: Validates the input, creates a new record in the `expenses` table, and creates the associated records in the `expense_splits` table.

#### `manage-group`
- **Trigger**: Called when a user creates a new group, or an admin deletes one.
- **Action**: Handles the creation of a new group and the assignment of the creator as an admin, or handles the deletion of an existing group.

#### `send-friend-email`
-   **Trigger**: Called when a user sends a friend request.
-   **Action**: Sends a notification email to the recipient of the friend request.
