# Task: Fix Login JSON Parse Error (SyntaxError: Unexpected token '<')

Status: In progress

## Steps:
1. [ ] Edit backend/routes/auth.js - rename POST /signin → POST /login
2. [ ] Edit backend/index.js - change `app.use(Authrouter)` → `app.use('/auth', Authrouter)`
3. [ ] Edit frontend/src/context/AuthContext.jsx - Add `if (!response.ok) throw new Error(...);` before response.json() in login() and register()
4. [ ] Restart backend server
5. [ ] Test login in frontend (use guest@gmail.com)
6. [x] Mark complete

Current progress: Starting edits
