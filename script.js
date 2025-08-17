/**
 * Addon Store Manager
 * Ensures consistent square icon containers, even when icons are missing.
 */
document.addEventListener("DOMContentLoaded", () => {
  // DOM Elements
  const themeToggle = document.getElementById("theme-toggle");
  const searchInput = document.getElementById("search");
  const filterSelect = document.getElementById("filter-type");
  const addonGrid = document.getElementById("addon-grid");

  // Configuration
  const CONFIG = {
    contactEmail: "scleragames@gmail.com", // Easy to customize
    jsonUrl: "addons.json",
    debounceDelay: 300, // ms
  };

  // State
  let addons = [];

  // --------------------------
  // 🌙 Theme Management
  // --------------------------
  const Theme = {
    get: () => localStorage.getItem("theme") || "light",
    set: (theme) => {
      document.documentElement.setAttribute("data-theme", theme);
      localStorage.setItem("theme", theme);
      updateToggleIcon(theme);
    },
    toggle: () => {
      const current = Theme.get();
      Theme.set(current === "dark" ? "light" : "dark");
    },
  };

  function updateToggleIcon(theme) {
    themeToggle.textContent = theme === "dark" ? "☀️" : "🌙";
    themeToggle.setAttribute("aria-label", `Switch to ${theme === "dark" ? "light" : "dark"} mode`);
  }

  // Apply saved theme
  const savedTheme = Theme.get();
  document.documentElement.setAttribute("data-theme", savedTheme);
  updateToggleIcon(savedTheme);

  themeToggle.addEventListener("click", Theme.toggle);

  // --------------------------
  // 🧱 UI State Management
  // --------------------------
  function showLoading() {
    addonGrid.innerHTML = "";
    for (let i = 0; i < 6; i++) {
      const skeleton = document.createElement("div");
      skeleton.className = "card card-skeleton";
      skeleton.innerHTML = `
        <div class="card-img-container"></div>
        <div class="card-body">
          <h3 class="skeleton-title"></h3>
          <p class="skeleton-text"></p>
          <div class="card-meta">
            <span class="skeleton-tag"></span>
            <span class="skeleton-version"></span>
          </div>
          <div class="card-meta">
            <small class="skeleton-author"></small>
          </div>
          <div class="skeleton-btn"></div>
        </div>
      `;
      addonGrid.appendChild(skeleton);
    }
  }

  function showError(message) {
    addonGrid.innerHTML = `<p class="error-message" role="alert">${message}</p>`;
  }

  function showEmpty() {
    addonGrid.innerHTML = `<p class="empty-state">No addons match your search.</p>`;
  }

  // --------------------------
  // 🖼️ Create Addon Card (Always Square Icon)
  // --------------------------
  function createAddonCard(addon) {
    const card = document.createElement("div");
    card.className = "card";
    card.setAttribute("role", "article");
    card.setAttribute("aria-label", `${addon.name} – ${addon.type} addon by ${addon.author}`);

    // --- Image Container (Always Square) ---
    const imgContainer = document.createElement("div");
    imgContainer.className = "card-img-container";

    const iconSrc = (addon.icon || "").trim();

    if (iconSrc && !iconSrc.startsWith("http") && !iconSrc.startsWith("/")) {
      console.warn(`Invalid icon URL: ${iconSrc}`);
    }

    if (iconSrc && iconSrc !== "#") {
      const img = new Image();
      img.src = iconSrc;
      img.alt = addon.name;
      img.loading = "lazy";
      img.onerror = () => {
        imgContainer.innerHTML = "";
        imgContainer.textContent = "No Icon";
      };
      imgContainer.appendChild(img);
    } else {
      imgContainer.textContent = "No Icon"; // Fallback text
    }

    // --- Card Body ---
    const body = document.createElement("div");
    body.className = "card-body";

    const title = document.createElement("h3");
    title.textContent = addon.name || "Unnamed Addon";

    const desc = document.createElement("p");
    desc.textContent = addon.description || "No description available.";

    // Metadata row 1: Type & Version
    const meta1 = document.createElement("div");
    meta1.className = "card-meta";

    const typeTag = document.createElement("span");
    typeTag.className = `tag tag-${addon.type}`;
    typeTag.textContent = (addon.type || "free").toUpperCase();

    const version = document.createElement("span");
    version.textContent = `v${addon.version || "1.0"}`;

    meta1.append(typeTag, version);

    // Metadata row 2: Author
    const meta2 = document.createElement("div");
    meta2.className = "card-meta";
    const author = document.createElement("small");
    author.textContent = `by ${addon.author || "Unknown"}`;
    meta2.appendChild(author);

    // Action Button
    const action = document.createElement("div");

    if (addon.type === "free" && addon.file && addon.file !== "#") {
      const link = document.createElement("a");
      link.href = addon.file;
      link.className = "btn";
      link.setAttribute("download", "");
      link.textContent = "Download";
      link.setAttribute("aria-label", `Download ${title.textContent}`);
      action.appendChild(link);
    } else {
      const btn = document.createElement("button");
      btn.className = "btn btn-outline";
      btn.textContent = "Contact Me";
      btn.addEventListener("click", () => {
        alert(`📩 Please contact me at: ${CONFIG.contactEmail} to purchase "${title.textContent}".`);
      });
      action.appendChild(btn);
    }

    // Assemble body
    body.append(title, desc, meta1, meta2, action);

    // Assemble card
    card.append(imgContainer, body);

    return card;
  }

  // --------------------------
  // 📦 Render Addons Safely
  // --------------------------
  function renderAddons(addonList) {
    addonGrid.innerHTML = "";

    if (!addonList || addonList.length === 0) {
      showEmpty();
      return;
    }

    const fragment = document.createDocumentFragment();
    addonList.forEach(addon => fragment.appendChild(createAddonCard(addon)));
    
    requestAnimationFrame(() => {
      addonGrid.appendChild(fragment);
    });
  }

  // --------------------------
  // 🔍 Search & Filter (Debounced)
  // --------------------------
  function filterAddons() {
    const query = searchInput.value.trim().toLowerCase();
    const type = filterSelect.value;

    const results = addons.filter(addon => {
      const matchesSearch =
        (addon.name || "").toLowerCase().includes(query) ||
        (addon.description || "").toLowerCase().includes(query);
      const matchesType = type === "all" || addon.type === type;
      return matchesSearch && matchesType;
    });

    renderAddons(results);
  }

  const debouncedFilter = ((func, delay) => {
    let timer;
    return (...args) => {
      clearTimeout(timer);
      timer = setTimeout(() => func.apply(this, args), delay);
    };
  })(filterAddons, CONFIG.debounceDelay);

  searchInput.addEventListener("input", debouncedFilter);
  filterSelect.addEventListener("change", filterAddons);

  // Optional: Trigger filter on Enter
  [searchInput, filterSelect].forEach(input => {
    input.addEventListener("keydown", e => {
      if (e.key === "Enter") {
        filterAddons();
      }
    });
  });

  // --------------------------
  // 🌐 Load Addons
  // --------------------------
  async function loadAddons() {
    showLoading();

    try {
      const res = await fetch(`${CONFIG.jsonUrl}?t=${Date.now()}`, {
        method: "GET",
        cache: "no-store",
      });

      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();

      if (!Array.isArray(data)) {
        throw new Error("Invalid JSON format: expected array of addons.");
      }

      // Normalize data with defaults
      addons = data.map(item => ({
        name: item.name?.trim() || "Unnamed Addon",
        description: item.description?.trim() || "No description available.",
        type: item.type === "paid" ? "paid" : "free",
        version: item.version?.trim() || "1.0",
        author: item.author?.trim() || "Unknown",
        file: item.file?.trim() || (item.type === "free" ? "#" : ""),
        icon: item.icon?.trim() || "",
      }));

      filterAddons(); // Initial render
    } catch (err) {
      console.error("Addon load failed:", err);
      showError("❌ Failed to load addons. Please check your connection and try again.");
    }
  }

  // --------------------------
  // ✅ Initialize
  // --------------------------
  loadAddons();
});
