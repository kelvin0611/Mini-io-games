# 🕹️ Neon Arcade – Multi-Game Platform with Real-time Leaderboards

A cyberpunk-themed gaming platform featuring multiple competitive "IO-style" mini-games with persistent user accounts, global leaderboards, and a progressive XP/leveling system. Built with modern full-stack architecture—vanilla JavaScript for games, Node.js for APIs, and PostgreSQL for data persistence.

---

## 🎮 Features (What I Shipped)

### **Core Gameplay**
- **Multi-Game Architecture**: Three playable games implemented with individual game loops and physics
  - **Slice.io** – Fruit Ninja-style slicing mechanics with collision detection
  - **Beat.io** – Rhythm game with time-synchronized note hits
  - **Snek.io** – Real-time multiplayer snake with grid-based movement
- **Delta-Time System**: Frame-rate independent movement and smooth gameplay across all devices
- **High-DPI Canvas Scaling**: Crisp rendering on all display densities using device pixel ratio compensation

### **User System & Authentication**
- **Secure Registration/Login**: Password hashing with Argon2, JWT token generation, HTTP-only cookies
- **Session Persistence**: Automatic session validation on page load
- **XP & Leveling System**: Dynamic progression tracking with configurable XP rewards per game
- **User Profile Badge HUD**: Real-time display of player name, level, and XP progress bar

### **Global Leaderboards**
- **Per-Game Rankings**: Top 100 scores per game fetched and sorted by backend
- **Tab-based UI**: Easy switching between game leaderboards
- **Rank Badges**: Visual indicators (🥇 1ST, 🥈 2ND, 🥉 3RD) for top performers
- **Score Persistence**: All scores saved to PostgreSQL with timestamps

### **Visual & UX**
- **Glassmorphism Design**: Modern UI with backdrop blur and neon accent colors
- **Dark/Light Theme Toggle**: Persistent theme preference in localStorage
- **Responsive Layout**: Full-screen canvas with sidebar navigation
- **Real-time HUD**: Live score, level, and feedback animations during gameplay

---

## 🛠️ Tech Stack

| Layer | Technology | Purpose |
|-------|-----------|---------|
| **Frontend** | ![JavaScript](https://img.shields.io/badge/JavaScript-ES6+-yellow?logo=javascript) ![HTML5](https://img.shields.io/badge/HTML5-Canvas-red?logo=html5) ![CSS3](https://img.shields.io/badge/CSS3-Glassmorphism-blue?logo=css3) | Game rendering, UI logic, client-side state |
| **Backend** | ![Node.js](https://img.shields.io/badge/Node.js-v16+-green?logo=node.js) ![Express](https://img.shields.io/badge/Express-REST%20API-black?logo=express) | API routing, authentication, business logic |
| **Database** | ![PostgreSQL](https://img.shields.io/badge/PostgreSQL-Neon%20Cloud-336791?logo=postgresql) ![Prisma](https://img.shields.io/badge/Prisma-ORM-2D3748?logo=prisma) | Data modeling, migrations, queries |
| **Real-time** | ![Socket.io](https://img.shields.io/badge/Socket.io-WebSocket-green?logo=socket.io) | Multiplayer game events, live updates |
| **Security** | ![JWT](https://img.shields.io/badge/JWT-Authentication-blue) ![Argon2](https://img.shields.io/badge/Argon2-Password%20Hashing-darkred) | Secure token-based auth, password protection |

---

## 🎯 Technical Challenges & What I Learned

### **1. Database Schema Design (Relational Modeling)**
**Challenge**: Design a schema to support users, their scores across multiple games, XP progression, and leaderboard queries efficiently.

**Solution**:
- Normalized schema with `User`, `Score`, and `Challenge` tables
- Indexed `(gameId, score DESC)` composite index for fast leaderboard queries
- JSON field for user customization (avatar, game skins) without schema bloat
- Used Prisma migrations for version control and type safety

**Learning**: Understanding relational constraints, indexing strategy for query performance, and ORM benefits for rapid development.

```prisma
model Score {
  id        Int      @id @default(autoincrement())
  userId    Int
  gameId    String   // "slice-io", "beat-io", "snek-io"
  score     Int
  duration  Int
  createdAt DateTime @default(now())
  user      User     @relation(fields: [userId], references: [id])
  @@index([gameId, score(sort: Desc)])  // Fast leaderboard queries
}
```

### **2. CORS & Cookie Security (Cross-Domain Authentication)**
**Challenge**: Frontend and backend on different addresses (127.0.0.1:5500 vs localhost:3000) broke cookie transmission. Browsers don't share cookies across different domains by default.

**Solution**:
- Explicit CORS configuration with `credentials: true`
- Same-origin enforcement using domain-based cookie scoping
- Unified frontend/backend addressing scheme
- HTTP-only cookies to prevent XSS attacks

**Learning**: CORS policy nuances, browser same-origin policy, secure cookie transmission patterns, and debugging credential flow issues.

```javascript
app.use(cors({
    origin: ['http://127.0.0.1:5500', 'http://localhost:5500'],
    credentials: true  // Allow cookie inclusion
}));
```

### **3. Game Loop & Delta Time (Frame-Independent Movement)**
**Challenge**: Games ran at different speeds depending on frame rate. A 60fps desktop vs 120fps monitor had different game pacing.

**Solution**:
- Implemented delta-time system: `deltaTime = (now - lastFrameTime) / 1000` (in seconds)
- All movement scaled by deltaTime: `velocity * deltaTime` per frame
- Capped maximum delta to prevent "spiral of death" (frame drops cause bigger jumps)
- Applied DPI scaling for crisp canvas rendering

**Learning**: Game physics foundations, fixed timestep vs variable timestep tradeoffs, high-DPI display handling, and performance optimization.

```javascript
const now = performance.now();
const deltaTime = Math.min((now - lastFrameTime) / 1000, 0.05);
lastFrameTime = now;

// Snake position updates using delta time
snake.x += snake.velocityX * deltaTime * speed;
snake.y += snake.velocityY * deltaTime * speed;
```

### **4. Real-time State Synchronization (Frontend-Backend Sync)**
**Challenge**: After a game ends, the score must be saved to the database, user XP updated, level checked, and leaderboard refreshed—all without page reload.

**Solution**:
- API endpoint returns success/failure status with new user stats
- Frontend updates UI immediately upon response
- Console logging at each step for debugging score submission failures
- Error handling for network timeouts and auth failures

**Learning**: Asynchronous request handling, state mutation patterns, error resilience, and user feedback mechanisms.

### **5. JWT Authentication Flow**
**Challenge**: Implement secure login without sending passwords over plaintext. Tokens must persist across sessions but expire for security.

**Solution**:
- Password hashing with Argon2 (salted, slow hash function)
- JWT token generation on login with 7-day expiry
- Token stored in HTTP-only cookie (immune to XSS)
- `requireAuth` middleware checks token validity on protected routes

**Learning**: Authentication patterns, password security best practices, token lifecycle management, and middleware architecture.

---

## 📦 Installation & Setup

### **Prerequisites**
- **Node.js** v16+ ([Download](https://nodejs.org))
- **PostgreSQL** (or Neon account for cloud DB)
- **Git** & **npm**

### **Step 1: Clone & Install Dependencies**
```bash
cd io-arcade-backend
npm install
```

### **Step 2: Configure Environment Variables**
Create a `.env` file in `io-arcade-backend/`:
```env
# Database Connection (Get URL from Neon Console)
DATABASE_URL=postgresql://user:password@host:5432/neondb

# JWT Secret (Generate random string)
JWT_SECRET=your_super_secret_key_here_min_32_chars

# Server Config
PORT=3000
NODE_ENV=development
```

### **Step 3: Initialize Database**
```bash
# Run Prisma migrations
npx prisma db push

# (Optional) Open Prisma Studio to view/edit data
npx prisma studio
```

### **Step 4: Start Backend Server**
```bash
npm run dev
# Server runs on http://127.0.0.1:3000
```

### **Step 5: Start Frontend**
In a separate terminal, use **Live Server** extension in VS Code, or:
```bash
npx live-server
# Opens on http://127.0.0.1:5500
```

### **Step 6: Test the Platform**
1. Navigate to `http://127.0.0.1:5500`
2. Click **LOGIN** → **REGISTER** to create an account
3. Select a game and play to completion
4. View your score on the **🏆 LEADERBOARD**

---

## 🏗️ Project Architecture

```
io-arcade-backend/          # Express REST API
├── src/
│   ├── server.js           # App initialization, CORS, routes
│   ├── config/
│   │   └── db.js           # Prisma client setup
│   ├── middleware/
│   │   ├── auth.js         # JWT verification
│   │   ├── errorHandler.js # Global error handler
│   │   └── rateLimiter.js  # Rate limiting for APIs
│   ├── modules/            # Feature-based organization
│   │   ├── auth/           # Register, Login, Logout
│   │   ├── users/          # User profile endpoints
│   │   ├── scores/         # Score submission & leaderboards
│   │   └── challenges/     # Daily/Weekly challenges (future)
│   ├── sockets/
│   │   └── snek.handler.js # WebSocket events for multiplayer
│   └── utils/
│       └── levelSystem.js  # XP & level calculation logic

js/                         # Vanilla JavaScript Frontend
├── main.js                 # GameManager, auth flow, UI orchestration
├── games/
│   ├── SliceGame.js        # Fruit cutting mechanics
│   ├── BeatGame.js         # Rhythm game loop
│   └── SnakeGame.js        # Snake movement & collision
└── utils/
    ├── api.js              # Fetch wrapper for backend calls
    ├── global.js           # Shared canvas & globals
    ├── audio.js            # Background music & SFX
    ├── input.js            # Mouse/Keyboard event listeners
    └── assets.js           # Image/Sprite loading

css/
└── style.css               # Glassmorphism theme, animations

index.html                  # Entry point

prisma/
└── schema.prisma           # Database models & migrations
```

---

## 🚀 Key Code Highlights

### **Smart Leaderboard Fetching**
```javascript
async showLeaderboard(gameIdStr = 'slice-io') {
    const data = await API.getLeaderboard(gameIdStr);
    const html = data.leaderboard.map((entry, index) => {
        const rank = index + 1;
        const badges = { 1: '🥇 1ST', 2: '🥈 2ND', 3: '🥉 3RD' };
        return `<div class="lb-row" style="color: ${rankClass}">
                  ${badges[rank] || `#${rank}`} ${entry.username} ${entry.score}
                </div>`;
    }).join('');
    document.getElementById('lb-content').innerHTML = html;
}
```

### **Secure Score Submission with Auth Validation**
```javascript
export const submitScore = async (req, res, next) => {
    const { gameId } = req.params;
    const { score, duration } = req.body;
    const userId = req.user.userId; // From JWT middleware
    
    // Save score
    await prisma.score.create({ data: { userId, gameId, score, duration } });
    
    // Calculate XP reward
    const xpEarned = calculateXpReward(score, gameId);
    const user = await prisma.user.findUnique({ where: { id: userId } });
    const newLevel = calculateLevel(user.totalXp + xpEarned);
    
    res.json({ xpEarned, levelUp: newLevel > user.level });
};
```

---

## 📈 Future Roadmap (Design Follow-up)

**Phase 2: Multiplayer & Real-time Features**
- [ ] Extend all games to support 2-4 player real-time mode (Socket.io events)
- [ ] Friend system with private matches
- [ ] Live notifications for leaderboard changes

**Phase 3: Mobile & Accessibility**
- [ ] Touch controls for mobile gameplay
- [ ] Progressive Web App (PWA) for offline play
- [ ] Keyboard shortcuts & ARIA labels for accessibility

**Phase 4: Anti-Cheat & Fairness**
- [ ] Server-side score validation (Impossible scores flag)
- [ ] Replay system to verify suspicious records
- [ ] ELO rating system for ranked matches

**Phase 5: Cosmetics & Monetization**
- [ ] Unlock skins, emotes, and name colors with XP
- [ ] Season pass with exclusive rewards
- [ ] Leaderboard tournaments with prize pools

**Phase 6: Analytics & Insights**
- [ ] Player stats dashboard (win rate, best game, playtime)
- [ ] Difficulty scaling based on skill
- [ ] Recommendations for games player might enjoy

---

## 🎓 Skills Demonstrated

### **Backend Development**
- ✅ REST API design and error handling
- ✅ Authentication & authorization (JWT, secure cookies)
- ✅ Middleware architecture and request pipeline
- ✅ Database schema design and query optimization
- ✅ Rate limiting and security best practices

### **Frontend Development**
- ✅ Vanilla JavaScript (ES6+ modules, async/await)
- ✅ HTML5 Canvas API for 2D game rendering
- ✅ CSS3 (Glassmorphism, animations, responsive design)
- ✅ State management and DOM manipulation
- ✅ Fetch API and error handling

### **DevOps & Tools**
- ✅ Environment configuration and secrets management
- ✅ Git version control and commits
- ✅ Node.js npm package management
- ✅ Database migrations with Prisma
- ✅ Debugging and browser dev tools

### **Software Design**
- ✅ Object-oriented game loop architecture
- ✅ MVC-like separation (Games, API, UI)
- ✅ Error handling and resilience
- ✅ Testing & debugging mindset
- ✅ Code organization and naming conventions

---

## 📸 Screenshots / Demo

> *Add screenshots here*
> - ![Lobby Screen](screenshots/lobby.png) – Game selection interface
> - ![Leaderboard](screenshots/leaderboard.png) – Global rankings with badges
> - ![Gameplay](screenshots/gameplay.png) – In-game HUD with score tracking
> - ![User Profile](screenshots/profile.png) – Player badge with XP bar

---

## 🔐 Security Considerations

- **Passwords**: Hashed with Argon2 (resistant to brute force)
- **Tokens**: JWT with 7-day expiry + HTTP-only cookies
- **CORS**: Whitelisted origins only
- **Rate Limiting**: Max 10 score submissions per minute per user
- **Input Validation**: All user inputs sanitized before DB insertion
- **HTTPS Ready**: Secure cookie flag enabled in production

---

## 🤝 Contributing & Feedback

This project is a portfolio piece. If you have feedback, ideas, or spot bugs:
1. Open an **Issue** with detailed reproduction steps
2. Submit a **Pull Request** with improvements
3. Reach out via email or LinkedIn (see below)

---

## 📄 License

This project is open source under the **MIT License**. See [LICENSE](LICENSE) for details.

---

## 👨‍💻 About Me

Hello! I'm a Computer Science student passionate about **full-stack development** and **game mechanics**. This project showcases my ability to:
- Design and build scalable backend APIs
- Create engaging frontend experiences
- Manage databases and real-time data flow
- Think critically about security, performance, and UX

**Let's connect!**
- 📧 Email: your.email@example.com
- 🔗 LinkedIn: [linkedin.com/in/yourprofile](https://linkedin.com)
- 💼 Portfolio: [yourportfolio.com](https://yourportfolio.com)
- 🐙 GitHub: [@yourprofile](https://github.com/yourprofile)

---

## 📚 Resources & Learning References

- [MDN Web Docs – Game Development](https://developer.mozilla.org/en-US/docs/Games)
- [Express.js Official Guide](https://expressjs.com/)
- [Prisma Documentation](https://www.prisma.io/docs/)
- [JWT Best Practices](https://datatracker.ietf.org/doc/html/rfc7519)
- [CORS Explained](https://developer.mozilla.org/en-US/docs/Web/HTTP/CORS)

---

**Last Updated**: February 2026 | **Status**: Active Development 🚀
