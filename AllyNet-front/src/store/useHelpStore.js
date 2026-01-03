import { create } from 'zustand';

export const useHelpStore = create((set) => ({
  requests: [
    {
      id: '1',
      title: 'Need help moving a couch',
      category: 'Physical',
      priority: 'low',
      budget: '20',
      location: '200m away',
      user: 'Sarah M.',
      status: 'open',
      createdAt: new Date().toISOString(),
    },
    {
      id: '2',
      title: 'Flat tire near Main St.',
      category: 'Auto',
      priority: 'high',
      budget: null,
      location: '1.2km away',
      user: 'Mike R.',
      status: 'open',
      createdAt: new Date().toISOString(),
    }
  ],
  
  addRequest: (request) => set((state) => ({ 
    requests: [
      { 
        id: Math.random().toString(36).substr(2, 9), 
        ...request, 
        status: 'open', 
        createdAt: new Date().toISOString() 
      }, 
      ...state.requests 
    ] 
  })),
  
  updateRequestStatus: (id, status) => set((state) => ({
    requests: state.requests.map(req => req.id === id ? { ...req, status } : req)
  })),
}));


