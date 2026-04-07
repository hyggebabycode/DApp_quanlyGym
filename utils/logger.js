/**
 * utils/logger.js
 * Logger nhẹ với màu sắc + timestamp — không cần thư viện ngoài
 */

const LEVELS = { error: 0, warn: 1, info: 2, debug: 3 };

const COLORS = {
  error: "\x1b[31m",
  warn: "\x1b[33m",
  info: "\x1b[36m",
  debug: "\x1b[90m",
  reset: "\x1b[0m",
};

const ICONS = { error: "✖", warn: "⚠", info: "ℹ", debug: "·" };

const CURRENT_LEVEL = LEVELS[process.env.LOG_LEVEL] ?? LEVELS.info;

function timestamp() {
  return new Date().toLocaleString("vi-VN", { timeZone: "Asia/Ho_Chi_Minh" });
}

function formatMeta(meta) {
  if (!meta || typeof meta !== "object") return "";
  return (
    "\n" +
    Object.entries(meta)
      .map(([k, v]) => `    ${k}: ${v}`)
      .join("\n")
  );
}

function log(level, message, meta) {
  if (LEVELS[level] > CURRENT_LEVEL) return;
  const color = COLORS[level];
  const icon = ICONS[level];
  const ts = timestamp();
  const label = level.toUpperCase().padEnd(5);
  const extra = meta ? formatMeta(meta) : "";

  process.stdout.write(
    `${color}${icon} [${ts}] ${label}${COLORS.reset} ${message}${extra}\n`,
  );
}

const logger = {
  error: (msg, meta) => log("error", msg, meta),
  warn: (msg, meta) => log("warn", msg, meta),
  info: (msg, meta) => log("info", msg, meta),
  debug: (msg, meta) => log("debug", msg, meta),
};

module.exports = logger;
