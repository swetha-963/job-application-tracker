import { test } from "node:test";
import assert from "node:assert/strict";
import { errorMessage } from "./errors.js";

const django404 = `<!DOCTYPE html>
<html lang="en">
<head><title>Page not found at /api/documents/</title></head>
<body><h1>Page not found (404)</h1><pre>Traceback details</pre></body>
</html>`;

test("replaces a Django HTML 404 page with a concise diagnostic", () => {
  const message = errorMessage(
    {
      response: {
        status: 404,
        headers: { "content-type": "text/html; charset=utf-8" },
        data: django404,
      },
    },
    "Could not load documents.",
  );

  assert.match(message, /web page instead of API data/i);
  assert.doesNotMatch(message, /<!DOCTYPE|Page not found|Traceback/i);
  assert.ok(message.length < 200);
});

test("detects HTML even when the response header is missing", () => {
  const message = errorMessage({ response: { data: { detail: django404 } } });

  assert.match(message, /web page instead of API data/i);
  assert.doesNotMatch(message, /<!DOCTYPE|Page not found/i);
});

test("preserves useful JSON API validation messages", () => {
  assert.equal(
    errorMessage({ response: { data: { file: ["Only PDF files are allowed."] } } }),
    "Only PDF files are allowed.",
  );
  assert.equal(
    errorMessage({ response: { data: { detail: "Authentication credentials were not provided." } } }),
    "Authentication credentials were not provided.",
  );
});

test("uses the supplied fallback when there is no response message", () => {
  assert.equal(errorMessage({ response: { data: {} } }, "Could not load documents."), "Could not load documents.");
});
