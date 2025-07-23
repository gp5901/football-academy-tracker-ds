# Football Academy Backend API

A comprehensive backend API for managing football academy attendance, players, and sessions.

## 🚀 Quick Start

### Prerequisites
- Node.js (v16 or higher)
- PostgreSQL (v12 or higher)
- npm or yarn

### Installation

1. **Clone and setup**
\`\`\`bash
cd backend
npm install
\`\`\`

2. **Database Setup**
\`\`\`bash
# Create database
createdb football_academy

# Run schema
npm run init-db
\`\`\`

3. **Environment Configuration**
\`\`\`bash
cp .env.example .env
# Edit .env with your database credentials
\`\`\`

4. **Start Development Server**
\`\`\`bash
npm run dev
\`\`\`

## 📊 API Endpoints

### Authentication
- `POST /api/auth/login` - Coach login
- `POST /api/auth/logout` - Logout
- `GET /api/auth/me` - Get current user

### Players Management
- `GET /api/players/:ageGroup` - Get players by age group
- `POST /api/players` - Create new player
- `PUT /api/players/:id` - Update player
- `DELETE /api/players/:id` - Delete player

### Sessions Management
- `GET /api/sessions/today/:ageGroup` - Get today's sessions
- `POST /api/sessions/create` - Create new session
- `GET /api/sessions/:id/attendance` - Get session attendance
- `GET /api/sessions/history/:ageGroup` - Get sessions history

### Attendance Management
- `POST /api/attendance/mark` - Mark attendance for multiple players
- `POST /api/attendance/photo/:sessionId` - Upload session photo
- `GET /api/attendance/history/:ageGroup` - Get attendance history
- `GET /api/attendance/stats/:ageGroup` - Get attendance statistics

## 🔐 Authentication

All API endpoints (except login) require JWT authentication:

\`\`\`javascript
headers: {
  'Authorization': 'Bearer <your-jwt-token>'
}
\`\`\`

## 📝 Sample Requests

### Login
\`\`\`bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username": "coach_u16", "password": "password123"}'
\`\`\`

### Get Players
\`\`\`bash
curl -X GET http://localhost:5000/api/players/U16 \
  -H "Authorization: Bearer <your-token>"
\`\`\`

### Mark Attendance
\`\`\`bash
curl -X POST http://localhost:5000/api/attendance/mark \
  -H "Authorization: Bearer <your-token>" \
  -H "Content-Type: application/json" \
  -d '{
    "sessionId": 1,
    "attendanceRecords": [
      {"playerId": 1, "status": "present_regular", "notes": "Great performance"},
      {"playerId": 2, "status": "absent", "notes": "Sick"}
    ]
  }'
\`\`\`

## 🗄️ Database Schema

### Tables
- **coaches** - Coach authentication and profile data
- **players** - Player information and session tracking
- **sessions** - Training session records
- **attendance** - Individual attendance records

### Key Features
- Foreign key constraints for data integrity
- Unique constraints to prevent duplicates
- Indexes for optimal query performance
- Cascade deletes for data consistency

## 🔧 Development

### Database Commands
\`\`\`bash
# Reset database
dropdb football_academy && createdb football_academy
npm run init-db

# Connect to database
psql -U postgres -d football_academy
\`\`\`

### Testing
\`\`\`bash
# Health check
curl http://localhost:5000/api/health

# Test authentication
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username": "coach_u16", "password": "password123"}'
\`\`\`

## 📁 Project Structure
\`\`\`
backend/
├── config/
│   └── database.js          # Database connection
├── database/
│   └── schema.sql           # Database schema
├── middleware/
│   └── auth.js              # JWT authentication
├── routes/
│   ├── auth.js              # Authentication routes
│   ├── players.js           # Player management
│   ├── sessions.js          # Session management
│   └── attendance.js        # Attendance tracking
├── uploads/                 # File uploads directory
├── server.js                # Main server file
├── package.json
└── .env.example
\`\`\`

## 🚀 Production Deployment

1. **Environment Variables**
\`\`\`bash
NODE_ENV=production
DB_HOST=your-production-db-host
JWT_SECRET=your-super-secure-production-secret
\`\`\`

2. **Database Migration**
\`\`\`bash
# Run schema on production database
psql -h your-db-host -U your-user -d football_academy -f database/schema.sql
\`\`\`

3. **Start Production Server**
\`\`\`bash
npm start
\`\`\`

## 🔒 Security Features

- JWT-based authentication
- Password hashing with bcrypt
- CORS protection
- Helmet security headers
- Input validation
- SQL injection prevention
- File upload restrictions
- Age group access control

## 📈 Performance Features

- Database connection pooling
- Query optimization with indexes
- File upload size limits
- Request logging
- Error handling middleware
