#!/usr/bin/env node
/**
 * Public HTTPS tunnel for phone testing (campus Wi-Fi blocks LAN IPs).
 * Uses cloudflared if installed; otherwise localtunnel (loca.lt broker + timeout).
 */

const { spawn, spawnSync } = require("child_process");
const PORT = Number(process.env.TUNNEL_PORT || 3000);

console.log(
  "\nTunnel → http://127.0.0.1:%s — run `npm run dev` in another terminal first.\n",
  PORT
);

const cfCheck = spawnSync("cloudflared", ["--version"], {
  encoding: "utf8",
  stdio: "pipe",
});
const hasCloudflared = cfCheck.status === 0;

if (hasCloudflared) {
  console.log("Using cloudflared (recommended on campus networks).\n");
  const cf = spawn(
    "cloudflared",
    ["tunnel", "--url", `http://localhost:${PORT}`],
    { stdio: "inherit" }
  );
  cf.on("error", (err) => {
    console.error(err);
    process.exit(1);
  });
  cf.on("exit", (code) => process.exit(code ?? 0));
} else {
  console.log("cloudflared not in PATH — using localtunnel.");
  console.log("For better reliability: brew install cloudflare/cloudflare/cloudflared\n");
  runLocalTunnel();
}

function runLocalTunnel() {
  const localtunnel = require("localtunnel");
  const BROKER = process.env.TUNNEL_BROKER || "https://loca.lt";

  console.log("Broker: %s (set TUNNEL_BROKER to override)\n", BROKER);

  const timer = setTimeout(() => {
    console.error(
      "\nTimeout: tunnel broker did not respond in 25s.\n" +
        "Your network may block it. Install Cloudflare’s CLI:\n\n" +
        "  brew install cloudflare/cloudflare/cloudflared\n\n" +
        "Then run: npm run tunnel\n"
    );
    process.exit(1);
  }, 25000);

  localtunnel({ port: PORT, host: BROKER })
    .then((tunnel) => {
      clearTimeout(timer);
      console.log("\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
      console.log("  Open this on your phone (HTTPS):");
      console.log("  %s", tunnel.url);
      console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");
      console.log("Keep this terminal open. Ctrl+C to stop.\n");
      tunnel.on("error", (e) => console.error("Tunnel error:", e.message));
    })
    .catch((e) => {
      clearTimeout(timer);
      console.error("localtunnel failed:", e.message || e);
      console.error("\nInstall cloudflared:\n  brew install cloudflare/cloudflare/cloudflared\n");
      process.exit(1);
    });
}
