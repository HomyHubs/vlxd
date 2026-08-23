#!/usr/bin/env node

/**
 * Staging Automated Smoke Test
 * Tests API health endpoint and Web frontend shell accessibility concurrently.
 * Both services must pass simultaneously in the same check iteration.
 */

const API_URL = process.env.API_URL || process.env.STAGING_API_URL || "http://localhost:3001";
const WEB_URL = process.env.WEB_URL || process.env.STAGING_WEB_URL || "http://localhost:3000";
const MAX_ATTEMPTS = parseInt(process.env.SMOKE_MAX_ATTEMPTS || "15", 10);
const INITIAL_DELAY_MS = parseInt(process.env.SMOKE_RETRY_DELAY_MS || "1500", 10);
const MAX_DELAY_MS = 8000;
const REQUEST_TIMEOUT_MS = 5000;

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function checkApiHealth() {
  const healthUrl = `${API_URL}/health`;
  const response = await fetch(healthUrl, {
    signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
  });
  if (!response.ok) {
    throw new Error(`API healthcheck returned HTTP ${response.status}`);
  }
  const data = await response.json();
  if (data.status !== "ok") {
    throw new Error(`API health status expected 'ok', got '${data.status}'`);
  }
  if (!data.version) {
    throw new Error("API health response missing 'version' field");
  }
  if (!data.timestamp || isNaN(Date.parse(data.timestamp))) {
    throw new Error(`API health response invalid timestamp '${data.timestamp}'`);
  }
  return data;
}

async function checkWebShell() {
  const response = await fetch(WEB_URL, {
    signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
  });
  if (!response.ok) {
    throw new Error(`Web shell returned HTTP ${response.status}`);
  }
  const text = await response.text();
  if (!text.includes("<html") && !text.includes("<!DOCTYPE html>")) {
    throw new Error("Web shell response does not contain valid HTML");
  }
  return { status: response.status, bytes: text.length };
}

async function runSmokeTests() {
  console.log("=========================================");
  console.log("🚀 Starting Staging Concurrent Smoke Verification");
  console.log(`- Target API URL: ${API_URL}`);
  console.log(`- Target Web URL: ${WEB_URL}`);
  console.log(`- Max attempts: ${MAX_ATTEMPTS}`);
  console.log(`- Request timeout: ${REQUEST_TIMEOUT_MS}ms`);
  console.log("=========================================\n");

  let currentDelay = INITIAL_DELAY_MS;

  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    console.log(`[Attempt ${attempt}/${MAX_ATTEMPTS}] Concurrent health checks...`);

    const results = await Promise.allSettled([checkApiHealth(), checkWebShell()]);
    const [apiResult, webResult] = results;

    const apiPassed = apiResult.status === "fulfilled";
    const webPassed = webResult.status === "fulfilled";

    if (apiPassed && webPassed) {
      const apiData = apiResult.value;
      const webData = webResult.value;
      console.log(`  ✅ API Health OK: version ${apiData.version}, status: ${apiData.status}`);
      console.log(`  ✅ Web Shell OK: HTTP ${webData.status}, payload size: ${webData.bytes} bytes`);
      console.log("\n🎉 All staging smoke tests passed concurrently!");
      process.exit(0);
    }

    if (!apiPassed) console.warn(`  ⏳ API waiting: ${apiResult.reason?.message || "Unknown error"}`);
    if (!webPassed) console.warn(`  ⏳ Web waiting: ${webResult.reason?.message || "Unknown error"}`);

    if (attempt < MAX_ATTEMPTS) {
      console.log(`   Waiting ${currentDelay}ms before retry...`);
      await sleep(currentDelay);
      currentDelay = Math.min(currentDelay * 1.5, MAX_DELAY_MS);
    }
  }

  console.error("\n❌ Smoke test failed: Services failed concurrent health verification within limit.");
  process.exit(1);
}

runSmokeTests().catch((err) => {
  console.error("Unhandled smoke test error:", err);
  process.exit(1);
});
