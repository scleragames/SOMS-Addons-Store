document.addEventListener("DOMContentLoaded", () => {
  const themeToggle = document.getElementById("theme-toggle");
  const searchInput = document.getElementById("search");
  const filterSelect = document.getElementById("filter-type");
  const addonGrid = document.getElementById("addon-grid");

  const CONFIG = {
    contactEmail: "you@example.com",
    jsonUrl: "addons.json",
    debounceDelay: 300,
  };

  let addons = [];

  // Theme Management
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

  Theme.set(Theme.get());
  themeToggle.addEventListener("click", Theme.toggle);

  // UI Functions
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
    addonGrid.innerHTML = `<p class="error-message">${message}</p>`;
  }

  function showEmpty() {
    addonGrid.innerHTML = `<p class="empty-state">No addons match your search.</p>`;
  }

  // Create Card Function
  function createAddonCard(addon) {
    const card = document.createElement("div");
    card.className = "card";

    const imgContainer = document.createElement("div");
    imgContainer.className = "card-img-container";

    const iconSrc = addon.icon?.trim();

    // If valid URL, load image
    if (iconSrc && iconSrc !== "#" && !iconSrc.startsWith("http")) {
      console.warn(`Invalid URL: ${iconSrc}`);
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
      imgContainer.textContent = "No Icon"; // Fallback
    }

    const body = document.createElement("div");
    body.className = "card-body";

    const title = document.createElement("h3");
    title.textContent = addon.name || "Unnamed Addon";

    const desc = document.createElement("p");
    desc.textContent = addon.description || "No description available.";

    const meta1 = document.createElement("div");
    meta1.className = "card-meta";

    const typeTag = document.createElement("span");
    typeTag.className = `tag tag-${addon.type}`;
    typeTag.textContent = addon.type.toUpperCase();

    const version = document.createElement("span");
    version.textContent = `v${addon.version || "1.0"}`;

    meta1.append(typeTag, version);

    const meta2 = document.createElement("div");
    meta2.className = "card-meta";
    const author = document.createElement("small");
    author.textContent = `by ${addon.author || "Unknown"}`;
    meta2.appendChild(author);

    const action = document.createElement("div");

    if (addon.type === "free" && addon.file) {
      const link = document.createElement("a");
      link.href = addon.file;
      link.className = "btn";
      link.download = true;
      link.textContent = "Download";
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

    body.append(title, desc, meta1, meta2, action);
    card.append(imgContainer, body);

    return card;
  }

  // Render Addons
  function renderAddons(list) {
    addonGrid.innerHTML = "";
    if (list.length === 0) {
      showEmpty();
      return;
    }

    const fragment = document.createDocumentFragment();
    list.forEach(addon => fragment.appendChild(createAddonCard(addon)));
    addonGrid.appendChild(fragment);
  }

  // Filter Logic
  function filterAddons() {
    const query = searchInput.value.toLowerCase();
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

  // Load Addons
  async function loadAddons() {
    showLoading();

    try {
      const res = await fetch(`${CONFIG.jsonUrl}?t=${Date.now()}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();

      if (!Array.isArray(data)) throw new Error("Invalid JSON format");

      addons = data.map(item => ({
        name: item.name || "Unnamed Addon",
        description: item.description || "No description available.",
        type: item.type === "paid" ? "paid" : "free",
        version: item.version || "1.0",
        author: item.author || "Unknown",
        file: item.file || "#",
        icon: item.icon || "",
      }));

      filterAddons();
    } catch (err) {
      console.error("Load failed:", err);
      showError("❌ Failed to load addons.");
    }
  }

  // Initialize
  loadAddons();

  // Enter key support
  [searchInput, filterSelect].forEach(el => {
    el.addEventListener("keydown", e => {
      if (e.key === "Enter") filterAddons();
    });
  });
});
