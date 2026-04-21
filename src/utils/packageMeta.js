export const PACKAGE_ORDER = ["basic", "pro", "vip"];

const PACKAGE_DISPLAY_NAMES = {
  basic: "STANDARD",
  pro: "PRO",
  vip: "VIP",
};

export const getPackageDisplayName = (slug, fallbackName = "") =>
  PACKAGE_DISPLAY_NAMES[String(slug || "").toLowerCase()] ||
  String(fallbackName || "PACKAGE").toUpperCase();

export const getPackageBadgeLabel = (slug) =>
  getPackageDisplayName(slug, slug || "package");
