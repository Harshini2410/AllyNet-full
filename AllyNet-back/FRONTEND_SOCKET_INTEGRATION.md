# Frontend Socket.IO Integration Guide

This document contains the Socket.IO client integration code for the AllyNet frontend.

## Files to Create

1. `src/api/socket.js` - Socket instance
2. `src/hooks/useEmergencySocket.js` - Socket hook

## Installation

```bash
npm install socket.io-client
```

## Integration Steps

1. Copy the files below to your frontend project
2. Update Zustand store with new actions (see below)
3. Use `useEmergencySocket` hook in SOS components
4. Ensure JWT token is available from auth store

---

