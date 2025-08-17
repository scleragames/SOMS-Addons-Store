/**
 * Addon Manager - Enhanced with better UX, performance & structure
 */
document.addEventListener("DOMContentLoaded", () => {
  // DOM Elements
  const themeToggle = document.getElementById("theme-toggle");
  const searchInput = document.getElementById("search");
  const filterSelect = document.getElementById("filter-type");
  const addonGrid = document.getElementById("addon-grid");

  // Configuration
  const CONFIG = {
    contactEmail: "you@example.com", // Easy to change
    jsonUrl: "addons.json",
    imagePlaceholder: "https://via.placeholder.com/280x160?text=No+Image",
    debounceDelay: 300, // ms
  };

  // State
  let addons = [];
  let filteredAddons = [];
  let isLoaded = false;

  // --------------------------
  // Theme Management
  // --------------------------
  const Theme = {
    current: () => localStorage.getItem("theme") || "light",
    apply: (theme) => {
      document.body.classList.remove("light", "dark");
      document.body.classList.add(theme);
      localStorage.setItem("theme", theme);
    },
    toggle: () => {
      const newTheme = Theme.current() === "dark" ? "light" : "dark";
      Theme.apply(newTheme);
      updateThemeToggleIcon(newTheme);
    },
  };

  function updateThemeToggleIcon(theme) {
    themeToggle.textContent = theme === "dark" ? "☀️" : "🌙";
    themeToggle.setAttribute("aria-label", `Switch to ${theme === "dark" ? "light" : "dark"} mode`);
  }

  themeToggle.addEventListener("click", Theme.toggle);
  Theme.apply(Theme.current()); // Apply saved theme
  updateThemeToggleIcon(Theme.current());

  // --------------------------
  // Loading & Error UI
  // --------------------------
  function showLoading() {
    addonGrid.innerHTML = "";
    for (let i = 0; i < 6; i++) {
      const skeleton = document.createElement("div");
      skeleton.className = "card card-skeleton";
      skeleton.innerHTML = `
        <div class="card-skeleton-img"></div>
        <div class="card-body">
          <h3 class="card-skeleton-title"></h3>
          <p class="card-skeleton-text"></p>
          <p class="card-skeleton-text short"></p>
          <button class="btn btn-skeleton" disabled></button>
        </div>
      `;
      addonGrid.appendChild(skeleton);
    }
  }

  function showError(message) {
    addonGrid.innerHTML = `<p class="error-message" role="alert">${message}</p>`;
  }

  function showEmptyState() {
    addonGrid.innerHTML = `<p class="empty-state">No addons match your search.</p>`;
  }

  // --------------------------
  // Addon Display
  // --------------------------
  function createAddonCard(addon) {
    const card = document.createElement("div");
    card.className = "card";
    card.setAttribute("role", "article");
    card.setAttribute("aria-label", `${addon.name}, ${addon.type} addon by ${addon.author}`);

    const img = new Image();
    img.src = addon.icon;
    img.alt = addon.name;
    img.loading = "lazy"; // Lazy load images
    img.onerror = () => { img.src = CONFIG.imagePlaceholder; };

    const downloadLink = addon.type === "free"
      ? `<a href="${addon.file}" class="btn" download aria-label="Download ${addon.name} v${addon.version}">
           Download
         </a>`
      : `<button class="btn btn-outline" aria-label="Contact to purchase ${addon.name}">
           Contact Me
         </button>`;

    card.innerHTML = `
      <div class="card-img-container">${img.outerHTML}</div>
      <div class="card-body">
        <h3>${addon.name}</h3>
        <p>${addon.description}</p>
        <div class="card-meta">
          <span class="tag tag-${addon.type}">${addon.type.toUpperCase()}</span>
          <span>v${addon.version}</span>
        </div>
        <div class="card-meta">
          <small>by ${addon.author}</small>
        </div>
        ${downloadLink}
      </div>
    `;

    // Add interaction for paid addons
    if (addon.type === "paid") {
      const btn = card.querySelector(".btn");
      btn.addEventListener("click", () => {
        alert(`📩 Please contact me at: ${CONFIG.contactEmail} to purchase "${addon.name}".`);
      });
    }

    return card;
  }

  function displayAddons(addonsList) {
    addonGrid.innerHTML = "";
    if (addonsList.length === 0) {
      showEmptyState();
      return;
    }

    addonsList.forEach(addon => {
      addonGrid.appendChild(createAddonCard(addon));
    });
    isLoaded = true;
  }

  // --------------------------
  // Search & Filter Logic
  // --------------------------
  function filterAddons() {
    const query = searchInput.value.trim().toLowerCase();
    const type = filterSelect.value;

    filteredAddons = addons.filter(addon => {
      const matchesSearch = 
        addon.name.toLowerCase().includes(query) ||
        addon.description.toLowerCase().includes(query);
      const matchesType = type === "all" || addon.type === type;
      return matchesSearch && matchesType;
    });

    displayAddons(filteredAddons);
  }

  // Debounce function to limit filter calls
  function debounce(func, delay) {
    let timeoutId;
    return (...args) => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => func.apply(this, args), delay);
    };
  }

  const debouncedFilter = debounce(filterAddons, CONFIG.debounceDelay);

  searchInput.addEventListener("input", debouncedFilter);
  filterSelect.addEventListener("change", filterAddons);

  // --------------------------
  // Load Addons
  // --------------------------
  async function loadAddons() {
    showLoading();

    try {
      const res = await fetch(CONFIG.jsonUrl, { cache: "no-cache" });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      addons = await res.json();

      // Validate data shape
      if (!Array.isArray(addons)) throw new Error("Invalid data format");

      // Set default values for missing fields
      addons = addons.map(addon => ({
        name: addon.name || "Unnamed Addon",
        description: addon.description || "No description available.",
        type: addon.type === "free" || addon.type === "paid" ? addon.type : "free",
        version: addon.version || "1.0",
        author: addon.author || "Unknown",
        file: addon.file || "#",
        icon: addon.icon || CONFIG.imagePlaceholder,
      }));

      filteredAddons = [...addons];
      filterAddons(); // Initial display
    } catch (err) {
      console.error("Failed to load or parse addons:", err);
      showError("❌ Failed to load addons. Please check your connection or try again later.");
    }
  }

  // --------------------------
  // Initialize
  // --------------------------
  loadAddons();

  // Optional: Add keyboard support for filter controls
  [searchInput, filterSelect].forEach(el => {
    el.addEventListener("keydown", (e) => {
      if (e.key === "Enter") {
        filterAddons(); // Trigger filter on Enter
      }
    });
  });
});
