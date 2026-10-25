const DEFAULT_ERROR_MESSAGE = "Something went wrong. Please try again.";
const HTML_RESPONSE_MESSAGE =
  "The server returned a web page instead of API data. Refresh the app and confirm that the backend is serving the current project.";
const HTML_MARKUP = /<\s*(?:!doctype\s+html|\/?html\b|\/?head\b|\/?body\b|\/?title\b|\/?style\b|\/?script\b|\/?div\b|\/?pre\b|\/?main\b|\/?section\b)[^>]*>/i;

function containsHtml(value) {
  if (typeof value === "string") return HTML_MARKUP.test(value);
  if (Array.isArray(value)) return value.some(containsHtml);
  if (value && typeof value === "object") {
    return Object.values(value).some(containsHtml);
  }
  return false;
}

function firstText(value) {
  if (typeof value === "string") return value.trim() || null;
  if (Array.isArray(value)) {
    for (const item of value) {
      const message = firstText(item);
      if (message) return message;
    }
  } else if (value && typeof value === "object") {
    for (const item of Object.values(value)) {
      const message = firstText(item);
      if (message) return message;
    }
  }
  return null;
}

function contentTypeOf(headers) {
  if (typeof headers?.get === "function") {
    return headers.get("content-type") || "";
  }
  return headers?.["content-type"] || headers?.["Content-Type"] || "";
}

export function errorMessage(error, fallback = DEFAULT_ERROR_MESSAGE) {
  const response = error?.response;
  const data = response?.data;
  if (!data) return fallback;

  if (contentTypeOf(response.headers).toLowerCase().includes("text/html") || containsHtml(data)) {
    return HTML_RESPONSE_MESSAGE;
  }

  return firstText(data) || fallback;
}
