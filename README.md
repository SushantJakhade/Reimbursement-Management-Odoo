# Reimbursement Management System (Odoo-Inspired)

A premium, AI-powered reimbursement and expense management platform built with Next.js 14, Node.js, and Google's Gemini AI.

![Dashboard Preview](file:///Users/sushantjakhade/.gemini/antigravity/brain/36644867-cfaa-4199-83a4-eb8841e5b6c1/media__1774781266757.png)

## 🚀 Key Features

- **AI-Powered OCR**: Scan receipts instantly using **Gemini 2.5 Flash**. Automatically extracts merchant, date, amount, and currency with high precision.
- **Smart Analytics**: Live dashboard with monthly trend graphs, department spends, and real-time status tracking.
- **Budget Management**: Set multi-period budgets (Monthly, Quarterly, Yearly) with automated alert thresholds and progress tracking.
- **Automated Workflows**: Multi-step approval rules based on department, category, or amount limits.
- **Gamification**: Recognition points system for cost-efficient spending, integrated with a company-wide leaderboard.
- **Duplicate Detection**: AI-assisted detection of potential duplicate receipt submissions.
- **Localized for India**: Full support for INR (₹) and Indian localization defaults.

## 🛠 Tech Stack

### Frontend
- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: Vanilla CSS with CSS Variables (Premium Dark Theme)
- **Icons**: Lucide React
- **Charts**: Recharts

### Backend
- **Runtime**: Node.js (Express)
- **Database**: PostgreSQL (Prisma ORM)
- **AI Engine**: Google Generative AI (Gemini SDK)
- **Authentication**: JWT with Refresh Tokens

## 📦 Getting Started

### Prerequisites
- Node.js (v18+)
- PostgreSQL
- Gemini API Key ([Get one here](https://aistudio.google.com/))

### Installation

1. **Clone the repository**:
   ```bash
   git clone <repository-url>
   cd "Reimbursement Management Odoo"
   ```

2. **Configure Environment Variables**:
   Create a `.env` file in the root:
   ```env
   DATABASE_URL="postgresql://user:password@localhost:5432/reimbursement_db"
   GEMINI_API_KEY="your_api_key_here"
   JWT_SECRET="your_secret_here"
   ```

3. **Backend Setup**:
   ```bash
   npm install
   npx prisma migrate dev
   npx prisma db seed
   npm run dev
   ```

4. **Frontend Setup**:
   ```bash
   cd frontend
   npm install
   npm run dev
   ```

## 📂 Project Structure

- `src/modules/`: Domain-driven backend modules (Expense, Budget, Report, OCR, etc.)
- `frontend/src/app/`: Next.js App Router pages and layouts.
- `prisma/`: Database schema and migration files.
- `uploads/`: Temporary storage for scanned receipts.

---
Built with ❤️ by Team TRIGARTA.
