# Crust & Co: Pizza Delivery Application (MERN)

React + Node/Express + MongoDB. Covers all 10 requirements of the brief.

## Setup
Prerequisites: Node 18+, MongoDB running locally (or an Atlas URI).

```bash
# 1. Backend
cd server
cp .env.example .env      # fill in values (see below)
npm install
npm run seed              # creates inventory, 5 pizzas and the admin account
npm run dev               # http://localhost:5000

# 2. Frontend (new terminal)
cd client
cp .env.example .env
npm install
npm run dev               # http://localhost:5173
```

## Config you must provide in server/.env
- **Razorpay test keys**: create a free account, switch to Test Mode, Settings > API Keys. Paste Key ID and Secret.
  In the checkout popup choose Netbanking (or any test method) and click **Success**.
- **SMTP** for verification, reset and low-stock emails. Leave `SMTP_HOST` empty to print emails in the server console
  (copy the verify link from there while developing). Gmail: use an App Password.
- `ADMIN_EMAIL` / `ADMIN_PASSWORD`: admin login created by the seed script. Low-stock alerts go to `ADMIN_EMAIL`.

## How the brief maps to the code
| # | Requirement | Where |
|---|---|---|
| 1 | MERN stack | `client/`, `server/` |
| 2 | Register, login, email verification, forgot/reset password, admin vs user role | `server/routes/auth.js`, `client/src/pages/Auth.jsx` |
| 3 | Pizza varieties on dashboard | `Dashboard.jsx` (Menu tab), `GET /api/pizzas` |
| 4 | Custom pizza: 5 bases, 5 sauces, cheese, veggies | `Dashboard.jsx` (Build your own tab) |
| 5 | Razorpay test checkout, confirm order on success | `routes/shop.js` (`/checkout`, `/verify-payment` with signature check) |
| 6 | Admin inventory: base, sauce, cheese, veggies, meat | `Admin.jsx`, `routes/admin.js` |
| 7 | Stock reduces after each paid order, shown in admin | `server/stock.js` (`deduct`) |
| 8 | Email admin when stock falls below threshold | `stock.js` (`checkLowStock`, runs after every order and hourly via node-cron) |
| 9 | Admin updates status: Order received, In the kitchen, Sent to delivery | `Admin.jsx`, `PATCH /api/admin/orders/:id/status` |
| 10 | Status shown on the user dashboard | `Dashboard.jsx` (My orders tab, refreshes every 8 s) |

Each item has its own threshold (default 20). Alerts send once per drop and re-arm when you restock above the threshold.
