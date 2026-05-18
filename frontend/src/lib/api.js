import axios from "axios";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
export const API = `${BACKEND_URL}/api`;

export const api = axios.create({ baseURL: API });

export const getCategories = () => api.get("/categories").then(r => r.data);
export const getCreators = (params = {}) => api.get("/creators", { params }).then(r => r.data);
export const getCreator = (id) => api.get(`/creators/${id}`).then(r => r.data);
export const getEditors = (params = {}) => api.get("/editors", { params }).then(r => r.data);
export const getBrands = () => api.get("/brands").then(r => r.data);
export const getDeals = (params = {}) => api.get("/deals", { params }).then(r => r.data);
export const createDeal = (data) => api.post("/deals", data).then(r => r.data);
export const updateDeal = (id, data) => api.patch(`/deals/${id}`, data).then(r => r.data);
export const createReview = (data) => api.post("/reviews", data).then(r => r.data);

export const createOrder = (data) => api.post("/razorpay/create-order", data).then(r => r.data);
export const verifyPayment = (data) => api.post("/razorpay/verify", data).then(r => r.data);
export const razorpayConfig = () => api.get("/razorpay/config").then(r => r.data);

// Onboarding
export const completeCreatorOnboarding = (data) => api.patch("/onboarding/creator", data).then(r => r.data);
export const completeBrandOnboarding   = (data) => api.patch("/onboarding/brand", data).then(r => r.data);

// Campaigns
export const getCampaigns    = (params = {}) => api.get("/campaigns", { params }).then(r => r.data);
export const getCampaign     = (id) => api.get(`/campaigns/${id}`).then(r => r.data);
export const createCampaign  = (data) => api.post("/campaigns", data).then(r => r.data);

// Applications
export const getApplications  = (params = {}) => api.get("/applications", { params }).then(r => r.data);
export const applyToCampaign  = (data) => api.post("/applications", data).then(r => r.data);
export const reviewApplication = (id, action) => api.patch(`/applications/${id}`, { action }).then(r => r.data);

// Google OAuth
export const googleSignIn = (credential, role) => api.post("/auth/google", { credential, role }).then(r => r.data);

// Delete account
export const deleteAccount = () => api.delete("/auth/me").then(r => r.data);

// Change password
export const changePassword = (current_password, new_password) =>
  api.patch("/auth/change-password", { current_password, new_password }).then(r => r.data);

// Phyllo / Instagram (legacy)
export const createPhylloUser    = () => api.post("/phyllo/create-user").then(r => r.data);
export const fetchPhylloProfile  = (account_id) => api.post("/phyllo/fetch-profile", { account_id }).then(r => r.data);

// Avatar upload
export const uploadAvatar = (avatar) => api.post("/creators/avatar", { avatar }).then(r => r.data);

// Instagram (RapidAPI scraper)
export const instagramLookup  = (username) => api.post("/instagram/lookup", { username }).then(r => r.data);
export const instagramConnect = (username) => api.post("/instagram/connect", { username }).then(r => r.data);

// Email OTP
export const sendOTP    = (email) => api.post("/auth/send-otp", { email }).then(r => r.data);
export const verifyOTP  = (email, otp) => api.post("/auth/verify-otp", { email, otp }).then(r => r.data);

// Careers
export const submitCareersApplication = (data) => api.post("/careers/apply", data).then(r => r.data);

// Profile updates
export const updateCreatorProfile = (data) => api.patch("/profile/creator", data).then(r => r.data);
export const updateBrandProfile   = (data) => api.patch("/profile/brand", data).then(r => r.data);

// Notifications
export const getNotifications        = () => api.get("/notifications").then(r => r.data);
export const markNotificationRead    = (id) => api.patch(`/notifications/${id}/read`).then(r => r.data);
export const markAllNotificationsRead = () => api.patch("/notifications/read-all").then(r => r.data);

// Trust Score
export const refreshTrustScore = (creatorId) => api.post(`/creators/${creatorId}/refresh-trust-score`).then(r => r.data);

// Deal Rooms
export const getDealRooms       = () => api.get("/deal-rooms").then(r => r.data);
export const getDealRoom        = (id) => api.get(`/deal-rooms/${id}`).then(r => r.data);
export const submitContent      = (id, content_link) => api.patch(`/deal-rooms/${id}/submit`, { content_link }).then(r => r.data);
export const reviewContent      = (id, note) => api.patch(`/deal-rooms/${id}/review`, { note }).then(r => r.data);
export const updateDealRoomStatus = (id, status, instagram_post_url) => api.patch(`/deal-rooms/${id}/status`, { status, instagram_post_url }).then(r => r.data);
