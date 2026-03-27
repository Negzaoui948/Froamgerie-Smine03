export const API_BASE_URL =
  process.env.REACT_APP_API_BASE_URL || "http://localhost:3015";

export const buildApiUrl = (path = "") => `${API_BASE_URL}${path}`;
