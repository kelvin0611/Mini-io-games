# Database Guide - IO Arcade

## How to View Your Registered Users

### **Method 1: Prisma Studio (Easiest GUI)**

Open a new terminal in the `io-arcade-backend` folder and run:
```powershell
npx prisma studio
```

This opens a web interface at **http://localhost:5555** where you can:
- ✅ View all registered users
- ✅ See user profiles (username, email, level, totalXp)
- ✅ View leaderboards and scores
- ✅ Verify new registrations in real-time

**Check these tables:**
1. **User** - See all registered users, their levels, and XP
2. **Score** - See all submitted game scores with usernames
3. **Challenge** - Daily/weekly challenges progress

### **Method 2: SQLite Browser (Local Desktop)**

If you have SQLite installed or want to use SQLite Browser:

The database is stored at: `io-arcade-backend/dev.db`

You can open it with:
- **SQLite Browser** (free, download from sqlite.org)
- **DBeaver** (free, more powerful)
- **VS Code SQLite Extension** (install in VS Code)

Query all users:
```sql
SELECT id, username, email, level, totalXp FROM "User";
```

Query all scores:
```sql
SELECT u.username, s.gameId, s.score, s.createdAt 
FROM "Score" s 
JOIN "User" u ON s.userId = u.id 
ORDER BY s.createdAt DESC;
```

---

## Verifying Registration Steps

### **Step 1: Register/Login**
1. Click **LOGIN** button on the game
2. Fill in email, username, and password
3. Click **REGISTER** (for new account) or **LOGIN** (for existing)
4. You should see: ✅ **"Account created!"** or **"Login successful!"** message in green

### **Step 2: Check Player Badge**
After successful login, you should see in the top-right corner:
- **Your username**
- **Lv.1** (starting level)
- **✖** logout button

### **Step 3: Verify in Database (Prisma Studio)**
1. Open terminal in `io-arcade-backend`
2. Run: `npx prisma studio`
3. Go to http://localhost:5555
4. Click on **"User"** table
5. You should see your newly registered user with:
   - **id**: Auto-generated
   - **username**: What you registered
   - **email**: What you registered
   - **level**: 1
   - **totalXp**: 0
   - **createdAt**: Current timestamp

---

## Quick Database Queries

### **See All Users**
```sql
SELECT username, email, level, totalXp, createdAt FROM "User" ORDER BY createdAt DESC;
```

### **See User Scores for a Game**
```sql
SELECT u.username, s.score, s.duration, s.gameId, s.createdAt 
FROM "Score" s 
JOIN "User" u ON s.userId = u.id 
WHERE s.gameId = 'slice-io' 
ORDER BY s.score DESC;
```

### **Count Total Users**
```sql
SELECT COUNT(*) as total_users FROM "User";
```

### **Get Leaderboard for a Game**
```sql
SELECT 
  ROW_NUMBER() OVER (ORDER BY MAX(s.score) DESC) as rank,
  u.username, 
  MAX(s.score) as best_score,
  COUNT(s.id) as games_played
FROM "Score" s
JOIN "User" u ON s.userId = u.id
WHERE s.gameId = 'slice-io'
GROUP BY u.id, u.username
ORDER BY best_score DESC
LIMIT 10;
```

---

## Troubleshooting

**"User badge not showing after login?"**
- Make sure you see the green "✓ Login successful!" message
- Refresh the page (F5)
- Check browser console for errors (F12)

**"Can't open Prisma Studio?"**
- Make sure backend is running in another terminal
- Use: `npx prisma studio` from the `io-arcade-backend` folder
- Check that port 5555 is not blocked

**"No users appearing in database?"**
- Click LOGIN to open auth modal
- Check the email/username format (no spaces)
- Make sure you see the success message
- Try a different email (must be unique)

**"Player info missing after login?"**
- The API fetches from `/api/users/me` endpoint
- This requires a valid JWT token (set automatically)
- If it fails, check Network tab in DevTools (F12)

---

## Notes

- Database resets when you delete `dev.db` file
- JWT tokens expire after 7 days
- Passwords are hashed with Argon2 (secure)
- All user data is stored with timestamps for tracking

---

## Quick Start Reminder

**Terminal 1 (Backend):**
```powershell
cd io-arcade-backend
npm run dev
```

**Terminal 2 (Database Viewer):**
```powershell
cd io-arcade-backend
npx prisma studio
```

**Frontend:**
- Open `index.html` with Live Server
- Visit http://127.0.0.1:5500

**Database Management:**
- http://localhost:5555 (Prisma Studio)
