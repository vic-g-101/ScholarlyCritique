export const API_BASE_URL =
  (typeof import.meta !== "undefined" && import.meta.env && import.meta.env.VITE_API_URL) ||
  (typeof process !== "undefined" && process.env && process.env.REACT_APP_API_URL) ||
  "http://localhost:8000";

export const API_PATHS = {
  AUTH: {
    LOGIN: "/api/v1/auth/login",
    REGISTER: "/api/v1/auth/register",
    GET_USER_INFO: "/api/v1/auth/getUser",
    UPDATE_PROFILE: "/api/v1/auth/profile",          // for signup data save
  },

  IMAGE: {
    UPLOAD_IMAGE: "/api/v1/auth/upload-image",
  },

  DASHBOARD: {
    GET_DATA: "/api/v1/dashboard",
  },

  ESSAYS: {
    SUBMIT: "/api/v1/essays",                         // POST (multipart: document, topic, etc.)
    MINE: "/api/v1/essays/me",                        // GET ?status=open|in_review|closed
    FEED: "/api/v1/essays/feed",                      // GET ?limit=..&excludeMine=true
    BY_ID: (id) => `/api/v1/essays/${id}`,            // GET
  },

  CRITIQUES: {
    SUBMIT: "/api/v1/critiques",                      // POST (optional annotated file)
    FOR_ESSAY: (essayId) => `/api/v1/critiques/essay/${essayId}`, // GET
    MINE: "/api/v1/critiques/me",                     // GET
  },

  STARS: {
    RATE: "/api/v1/star",                              // POST { critiqueId?, value, comment? }
    FOR_CRITIQUE: (critiqueId) => `/api/v1/star/critique/${critiqueId}`, // GET
    RECEIVED_FOR_USER: (userId) => `/api/v1/star/user/${userId}/received`, // GET
    SUMMARY_FOR_USER: (userId) => `/api/v1/star/user/${userId}/summary`,   // GET
    GIVEN_BY_ME: "/api/v1/star/me/given",             // GET
    UPDATE: (ratingId) => `/api/v1/star/${ratingId}`, // PUT
    DELETE: (ratingId) => `/api/v1/star/${ratingId}`, // DELETE
  },

  CREDITS: {
    ME: "/api/v1/credits/me",                         // GET
    AWARD_CRITIQUE: "/api/v1/credits/award-critique", // POST (usually called server-side on rating)
    CHARGE_ESSAY: "/api/v1/credits/charge-essay",     // POST (server uses this during submit)
    ADJUST: "/api/v1/credits/adjust",                 // POST (admin-only; guard on server)
  },

  LEADERBOARD: {
    REVIEWERS: "/api/v1/leaderboard/reviewers",       // GET ?period=month&limit=5&minCount=3
  },

  AI: {
    PROMPTS: "/api/v1/ai/prompts",                    // GET ?limit=6&areas=stem,law
    // TOPICS: "/api/v1/ai/topics",                   // only if you kept the topics endpoint
  },
};

// Helper to build absolute URLs
export const withBase = (path) => `${API_BASE_URL}${path}`;