document.addEventListener("DOMContentLoaded", () => {
  const themeToggle = document.getElementById("theme-toggle");
  const searchInput = document.getElementById("search");
  const filterSelect = document.getElementById("filter-type");
  const addonGrid = document.getElementById("addon-grid");

  // Theme toggle
  const savedTheme = localStorage.getItem("theme") || "light";
  document.body.className = savedTheme;
  themeToggle.textContent = savedTheme === "dark" ? "☀️" : "🌙";

  themeToggle.addEventListener("click", () => {
    const isDark = document.body.className === "dark";
    document.body.className = isDark ? "light" : "dark";
    localStorage.setItem("theme", isDark ? "light" : "dark");
    themeToggle.textContent = isDark ? "🌙" : "☀️";
  });

  // Load addons
  async function loadAddons() {
    try {
      const res = await fetch("addons.json");
      const addons = await res.json();
      displayAddons(addons);
      setupSearchAndFilter(addons);
    } catch (err) {
      console.error("Failed to load addons:", err);
      addonGrid.innerHTML = `<p>Failed to load addons. Please try again later.</p>`;
    }
  }

  function displayAddons(addons) {
    addonGrid.innerHTML = "";
    if (addons.length === 0) {
      addonGrid.innerHTML = `<p>No addons available.</p>`;
      return;
    }

    addons.forEach(addon => {
      const card = document.createElement("div");
      card.className = "card";

      card.innerHTML = `
        <img src="${addon.icon}" alt="${addon.name}" onerror="this.src='https://via.placeholder.com/280x160?text=No+Image'">
        <div class="card-body">
          <h3>${addon.name}</h3>
          <p>${addon.description}</p>
          <div class="card-meta">
            <span class="card-${addon.type}">${addon.type.toUpperCase()}</span>
            <span>v${addon.version}</span>
          </div>
          <div class="card-meta">
            <small>by ${addon.author}</small>
          </div>
          ${addon.type === "free"
            ? `<a href="${addon.file}" class="btn" download>Download</a>`
            : `<button class="btn btn-outline">Contact Me</button>`
          }
        </div>
      `;

      if (addon.type === "paid") {
        card.querySelector(".btn").addEventListener("click", () => {
          alert("📩 Please contact me at: you@example.com to purchase this addon.");
        });
      }

      addonGrid.appendChild(card);
    });
  }

  function setupSearchAndFilter(addons) {
    function filterAddons() {
      const query = searchInput.value.toLowerCase();
      const type = filterSelect.value;

      const filtered = addons.filter(addon => {
        const matchesSearch = addon.name.toLowerCase().includes(query) ||
                              addon.description.toLowerCase().includes(query);
        const matchesType = type === "all" || addon.type === type;
        return matchesSearch && matchesType;
      });

      displayAddons(filtered);
    }

    searchInput.addEventListener("input", filterAddons);
    filterSelect.addEventListener("change", filterAddons);
  }

  // Initial load
  loadAddons();

  // Optional: Add loading skeleton
  // (You can add a few .card-placeholder divs while loading)
});
