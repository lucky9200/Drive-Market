/* =========================================================
   DRIVE MARKET
   COMPLETE JAVASCRIPT
========================================================= */

/* =========================================================
   SUPABASE CLOUD SETTINGS
========================================================= */

const SUPABASE_URL = "https://ddulammxpjfalnllaxcj.supabase.co";
const SUPABASE_PUBLIC_KEY = "sb_publishable_HxsFsDURNRrwI3uBd9gIwg_PXrNBavW";

const SUPABASE_CONFIGURED =
    !SUPABASE_URL.includes("YOUR_PROJECT_REF") &&
    !SUPABASE_PUBLIC_KEY.includes("YOUR_SUPABASE_");

const supabaseClient = SUPABASE_CONFIGURED && window.supabase
    ? window.supabase.createClient(SUPABASE_URL, SUPABASE_PUBLIC_KEY)
    : null;

/* =========================================================
   DEFAULT CAR DATA
========================================================= */

const defaultCars = [];

/* =========================================================
   LOCAL STORAGE
========================================================= */

let cars = [...defaultCars];

let wishlist =
    JSON.parse(localStorage.getItem("driveMarketWishlist")) || [];

let adminLoggedIn = false;

/* =========================================================
   PAGE SECTION NAVIGATION
========================================================= */

function showSection(sectionName) {
    const sections = document.querySelectorAll(".page-section");

    sections.forEach(section => {
        section.classList.remove("active");
    });

    const selectedSection =
        document.getElementById(sectionName + "Section");

    if (selectedSection) {
        selectedSection.classList.add("active");

        window.scrollTo({
            top: 0,
            behavior: "smooth"
        });
    }

    const navLinks =
        document.querySelectorAll(".nav-links a[data-section]");

    navLinks.forEach(link => {
        link.classList.remove("active");

        if (link.dataset.section === sectionName) {
            link.classList.add("active");
        }
    });

    try {
        history.replaceState(null, "", "#" + sectionName);
    } catch (error) {
        console.log(error);
    }

    if (sectionName === "cars") {
        renderCars();
    }

    closeMobileMenu();
}

function showHome() {
    showSection("home");
}

/* =========================================================
   INITIAL PAGE
========================================================= */

document.addEventListener("DOMContentLoaded", async () => {
    setupImagePreview();

    await loadCloudCars();

    updateWishlistCount();
    updateAdminStats();

    showSection("home");
});

/* =========================================================
   FORMAT PRICE
========================================================= */

function formatPrice(price) {
    return new Intl.NumberFormat("en-IN", {
        style: "currency",
        currency: "INR",
        maximumFractionDigits: 0
    }).format(price);
}

/* =========================================================
   LOAD CLOUD CARS
========================================================= */

async function loadCloudCars() {
    if (!SUPABASE_CONFIGURED || !supabaseClient) {
        console.warn(
            "Drive Market cloud is not configured. Check Supabase settings."
        );

        cars = [...defaultCars];

        renderCars();
        renderFeaturedCars();
        updateStats();
        updateAdminStats();

        return;
    }

    const { data, error } = await supabaseClient
        .from("cars")
        .select("*")
        .order("id", { ascending: false });

    if (error) {
        console.error("Could not load cloud car listings:", error);

        cars = [...defaultCars];

        renderCars();
        renderFeaturedCars();
        updateStats();
        updateAdminStats();

        showToast("Online listings could not load. Check Supabase settings.");
        return;
    }

    const cloudCars = (data || []).map(car => ({
        ...car,
        id: Number(car.id),
        price: Number(car.price),
        year: Number(car.year),
        km: Number(car.km || 0),
        _cloud: true
    }));

    cars = [...cloudCars, ...defaultCars];

    renderCars();
    renderFeaturedCars();
    updateStats();
    updateAdminStats();
}

function saveCars() {
    localStorage.setItem(
        "driveMarketCars",
        JSON.stringify(cars.filter(car => !car._cloud))
    );
}

function saveWishlist() {
    localStorage.setItem(
        "driveMarketWishlist",
        JSON.stringify(wishlist)
    );
}

/* =========================================================
   IMAGE
========================================================= */

function getCarImage(car) {
    if (car.image) {
        return `
            <img
                src="${car.image}"
                alt="${escapeHTML(car.name)}"
            >
        `;
    }

    return `
        <div class="car-placeholder">
            🚘
        </div>
    `;
}

/* =========================================================
   ESCAPE HTML
========================================================= */

function escapeHTML(value) {
    if (!value) return "";

    return String(value)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

/* =========================================================
   RENDER CAR CARD
========================================================= */

function carCard(car) {
    const isWishlisted = wishlist.includes(car.id);

    return `
        <article class="car-card">
            <div class="car-image">
                ${getCarImage(car)}

                <span class="car-badge">
                    ${escapeHTML(car.year)}
                </span>

                <button
                    class="wishlist-card-btn ${isWishlisted ? "active" : ""}"
                    onclick="toggleWishlist(${car.id})"
                    title="Add to wishlist"
                >
                    ${isWishlisted ? "♥" : "♡"}
                </button>
            </div>

            <div class="car-content">
                <h3>${escapeHTML(car.name)}</h3>

                <div class="car-brand">
                    ${escapeHTML(car.brand)}
                </div>

                <div class="car-price">
                    ${formatPrice(car.price)}
                </div>

                <div class="car-meta">
                    <span>⛽ ${escapeHTML(car.fuel)}</span>
                    <span>⚙ ${escapeHTML(car.transmission)}</span>
                    <span>📍 ${escapeHTML(car.location || "India")}</span>
                </div>

                <div class="car-actions">
                    <button onclick="showCarDetails(${car.id})">
                        View Details
                    </button>

                    <button
                        class="buy-btn"
                        onclick="openPurchaseModal(${car.id})"
                    >
                        Buy / Enquire
                    </button>
                </div>
            </div>
        </article>
    `;
}

/* =========================================================
   RENDER ALL CARS
========================================================= */

function renderCars(list = cars) {
    const grid = document.getElementById("carsGrid");

    if (!grid) return;

    if (list.length === 0) {
        grid.innerHTML = `
            <div class="empty-state">
                <strong>No Cars Found</strong>
                <span>Try changing your search or filters.</span>
            </div>
        `;
    } else {
        grid.innerHTML = list.map(carCard).join("");
    }

    const count = document.getElementById("resultsCount");

    if (count) {
        count.textContent =
            `${list.length} car${list.length !== 1 ? "s" : ""} found`;
    }
}

/* =========================================================
   FEATURED CARS
========================================================= */

function renderFeaturedCars() {
    const container = document.getElementById("featuredCars");

    if (!container) return;

    const featured = cars.slice(0, 3);

    container.innerHTML = featured.map(carCard).join("");
}

/* =========================================================
   FILTER CARS
========================================================= */

function filterCars() {
    const search = document
        .getElementById("searchInput")
        .value
        .toLowerCase()
        .trim();

    const brand = document.getElementById("brandFilter").value;
    const fuel = document.getElementById("fuelFilter").value;
    const price = document.getElementById("priceFilter").value;

    const maxPrice = price ? Number(price) : Infinity;

    const filtered = cars.filter(car => {
        const matchesSearch =
            !search ||
            car.name.toLowerCase().includes(search) ||
            car.brand.toLowerCase().includes(search);

        const matchesBrand = !brand || car.brand === brand;
        const matchesFuel = !fuel || car.fuel === fuel;
        const matchesPrice = car.price <= maxPrice;

        return (
            matchesSearch &&
            matchesBrand &&
            matchesFuel &&
            matchesPrice
        );
    });

    renderCars(filtered);
}
/* =========================================================
   RESET FILTERS
========================================================= */

function resetFilters() {
    document.getElementById("searchInput").value = "";
    document.getElementById("brandFilter").value = "";
    document.getElementById("fuelFilter").value = "";
    document.getElementById("priceFilter").value = "";

    renderCars();
}

/* =========================================================
   HERO SEARCH
========================================================= */

function searchFromHero() {
    const value = document
        .getElementById("heroSearch")
        .value
        .trim();

    showSection("cars");

    document.getElementById("searchInput").value = value;

    filterCars();
}

function heroSearchCars(event) {
    if (event.key === "Enter") {
        searchFromHero();
    }
}

/* =========================================================
   BRAND SEARCH
========================================================= */

function selectBrand(brand) {
    showSection("cars");

    document.getElementById("brandFilter").value = brand;
    document.getElementById("searchInput").value = "";
    document.getElementById("fuelFilter").value = "";
    document.getElementById("priceFilter").value = "";

    filterCars();
}

/* =========================================================
   CAR DETAILS
========================================================= */

function showCarDetails(id) {
    const car = cars.find(item => item.id === id);

    if (!car) return;

    const content = document.getElementById("carDetailsContent");

    content.innerHTML = `
        <div class="details-layout">
            <div class="details-image">
                ${getCarImage(car)}
            </div>

            <div class="details-info">
                <span class="small-title">
                    ${escapeHTML(car.brand)}
                </span>

                <h2>${escapeHTML(car.name)}</h2>

                <div class="details-price">
                    ${formatPrice(car.price)}
                </div>

                <div class="details-meta">
                    <div>
                        <strong>Year</strong>
                        <span>${car.year}</span>
                    </div>

                    <div>
                        <strong>Fuel</strong>
                        <span>${escapeHTML(car.fuel)}</span>
                    </div>

                    <div>
                        <strong>Transmission</strong>
                        <span>${escapeHTML(car.transmission)}</span>
                    </div>

                    <div>
                        <strong>Kilometers</strong>
                        <span>${Number(car.km || 0).toLocaleString("en-IN")} km</span>
                    </div>

                    <div>
                        <strong>Location</strong>
                        <span>${escapeHTML(car.location || "India")}</span>
                    </div>
                </div>

                <h4>Description</h4>

                <p style="color:#64748b; margin:8px 0 20px;">
                    ${escapeHTML(
                        car.description || "No description available."
                    )}
                </p>

                <button
                    class="primary-btn full-btn"
                    onclick="closeModal('carDetailsModal'); openPurchaseModal(${car.id});"
                >
                    Buy / Send Enquiry
                </button>
            </div>
        </div>
    `;

    openModal("carDetailsModal");
}

/* =========================================================
   WISHLIST
========================================================= */

function toggleWishlist(id) {
    if (wishlist.includes(id)) {
        wishlist = wishlist.filter(item => item !== id);
        showToast("Removed from wishlist");
    } else {
        wishlist.push(id);
        showToast("Added to wishlist");
    }

    saveWishlist();
    updateWishlistCount();
    renderCars();
    renderFeaturedCars();
}

function updateWishlistCount() {
    const count = document.getElementById("wishlistCount");

    if (count) {
        count.textContent = wishlist.length;
    }
}

/* =========================================================
   WISHLIST MODAL
========================================================= */

function openWishlist() {
    const container = document.getElementById("wishlistContent");

    const wishlistCars = cars.filter(car =>
        wishlist.includes(car.id)
    );

    if (wishlistCars.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <strong>Your Wishlist is Empty</strong>
                <span>Click ♡ on any car to save it here.</span>
            </div>
        `;
    } else {
        container.innerHTML = wishlistCars.map(carCard).join("");
    }

    openModal("wishlistModal");
}

/* =========================================================
   PURCHASE MODAL
========================================================= */

function openPurchaseModal(id) {
    const car = cars.find(item => item.id === id);

    if (!car) return;

    document.getElementById("purchaseCarId").value = id;

    document.getElementById("buyerMessage").value =
        `I am interested in purchasing the ${car.name}. Please contact me with more details.`;

    openModal("purchaseModal");
}

document
    .getElementById("purchaseForm")
    ?.addEventListener("submit", function(event) {
        event.preventDefault();

        const carId = Number(
            document.getElementById("purchaseCarId").value
        );

        const car = cars.find(item => item.id === carId);

        showToast(
            `Purchase request sent for ${car ? car.name : "car"}!`
        );

        this.reset();
        closeModal("purchaseModal");
    });

/* =========================================================
   SELL CAR
========================================================= */

function openSellModal() {
    openModal("sellModal");
}

document
    .getElementById("sellForm")
    ?.addEventListener("submit", async function(event) {
        event.preventDefault();

        if (!SUPABASE_CONFIGURED || !supabaseClient) {
            showToast(
                "Cloud setup is not finished. Add your Supabase URL and public key in script.js."
            );
            return;
        }

        const form = this;
        const submitButton = form.querySelector('button[type="submit"]');
        const originalButtonText = submitButton.textContent;

        submitButton.disabled = true;
        submitButton.textContent = "Uploading...";

        let uploadedPath = null;

        try {
            const imageFile = document.getElementById("sellImage").files[0];

            if (!imageFile) {
                throw new Error("Please select a car photo.");
            }

            if (!imageFile.type.startsWith("image/")) {
                throw new Error("Please select a valid image file.");
            }

            if (imageFile.size > 5 * 1024 * 1024) {
                throw new Error("Please select an image smaller than 5 MB.");
            }

            const safeFileName = imageFile.name.replace(
                /[^a-zA-Z0-9._-]/g,
                "_"
            );

            uploadedPath = `${Date.now()}-${safeFileName}`;

            const { error: uploadError } = await supabaseClient
                .storage
                .from("car-photos")
                .upload(uploadedPath, imageFile, {
                    contentType: imageFile.type,
                    upsert: false
                });

            if (uploadError) throw uploadError;

            const { data: publicImageData } = supabaseClient
                .storage
                .from("car-photos")
                .getPublicUrl(uploadedPath);

            const newCar = {
                id: Date.now(),
                name: document.getElementById("sellName").value.trim(),
                brand: document.getElementById("sellBrand").value,
                year: Number(document.getElementById("sellYear").value),
                price: Number(document.getElementById("sellPrice").value),
                fuel: document.getElementById("sellFuel").value,
                transmission: document.getElementById("sellTransmission").value,
                km: Number(document.getElementById("sellKm").value) || 0,
                location:
                    document.getElementById("sellLocation").value.trim() || "India",
                image: publicImageData.publicUrl,
                description:
                    document.getElementById("sellDescription").value.trim()
            };

            const { data: savedCar, error: insertError } =
                await supabaseClient
                    .from("cars")
                    .insert(newCar)
                    .select()
                    .single();

            if (insertError) throw insertError;

            cars.unshift({
                ...savedCar,
                id: Number(savedCar.id),
                price: Number(savedCar.price),
                year: Number(savedCar.year),
                km: Number(savedCar.km || 0),
                _cloud: true
            });

            form.reset();
            document.getElementById("imagePreview").innerHTML = "";
            closeModal("sellModal");

            renderCars();
            renderFeaturedCars();
            updateStats();
            updateAdminStats();

            showToast("Car listed online successfully!");
            showSection("cars");
        } catch (error) {
            console.error("Car upload failed:", error);

            showToast(
                error.message ||
                "Could not upload the car. Check Supabase setup and policies."
            );
        } finally {
            submitButton.disabled = false;
            submitButton.textContent = originalButtonText;
        }
    });

/* =========================================================
   IMAGE TO BASE64
========================================================= */

function convertImageToBase64(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();

        reader.onload = () => resolve(reader.result);
        reader.onerror = reject;

        reader.readAsDataURL(file);
    });
}

/* =========================================================
   IMAGE PREVIEW
========================================================= */

function setupImagePreview() {
    const input = document.getElementById("sellImage");

    if (!input) return;

    input.addEventListener("change", function() {
        const file = this.files[0];
        const preview = document.getElementById("imagePreview");

        if (!file) {
            preview.innerHTML = "";
            return;
        }

        const reader = new FileReader();

        reader.onload = function(event) {
            preview.innerHTML = `
                <img
                    src="${event.target.result}"
                    alt="Car Preview"
                >
            `;
        };

        reader.readAsDataURL(file);
    });
}
/* =========================================================
   ADMIN LOGIN
========================================================= */

function openAdminLogin() {
    if (adminLoggedIn) {
        openAdminDashboard();
        return;
    }

    openModal("adminLoginModal");
}

document
    .getElementById("adminLoginForm")
    ?.addEventListener("submit", function(event) {
        event.preventDefault();

        const username =
            document.getElementById("adminUsername").value.trim();

        const password =
            document.getElementById("adminPassword").value;

        if (
            (username === "Lucky" && password === "Lucky@123") ||
            (username === "Deepanshu" && password === "Deepanshu@123") ||
            (username === "Dhiraj" && password === "Dhiraj@123")
        ) {
            adminLoggedIn = true;

            closeModal("adminLoginModal");
            openAdminDashboard();

            this.reset();

            showToast("Admin login successful!");
        } else {
            showToast("Invalid username or password");
        }
    });

/* =========================================================
   ADMIN DASHBOARD
========================================================= */

function openAdminDashboard() {
    renderAdminCars();
    updateAdminStats();
    openModal("adminModal");
}

function updateAdminStats() {
    const count = document.getElementById("adminCarCount");
    const wishlistCount = document.getElementById("adminWishlistCount");

    if (count) {
        count.textContent = cars.length;
    }

    if (wishlistCount) {
        wishlistCount.textContent = wishlist.length;
    }
}

/* =========================================================
   ADMIN CAR LIST
========================================================= */

function renderAdminCars() {
    const container = document.getElementById("adminCarsList");

    if (!container) return;

    if (cars.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                No cars available.
            </div>
        `;
        return;
    }

    container.innerHTML = cars.map(car => `
        <div class="admin-car-item">
            <div class="admin-car-left">
                <div class="admin-car-image">
                    ${getCarImage(car)}
                </div>

                <div>
                    <strong>${escapeHTML(car.name)}</strong>

                    <small>
                        ${escapeHTML(car.brand)}
                        •
                        ${formatPrice(car.price)}
                    </small>
                </div>
            </div>

            <button
                class="danger-btn"
                onclick="deleteCar(${car.id})"
            >
                Delete
            </button>
        </div>
    `).join("");
}

/* =========================================================
   DELETE CAR AND PHOTO
========================================================= */

async function deleteCar(id) {
    const car = cars.find(
        item => Number(item.id) === Number(id)
    );

    if (!car) return;

    const confirmed = confirm(
        `Delete ${car.name} and its photo from Drive Market?`
    );

    if (!confirmed) return;

    if (car._cloud) {
        if (!supabaseClient) {
            showToast("Supabase is not configured.");
            return;
        }

        try {
            // First, delete the listing from the database.
            const { data, error } = await supabaseClient
                .from("cars")
                .delete()
                .eq("id", car.id)
                .select("id");

            if (error) throw error;

            if (!data || data.length === 0) {
                throw new Error(
                    "No listing was deleted. Check the cars table DELETE policy."
                );
            }

            // Then remove the photo from the car-photos Storage bucket.
            if (car.image) {
                const publicMarker =
                    "/storage/v1/object/public/car-photos/";

                const imageURL = new URL(
                    car.image,
                    window.location.href
                );

                const markerIndex =
                    imageURL.pathname.indexOf(publicMarker);

                if (markerIndex !== -1) {
                    const encodedPath = imageURL.pathname.slice(
                        markerIndex + publicMarker.length
                    );

                    const imagePath = encodedPath
                        .split("/")
                        .map(part => decodeURIComponent(part))
                        .join("/");

                    if (imagePath) {
                        const { error: photoError } =
                            await supabaseClient
                                .storage
                                .from("car-photos")
                                .remove([imagePath]);

                        if (photoError) {
                            console.error(
                                "Listing deleted, but photo removal failed:",
                                photoError
                            );

                            showToast(
                                "Car deleted, but its photo could not be removed. Check Storage DELETE policy."
                            );
                        }
                    }
                }
            }
        } catch (error) {
            console.error("Cloud deletion failed:", error);

            showToast(
                error.message ||
                "Could not delete cloud listing. Check Supabase policies."
            );

            return;
        }
    }

    // Update the page after deletion.
    cars = cars.filter(
        item => Number(item.id) !== Number(id)
    );

    wishlist = wishlist.filter(
        item => Number(item) !== Number(id)
    );

    saveCars();
    saveWishlist();

    renderCars();
    renderFeaturedCars();
    renderAdminCars();

    updateStats();
    updateWishlistCount();
    updateAdminStats();

    showToast("Car deleted successfully.");
}

/* =========================================================
   ADMIN LOGOUT
========================================================= */

function adminLogout() {
    adminLoggedIn = false;

    closeModal("adminModal");

    showToast("Admin logged out.");
}

/* =========================================================
   STATS
========================================================= */

function updateStats() {
    const total = document.getElementById("totalCarsStat");

    if (total) {
        total.textContent = cars.length;
    }
}

/* =========================================================
   MODALS
========================================================= */

function openModal(id) {
    const modal = document.getElementById(id);

    if (modal) {
        modal.classList.add("show");
        document.body.style.overflow = "hidden";
    }
}

function closeModal(id) {
    const modal = document.getElementById(id);

    if (modal) {
        modal.classList.remove("show");
        document.body.style.overflow = "";
    }
}

/* Close modal by clicking outside */

document.addEventListener("click", function(event) {
    if (event.target.classList.contains("modal")) {
        event.target.classList.remove("show");
        document.body.style.overflow = "";
    }
});

/* ESC key */

document.addEventListener("keydown", function(event) {
    if (event.key === "Escape") {
        document
            .querySelectorAll(".modal.show")
            .forEach(modal => {
                modal.classList.remove("show");
            });

        document.body.style.overflow = "";
    }
});

/* =========================================================
   MOBILE MENU
========================================================= */

function toggleMobileMenu() {
    document
        .getElementById("mobileMenu")
        .classList.toggle("open");
}

function closeMobileMenu() {
    const menu = document.getElementById("mobileMenu");

    if (menu) {
        menu.classList.remove("open");
    }
}

/* =========================================================
   TOAST
========================================================= */

let toastTimer;

function showToast(message) {
    const toast = document.getElementById("toast");

    if (!toast) return;

    toast.textContent = message;
    toast.classList.add("show");

    clearTimeout(toastTimer);

    toastTimer = setTimeout(() => {
        toast.classList.remove("show");
    }, 3000);
}
