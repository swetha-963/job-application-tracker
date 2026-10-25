import axios from "axios";
import { errorMessage } from "./errors.js";
export { errorMessage };

const apiBase = import.meta.env.VITE_API_URL || "/api";
const ACCESS_KEY = "careerflow.access";
const REFRESH_KEY = "careerflow.refresh";

export const tokenStore = {
  getAccess: () => window.sessionStorage.getItem(ACCESS_KEY),
  getRefresh: () => window.sessionStorage.getItem(REFRESH_KEY),
  set: (tokens) => {
    if (tokens.access) window.sessionStorage.setItem(ACCESS_KEY, tokens.access);
    if (tokens.refresh) window.sessionStorage.setItem(REFRESH_KEY, tokens.refresh);
  },
  clear: () => {
    window.sessionStorage.removeItem(ACCESS_KEY);
    window.sessionStorage.removeItem(REFRESH_KEY);
  },
};

export const api = axios.create({ baseURL: apiBase });

api.interceptors.request.use((config) => {
  const access = tokenStore.getAccess();
  if (access) {
    config.headers = config.headers || {};
    config.headers.Authorization = "Bearer " + access;
  }
  return config;
});

let refreshRequest = null;
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const original = error.config;
    if (
      error.response?.status !== 401 ||
      !original ||
      original._retry ||
      String(original.url || "").includes("/auth/")
    ) {
      return Promise.reject(error);
    }

    const refresh = tokenStore.getRefresh();
    if (!refresh) {
      tokenStore.clear();
      return Promise.reject(error);
    }

    original._retry = true;
    try {
      if (!refreshRequest) {
        refreshRequest = axios
          .post(apiBase + "/auth/token/refresh/", { refresh })
          .then((response) => {
            tokenStore.set(response.data);
            return response.data.access;
          })
          .finally(() => {
            refreshRequest = null;
          });
      }
      const access = await refreshRequest;
      original.headers = original.headers || {};
      original.headers.Authorization = "Bearer " + access;
      return api(original);
    } catch (refreshError) {
      tokenStore.clear();
      return Promise.reject(refreshError);
    }
  },
);

export function getList(data) {
  return Array.isArray(data) ? data : data?.results || [];
}

export async function getAll(path, params = {}) {
  const rows = [];
  let next = path;
  let first = true;
  while (next) {
    const response = await api.get(next, first ? { params } : undefined);
    const data = response.data;
    rows.push(...getList(data));
    next = Array.isArray(data) ? null : data?.next;
    first = false;
  }
  return rows;
}



export async function downloadPrivateFile(path, filename) {
  const response = await api.get(path, { responseType: "blob" });
  const url = URL.createObjectURL(response.data);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename || "download";
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}

