# AllyNet Backend Architecture

## 🏗️ High-Level Architecture

### System Overview
AllyNet backend is designed as a **modular, feature-based Express.js application** that prioritizes:
- **Safety & Reliability**: All emergency operations are idempotent and handle failure scenarios explicitly
- **Real-Time Communication**: Socket.IO for live emergency broadcasts and helper coordination
- **Scalability**: Clear separation of concerns with services, controllers, and models
- **Security**: JWT-based auth, role-based access control, input validation

---

## 📊 Data Flow & Request Lifecycle

### 1. Authentication Flow
```
Client Request → Auth Middleware → JWT Validation → Role Check → Controller → Service → Model → MongoDB
                                                                    ↓
                                                              Response → Client
```

### 2. Emergency (SOS) Flow
```
User Creates Emergency → Controller → Service (validates duplicate, checks user status)
                            ↓
                    Create Emergency Record (status: 'active')
                            ↓
                    Emit Socket Event (broadcast to nearby helpers)
                            ↓
                    Helpers Join Emergency Room (Socket.IO)
                            ↓
                    Helper Responds → Update Status ('responding')
                            ↓
                    Resolution → Update Status ('resolved')
```

### 3. Real-Time Event Flow
```
Socket.IO Server ← → Emergency Rooms (per emergency_id)
                          ↓
                    Real-time Events:
                    - emergency.created
                    - helper.joined
                    - emergency.status_changed
                    - emergency.resolved
```

---

## 🗂️ Layer Architecture

### **Controllers** (Request/Response Layer)
- Handle HTTP requests
- Validate input
- Call services
- Format responses
- Return appropriate status codes

### **Services** (Business Logic Layer)
- Contains core business rules
- Coordinates between models
- Handles complex operations (e.g., duplicate emergency prevention)
- Emits Socket.IO events
- Transaction management

### **Models** (Data Layer)
- Mongoose schemas
- Data validation at schema level
- Database interactions
- Virtual fields (e.g., trust score calculation)

### **Middleware**
- Authentication (JWT verification)
- Authorization (role-based)
- Error handling
- Request logging
- Rate limiting (future)

### **Sockets** (Real-Time Layer)
- Socket.IO event handlers
- Room management
- Connection lifecycle
- Real-time data synchronization

---

## 🔐 Security Architecture

### Authentication
- **Access Token**: Short-lived (15min - 1hr), stored in memory/frontend
- **Refresh Token**: Long-lived (7-30 days), stored securely (HttpOnly cookie recommended)
- **JWT Payload**: userId, role, email (no sensitive data)

### Authorization
- Role-based access control (RBAC)
- Middleware checks user role before route access
- Emergency ownership validation (users can only modify their own emergencies)

### Data Protection
- Password hashing (bcrypt, salt rounds: 10-12)
- Input validation (express-validator)
- MongoDB injection prevention (Mongoose)
- CORS configuration
- Environment variables for secrets

---

## 🗄️ Database Design Philosophy

### Collections (MongoDB)
1. **users** - User profiles, location, trust score, verification
2. **emergencies** - SOS requests, status, metadata
3. **help_requests** - Non-urgent help, categories, budget
4. **skills** - Individual skills marketplace
5. **businesses** - Business profiles, promotions
6. **organizations** - Org data, members, subscriptions
7. **payments** - Payment intents, subscriptions, history

### Key Design Decisions
- **Denormalization**: Trust scores may be cached on user docs for performance
- **Indexes**: Location (2dsphere), emergency status, user_id for lookups
- **Embedded vs Referenced**: 
  - Emergency responses embedded (array of helper IDs with timestamps)
  - Skills referenced (foreign key to user)
  - Business promotions embedded (array in business doc)

---

## 🔄 Emergency System Design (Critical Path)

### Duplicate Prevention
- **Atomic Check**: User can only have ONE active emergency at a time
- **Idempotent Creation**: Same request ID prevents duplicates
- **Status Transitions**: Enforced state machine (active → responding → resolved)

### Nearby Helpers Discovery
1. Query users with `helper: true` and `verified: true`
2. Location-based query (MongoDB geospatial: $near)
3. Filter by user's emergency radius
4. Sort by trust score + distance
5. Limit results (e.g., top 50)

### Socket.IO Room Strategy
- Room naming: `emergency:${emergencyId}`
- Broadcast events only to room members
- Helpers auto-join when responding
- Cleanup on emergency resolution

---

## 📡 API Design Principles

### RESTful Conventions
- `/api/v1/emergencies` - Emergency resources
- `/api/v1/help-requests` - Help requests
- `/api/v1/users` - User profiles
- `/api/v1/auth` - Authentication

### Error Handling
- Consistent error format: `{ error: { code, message, details? } }`
- Proper HTTP status codes (400, 401, 403, 404, 409, 500)
- Global error handler catches unhandled errors

### Response Format
```json
{
  "success": true,
  "data": { ... },
  "message": "Optional success message"
}
```

---

## 🚀 Deployment Considerations

### Environment Variables
- `NODE_ENV` (development/production)
- `PORT` (server port)
- `MONGODB_URI` (database connection)
- `JWT_SECRET` (token signing)
- `JWT_REFRESH_SECRET` (refresh token signing)
- `FRONTEND_URL` (CORS origin)

### Scalability Hints
- Stateless API (JWT tokens, no server-side sessions)
- Socket.IO can scale with Redis adapter (future)
- Database read replicas for geospatial queries (future)
- CDN for static assets (future)

---

## 🧪 Testing Strategy (Future)

- Unit tests: Services, utilities
- Integration tests: API endpoints
- Socket.IO tests: Real-time events
- Load tests: Emergency creation under stress

---

## 📝 Next Steps (Implementation Order)

1. ✅ **Project Setup** - package.json, folder structure, basic server
2. ⏳ **Database Models** - User, Emergency schemas
3. ⏳ **Auth System** - JWT, middleware, routes
4. ⏳ **Emergency System** - Core SOS functionality
5. ⏳ **Socket.IO** - Real-time events
6. ⏳ **Help Requests** - Non-urgent help flow
7. ⏳ **Additional Features** - Skills, Businesses, Organizations

---

*This architecture prioritizes clarity, security, and reliability over premature optimization.*

