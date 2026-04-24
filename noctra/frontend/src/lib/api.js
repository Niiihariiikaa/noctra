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
