
const $ = (id) => document.getElementById(id);

const siteName = $("siteName");
const siteUrl = $("siteUrl");
const checkButton = $("checkButton");
const result = $("result");
const resultIcon = $("resultIcon");
const resultTitle = $("resultTitle");
const resultText = $("resultText");

const httpsStatus = $("httpsStatus");
const urlStatus = $("urlStatus");
const hostStatus = $("hostStatus");

let currentUrl = "";

function showResult(level, icon, title, message) {
  result.className = `result ${level}`;
  resultIcon.textContent = icon;
  resultTitle.textContent = title;
  resultText.textContent = message;
}

function inspectUrl(rawUrl) {
  const warnings = [];
  let url;

  try {
    url = new URL(rawUrl);
  } catch {
    return {
      level: "warning",
      title: "Unable to analyze",
      message: "This tab does not have a standard web URL.",
      connection: "Unknown",
      structure: "Not checked",
      hostname: "Unknown",
      warnings: ["Invalid URL"]
    };
  }

  if (!["http:", "https:"].includes(url.protocol)) {
    return {
      level: "warning",
      title: "Page cannot be checked",
      message: "Browser-internal pages and non-web URLs are not supported.",
      connection: "Not applicable",
      structure: "Not checked",
      hostname: "Not checked",
      warnings: ["Unsupported URL scheme"]
    };
  }

  const host = url.hostname.toLowerCase();
  const labels = host.split(".");
  const isHttps = url.protocol === "https:";
  let suspicious = false;

  // Check the connection scheme.
  if (!isHttps) {
    warnings.push("The connection uses HTTP, not HTTPS.");
  }

  // Check for misleading user-info syntax, such as trusted.example@evil.test.
  if (url.username || url.password || rawUrl.includes("@")) {
    warnings.push("The URL contains @ or user-information syntax.");
    suspicious = true;
  }

  // Check for IP-address hostnames.
  const ipv4 = /^(?:\d{1,3}\.){3}\d{1,3}$/.test(host);
  const bracketedIPv6 = host.startsWith("[") && host.endsWith("]");

  if (ipv4 || bracketedIPv6) {
    warnings.push("The hostname is an IP address rather than a typical domain.");
    suspicious = true;
  }

  // Check for internationalized domain labels.
  if (labels.some(label => label.startsWith("xn--"))) {
    warnings.push("The domain contains an encoded internationalized label.");
    suspicious = true;
  }

  // Check for excessive hostname complexity.
  if (labels.length >= 5) {
    warnings.push("The hostname contains many subdomains.");
    suspicious = true;
  }

  if (labels.some(label => label.length > 30)) {
    warnings.push("The hostname contains an unusually long label.");
    suspicious = true;
  }

  // Check for misleading brand-like words in a hostname.
  // This is only a warning heuristic, not brand verification.
  const brandWords = [
    "paypal", "google", "microsoft", "apple",
    "amazon", "facebook", "instagram", "netflix"
  ];

  const knownBrand = brandWords.find(brand => {
    return labels.some(label =>
      label.includes(brand) && label !== brand
    );
  });

  if (knownBrand) {
    warnings.push(
      `The hostname contains a brand-like word ("${knownBrand}") inside a different label. Verify the real domain.`
    );
    suspicious = true;
  }

  // Look for common social-engineering words in the hostname.
  const riskyWords = [
    "verify-account",
    "secure-login",
    "account-verify",
    "password-reset",
    "wallet-connect",
    "urgent-login"
  ];

  if (riskyWords.some(word => host.includes(word))) {
    warnings.push("The hostname contains a common account-lure phrase.");
    suspicious = true;
  }

  // Check for unusually long hostnames.
  if (host.length > 60) {
    warnings.push("The hostname is unusually long.");
    suspicious = true;
  }

  let level = "safe";
  let title = "No obvious warning signs";
  let message =
    "These basic checks found no selected warning patterns. This is not a reputation check and does not prove the website is safe.";

  if (suspicious) {
    level = "danger";
    title = "Suspicious URL patterns detected";
    message =
      "One or more URL patterns deserve review. Do not enter sensitive information until you independently verify the domain.";
  } else if (!isHttps) {
    level = "warning";
    title = "Connection is not encrypted";
    message =
      "This website uses HTTP. Avoid entering passwords, payment details, or other sensitive information.";
  }

  return {
    level,
    title,
    message,
    connection: isHttps ? "HTTPS detected" : "HTTP — not encrypted",
    structure: suspicious ? "Suspicious patterns found" : "No selected pattern found",
    hostname: host,
    warnings
  };
}

function getCurrentTab() {
  return new Promise(resolve => {
    chrome.tabs.query(
      { active: true, lastFocusedWindow: true },
      tabs => resolve(tabs && tabs.length ? tabs[0] : null)
    );
  });
}

async function loadCurrentSite() {
  const tab = await getCurrentTab();

  if (!tab || !tab.url) {
    currentUrl = "";
    siteName.textContent = "Website unavailable";
    siteUrl.textContent = "";
    checkButton.disabled = true;

    httpsStatus.textContent = "Not checked";
    urlStatus.textContent = "Not checked";
    hostStatus.textContent = "Not checked";

    showResult(
      "neutral",
      "ⓘ",
      "Page unavailable",
      "Open a normal website and click SafeBrowse again."
    );
    return;
  }

  currentUrl = tab.url;

  try {
    const url = new URL(currentUrl);
    siteName.textContent = url.hostname || "Browser page";
    siteUrl.textContent = currentUrl;
  } catch {
    siteName.textContent = "Browser page";
    siteUrl.textContent = currentUrl;
  }

  checkButton.disabled = false;

  // Reset previous results whenever the popup opens on another tab.
  httpsStatus.textContent = "Not checked";
  urlStatus.textContent = "Not checked";
  hostStatus.textContent = "Not checked";

  showResult(
    "neutral",
    "◉",
    "Ready to check",
    "Analyze this tab to review its connection and URL patterns."
  );
}

checkButton.addEventListener("click", () => {
  if (!currentUrl) return;

  const report = inspectUrl(currentUrl);

  httpsStatus.textContent = report.connection;
  urlStatus.textContent = report.structure;
  hostStatus.textContent = report.hostname;

  const icon =
    report.level === "safe" ? "✓" :
    report.level === "warning" ? "!" : "⚠";

  showResult(
    report.level,
    icon,
    report.title,
    report.message
  );

  console.info("SafeBrowse local analysis", {
    hostname: report.hostname,
    warnings: report.warnings
  });
});

loadCurrentSite();

