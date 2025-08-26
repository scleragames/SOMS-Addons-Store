// DOM Elements
const grid = document.getElementById("addon-grid");
const searchInput = document.getElementById("search");
const filterType = document.getElementById("filter-type");
const themeToggle = document.getElementById("theme-toggle");
const loading = document.getElementById("loading");

// Load Addons from JSON
async function loadAddons() {
  try {
    const res = await fetch("addons.json");
    if (!res.ok) throw new Error("Failed to load addons.json");
    const addons = await res.json();
    renderAddons(addons);
    setupFiltering(addons);
  } catch (err) {
    grid.innerHTML = `
      <div class="error" style="grid-column: 1/-1; text-align: center; color: red;">
        ❌ Error loading addons: ${err.message}
      </div>
    `;
    console.error("Failed to load addons:", err);
  } finally {
    loading.style.display = "none";
  }
}

// Detect mobile vs desktop and open WhatsApp properly
function contactOnWhatsApp(addonName) {
  const phone = "923147050300"; //WhatsApp number (no +, no spaces)
  const message = `Inquiry: ${addonName}`;
  const encodedMessage = encodeURIComponent(message);

  // Detect mobile device
  const isMobile = /Android|iPhone|iPad|iPod|IEMobile|Opera Mini/i.test(navigator.userAgent);

  let url;
  if (isMobile) {
    url = `whatsapp://send?phone=${phone}&text=${encodedMessage}`; // Opens WhatsApp app
  } else {
    url = `https://wa.me/${phone}?text=${encodedMessage}`; // Opens WhatsApp Web
  }

  window.open(url, "_blank");
}

// Simulate Download
function downloadAddon(file) {
  const a = document.createElement("a");
  a.href = file;
  a.download = file.split("/").pop();
  a.click();
}

// === NEW: Open Details Modal ===
let addonData = {}; // Store addon data globally

// Open Modal with Animation
function openDetailsModal(addonId) {
  const addon = addonData[addonId];
  if (!addon) return;

  const modalBody = document.getElementById("modal-body");
  modalBody.innerHTML = `
    <h2 style="color: ${addon.color ? addon.color : 'var(--text-primary)'};">
      ${addon.name}
    </h2>
    <p><strong>By:</strong> ${addon.author}</p>
    <p>${addon.longdescription}</p>

    <div class="detail-row"><strong>Version:</strong> v${addon.version}</div>
    <div class="detail-row"><strong>Type:</strong> ${addon.type === 'free' ? 'Free' : 'Premium'}</div>
    <div class="detail-row"><strong>Min App Version:</strong> ${addon.minAppVersion || '1.0.0'}</div>

    ${addon.screenshots && addon.screenshots.length > 0 ? `
      <div>
        <strong>Screenshots:</strong>
        <div class="screenshots">
          ${addon.screenshots.map(img => `
            <img src="${img}" alt="Screenshot" onclick="openLightbox('${img}')" style="cursor: pointer;">
          `).join('')}
        </div>
      </div>
    ` : ''}

    <div style="margin-top: 1.5rem;" class="btn-group">
      <button class="btn ${addon.type === 'premium' ? 'btn-outline' : ''}" 
              onclick="${addon.type === 'premium' 
                ? `contactOnWhatsApp('${addon.name}')` 
                : `downloadAddon('${addon.file}')`}">
        ${addon.type === 'premium' ? 'Contact Me on WhatsApp' : 'Download'}
      </button>
    </div>
  `;

  const modal = document.getElementById("details-modal");

  // Force reflow to ensure animation works
  modal.style.display = "flex";
  modal.offsetHeight; // Trigger layout
  modal.classList.add("show");
}

// Close Modal with Animation
function closeDetailsModal() {
  const modal = document.getElementById("details-modal");
  modal.classList.remove("show");

  // Wait for animation to finish before hiding
  setTimeout(() => {
    modal.style.display = "none";
  }, 300);
}

// Close on click outside
window.addEventListener("click", (e) => {
  const modal = document.getElementById("details-modal");
  if (e.target === modal) {
    closeDetailsModal();
  }
});

// Close modal with ESC key
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape") {
    closeDetailsModal();
  }
});

function renderAddons(addons) {
  // Cache addon data for modal access
  addonData = {};
  addons.forEach(addon => {
    addonData[addon.id] = addon;
  });

  grid.innerHTML = addons.map(addon => `
    <div class="addon-card">
      <div class="addon-icon">
        ${addon.icon && addon.icon.trim() !== "" ? `<img src="${addon.icon}" alt="${addon.name}">` : ''}
      </div>
      <div class="addon-info">
        <h3>${addon.name}</h3>
        <p>${addon.shortdescription}</p>
        <div class="card-meta">
          <span class="tag tag-${addon.type}">${addon.type}</span>
          <span>👤 ${addon.author}</span>
        </div>
        <div class="card-meta" style="justify-content: flex-start; margin-top: -0.5rem;">
          <small>📦 v${addon.version}</small>
        </div>

          <button class="btn btn-outline" onclick="openDetailsModal('${addon.id}')">
            View Details
          </button>
        </div>
      </div>
    </div>
  `).join('');
}

// Filter Logic
function setupFiltering(originalAddons) {
  function filterAddons() {
    const query = searchInput.value.toLowerCase();
    const type = filterType.value;

    const filtered = originalAddons.filter(addon =>
      addon.name.toLowerCase().includes(query) ||
      addon.shortdescription.toLowerCase().includes(query)
    ).filter(addon =>
      type === "" || addon.type === type
    );

    renderAddons(filtered);
  }

  searchInput.addEventListener("input", filterAddons);
  filterType.addEventListener("change", filterAddons);
}

// Open Lightbox
function openLightbox(src) {
  const img = document.getElementById("enlarged-screenshot");
  img.src = src;
  const lightbox = document.getElementById("lightbox");
  lightbox.classList.add("show");
}

// Close Lightbox
function closeLightbox() {
  const lightbox = document.getElementById("lightbox");
  lightbox.classList.remove("show");
}

// Close with ESC key
document.addEventListener("keydown", (e) => {
  const lightbox = document.getElementById("lightbox");
  if (e.key === "Escape" && lightbox.classList.contains("show")) {
    closeLightbox();
  }
});

// Close on click outside
document.getElementById("lightbox").addEventListener("click", (e) => {
  if (e.target === document.getElementById("lightbox")) {
    closeLightbox();
  }
});

// Theme Toggle
themeToggle.addEventListener("click", () => {
  const currentTheme = document.documentElement.getAttribute("data-theme");
  const newTheme = currentTheme === "light" ? "dark" : "light";
  document.documentElement.setAttribute("data-theme", newTheme);
  localStorage.setItem("theme", newTheme);
  themeToggle.textContent = newTheme === "dark" ? "☀️" : "🌙";
});

// Initialize
document.addEventListener("DOMContentLoaded", () => {
  // Set theme from localStorage
  const savedTheme = localStorage.getItem("theme") || "light";
  document.documentElement.setAttribute("data-theme", savedTheme);
  themeToggle.textContent = savedTheme === "dark" ? "☀️" : "🌙";

  // Load addons
  loadAddons();

});
