const ElemSelector = "relative-time:not(.full-time-updated), time:not(.full-time-updated), button[data-testid='issuable-timestamp']:not(.full-time-updated)"

function formatTimeDelta(pastDate) {
  const now = new Date();
  let delta = Math.floor((now - pastDate) / 1000); // in seconds

  const SECOND = 1;
  const MINUTE = 60 * SECOND;
  const HOUR = 60 * MINUTE;
  const DAY = 24 * HOUR;
  const MONTH = 30 * DAY; // Approximation
  const YEAR = 365 * DAY; // Approximation

  const parts = [];

  const units = [
    { label: "year", seconds: YEAR },
    { label: "month", seconds: MONTH },
    { label: "day", seconds: DAY },
    { label: "hour", seconds: HOUR },
    { label: "minute", seconds: MINUTE },
    { label: "second", seconds: SECOND },
  ];

  for (const unit of units) {
    const count = Math.floor(delta / unit.seconds);
    if (count) {
      delta -= count * unit.seconds;
      parts.push(`${count} ${unit.label}${count !== 1 ? "s" : ""}`);
    }
    if (parts.length === 3) break;
  }

  // If nothing added, add "0 seconds"
  if (parts.length === 0) {
    parts.push("0 seconds");
  }

  return `${parts.join(", ")} ago`;
}

function updateRunTimeDisplay() {
  const timeElements = document.querySelectorAll(
    ElemSelector
  );

  timeElements.forEach((el) => {                    // for gitlab, August 10, 2025 at 2:06:14 AM GMT+2
    const fullTime = el.getAttribute("datetime") || el.getAttribute("aria-label").replace(' at ', ' ');
    if (!fullTime) return;
    const date = new Date(fullTime);
    const niceDate = date.toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
    const timeAgo = formatTimeDelta(date).trim();

    let elType = "span"
    if(el.tagName == "BUTTON"){
      elType = "button"
    }
    const replacement = document.createElement(elType);
    replacement.textContent = timeAgo;
    replacement.title = niceDate;

    replacement.className = el.className + " extension-timedelta";

    const parent = el.parentElement;
    if (parent) {
      parent.style.display = "inline";
      parent.style.whiteSpace = "nowrap";
    }

    el.replaceWith(replacement);
  });
}

function observeDOMChanges() {
  const observer = new MutationObserver((mutations) => {
    let shouldUpdate = false;

    for (const mutation of mutations) {
      if (mutation.type === "childList") {
        for (const node of mutation.addedNodes) {
          if (node.nodeType === Node.ELEMENT_NODE) {
            if (
              node.matches(ElemSelector) || node.querySelector?.(ElemSelector)
            ) {
              shouldUpdate = true;
              break;
            }
          }
        }
      } else if (mutation.type === "characterData") {
        shouldUpdate = true;
        break;
      }
    }

    if (shouldUpdate) {
      updateRunTimeDisplay();
    }
  });

  observer.observe(document.body, {
    childList: true,
    subtree: true,
  });
}

if (window.location.href.match(/^https:\/\/(github\.com|codeberg\.org|gitlab\.com)\/.*$/)) {
  updateRunTimeDisplay(); // Needed for refresh on `actions` page
  observeDOMChanges();
}
