/**
 * Frees a TCP port before dev server start (Windows + Unix).
 * Usage: node scripts/free-port.js [port]
 */
const { execSync } = require("child_process");
const fs = require("fs");
const path = require("path");

function readPortFromEnv() {
  try {
    const envPath = path.resolve(__dirname, "../.env");
    const content = fs.readFileSync(envPath, "utf8");
    const match = content.match(/^PORT=(\d+)/m);
    if (match) return match[1];
  } catch {
    // no .env
  }
  return null;
}

const port = process.argv[2] || readPortFromEnv() || process.env.PORT || "4001";

function freePortWindows(p) {
  try {
    const out = execSync(`netstat -ano | findstr :${p}`, { encoding: "utf8" });
    const pids = new Set();

    for (const line of out.split("\n")) {
      if (!line.includes("LISTENING")) continue;
      const parts = line.trim().split(/\s+/);
      const pid = parts[parts.length - 1];
      if (pid && /^\d+$/.test(pid) && pid !== "0") {
        pids.add(pid);
      }
    }

    for (const pid of pids) {
      try {
        execSync(`taskkill /PID ${pid} /F`, { stdio: "ignore" });
        console.log(`[free-port] Freed port ${p} (pid ${pid})`);
      } catch {
        // already gone
      }
    }
  } catch {
    // nothing listening
  }
}

function freePortUnix(p) {
  try {
    execSync(`lsof -ti tcp:${p} | xargs -r kill -9`, { stdio: "ignore", shell: true });
    console.log(`[free-port] Freed port ${p}`);
  } catch {
    // port already free
  }
}

if (process.platform === "win32") {
  freePortWindows(port);
} else {
  freePortUnix(port);
}
