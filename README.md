# AllyNet - Community Safety Platform

**AllyNet** is a production-grade, safety-first community platform that connects neighbors in need with verified helpers in real-time. The platform combines emergency SOS capabilities with community assistance features, all built on a foundation of trust and verified interactions.

---

## 📋 Table of Contents

- [Overview](#overview)
- [Key Features](#key-features)
- [Technology Stack](#technology-stack)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
  - [Prerequisites](#prerequisites)
  - [Backend Setup](#backend-setup)
  - [Frontend Setup](#frontend-setup)
- [Environment Variables](#environment-variables)
- [API Documentation](#api-documentation)
- [Trust Score System](#trust-score-system)
- [Security Features](#security-features)
- [Real-Time Features](#real-time-features)
- [Deployment](#deployment)
- [Development](#development)

---

## 🎯 Overview

AllyNet is a full-stack application designed to enhance community safety through:

1. **Emergency SOS System**: Real-time location-based emergency alerts with instant notification to nearby verified helpers
2. **Community Help Marketplace**: Non-urgent peer-to-peer assistance platform (moving, tech support, tutoring, etc.)
3. **Trust & Verification**: Comprehensive trust score system that rewards helpful behavior and maintains community safety
4. **Safety Features**: Emergency contacts with SMS notifications, safety settings, and reporting mechanisms

---

## ✨ Key Features

### Emergency SOS
- **Real-Time Alerts**: Instant location-based emergency notifications
- **Multiple Emergency Types**: Medical, safety, accident, assault, natural disaster, and more
- **Privacy Options**: Silent mode, anonymous mode, and fake call alerts
- **Helper Coordination**: Real-time chat, status updates, and location sharing
- **Emergency History**: Complete history of SOS requested and SOS helped

### Community Help Requests
- **Create Help Requests**: Post non-urgent assistance requests with location
- **Helper Responses**: Verified helpers can respond with messages
- **Conversation Threads**: Full messaging system for creator-helper communication
- **Accept/Deny/Report**: Creator can accept, deny, or report helper responses
- **Response Management**: View all requests and responses in one place

### Trust Score System
- **Dynamic Scoring**: Trust score ranges from 0-1000
- **Score Increases**:
  - +10 points: When helper's response to help request is accepted
  - +50 points: When helper accepts/responds to an SOS emergency
  - +50 points: When helper resolves an SOS emergency
- **Score Decreases**:
  - -50 points: When helper is reported by a creator
- **Profile Stats**: Track helped, requested, SOS alerts, and reports

### User Profile & Settings
- **Comprehensive Profile**: Trust score, stats, and activity history
- **Emergency Contacts**: Add/delete emergency contacts for SMS notifications
- **Safety Settings**: Manage emergency contacts and safety preferences
- **Help Center**: Submit questions, complaints, bug reports, and feature requests
- **Emergency History**: Detailed view of all SOS interactions

### Marketplace & Discovery
- **Location-Based Discovery**: Find nearby help requests and emergencies
- **Ad System**: Create and view marketplace advertisements
- **Nearby Ads Preview**: Discover local services and offerings

---

## 🛠 Technology Stack

### Backend
- **Runtime**: Node.js (>=18.0.0)
- **Framework**: Express.js
- **Database**: MongoDB with Mongoose ODM
- **Authentication**: JWT (JSON Web Tokens) with refresh token support
- **Real-Time**: Socket.IO for real-time communication
- **Validation**: express-validator
- **Security**: bcryptjs for password hashing
- **Other**: dotenv, cors, uuid

### Frontend
- **Framework**: React 19.2.0
- **Build Tool**: Vite 7.2.4
- **Routing**: React Router DOM 7.11.0
- **State Management**: Zustand 5.0.9
- **Styling**: Tailwind CSS 4.1.18
- **Animations**: Framer Motion 12.23.26
- **Icons**: Lucide React 0.562.0
- **Real-Time**: Socket.IO Client 4.8.1
- **Utilities**: clsx, tailwind-merge

---

## 📁 Project Structure

```
AllyNet-full/
├── AllyNet-back/                 # Backend API Server
│   ├── src/
│   │   ├── config/              # Configuration files
│   │   │   └── database.js      # MongoDB connection
│   │   ├── controllers/         # Request handlers
│   │   │   ├── authController.js
│   │   │   ├── emergencyController.js
│   │   │   ├── helpRequestController.js
│   │   │   ├── messageController.js
│   │   │   ├── adController.js
│   │   │   └── contactController.js
│   │   ├── models/              # Mongoose schemas
│   │   │   ├── User.js
│   │   │   ├── Emergency.js
│   │   │   ├── HelpRequest.js
│   │   │   ├── EmergencyMessage.js
│   │   │   ├── Ad.js
│   │   │   ├── Contact.js
│   │   │   └── index.js
│   │   ├── routes/              # Express routes
│   │   │   ├── auth.js
│   │   │   ├── emergency.js
│   │   │   ├── helpRequest.js
│   │   │   ├── health.js
│   │   │   ├── ad.js
│   │   │   └── contact.js
│   │   ├── services/            # Business logic layer
│   │   │   ├── emergencyService.js
│   │   │   ├── helpRequestService.js
│   │   │   ├── messageService.js
│   │   │   ├── adService.js
│   │   │   └── contactService.js
│   │   ├── middleware/          # Custom middleware
│   │   │   ├── auth.js          # JWT authentication
│   │   │   └── errorHandler.js  # Global error handler
│   │   ├── sockets/             # Socket.IO handlers
│   │   │   ├── index.js
│   │   │   ├── emergencySocket.js
│   │   │   └── socketAuth.js
│   │   ├── utils/               # Utility functions
│   │   │   ├── jwt.js
│   │   │   ├── asyncHandler.js
│   │   │   ├── messageSerializer.js
│   │   │   └── smsService.js
│   │   ├── app.js               # Express app setup
│   │   └── server.js            # Server bootstrap
│   ├── scripts/                 # Utility scripts
│   │   └── cleanup-stale-emergencies.js
│   └── package.json
│
├── AllyNet-front/               # Frontend React Application
│   ├── src/
│   │   ├── api/                 # API client functions
│   │   │   ├── auth.js
│   │   │   ├── emergency.js
│   │   │   ├── helpRequest.js
│   │   │   ├── socket.js
│   │   │   ├── ad.js
│   │   │   └── contact.js
│   │   ├── components/          # Reusable UI components
│   │   │   ├── Button.jsx
│   │   │   ├── Card.jsx
│   │   │   ├── BottomNav.jsx
│   │   │   ├── ProtectedRoute.jsx
│   │   │   ├── ThemeToggle.jsx
│   │   │   ├── EmergencyNotification.jsx
│   │   │   ├── EmergencyEndedNotification.jsx
│   │   │   ├── EmergencyMapModal.jsx
│   │   │   ├── FakeCallAlert.jsx
│   │   │   └── NearbyAdsPreview.jsx
│   │   ├── features/            # Feature-based components
│   │   │   ├── auth/
│   │   │   │   ├── LoginPage.jsx
│   │   │   │   ├── SignupPage.jsx
│   │   │   │   └── Onboarding.jsx
│   │   │   ├── emergency/
│   │   │   │   ├── SOSOverlay.jsx
│   │   │   │   ├── EmergencyActiveView.jsx
│   │   │   │   ├── EmergencyChat.jsx
│   │   │   │   ├── EmergencyDetails.jsx
│   │   │   │   └── EmergencyChatHistory.jsx
│   │   │   ├── help/
│   │   │   │   ├── CreateHelpRequest.jsx
│   │   │   │   ├── HelpFeed.jsx
│   │   │   │   └── HelpRequestsPage.jsx
│   │   │   ├── profile/
│   │   │   │   ├── ProfilePage.jsx
│   │   │   │   ├── ProfileView.jsx
│   │   │   │   ├── EmergencyHistory.jsx
│   │   │   │   ├── SafetySettings.jsx
│   │   │   │   ├── HelpCenter.jsx
│   │   │   │   ├── TrustScoreRing.jsx
│   │   │   │   ├── OrganizationView.jsx
│   │   │   │   └── PaymentsView.jsx
│   │   │   ├── marketplace/
│   │   │   │   ├── DiscoveryView.jsx
│   │   │   │   └── CreateAdForm.jsx
│   │   │   ├── ads/
│   │   │   │   ├── AdDetailView.jsx
│   │   │   │   └── AdHistory.jsx
│   │   │   └── about/
│   │   │       └── AboutAllyNet.jsx
│   │   ├── hooks/               # Custom React hooks
│   │   │   └── useEmergencySocket.js
│   │   ├── layouts/             # Layout components
│   │   │   └── AppShell.jsx
│   │   ├── store/               # Zustand state stores
│   │   │   ├── useAuthStore.js
│   │   │   ├── useEmergencyStore.js
│   │   │   ├── useEmergencySessionStore.js
│   │   │   ├── useHelpStore.js
│   │   │   ├── useMarketplaceStore.js
│   │   │   ├── useTabStore.js
│   │   │   └── useThemeStore.js
│   │   ├── App.jsx              # Main app component
│   │   ├── main.jsx             # React entry point
│   │   ├── index.css            # Global styles
│   │   └── utils.js             # Utility functions
│   ├── public/
│   │   └── favicon.svg
│   ├── index.html
│   ├── vite.config.js
│   ├── tailwind.config.js
│   └── package.json
│
└── README.md                    # This file
```

---

## 🚀 Getting Started

### Prerequisites

- **Node.js**: >= 18.0.0
- **MongoDB**: Local installation or MongoDB Atlas account
- **npm** or **yarn**: Package manager

### Backend Setup

1. **Navigate to backend directory**:
   ```bash
   cd AllyNet-back
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Create environment file**:
   Create a `.env` file in the `AllyNet-back` directory:
   ```env
   NODE_ENV=development
   PORT=5000
   MONGODB_URI=mongodb://localhost:27017/allynet
   JWT_SECRET=your-super-secret-jwt-key-change-in-production
   JWT_REFRESH_SECRET=your-super-secret-refresh-key-change-in-production
   JWT_EXPIRE=1d
   JWT_REFRESH_EXPIRE=7d
   FRONTEND_URL=http://localhost:5173
   ```

4. **Start MongoDB** (if running locally):
   ```bash
   # Make sure MongoDB is running on localhost:27017
   # Or update MONGODB_URI in .env to point to your MongoDB instance
   ```

5. **Run the server**:
   ```bash
   # Development mode (with hot reload)
   npm run dev

   # Production mode
   npm start
   ```

6. **Verify backend is running**:
   ```bash
   curl http://localhost:5000/api/health
   ```

### Frontend Setup

1. **Navigate to frontend directory**:
   ```bash
   cd AllyNet-front
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Configure API base URL** (if needed):
   Update the API base URL in `src/api/*.js` files if your backend runs on a different port.

4. **Run the development server**:
   ```bash
   npm run dev
   ```

5. **Build for production**:
   ```bash
   npm run build
   ```

6. **Preview production build**:
   ```bash
   npm run preview
   ```

The frontend will be available at `http://localhost:5173` (or the next available port).

---

## 🔧 Environment Variables

### Backend (.env)

| Variable | Description | Default | Required |
|----------|-------------|---------|----------|
| `NODE_ENV` | Environment (development/production) | `development` | No |
| `PORT` | Server port | `5000` | No |
| `MONGODB_URI` | MongoDB connection string | - | **Yes** |
| `JWT_SECRET` | Secret key for access tokens | - | **Yes** |
| `JWT_REFRESH_SECRET` | Secret key for refresh tokens | - | **Yes** |
| `JWT_EXPIRE` | Access token expiration | `1d` | No |
| `JWT_REFRESH_EXPIRE` | Refresh token expiration | `7d` | No |
| `FRONTEND_URL` | Frontend URL for CORS | `http://localhost:5173` | No |

**Security Note**: Never commit `.env` files to version control. Use strong, unique secrets in production.

---

## 📡 API Documentation

### Base URL
```
http://localhost:5000/api/v1
```

### Authentication Endpoints

#### Register User
```
POST /auth/register
Body: { email, password, name (or firstName, lastName), phone?, location? }
Response: { success, data: { user, tokens } }
```

#### Login
```
POST /auth/login
Body: { email, password }
Response: { success, data: { user, tokens } }
```

#### Get Current User
```
GET /auth/me
Headers: { Authorization: "Bearer <access_token>" }
Response: { success, data: { user } }
```

#### Get User Stats
```
GET /auth/stats
Headers: { Authorization: "Bearer <access_token>" }
Response: { success, data: { trustScore, helped, requested, sosAlerts, reports } }
```

#### Emergency Contacts
```
GET /auth/emergency-contacts
POST /auth/emergency-contacts (Body: { name, phone })
DELETE /auth/emergency-contacts/:contactId
```

### Emergency Endpoints

#### Create Emergency (SOS)
```
POST /emergencies
Body: {
  location: { latitude, longitude },
  type?: string,
  description?: string,
  silentMode?: boolean,
  anonymousMode?: boolean,
  fakeCallAlert?: boolean
}
Response: { success, data: { emergency } }
```

#### Get Active Emergency
```
GET /emergencies/active
Response: { success, data: { emergency } }
```

#### Get Nearby Emergencies
```
GET /emergencies/nearby?latitude=...&longitude=...&radius=...
Response: { success, data: { emergencies } }
```

#### Respond to Emergency
```
POST /emergencies/:id/respond
Body: { estimatedArrival?: Date }
Response: { success, data: { emergency } }
```

#### Resolve Emergency
```
POST /emergencies/:id/resolve
Body: { resolutionType?: string, notes?: string }
Response: { success, data: { emergency } }
```

### Help Request Endpoints

#### Create Help Request
```
POST /help-requests
Body: {
  title, description, category, location: { latitude, longitude },
  urgency, estimatedDuration?, budget?
}
Response: { success, data: { helpRequest } }
```

#### Get User's Help Requests
```
GET /help-requests/my
Response: { success, data: { helpRequests } }
```

#### Get Nearby Help Requests
```
GET /help-requests/nearby?latitude=...&longitude=...&radius=...
Response: { success, data: { helpRequests } }
```

#### Respond to Help Request
```
POST /help-requests/:id/respond
Body: { message }
Response: { success, data: { helpRequest } }
```

#### Accept/Deny/Report Helper Response
```
POST /help-requests/:id/responses/:helperId/accept
POST /help-requests/:id/responses/:helperId/deny
POST /help-requests/:id/responses/:helperId/report
Body (for report): { reason: string }
Response: { success, data: { helpRequest } }
```

#### Reply to Response
```
POST /help-requests/:id/responses/:helperId/reply
Body: { message }
Response: { success, data: { helpRequest } }
```

### Contact Endpoints

#### Submit Contact Form
```
POST /contact
Body: { category, subject, message }
Response: { success, message }
```

---

## 🎖 Trust Score System

The trust score is a numerical representation of a user's reliability and helpfulness in the community, ranging from **0 to 1000**.

### Score Increases

| Action | Points | Description |
|--------|--------|-------------|
| Help Request Accepted | +10 | When a creator accepts a helper's response to their help request |
| SOS Response | +50 | When a helper accepts/responds to an SOS emergency |
| SOS Resolution | +50 | When a helper resolves an SOS emergency (additional to response points) |

### Score Decreases

| Action | Points | Description |
|--------|--------|-------------|
| Reported | -50 | When a helper is reported by a creator (minimum score: 0) |

### Profile Statistics

Users can view their statistics on their profile:
- **Trust Score**: Current trust score (0-1000)
- **Helped**: Number of help requests where user's response was accepted
- **Requested**: Number of help requests created by user
- **SOS Alerts**: Number of emergencies created by user
- **Reports**: Number of times user was reported

---

## 🔒 Security Features

### Authentication & Authorization
- **JWT-based Authentication**: Secure token-based authentication
- **Refresh Tokens**: Long-lived refresh tokens with short-lived access tokens
- **Password Hashing**: bcrypt with 12 salt rounds
- **Protected Routes**: Middleware protection on all private endpoints

### Data Security
- **Input Validation**: express-validator on all endpoints
- **CORS Configuration**: Restrictive CORS policies
- **Environment Variables**: Sensitive data stored in environment variables
- **SQL Injection Prevention**: Mongoose ODM provides built-in protection

### User Privacy
- **Anonymous Mode**: Users can create emergencies anonymously
- **Silent Mode**: Silent emergency notifications
- **Location Privacy**: Location only shared during active emergencies
- **Fake Call Alert**: Disguised emergency interface

---

## 🔴 Real-Time Features

### Socket.IO Integration

AllyNet uses Socket.IO for real-time communication, particularly for emergency events.

#### Namespace
```
/emergencies
```

#### Events

**Client → Server**:
- `emergency:join` - Join an emergency room
- `emergency:leave` - Leave an emergency room
- `message:send` - Send a message in emergency chat

**Server → Client**:
- `emergency:created` - New emergency created nearby
- `helper:joined` - Helper joined emergency
- `emergency:status_changed` - Emergency status updated
- `emergency:resolved` - Emergency resolved
- `message:received` - New message in emergency chat

#### Authentication
Socket connections are authenticated using JWT tokens sent during connection.

---

## 🚢 Deployment

### Backend Deployment

1. **Set environment variables** on your hosting platform (Heroku, AWS, DigitalOcean, etc.)
2. **Build command**: Not required (Node.js application)
3. **Start command**: `npm start`
4. **Port**: Use the `PORT` environment variable (most platforms set this automatically)

### Frontend Deployment

1. **Build the application**:
   ```bash
   cd AllyNet-front
   npm run build
   ```

2. **Deploy the `dist` folder** to your static hosting service:
   - Vercel
   - Netlify
   - AWS S3 + CloudFront
   - GitHub Pages
   - Any static file server

3. **Configure API base URL**:
   Update API endpoints in `src/api/*.js` to point to your production backend URL.

### Production Checklist

- [ ] Set `NODE_ENV=production`
- [ ] Use strong, unique JWT secrets
- [ ] Configure MongoDB Atlas or production MongoDB instance
- [ ] Set up CORS to allow only your frontend domain
- [ ] Enable HTTPS/SSL
- [ ] Set up error monitoring (e.g., Sentry)
- [ ] Configure backup strategy for MongoDB
- [ ] Set up SMS service (Twilio) for emergency contacts
- [ ] Test all critical features
- [ ] Set up logging and monitoring

---

## 👨‍💻 Development

### Backend Development

- **Hot Reload**: Use `npm run dev` (nodemon)
- **Health Check**: `GET /api/health`
- **Error Handling**: Global error handler in `src/middleware/errorHandler.js`
- **Logging**: Console logging (consider adding Winston or similar in production)

### Frontend Development

- **Hot Module Replacement**: Vite provides instant HMR
- **Linting**: `npm run lint`
- **Build**: `npm run build`
- **Preview**: `npm run preview` (preview production build locally)

### Code Structure

- **Backend**: Follows MVC pattern with services layer for business logic
- **Frontend**: Feature-based organization with shared components
- **State Management**: Zustand for global state, local state for component-specific data
- **Styling**: Tailwind CSS utility classes with custom theme configuration

---

## 📝 Notes

### SMS Integration

The `smsService.js` utility contains placeholder code for sending SMS notifications. To enable SMS functionality:

1. Sign up for Twilio (or another SMS service)
2. Add credentials to environment variables
3. Implement the `sendEmergencySMS` function in `AllyNet-back/src/utils/smsService.js`

### MongoDB Indexes

The application uses MongoDB indexes for:
- User email (unique)
- User location (2dsphere for geospatial queries)
- Emergency location (2dsphere)
- Help request location (2dsphere)
- Various query optimizations

### Performance Considerations

- Geospatial queries are indexed for fast location-based searches
- Socket.IO rooms are used to minimize broadcast traffic
- Aggregation pipelines are used for complex statistics queries
- Trust score calculations are optimized with proper indexing

---

## 🤝 Contributing

This is a production application. When making changes:

1. Test thoroughly in development
2. Ensure all environment variables are documented
3. Update this README if adding new features
4. Follow existing code patterns and structure
5. Test API endpoints and frontend components

---

## 📄 License

This project is proprietary. All rights reserved.

---

## 🆘 Support

For issues, questions, or feature requests:
1. Use the Help Center feature in the application
2. Contact the development team
3. Review the About page in the application for more information

---

**Status**: 🟢 Production Ready

**Last Updated**: 2024

**Version**: 1.0.0


