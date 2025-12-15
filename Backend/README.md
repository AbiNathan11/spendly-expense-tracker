# Spendly Backend API 🚀

Backend API for **Spendly** - A Smart Expense Tracker with AI-powered Receipt Scanning

## 📋 Table of Contents

- [Features](#features)
- [Tech Stack](#tech-stack)
- [Setup Instructions](#setup-instructions)
- [API Endpoints](#api-endpoints)
- [Database Schema](#database-schema)
- [Environment Variables](#environment-variables)
- [Running the Server](#running-the-server)

## ✨ Features

- 🔐 **Authentication**: Supabase Auth with JWT tokens
- 📊 **Envelope System**: Digital envelopes with negative balance support
- 💰 **Expense Tracking**: Full CRUD with automatic envelope updates
- 🤖 **AI Receipt Scanning**: OpenAI Vision for automatic receipt parsing
- 📅 **Bill Management**: Bill reminders with auto-expense creation
- 📈 **Reports**: Weekly/Monthly reports with PDF generation
- 🔒 **Row-Level Security**: Supabase RLS for data protection
- ☁️ **Cloud Storage**: Receipt storage in Supabase Storage

## 🛠️ Tech Stack

- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: PostgreSQL (via Supabase)
- **Authentication**: Supabase Auth
- **AI**: OpenAI GPT-4 Vision
- **File Upload**: Multer
- **PDF Generation**: PDFKit
- **Validation**: Express-validator

## 🚀 Setup Instructions

### 1. Install Dependencies

```bash
cd Backend
npm install
```

### 2. Set Up Supabase

1. Create a new project at [supabase.com](https://supabase.com)
2. Go to **SQL Editor** and run the schema from `database/schema.sql`
3. Go to **Storage** and create a bucket named `receipts` (make it public)
4. Copy your project URL and API keys from **Settings > API**

### 3. Set Up OpenAI

1. Get your API key from [platform.openai.com](https://platform.openai.com)
2. Make sure you have GPT-4 Vision access

### 4. Configure Environment Variables

Create a `.env` file in the Backend folder:

```bash
cp .env.example .env
```

Then fill in your credentials:

```env
PORT=3000
NODE_ENV=development

# Supabase
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# OpenAI
OPENAI_API_KEY=your-openai-api-key

# App Config
MAX_FILE_SIZE=5242880
ALLOWED_FILE_TYPES=image/jpeg,image/png,image/jpg
```

## 📡 API Endpoints

### Health Check
```
GET /health
```

### Envelopes
```
GET    /api/envelopes              - Get all envelopes
POST   /api/envelopes              - Create new envelope
PUT    /api/envelopes/:id          - Update envelope
DELETE /api/envelopes/:id          - Delete envelope
GET    /api/envelopes/stats        - Get envelope statistics
```

### Expenses
```
GET    /api/expenses               - Get all expenses (with filters)
POST   /api/expenses               - Create new expense
PUT    /api/expenses/:id           - Update expense
DELETE /api/expenses/:id           - Delete expense
GET    /api/expenses/daily-stats   - Get daily spending stats
```

### Receipts
```
POST   /api/receipts/scan          - Scan receipt with AI
POST   /api/receipts/upload        - Upload receipt without scanning
```

### Bills
```
GET    /api/bills                  - Get all bills (with filters)
POST   /api/bills                  - Create new bill
POST   /api/bills/:id/pay          - Mark bill as paid
PUT    /api/bills/:id              - Update bill
DELETE /api/bills/:id              - Delete bill
```

### Reports
```
GET    /api/reports/weekly         - Get weekly report
GET    /api/reports/monthly        - Get monthly report
GET    /api/reports/pdf            - Generate PDF report
```

## 🗄️ Database Schema

### Tables

- **user_settings**: User preferences and daily budget
- **envelopes**: Digital expense envelopes
- **expenses**: Transaction records
- **bills**: Bill reminders and payments

All tables have Row-Level Security (RLS) enabled for data protection.

## 🔐 Authentication

All API endpoints (except `/health`) require a Bearer token:

```
Authorization: Bearer <supabase-jwt-token>
```

The token is obtained from Supabase Auth on the frontend.

## 🏃 Running the Server

### Development Mode
```bash
npm run dev
```

### Production Mode
```bash
npm start
```

The server will run on `http://localhost:3000`

## 📸 Receipt Scanning Flow

1. User uploads receipt image
2. Image is stored in Supabase Storage
3. OpenAI Vision analyzes the receipt
4. Extracts: amount, shop name, date, category
5. Returns structured data to create expense

## 🎯 Key Features Explained

### Negative Balance Support
Envelopes can go negative to show overspending:
- Balance > 0: Green
- Balance crossing 80%: Yellow alert
- Balance < 0: Red (shows negative amount)

### Bill Payment Flow
When a bill is marked as paid:
1. Bill status updated to `is_paid = true`
2. Automatically creates an expense entry
3. Deducts from specified envelope
4. Records payment date

### Report Generation
- **Weekly**: Shows daily breakdown for the week
- **Monthly**: Shows daily status (green/yellow/red) and envelope usage
- **PDF**: Downloadable summary with motivational message

## 📝 Example API Calls

### Create Envelope
```json
POST /api/envelopes
{
  "name": "Food",
  "icon": "🍔",
  "allocated_amount": 5000,
  "month": 12,
  "year": 2025
}
```

### Scan Receipt
```
POST /api/receipts/scan
Content-Type: multipart/form-data

receipt: <image file>
```

### Create Expense
```json
POST /api/expenses
{
  "amount": 250.50,
  "description": "Lunch at restaurant",
  "envelope_id": "uuid-here",
  "date": "2025-12-13",
  "shop_name": "Restaurant Name",
  "receipt_url": "https://..."
}
```

## 🔧 Troubleshooting

### Common Issues

1. **OpenAI API Error**: Make sure you have GPT-4 Vision access
2. **Supabase Connection**: Verify your URL and keys are correct
3. **File Upload Error**: Check file size limits and MIME types
4. **RLS Error**: Ensure auth token is valid and user exists

## 📚 Additional Notes

- All amounts are stored as DECIMAL(10, 2)
- Dates use ISO format (YYYY-MM-DD)
- File uploads limited to 5MB
- Receipt images: JPEG, PNG only
- Currency defaults to INR (₹)

## 🤝 Contributing

Feel free to submit issues and enhancement requests!

---

Built with ❤️ for better spending habits
