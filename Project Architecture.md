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
