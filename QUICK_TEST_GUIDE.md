# ✅ Complete Check: Registration, Login & Database

## Test Checklist

### 1️⃣ Register a New Account

**Frontend (Game):**
1. Click **LOGIN** button (top right)
2. Fill in the auth modal:
   - Email: `test@example.com` (must be unique)
   - Username: `testplayer` (must be unique) 
   - Password: `password123`
3. Click **REGISTER**
4. Look for **GREEN** message: ✓ "Account created! Logging in..."
5. Modal closes automatically
6. **Check top-right corner** - you should see:
   - Your username 
   - **Lv.1** badge
   - ✖ logout button

✅ **If you see your username and Lv.1, registration worked!**

---

### 2️⃣ Verify in Database (Most Important!)

**Open Prisma Studio:**
```powershell
cd io-arcade-backend
npx prisma studio
```

Visit: **http://localhost:5555**

**Check User Table:**
1. Click **"User"** in left sidebar
2. You should see your new user entry:
   - ✓ username: `testplayer`
   - ✓ email: `test@example.com`
   - ✓ level: `1`
   - ✓ totalXp: `0`
   - ✓ createdAt: Recent timestamp

✅ **If your user appears here, database registration is complete!**

---

### 3️⃣ Play a Game & Submit Score

1. Click on any game (Slice.io, Beat.io, or Snake.io)
2. Play and get a score
3. When game ends, click **RETRY** or **EXIT**
4. If logged in, score should save automatically (no error messages)

**Check Score in Database:**
1. Go to Prisma Studio (http://localhost:5555)
2. Click **"Score"** table
3. You should see your new score entry:
   - ✓ userId: (your user ID)
   - ✓ gameId: `slice-io`, `beat-io`, or `snek-io`
   - ✓ score: (your score value)
   - ✓ createdAt: Recent timestamp

✅ **If your score appears here, game submission works!**

---

### 4️⃣ View Leaderboard

1. Go back to lobby (click home icon or EXIT)
2. Click **🏆 Leaderboard** 
3. Game selector appears (Slice.io, Beat.io, Snek.io)
4. Click on a game to see leaderboards

**Expected Display:**
```
#1 testplayer   12500
#2 player1      10000
#3 player2       8500
```

✅ **If leaderboard shows your scores, leaderboard works!**

---

## Troubleshooting

### Problem: Player badge not showing after login
**Solution:**
- Wait 0.5 seconds after "Login successful!" appears
- Refresh page (F5)
- Check DevTools console (F12) for errors
- Make sure modal closed automatically

### Problem: No user in database
**Solution:**
- Try registering with different email
- Check for error message (must be red text)
- If error says "already exists", use new email
- Make sure backend is running (`npm run dev`)

### Problem: Leaderboard shows "No scores yet"
**Solution:**
- Play a game and get a score
- Make sure you're logged in when submitting
- Check Score table in Prisma Studio
- Game must end properly to submit

### Problem: Games not saving score
**Solution:**
- Make sure you're logged in ✓
- Play until game ends
- Wait for overlay to appear
- Check Network tab for API calls to `/scores/`

---

## Database File Location

SQLite database file is stored at:
```
io-arcade-backend/dev.db
```

To reset (DELETE all users/scores):
```powershell
cd io-arcade-backend
rm dev.db
npx prisma db push
# Recreates empty database
```

⚠️ **This will delete all users and scores!**

---

## Summary: How Authentication Works

1. **Register** → Creates user in database with hashed password
2. **Login** → Validates credentials, creates JWT token cookie
3. **getProfile** → Fetches user info from database (requires valid token)
4. **submitScore** → Game calls `/scores/{gameId}` endpoint
5. **Leaderboard** → Fetches top scores for each game

**All tokens are HTTP-only secure cookies** - automatically sent with API requests.

---

## Quick Commands

**Start Backend:**
```powershell
cd io-arcade-backend
npm run dev
```

**View Database:**
```powershell
cd io-arcade-backend
npx prisma studio
# Then visit http://localhost:5555
```

**Frontend:**
- Right-click `index.html` → Open with Live Server
- Visit http://127.0.0.1:5500

---

✅ **Your IO Arcade is now fully connected with:**
- ✓ User registration/login
- ✓ Player profiles & levels
- ✓ Score submission
- ✓ Leaderboards
- ✓ Database persistence

🎮 Enjoy!
