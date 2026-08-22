#!/usr/bin/env node

/**
 * Staging Automated Smoke Test
 * Tests API health endpoint and Web frontend shell accessibility.
 */

const API_URL = process.env.API_URL || "http://localhost:3001";
const WEB_URL = process.env.WEB_URL || "http://localhost:3000";
const MAX_ATTEMPTS = parseInt(process.env.SMOKE_MAX_ATTEMPTS || "15", 10);
const RETRY_DELAY_MS = parseInt(process.env.SMOKE_RETRY_DELAY_MS || "2000", 10);

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function checkApiHealth() {
  const healthUrl = `${API_URL}/health`;
  const response = await fetch(healthUrl);
  if (!response.ok) {
    throw new Error(`API healthcheck returned status ${response.status}`);
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
  const response = await fetch(WEB_URL);
  if (!response.ok) {
    throw new Error(`Web shell returned status ${response.status}`);
  }
  const text = await response.text();
  if (!text.includes("<html") && !text.includes("<!DOCTYPE html>")) {
    throw new Error("Web shell response does not contain valid HTML");
  }
  return { status: response.status, bytes: text.length };
}

async function runSmokeTests() {
  console.log("=========================================");
  console.log("🚀 Starting Staging Smoke Deploy Verification");
  console.log(`- API URL: ${API_URL}`);
  console.log(`- Web URL: ${WEB_URL}`);
  console.log(`- Max attempts: ${MAX_ATTEMPTS}`);
  console.log("=========================================\n");

  let apiPassed = false;
  let webPassed = false;

  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    console.log(`[Attempt ${attempt}/${MAX_ATTEMPTS}] Checking services...`);

    // 1. Check API
    if (!apiPassed) {
      try {
        const apiData = await checkApiHealth();
        console.log(`✅ API Health OK: version ${apiData.version}, status: ${apiData.status}`);
        apiPassed = true;
      } catch (err) {
        console.warn(`⏳ API Health waiting: ${err.message}`);
      }
    }

    // 2. Check Web
    if (!webPassed) {
      try {
        const webData = await checkWebShell();
        console.log(`✅ Web Shell OK: HTTP ${webData.status}, payload size: ${webData.bytes} bytes`);
        webPassed = true;
      } catch (err) {
        console.warn(`⏳ Web Shell waiting: ${err.message}`);
      }
    }

    if (apiPassed && webPassed) {
      console.log("\n🎉 All smoke tests passed successfully!");
      process.exit(0);
    }

    if (attempt < MAX_ATTEMPTS) {
      await sleep(RETRY_DELAY_MS);
    }
  }

  console.error("\n❌ Smoke test failed after maximum attempts.");
  if (!apiPassed) console.error("  - API service failed health checks.");
  if (!webPassed) console.error("  - Web frontend failed availability checks.");
  process.exit(1);
}

runSmokeTests().catch((err) => {
  console.error("Unhandled smoke test error:", err);
  process.exit(1);
});
