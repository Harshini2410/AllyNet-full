# Port Configuration Fix

## Issue
Backend was running on port 3000, but frontend expects port 5000.

## Fix Applied
Updated `AllyNet-back/.env` file to set `PORT=5000`

## Next Steps
**IMPORTANT:** Restart the backend server for the change to take effect.

1. Stop the current backend server (Ctrl+C in the terminal where it's running)
2. Start it again: `cd AllyNet-back && npm run dev`
3. Verify it shows: `Port: 5000`

## Verification
After restarting, the backend should show:
```
📍 Port: 5000
📡 API: http://localhost:5000
🔌 Socket.IO: ws://localhost:5000/emergencies
```

Frontend is already configured to use `http://localhost:5000` as the API base URL.

