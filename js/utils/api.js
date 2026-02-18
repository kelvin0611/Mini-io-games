// js/utils/api.js
const BASE_URL = 'http://127.0.0.1:3000/api';

async function fetchAPI(endpoint, options = {}) {
    try {
        const res = await fetch(`${BASE_URL}${endpoint}`, {
            ...options,
            headers: {
                'Content-Type': 'application/json',
                ...(options.headers || {})
            },
            // CRITICAL: This sends the HTTP-Only JWT cookie automatically
            credentials: 'include' 
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'API Request Failed');
        return data;
    } catch (err) {
        console.error('API Error:', err);
        throw err;
    }
}

export const API = {
    register: (email, username, password) => 
        fetchAPI('/auth/register', { method: 'POST', body: JSON.stringify({ email, username, password }) }),
    
    login: (email, password) => 
        fetchAPI('/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) }),
    
    logout: () => 
        fetchAPI('/auth/logout', { method: 'POST' }),
    
    getProfile: () => 
        fetchAPI('/users/me'),
    
    submitScore: (gameId, score, duration = 60) => 
        fetchAPI(`/scores/${gameId}`, { method: 'POST', body: JSON.stringify({ score, duration }) }),
    
    getLeaderboard: (gameId) => 
        fetchAPI(`/scores/leaderboard/${gameId}`)
};
