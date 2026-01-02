import { create } from 'zustand';

/**
 * Emergency Session Store
 * Separate from useEmergencyStore - handles only messaging/session state
 * API-first: State restored from API, sockets are enhancement only
 */
export const useEmergencySessionStore = create((set) => ({
  // Session state
  emergencyId: null,
  role: null, // 'creator' | 'helper'
  participants: [],
  messages: [],
  chatOpen: false,
  chatAvailable: false, // Chat is available but not necessarily open (for helpers)
  loading: false,
  error: null,
  isResolved: false, // Chat becomes read-only when emergency is resolved

  // Initialize session (API-first)
  initializeSession: (emergencyId, role) => set({ 
    emergencyId, 
    role,
    messages: [],
    loading: false,
    error: null,
    chatOpen: false,
    chatAvailable: true, // Session initialized means chat is available
    isResolved: false
  }),

  // Load messages from API
  loadMessages: (messages) => set({ 
    messages: messages || [],
    loading: false,
    error: null
  }),

  // Add message (from API response or socket enhancement)
  addMessage: (message) => set((state) => {
    // Prevent duplicates (check by _id)
    const exists = state.messages.some(m => m._id === message._id);
    if (exists) return state;
    
    return {
      messages: [...state.messages, message]
    };
  }),

  // Remove message (after deletion)
  removeMessage: (messageId) => set((state) => ({
    messages: state.messages.filter(m => m._id !== messageId)
  })),

  // Set loading state
  setLoading: (loading) => set({ loading }),

  // Set error
  setError: (error) => set({ error }),

  // Toggle chat open/closed
  setChatOpen: (open) => set({ chatOpen: open }),

  // Set chat available flag
  setChatAvailable: (available) => set({ chatAvailable: available }),

  // Mark emergency as resolved (chat becomes read-only)
  setResolved: (resolved) => set({ isResolved: resolved }),

  // Clear session (on logout, emergency resolved, etc.)
  clearSession: () => set({
    emergencyId: null,
    role: null,
    participants: [],
    messages: [],
    chatOpen: false,
    chatAvailable: false,
    loading: false,
    error: null,
    isResolved: false
  }),

  // Update participants
  setParticipants: (participants) => set({ participants: participants || [] }),
}));

