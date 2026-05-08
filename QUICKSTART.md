# 🚀 AI Approval Assistant - Quick Start Guide

Welcome! This guide will help you set up and run the complete AI-powered enterprise approval assistant.

## What You Have

✅ **Ready-to-use JavaScript initialization scripts** that create all project files  
✅ **Full-stack application** (React frontend + Node.js Express backend)  
✅ **SQLite database** with 8 pre-seeded approval requests  
✅ **Mock AI engine** for intelligent request analysis

## Quick Setup (3 Minutes)

### Step 1: Run the initialization script

Open a terminal/cmd in the `C:\Users\ngadewar\Desktop\Hackathon\` directory and run:

```bash
node create-all-files.js
```

This will create all backend and frontend files automatically.

### Step 2: Install Backend Dependencies

```bash
cd backend
npm install
```

This installs: Express, SQLite driver, CORS, Multer, UUID

### Step 3: Start the Backend Server

```bash
npm start
```

You'll see:
```
🚀 AI Approval Backend running on http://localhost:3001
```

### Step 4: Install Frontend Dependencies (in a NEW terminal)

```bash
cd frontend
npm install
```

This installs: React, Vite, Tailwind CSS, Axios, and dependencies

### Step 5: Start the Frontend Dev Server

```bash
npm run dev
```

You'll see:
```
➜  Local:   http://localhost:5173/
```

### Step 6: Open in Browser

Visit **http://localhost:5173** and start exploring! 🎉

---

## What Each File Does

### Initialization Scripts

| File | Purpose |
|------|---------|
| `create-all-files.js` | Creates backend + frontend files + configs |
| `create-components.js` | Creates additional React components (if needed) |
| `initialize.js` | Alternative initializer (same as create-all-files) |
| `setup.py` | Python-based initializer |
| `init.bat` | Batch file initializer for Windows |

### Choose ONE initialization method:
- **Recommended**: `node create-all-files.js` (most compatible)
- Alternative: `node initialize.js`
- Alternative: `python setup.py`
- Alternative: `init.bat`

---

## Project Structure After Setup

```
Hackathon/
├── backend/
│   ├── routes/
│   │   ├── requests.js       # Request CRUD endpoints
│   │   └── dashboard.js      # Dashboard stats endpoints
│   ├── package.json          # Dependencies
│   ├── server.js             # Express server setup
│   ├── database.js           # SQLite initialization
│   ├── mockAI.js             # AI analysis engine
│   └── approvals.db          # SQLite database (auto-created)
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── Sidebar.jsx
│   │   │   ├── Dashboard.jsx
│   │   │   ├── RequestForm.jsx
│   │   │   ├── WorkflowScreen.jsx
│   │   │   ├── RequestsList.jsx
│   │   │   ├── AIAnalysisCard.jsx
│   │   │   └── AIAnalysisCard.jsx
│   │   ├── App.jsx           # Main React component
│   │   ├── main.jsx          # React entry point
│   │   └── index.css         # Tailwind + custom CSS
│   ├── index.html            # HTML template
│   ├── package.json          # Dependencies
│   ├── vite.config.js        # Vite config
│   ├── tailwind.config.js    # Tailwind config
│   └── postcss.config.js     # PostCSS config
├── README.md                 # Main documentation
├── SETUP_GUIDE.md            # Detailed setup guide
└── create-all-files.js       # Initialization script

```

---

## Features Overview

### 🤖 AI Analysis
- **Automatic Risk Scoring**: Low, Medium, High
- **Intelligent Routing**: Based on request type and amount
- **Warning Detection**: Missing fields, insufficient details
- **Urgency Detection**: Identifies critical/urgent requests

### 📊 Dashboard
- **Live Statistics**: Total requests, pending, rush, high-risk
- **Request Table**: Filter, search, view details
- **Quick Actions**: Direct links to workflow

### 📝 Request Management
- **New Request Form**: Submit with attachments
- **Request Details**: Full request information
- **Status Updates**: Approve, reject, request more info
- **Approval Workflow**: Multi-level routing visualization

### 🔄 Approval Workflow
- **Level 1**: Direct Manager
- **Level 2**: Department Head  
- **Level 3**: Finance & Compliance (high-risk only)

---

## Testing the Application

### Pre-seeded Requests (Demo Data)

The database comes with 8 sample requests:

| ID | Employee | Type | Dept | Amount | Risk | Status |
|----|----------|------|------|--------|------|--------|
| REQ-001 | Sarah Johnson | NOPO | Procurement | $78,500 | High | Under Review |
| REQ-002 | Michael Chen | Rush | IT | $15,200 | Medium | Approved |
| REQ-003 | Emily Rodriguez | Standard | Marketing | $4,800 | Low | Approved |
| REQ-004 | James Wilson | PERN | Finance | $32,000 | High | Pending |
| REQ-005 | Lisa Park | Rush | Operations | $28,900 | High | Pending |
| REQ-006 | David Thompson | Standard | HR | $7,500 | Low | Pending |
| REQ-007 | Amanda Foster | NOPO | Legal | $55,000 | High | Rejected |
| REQ-008 | Robert Kim | Standard | IT | $2,400 | Low | Approved |

### Try These Scenarios

1. **Create a High-Risk Request**
   - Go to "New Request"
   - Amount: $75,000
   - Description: Any text
   - Watch AI flag it as High Risk

2. **Create an Urgent Request**
   - Include keywords: "urgent", "immediate", "critical", "emergency"
   - AI will detect urgency and suggest Rush routing

3. **Test Validation**
   - Try submitting with missing fields
   - AI shows warnings
   - Required fields highlighted in red

4. **View Approval Workflow**
   - Click any request to see full details
   - Check the approval routing timeline
   - Use demo buttons to change status

---

## Troubleshooting

### Backend won't start

```bash
# Check Node.js is installed
node --version

# Make sure you're in backend directory
cd backend

# Install dependencies again
npm install

# Check if port 3001 is in use
netstat -ano | findstr :3001
```

### Frontend won't start

```bash
# Check you're in frontend directory
cd frontend

# Clear npm cache
npm cache clean --force

# Install again
npm install

# Try running dev
npm run dev
```

### Database issues

```bash
# Go to backend folder
cd backend

# Delete the old database
del approvals.db

# Restart server
npm start
```

Database will be recreated automatically with fresh seed data.

### Can't connect frontend to backend

- Verify backend is running on http://localhost:3001
- Check CORS is enabled (it is by default)
- Frontend needs to access http://localhost:3001
- Check firewall isn't blocking localhost

### Components not loading

If you see blank pages or errors, run:
```bash
node create-components.js
```

This will create the missing React component files.

---

## API Endpoints Reference

### Dashboard
```
GET /api/dashboard/stats
Returns: { totalRequests, pendingApprovals, rushRequests, highRiskRequests, autoValidated }
```

### Requests
```
GET /api/requests
Returns: Array of all requests

POST /api/requests
Body: { employee_name, employee_id, request_type, department, description, amount, [attachment] }
Returns: Created request with AI analysis

GET /api/requests/:id
Returns: Detailed request with routing path

PATCH /api/requests/:id/status
Body: { status: "Approved" | "Rejected" | "Pending" | "Under Review" }
Returns: Updated request
```

---

## Development Commands

**Backend:**
```bash
npm start      # Start server (port 3001)
npm run dev    # Start with auto-reload (requires nodemon)
```

**Frontend:**
```bash
npm run dev    # Start dev server (port 5173)
npm run build  # Build for production
npm run preview # Preview production build
```

---

## Next Steps

- 🎨 **Customize**: Modify Tailwind colors in `tailwind.config.js`
- 🔧 **API Integration**: Replace mock AI with real API
- 📱 **Responsive**: Already mobile-optimized with Tailwind
- 🧪 **Deploy**: Build frontend, host backend separately

---

## Need Help?

1. Check SETUP_GUIDE.md for detailed manual setup
2. Check README.md for feature documentation
3. Run initialization script again if files missing
4. Check browser console for frontend errors
5. Check terminal for backend errors

---

**Enjoy your AI Approval Assistant! 🎉**

Questions? Refer to the inline code comments and the README files for more details.
