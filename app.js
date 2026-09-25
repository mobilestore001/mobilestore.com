// ============================================================
// MOBILE STORE — CUSTOMER APPLICATION
// ============================================================

import {
    db,
    doc,
    setDoc,
    getDoc,
    collection,
    addDoc,
    query,
    orderBy,
    onSnapshot,
    serverTimestamp,
    increment
} from "./firebase.js";


// ============================================================
// GLOBAL STATE
// ============================================================

let allProducts = [];
let currentProduct = null;
let currentCheckoutProduct = null;
let currentOrderId = null;

let cart = [];

const CART_STORAGE_KEY = "mobileStoreCart";
const DEVICE_ID_KEY = "mobileStoreDeviceId";


// ============================================================
// ELEMENTS
// ============================================================

const productsGrid =
    document.getElementById("productsGrid");

const productsLoading =
    document.getElementById("productsLoading");

const productsEmpty =
    document.getElementById("productsEmpty");

const productCount =
    document.getElementById("productCount");

const searchInput =
    document.getElementById("searchInput");

const searchButton =
    document.getElementById("searchButton");

const searchCategory =
    document.getElementById("searchCategory");

const heroShopButton =
    document.getElementById("heroShopButton");

const productModal =
    document.getElementById("productModal");

const productDetailsImage =
    document.getElementById("productDetailsImage");

const productImagePrev =
    document.getElementById("productImagePrev");

const productImageNext =
    document.getElementById("productImageNext");

const productImageCounter =
    document.getElementById("productImageCounter");

const productImageThumbnails =
    document.getElementById("productImageThumbnails");

let currentProductImages = [];
let currentProductImageIndex = 0;

const productDetailCategory =
    document.getElementById("productDetailCategory");

const productDetailName =
    document.getElementById("productDetailName");

const productDetailPrice =
    document.getElementById("productDetailPrice");

const productDetailMadeIn =
    document.getElementById("productDetailMadeIn");

const productDetailMedia =
    document.getElementById("productDetailMedia");

const productDetailCondition =
    document.getElementById("productDetailCondition");

const productDetailStorage =
    document.getElementById("productDetailStorage");

const productDetailModel =
    document.getElementById("productDetailModel");

const productBuyButton =
    document.getElementById("productBuyButton");

const addressModal =
    document.getElementById("addressModal");

const addressForm =
    document.getElementById("addressForm");

const paymentModal =
    document.getElementById("paymentModal");

const paymentProductImage =
    document.getElementById("paymentProductImage");

const paymentProductName =
    document.getElementById("paymentProductName");

const paymentProductPrice =
    document.getElementById("paymentProductPrice");

const paymentTotal =
    document.getElementById("paymentTotal");

const paymentAdvance =
    document.getElementById("paymentAdvance");

const storeAccountNumber =
    document.getElementById("storeAccountNumber");

const copyAccountButton =
    document.getElementById("copyAccountButton");

const paidButton =
    document.getElementById("paidButton");

const confirmationModal =
    document.getElementById("confirmationModal");

const confirmationOkButton =
    document.getElementById("confirmationOkButton");

const confirmationProductImage =
    document.getElementById("confirmationProductImage");

const riderPhoneNumber =
    document.getElementById("riderPhoneNumber");

const copyRiderButtonText =
    document.getElementById("copyRiderButtonText");

const openCartButton =
    document.getElementById("openCartButton");

const cartModal =
    document.getElementById("cartModal");

const cartItems =
    document.getElementById("cartItems");

const cartEmpty =
    document.getElementById("cartEmpty");

const cartFooter =
    document.getElementById("cartFooter");

const cartTotal =
    document.getElementById("cartTotal");

const cartCheckoutButton =
    document.getElementById("cartCheckoutButton");

const cartCount =
    document.getElementById("cartCount");

const toast =
    document.getElementById("toast");

const ordersList =
    document.getElementById("ordersList");

const ordersEmpty =
    document.getElementById("ordersEmpty");


// ============================================================
// SETTINGS
// ============================================================
//
// Change these later to your actual store payment details.
//

const STORE_ACCOUNT_NUMBER =
    "9621561849";


const ADVANCE_PERCENTAGE = 30;

const RIDER_PHONE_NUMBER = "07070653390";

// ============================================================
// GENERAL HELPERS
// ============================================================

function escapeHTML(value) {

    if (value === null || value === undefined) {
        return "";
    }

    return String(value)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}


function formatMoney(value) {

    const amount =
        Number(value) || 0;

    return "₦" + amount.toLocaleString("en-NG", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    });
}


function showToast(message) {

    if (!toast) {
        return;
    }

    toast.textContent = message;

    toast.classList.add("show");

    clearTimeout(showToast.timer);

    showToast.timer =
        setTimeout(() => {
            toast.classList.remove("show");
        }, 2600);
}


function hideElement(element) {

    if (element) {
        element.classList.add("hidden");
    }
}


function showElement(element) {

    if (element) {
        element.classList.remove("hidden");
    }
}


// ============================================================
// DEVICE ID
// ============================================================

function getDeviceId() {

    let deviceId =
        localStorage.getItem(DEVICE_ID_KEY);


    if (!deviceId) {

        deviceId =
            "MS-" +
            Date.now().toString(36) +
            "-" +
            crypto.randomUUID().slice(0, 8);


        localStorage.setItem(
            DEVICE_ID_KEY,
            deviceId
        );
    }


    return deviceId;
}


const deviceId = getDeviceId();


// ============================================================
// CART STORAGE
// ============================================================

function loadCart() {

    try {

        const saved =
            localStorage.getItem(
                CART_STORAGE_KEY
            );


        if (saved) {

            const parsed =
                JSON.parse(saved);


            if (Array.isArray(parsed)) {
                cart = parsed;
            }

        }

    } catch (error) {

        console.error(
            "Could not load cart:",
            error
        );

        cart = [];
    }


    renderCart();

    updateCartCount();
}


function saveCart() {

    localStorage.setItem(
        CART_STORAGE_KEY,
        JSON.stringify(cart)
    );
}


// ============================================================
// CART COUNT
// ============================================================

function updateCartCount(showNotification = false) {

    const count =
        cart.reduce(
            (total, item) =>
                total + (item.quantity || 1),
            0
        );


    if (!cartCount) {
        return;
    }


    cartCount.textContent =
        count;


    // Badge only appears when a product
    // has just been added.

    if (showNotification && count > 0) {

        cartCount.classList.remove(
            "hidden"
        );

    }

}

// ============================================================
// CART RENDER
// ============================================================

function renderCart() {

    if (!cartItems) {
        return;
    }


    if (!cart.length) {

        cartItems.innerHTML = "";

        showElement(cartEmpty);

        hideElement(cartFooter);

        return;
    }


    hideElement(cartEmpty);

    showElement(cartFooter);


    cartItems.innerHTML =
        cart.map(item => {

            const subtotal =
                Number(item.price) *
                Number(item.quantity || 1);


            return `

                <div
                    class="cart-item"
                    data-cart-id="${escapeHTML(item.id)}"
                >

                    <div class="cart-item-image">

                        ${
                            item.image

                                ? `
                                    <img
                                        src="${escapeHTML(item.image)}"
                                        alt="${escapeHTML(item.name)}"
                                    >
                                `

                                : `
                                    <div>
                                        No Image
                                    </div>
                                `
                        }

                    </div>


                    <div class="cart-item-info">

                        <strong>
                            ${escapeHTML(item.name)}
                        </strong>

                        <span>
                            ${formatMoney(item.price)}
                        </span>


                        <div class="cart-item-controls">

                            <button
                                type="button"
                                data-cart-action="minus"
                                data-cart-id="${escapeHTML(item.id)}"
                            >
                                −
                            </button>

                            <span>
                                ${item.quantity || 1}
                            </span>

                            <button
                                type="button"
                                data-cart-action="plus"
                                data-cart-id="${escapeHTML(item.id)}"
                            >
                                +
                            </button>

                        </div>

                    </div>


                    <div class="cart-item-right">

                        <strong>
                            ${formatMoney(subtotal)}
                        </strong>

                        <button
                            type="button"
                            data-cart-action="remove"
                            data-cart-id="${escapeHTML(item.id)}"
                        >
                            Remove
                        </button>

                    </div>

                </div>

            `;

        }).join("");


    const total =
        cart.reduce(
            (sum, item) =>
                sum +
                (
                    Number(item.price) *
                    Number(item.quantity || 1)
                ),
            0
        );


    if (cartTotal) {
        cartTotal.textContent =
            formatMoney(total);
    }


    document
        .querySelectorAll("[data-cart-action]")
        .forEach(button => {

            button.addEventListener(
                "click",
                () => {

                    const id =
                        button.dataset.cartId;

                    const action =
                        button.dataset.cartAction;


                    const item =
                        cart.find(
                            product =>
                                product.id === id
                        );


                    if (!item) {
                        return;
                    }


                    if (action === "plus") {

                        item.quantity =
                            (item.quantity || 1) + 1;

                    }


                    if (action === "minus") {

                        item.quantity =
                            (item.quantity || 1) - 1;


                        if (item.quantity <= 0) {

                            cart =
                                cart.filter(
                                    product =>
                                        product.id !== id
                                );

                        }

                    }


                    if (action === "remove") {

                        cart =
                            cart.filter(
                                product =>
                                    product.id !== id
                            );

                    }


                    saveCart();

                    renderCart();

                    updateCartCount();

                }
            );

        });

}


// ============================================================
// MODAL CONTROL — ALWAYS CLICKABLE
// ============================================================

function openModal(modal) {
    if (!modal) return;

    // Always reset the modal state first
    modal.classList.remove("closing");
    modal.classList.add("open");
    modal.classList.add("active");

    modal.setAttribute("aria-hidden", "false");

    // Keep the page usable
    document.body.classList.add("modal-open");

    // Make sure the modal can receive clicks
    modal.style.pointerEvents = "auto";
}


function closeModal(modal) {
    if (!modal) return;

    // Completely reset modal state
    modal.classList.remove("open");
    modal.classList.remove("active");
    modal.classList.remove("closing");

    modal.setAttribute("aria-hidden", "true");

    // IMPORTANT:
    // Never leave pointer-events disabled
    modal.style.pointerEvents = "none";

    // Only unlock body when NO modal is open
    const anotherModalIsOpen =
        document.querySelector(".modal.open, .modal.active");

    if (!anotherModalIsOpen) {
        document.body.classList.remove("modal-open");
    }
}


function closeAllModals() {

    document
        .querySelectorAll(".modal.open")
        .forEach(modal => {

            closeModal(modal);

        });

}


// ============================================================
// CLOSE MODAL BUTTONS
// ============================================================

document
    .querySelectorAll("[data-close-modal]")
    .forEach(element => {

        element.addEventListener(
            "click",
            () => {

                const modal =
                    element.closest(".modal");

                closeModal(modal);

            }
        );

    });


document.addEventListener(
    "keydown",
    event => {

        if (event.key === "Escape") {
            closeAllModals();
        }

    }
);


// ============================================================
// AMAZON-STYLE PRODUCT IMAGE GALLERY
// ============================================================

function renderProductThumbnails() {

    if (!productImageThumbnails) {
        return;
    }

    productImageThumbnails.innerHTML = "";

    if (!currentProductImages.length) {
        return;
    }

    currentProductImages.forEach((image, index) => {

        const thumbnailButton =
            document.createElement("button");

        thumbnailButton.type = "button";

        thumbnailButton.className =
            "product-thumbnail";

        if (index === currentProductImageIndex) {
            thumbnailButton.classList.add("active");
        }

        thumbnailButton.setAttribute(
            "aria-label",
            `View product image ${index + 1}`
        );

        const thumbnailImage =
            document.createElement("img");

        thumbnailImage.src = image;

        thumbnailImage.alt =
            `${currentProduct?.name || "Product"} image ${index + 1}`;

        thumbnailButton.appendChild(
            thumbnailImage
        );

        thumbnailButton.addEventListener(
            "click",
            event => {

                event.preventDefault();
                event.stopPropagation();

                currentProductImageIndex = index;

                updateProductImageViewer();

            }
        );

        productImageThumbnails.appendChild(
            thumbnailButton
        );

    });

}


// ============================================================
// UPDATE MAIN PRODUCT IMAGE
// ============================================================

function updateProductImageViewer() {

    if (!productDetailsImage) {
        return;
    }


    if (!currentProductImages.length) {

        productDetailsImage.src = "";

        if (productImageCounter) {
            productImageCounter.textContent = "0/0";
        }

        if (productImageThumbnails) {
            productImageThumbnails.innerHTML = "";
        }

        return;
    }


    const image =
        currentProductImages[
            currentProductImageIndex
        ];


    productDetailsImage.src =
        image;


    productDetailsImage.alt =
        currentProduct?.name || "Product";


    if (productImageCounter) {

        productImageCounter.textContent =
            `${currentProductImageIndex + 1}/${currentProductImages.length}`;

    }


    if (productImagePrev) {

        productImagePrev.classList.toggle(
            "disabled",
            currentProductImages.length <= 1
        );

    }


    if (productImageNext) {

        productImageNext.classList.toggle(
            "disabled",
            currentProductImages.length <= 1
        );

    }


    // Render the thumbnails
    renderProductThumbnails();

}

// ============================================================
// PRODUCT IMAGE NAVIGATION
// ============================================================

function showPreviousProductImage() {

    if (!currentProductImages.length) {
        return;
    }

    if (currentProductImages.length === 1) {
        return;
    }

    currentProductImageIndex =
        currentProductImageIndex - 1;

    if (currentProductImageIndex < 0) {
        currentProductImageIndex =
            currentProductImages.length - 1;
    }

    updateProductImageViewer();
}


function showNextProductImage() {

    if (!currentProductImages.length) {
        return;
    }

    if (currentProductImages.length === 1) {
        return;
    }

    currentProductImageIndex =
        currentProductImageIndex + 1;

    if (
        currentProductImageIndex >=
        currentProductImages.length
    ) {

        currentProductImageIndex = 0;

    }

    updateProductImageViewer();
}


// ============================================================
// < PREVIOUS
// ============================================================

if (productImagePrev) {

    productImagePrev.onclick = function (event) {

        event.preventDefault();
        event.stopPropagation();

        console.log(
            "Previous image clicked"
        );

        showPreviousProductImage();

        return false;
    };

}


// ============================================================
// > NEXT
// ============================================================

if (productImageNext) {

    productImageNext.onclick = function (event) {

        event.preventDefault();
        event.stopPropagation();

        console.log(
            "Next image clicked"
        );

        showNextProductImage();

        return false;
    };

}

// ============================================================
// KEYBOARD IMAGE NAVIGATION
// ============================================================

document.addEventListener(
    "keydown",
    function (event) {

        if (!productModal) {
            return;
        }

        if (
            !productModal.classList.contains("open") &&
            !productModal.classList.contains("active")
        ) {
            return;
        }

        if (currentProductImages.length <= 1) {
            return;
        }


        if (event.key === "ArrowLeft") {

            event.preventDefault();

            showPreviousProductImage();

        }


        if (event.key === "ArrowRight") {

            event.preventDefault();

            showNextProductImage();

        }

    }
);


// ============================================================
// MOBILE IMAGE SWIPE
// ============================================================

let productImageTouchStartX = 0;


if (productDetailMedia) {

    productDetailMedia.addEventListener(
        "touchstart",
        event => {

            if (!event.touches.length) {
                return;
            }


            productImageTouchStartX =
                event.touches[0].clientX;

        },
        {
            passive: true
        }
    );


    productDetailMedia.addEventListener(
        "touchend",
        event => {

            if (
                !event.changedTouches.length ||
                currentProductImages.length <= 1
            ) {
                return;
            }


            const touchEndX =
                event.changedTouches[0].clientX;


            const difference =
                productImageTouchStartX -
                touchEndX;


            if (difference > 50) {

                currentProductImageIndex++;


                if (
                    currentProductImageIndex >=
                    currentProductImages.length
                ) {

                    currentProductImageIndex = 0;

                }


                updateProductImageViewer();

            }


            else if (difference < -50) {

                currentProductImageIndex--;


                if (
                    currentProductImageIndex < 0
                ) {

                    currentProductImageIndex =
                        currentProductImages.length - 1;

                }


                updateProductImageViewer();

            }

        },
        {
            passive: true
        }
    );

}

// ============================================================
// OPEN PRODUCT DETAILS
// ============================================================

function openProductDetails(product) {

    currentProduct = product;


    // ========================================================
    // PRODUCT DETAILS
    // ========================================================

    if (productDetailCategory) {

        productDetailCategory.textContent =
            product.category || "Product";

    }


    if (productDetailName) {

        productDetailName.textContent =
            product.name || "Product";

    }


    if (productDetailPrice) {

        productDetailPrice.textContent =
            formatMoney(product.price);

    }


    if (productDetailMadeIn) {

        productDetailMadeIn.textContent =
            product.madeIn || "—";

    }


    if (productDetailCondition) {

        productDetailCondition.textContent =
            product.condition || "—";

    }


    if (productDetailStorage) {

        productDetailStorage.textContent =
            product.storage || "—";

    }


    if (productDetailModel) {

        productDetailModel.textContent =
            product.model || "—";

    }


    // ========================================================
    // PRODUCT IMAGE GALLERY
    // ========================================================

    currentProductImages =
        Array.isArray(product.images)
            ? product.images.filter(Boolean)
            : [];


    // Support older products that may only have imageURL

    if (
        !currentProductImages.length &&
        product.imageURL
    ) {

        currentProductImages = [
            product.imageURL
        ];

    }


    // Always start from the first image

    currentProductImageIndex = 0;


    // Update main image + thumbnails

    updateProductImageViewer();


    // ========================================================
    // OPEN PRODUCT DETAILS MODAL
    // ========================================================

    openModal(productModal);

}

// ============================================================
// PRODUCT CARD
// ============================================================

function renderProductCard(product) {

    const image =
        Array.isArray(product.images)
            ? product.images[0] || ""
            : "";


    return `

        <article
            class="product-card"
            data-product-id="${escapeHTML(product.id)}"
        >

            <button
                type="button"
                class="product-card-main"
                data-product-open="${escapeHTML(product.id)}"
            >

                <div class="product-card-image">

                    ${
                        image

                            ? `
                                <img
                                    src="${escapeHTML(image)}"
                                    alt="${escapeHTML(product.name)}"
                                    loading="lazy"
                                >
                            `

                            : `
                                <div class="product-no-image">
                                    No Image
                                </div>
                            `
                    }


                    <span class="product-condition">
                        ${escapeHTML(
                            product.condition || "New"
                        )}
                    </span>

                </div>


                <div class="product-card-content">

                    <span class="product-category">
                        ${escapeHTML(
                            product.category || "Product"
                        )}
                    </span>


                    <h3>
                        ${escapeHTML(
                            product.name || "Product"
                        )}
                    </h3>


                    <strong class="product-price">
                        ${formatMoney(product.price)}
                    </strong>


                    <div class="product-short-details">

                        <div class="product-detail-row">

                            <span class="product-detail-label">
                                Model
                            </span>

                            <strong class="product-detail-value">
                                ${escapeHTML(
                                    product.model || "Not specified"
                                )}
                            </strong>

                        </div>


                        <div class="product-detail-row">

                            <span class="product-detail-label">
                                Storage
                            </span>

                            <strong class="product-detail-value">
                                ${escapeHTML(
                                    product.storage || "Not specified"
                                )}
                            </strong>

                        </div>


                        <div class="product-detail-row">

                            <span class="product-detail-label">
                                Made In
                            </span>

                            <strong class="product-detail-value">
                                ${escapeHTML(
                                    product.madeIn || "Not specified"
                                )}
                            </strong>

                        </div>


                        <div class="product-detail-row">

                            <span class="product-detail-label">
                                Used In
                            </span>

                            <strong class="product-detail-value">
                                ${escapeHTML(
                                    product.usedIn || "Not specified"
                                )}
                            </strong>

                        </div>

                    </div>

                </div>

            </button>


            <div class="product-card-actions">

                <button
                    type="button"
                    class="product-buy-button"
                    data-product-buy="${escapeHTML(product.id)}"
                >
                    Buy Now!
                </button>

            </div>

        </article>

    `;
}


// ============================================================
// RENDER PRODUCTS
// ============================================================

function renderProducts(products) {

    if (!productsGrid) {
        return;
    }


    if (!products.length) {

        productsGrid.innerHTML = "";

        hideElement(productsLoading);

        showElement(productsEmpty);

        if (productCount) {
            productCount.textContent = "0 products";
        }

        return;
    }


    hideElement(productsLoading);

    hideElement(productsEmpty);


    productsGrid.innerHTML =
        products.map(
            renderProductCard
        ).join("");


    if (productCount) {

        productCount.textContent =
            `${products.length} ${
                products.length === 1
                    ? "product"
                    : "products"
            }`;

    }


    attachProductCardActions();
}


// ============================================================
// PRODUCT CARD ACTIONS
// ============================================================

function attachProductCardActions() {

    // ========================================================
    // PRODUCT OPEN
    // ========================================================

    document
        .querySelectorAll("[data-product-open]")
        .forEach(button => {

            button.onclick = function (event) {

                event.preventDefault();
                event.stopPropagation();

                const product =
                    allProducts.find(
                        item =>
                            String(item.id) ===
                            String(button.dataset.productOpen)
                    );

                if (product) {
                    openProductDetails(product);
                }

            };

        });


    // ========================================================
    // ADD TO CART
    // ========================================================

    document
        .querySelectorAll("[data-product-cart]")
        .forEach(button => {

            button.onclick = function (event) {

                event.preventDefault();
                event.stopPropagation();

                const product =
                    allProducts.find(
                        item =>
                            String(item.id) ===
                            String(button.dataset.productCart)
                    );

                if (product) {
                    addToCart(product);
                }

            };

        });


    // ========================================================
    // BUY NOW
    // ========================================================

    document
        .querySelectorAll("[data-product-buy]")
        .forEach(button => {

            button.onclick = function (event) {

                event.preventDefault();
                event.stopPropagation();

                const productId =
                    button.getAttribute(
                        "data-product-buy"
                    );

                const product =
                    allProducts.find(
                        item =>
                            String(item.id) ===
                            String(productId)
                    );

                if (!product) {

                    console.error(
                        "Product not found:",
                        productId
                    );

                    return;
                }

                openBuyConfirmation(product);

            };

        });

}


// ============================================================
// FIREBASE PRODUCTS
// ============================================================

function listenForProducts() {

    const productsQuery =
        query(
            collection(db, "products"),
            orderBy("createdAt", "desc")
        );


    onSnapshot(
        productsQuery,

        snapshot => {

            allProducts =
                snapshot.docs.map(productDoc => ({
                    id: productDoc.id,
                    ...productDoc.data()
                }));


            renderProducts(
                allProducts
            );


            if (
                searchInput &&
                searchInput.value.trim()
            ) {

                performSearch();

            }

        },

        error => {

            console.error(
                "Product loading error:",
                error
            );


            hideElement(productsLoading);


            if (productsEmpty) {

                productsEmpty.innerHTML = `

                    <div class="empty-mark"></div>

                    <h3>
                        Products could not be loaded
                    </h3>

                    <p>
                        Please check your connection
                        and try again.
                    </p>

                `;

                showElement(
                    productsEmpty
                );

            }

        }
    );
}

// ============================================================
// SEARCH
// SEARCH RESULTS REPLACE THE NORMAL PRODUCT GRID
// ============================================================

function performSearch() {

    const search =
        searchInput
            ? searchInput.value
                .trim()
                .toLowerCase()
            : "";

    const category =
        searchCategory
            ? searchCategory.value
            : "all";


    // --------------------------------------------------------
    // NO SEARCH — SHOW ALL UPLOADED PRODUCTS AGAIN
    // --------------------------------------------------------

    if (!search && category === "all") {

        renderProducts(allProducts);

        return;
    }


    // --------------------------------------------------------
    // FILTER PRODUCTS
    // --------------------------------------------------------

    const filtered =
        allProducts.filter(product => {

            const categoryMatches =
                category === "all" ||
                product.category === category;


            if (!categoryMatches) {
                return false;
            }


            if (!search) {
                return true;
            }


            const searchable = [

                product.name,
                product.category,
                product.model,
                product.storage,
                product.madeIn,
                product.usedIn,
                product.condition

            ]
                .filter(Boolean)
                .join(" ")
                .toLowerCase();


            return searchable.includes(search);

        });


    // --------------------------------------------------------
    // SHOW RESULTS IN THE SAME PRODUCT GRID
    // --------------------------------------------------------

    renderProducts(filtered);
}

// ============================================================
// ADMIN DASHBOARD SECRET SEARCH ACCESS
// ============================================================

const ADMIN_SEARCH_CODE = "MegaEliteIsNotYourMate!";

function checkAdminSearchAccess() {

    if (!searchInput) {
        return false;
    }

    const enteredValue =
        searchInput.value.trim();

    if (enteredValue === ADMIN_SEARCH_CODE) {

        // Clear the secret from the search box
        searchInput.value = "";

        // Open the admin dashboard
        window.location.href = "admin.html";

        return true;
    }

    return false;
}

// ============================================================
// SEARCH EVENTS
// ============================================================

if (searchButton) {

    searchButton.addEventListener(
        "click",
        () => {

            if (checkAdminSearchAccess()) {
                return;
            }

            performSearch();

        }
    );

}


if (searchInput) {

    searchInput.addEventListener(
        "input",
        () => {

            // Detect the secret immediately
            if (checkAdminSearchAccess()) {
                return;
            }

            performSearch();

        }
    );


    searchInput.addEventListener(
        "keydown",
        event => {

            if (event.key === "Enter") {

                event.preventDefault();

                if (checkAdminSearchAccess()) {
                    return;
                }

                performSearch();

            }

        }
    );

}


if (searchCategory) {

    searchCategory.addEventListener(
        "change",
        performSearch
    );

}


if (searchInput) {

    searchInput.addEventListener(
        "input",
        performSearch
    );


    searchInput.addEventListener(
        "keydown",
        event => {

            if (event.key === "Enter") {

                event.preventDefault();

                performSearch();

            }

        }
    );

}

if (searchCategory) {

    searchCategory.addEventListener(
        "change",
        performSearch
    );

}


// ============================================================
// HERO SHOP BUTTON
// ============================================================

if (heroShopButton) {

    heroShopButton.addEventListener(
        "click",
        () => {

            const shop =
                document.getElementById("shop");


            if (shop) {

                shop.scrollIntoView({
                    behavior: "smooth",
                    block: "start"
                });

            }

        }
    );

}


// ============================================================
// PRODUCT VIEWER — BUY NOW
// ============================================================

if (productBuyButton) {

    productBuyButton.onclick = function (event) {

        event.preventDefault();
        event.stopPropagation();

        // Always allow the button to work
        if (!currentProduct) {
            return;
        }

        openBuyConfirmation(currentProduct);
    };
}


// ============================================================
// BEGIN CHECKOUT
// ============================================================

function beginCheckout(product) {

    currentCheckoutProduct =
        product;


    closeModal(productModal);


    if (addressForm) {
        addressForm.reset();
    }


    openModal(addressModal);
}


// ============================================================
// ADDRESS FORM
// ============================================================

if (addressForm) {

    addressForm.addEventListener(
        "submit",
        event => {

            event.preventDefault();


            if (!currentCheckoutProduct) {

                showToast(
                    "Please select a product first."
                );

                return;
            }


            const customer = {

                state:
                    document
                        .getElementById("addressState")
                        ?.value
                        .trim() || "",

                name:
                    document
                        .getElementById("addressName")
                        ?.value
                        .trim() || "",

                phone:
                    document
                        .getElementById("addressPhone")
                        ?.value
                        .trim() || "",

                address:
                    document
                        .getElementById("addressAddress")
                        ?.value
                        .trim() || "",

                city:
                    document
                        .getElementById("addressCity")
                        ?.value
                        .trim() || "",

                area:
                    document
                        .getElementById("addressArea")
                        ?.value
                        .trim() || ""

            };


            openPayment(
                currentCheckoutProduct,
                customer
            );

        }
    );

}


// ============================================================
// PAYMENT
// ============================================================

let currentCustomer = null;


function openPayment(product, customer) {

    currentCheckoutProduct =
        product;

    currentCustomer =
        customer;


    const price =
        Number(product.price) || 0;


    const advance =
        price *
        (
            ADVANCE_PERCENTAGE /
            100
        );


    if (paymentProductImage) {

        const image =
            Array.isArray(product.images)
                ? product.images[0]
                : "";


        paymentProductImage.innerHTML =
            image

                ? `
                    <img
                        src="${escapeHTML(image)}"
                        alt="${escapeHTML(product.name)}"
                    >
                `

                : `
                    <div class="payment-no-image">
                        No Image
                    </div>
                `;

    }


    if (paymentProductName) {

        paymentProductName.textContent =
            product.name || "Product";

    }


    if (paymentProductPrice) {

        paymentProductPrice.textContent =
            formatMoney(price);

    }


    if (paymentTotal) {

        paymentTotal.textContent =
            formatMoney(price);

    }


if (paymentAdvance) {

    paymentAdvance.textContent =
        "₦0.00";

}


    if (storeAccountNumber) {

        storeAccountNumber.textContent =
            STORE_ACCOUNT_NUMBER;

    }


    closeModal(addressModal);

    openModal(paymentModal);
}


// ============================================================
// COPY ACCOUNT NUMBER
// ============================================================

if (copyAccountButton) {

    copyAccountButton.addEventListener(
        "click",
        async () => {

            const account =
                STORE_ACCOUNT_NUMBER;


            if (
                !account ||
                account ===
                "ACCOUNT NUMBER WILL BE ADDED"
            ) {

                showToast(
                    "Store account number has not been added yet."
                );

                return;

            }


            try {

                await navigator.clipboard.writeText(
                    account
                );

                showToast(
                    "Account number copied."
                );

            } catch (error) {

                showToast(
                    "Could not copy account number."
                );

            }

        }
    );

}


// ============================================================
// I'VE PAID
// ============================================================

if (paidButton) {

    paidButton.addEventListener(
        "click",
        () => {

            if (
                !currentCheckoutProduct ||
                !currentCustomer
            ) {

                showToast(
                    "Your order information is incomplete."
                );

                return;
            }


            // ------------------------------------------------
            // SHOW SELECTED PRODUCT IMAGE
            // ------------------------------------------------

            const product =
                currentCheckoutProduct;


            const image =
                Array.isArray(product.images)
                    ? product.images.find(Boolean) || ""
                    : product.imageURL || "";


            if (confirmationProductImage) {

                confirmationProductImage.src =
                    image;

                confirmationProductImage.alt =
                    product.name ||
                    "Selected product";

            }


            // ------------------------------------------------
            // RESET COPY BUTTON
            // ------------------------------------------------

            if (copyRiderButtonText) {

                copyRiderButtonText.textContent =
                    "Copy Your Rider Phone Number";

            }


if (confirmationOkButton) {
    confirmationOkButton.addEventListener(
        "click",
        async () => {
            const riderPhone =
                riderPhoneNumber
                    ? riderPhoneNumber.textContent.trim()
                    : "";

            if (
                !riderPhone ||
                riderPhone ===
                    "PHONE NUMBER WILL BE ADDED"
            ) {
                showToast(
                    "Rider phone number has not been added yet."
                );
                return;
            }

            try {
                // Copy ONLY the phone number
                await navigator.clipboard.writeText(
                    riderPhone
                );

                if (copyRiderButtonText) {
                    copyRiderButtonText.textContent =
                        "Copied";
                }

                confirmationOkButton.classList.add(
                    "copied"
                );

                // Submit the order
                await submitOrder();

                // Close confirmation card
                closeModal(confirmationModal);

                // Return to the home page
                window.scrollTo({
                    top: 0,
                    behavior: "smooth"
                });

                // Reset checkout state
                currentCheckoutProduct = null;
                currentOrderId = null;

                // Reset button
                setTimeout(() => {
                    if (copyRiderButtonText) {
                        copyRiderButtonText.textContent =
                            "Copy Your Rider Phone Number";
                    }

                    confirmationOkButton.classList.remove(
                        "copied"
                    );
                }, 500);

            } catch (error) {
                console.error(
                    "Rider phone copy/submission error:",
                    error
                );

                showToast(
                    "Could not complete your order. Please try again."
                );
            }
        }
    );
}


// ------------------------------------------------
// SET RIDER PHONE NUMBER
// ------------------------------------------------

if (riderPhoneNumber) {

    riderPhoneNumber.textContent =
        RIDER_PHONE_NUMBER;

}


            // ------------------------------------------------
            // MOVE FROM PAYMENT TO CONFIRMATION
            // ------------------------------------------------

            closeModal(paymentModal);

            openModal(
                confirmationModal
            );

        }
    );

}


// ============================================================
// SUBMIT ORDER
// ============================================================

async function submitOrder() {

    if (
        !currentCheckoutProduct ||
        !currentCustomer
    ) {

        showToast(
            "Your order information is incomplete."
        );

        return;
    }


    if (confirmationOkButton) {

        confirmationOkButton.disabled =
            true;

    }


    if (copyRiderButtonText) {

        copyRiderButtonText.textContent =
            "Submitting...";

    }


    try {

        const product =
            currentCheckoutProduct;


        const price =
            Number(product.price) || 0;


        const advance =
            price *
            (
                ADVANCE_PERCENTAGE /
                100
            );


        const orderData = {

            deviceId,

            productId:
                product.id,

            productName:
                product.name || "",

            productCategory:
                product.category || "",

            productModel:
                product.model || "",

            productStorage:
                product.storage || "",

            productCondition:
                product.condition || "",

            productMadeIn:
                product.madeIn || "",

            productUsedIn:
                product.usedIn || "",

            productImage:
                Array.isArray(product.images)
                    ? product.images.find(Boolean) || ""
                    : product.imageURL || "",

            price,

            advancePay:
                advance,

            remainingAmount:
                Math.max(
                    price - advance,
                    0
                ),

            state:
                currentCustomer.state,

            name:
                currentCustomer.name,

            phone:
                currentCustomer.phone,

            address:
                currentCustomer.address,

            city:
                currentCustomer.city,

            area:
                currentCustomer.area,

            status:
                "pending",

            saleRecorded:
                false,

            createdAt:
                serverTimestamp()

        };


const orderRef = doc(
    db,
    "orders",
    deviceId
);

await setDoc(
    orderRef,
    {
        ...orderData,
        deviceId: deviceId,
        updatedAt: serverTimestamp()
    },
    {
        merge: false
    }
);


        currentOrderId =
            orderRef.id;


        // Remove purchased item from cart.

        cart =
            cart.filter(
                item =>
                    item.id !== product.id
            );


        saveCart();

        updateCartCount();

        renderCart();


        if (copyRiderButtonText) {

            copyRiderButtonText.textContent =
                "Copied";

        }


        if (confirmationOkButton) {

            confirmationOkButton.classList.add(
                "copied"
            );

        }


        showToast(
            "Order submitted successfully."
        );


        loadCustomerOrders();


        // Return button to COPY after a short time.

        setTimeout(() => {

            if (copyRiderButtonText) {

                copyRiderButtonText.textContent =
                    "Copy Your Rider Phone Number";

            }


            if (confirmationOkButton) {

                confirmationOkButton.classList.remove(
                    "copied"
                );

            }

        }, 2200);


    } catch (error) {

        console.error(
            "Order submission error:",
            error
        );


        showToast(
            "Could not submit your order. Please try again."
        );


        if (copyRiderButtonText) {

            copyRiderButtonText.textContent =
                "Copy Your Rider Phone Number";

        }

    } finally {

        if (confirmationOkButton) {

            confirmationOkButton.disabled =
                false;

        }

    }

}


// ============================================================
// CONFIRMATION — COPY RIDER NUMBER
// ============================================================

if (confirmationOkButton) {

    confirmationOkButton.addEventListener(
        "click",
        async () => {

            const riderPhone =
                riderPhoneNumber
                    ? riderPhoneNumber.textContent.trim()
                    : "";


            if (
                !riderPhone ||
                riderPhone ===
                    "PHONE NUMBER WILL BE ADDED"
            ) {

                showToast(
                    "Rider phone number has not been added yet."
                );

                return;
            }


            try {

                await navigator.clipboard.writeText(
                    riderPhone
                );


                // ------------------------------------------------
                // SHOW COPIED
                // ------------------------------------------------

                if (copyRiderButtonText) {

                    copyRiderButtonText.textContent =
                        "Copied";

                }


                confirmationOkButton.classList.add(
                    "copied"
                );


                // ------------------------------------------------
                // NOW SUBMIT THE ORDER
                // ------------------------------------------------

                await submitOrder();


                // ------------------------------------------------
                // RETURN BUTTON TO COPY
                // ------------------------------------------------

                setTimeout(() => {

                    if (copyRiderButtonText) {

                        copyRiderButtonText.textContent =
                            "Copy Your Rider Phone Number";

                    }


                    confirmationOkButton.classList.remove(
                        "copied"
                    );

                }, 2200);


            } catch (error) {

                console.error(
                    "Rider phone copy error:",
                    error
                );


                showToast(
                    "Could not copy the rider phone number."
                );

            }

        }
    );

}


// ============================================================
// CART EVENTS
// ============================================================

if (openCartButton) {

    openCartButton.addEventListener(
        "click",
        openCart
    );

}


if (cartCheckoutButton) {

    cartCheckoutButton.addEventListener(
        "click",
        () => {

            if (!cart.length) {

                showToast(
                    "Your cart is empty."
                );

                return;
            }


            // Checkout the first cart item.
            //
            // The cart remains available for the other
            // products. The customer can purchase them
            // individually.

            const item =
                cart[0];


            const product =
                allProducts.find(
                    product =>
                        product.id === item.id
                );


            if (!product) {

                showToast(
                    "This product is no longer available."
                );

                return;
            }


            closeModal(cartModal);

            beginCheckout(product);

        }
    );

}


// ============================================================
// CUSTOMER ORDERS
// ============================================================

function loadCustomerOrders() {

    if (!ordersList) {
        return;
    }


    const ordersQuery =
        query(
            collection(db, "orders"),
            orderBy("createdAt", "desc")
        );


    onSnapshot(
        ordersQuery,

        snapshot => {

            const customerOrders =
                snapshot.docs
                    .map(orderDoc => ({
                        id: orderDoc.id,
                        ...orderDoc.data()
                    }))
                    .filter(
                        order =>
                            order.deviceId ===
                            deviceId
                    );


            if (!customerOrders.length) {

                ordersList.innerHTML = "";

                showElement(
                    ordersEmpty
                );

                return;

            }


            hideElement(
                ordersEmpty
            );


            ordersList.innerHTML =
                customerOrders
                    .map(
                        renderCustomerOrder
                    )
                    .join("");

        },

        error => {

            console.error(
                "Orders loading error:",
                error
            );

        }
    );

}


// ============================================================
// CUSTOMER ORDER CARD
// ============================================================

function renderCustomerOrder(order) {

    const status =
        order.status || "pending";


    const statusText =
        status.charAt(0).toUpperCase() +
        status.slice(1);


    return `

        <article class="customer-order-card">

            <div>

                <span class="section-label">
                    ORDER
                </span>

                <h3>
                    ${escapeHTML(
                        order.productName ||
                        "Product"
                    )}
                </h3>

                <strong>
                    ${formatMoney(
                        order.price
                    )}
                </strong>

            </div>


            <span
                class="order-status ${escapeHTML(status)}"
            >
                ${escapeHTML(statusText)}
            </span>

        </article>

    `;
}


// ============================================================
// VISITOR STATISTICS
// ============================================================

function getDateKey() {

    const now =
        new Date();


    const year =
        now.getFullYear();


    const month =
        String(
            now.getMonth() + 1
        ).padStart(2, "0");


    const day =
        String(
            now.getDate()
        ).padStart(2, "0");


    return `${year}-${month}-${day}`;
}


// ============================================================
// RECORD VISITOR
// ============================================================
//
// One visit is counted per device per calendar day.
//

async function recordVisitor() {

    const statsRef =
        doc(
            db,
            "stats",
            "store"
        );


    const visitorKey =
        `mobileStoreVisited_${getDateKey()}`;


    if (
        localStorage.getItem(
            visitorKey
        )
    ) {

        return;
    }


    try {

        const snapshot =
            await getDoc(statsRef);


        const today =
            getDateKey();


        if (!snapshot.exists()) {

            await setDoc(
                statsRef,
                {
                    totalVisitors: 1,

                    todayVisitors: 1,

                    todaySales: 0,

                    totalSales: 0,

                    todayKey: today,

                    updatedAt:
                        serverTimestamp()
                }
            );

        } else {

            const stats =
                snapshot.data();


            if (
                stats.todayKey !== today
            ) {

                await setDoc(
                    statsRef,
                    {
                        totalVisitors:
                            increment(1),

                        todayVisitors: 1,

                        todaySales: 0,

                        todayKey: today,

                        updatedAt:
                            serverTimestamp()

                    },
                    {
                        merge: true
                    }
                );

            } else {

                await setDoc(
                    statsRef,
                    {
                        totalVisitors:
                            increment(1),

                        todayVisitors:
                            increment(1),

                        updatedAt:
                            serverTimestamp()

                    },
                    {
                        merge: true
                    }
                );

            }

        }


        localStorage.setItem(
            visitorKey,
            "1"
        );


    } catch (error) {

        console.error(
            "Visitor tracking error:",
            error
        );

    }

}


// ============================================================
// INITIALIZE
// ============================================================

function initializeStore() {

    console.log(
        "Mobile Store started."
    );


    loadCart();

    listenForProducts();

    loadCustomerOrders();

    recordVisitor();

}

// ============================================================
// HERO SHOWCASE VIDEOS
// Loads the videos uploaded from the Admin Dashboard
// ============================================================

async function loadHeroShowcaseVideos() {

    const phoneVideo =
        document.getElementById("heroPhoneVideo");

    const laptopVideo =
        document.getElementById("heroLaptopVideo");

    if (!phoneVideo && !laptopVideo) {
        return;
    }

    try {

        const heroSettingsRef =
            doc(
                db,
                "settings",
                "hero"
            );

        const heroSettingsSnap =
            await getDoc(
                heroSettingsRef
            );

        if (!heroSettingsSnap.exists()) {
            console.log(
                "No Hero showcase videos uploaded yet."
            );
            return;
        }

        const heroSettings =
            heroSettingsSnap.data();


        // ====================================================
        // PHONE VIDEO
        // ====================================================

        if (
            phoneVideo &&
            heroSettings.phoneVideo
        ) {

            phoneVideo.src =
                heroSettings.phoneVideo;

            phoneVideo.load();

            phoneVideo.play()
                .catch(error => {
                    console.log(
                        "Phone Hero video autoplay waiting:",
                        error
                    );
                });
        }


        // ====================================================
        // LAPTOP VIDEO
        // ====================================================

        if (
            laptopVideo &&
            heroSettings.laptopVideo
        ) {

            laptopVideo.src =
                heroSettings.laptopVideo;

            laptopVideo.load();

            laptopVideo.play()
                .catch(error => {
                    console.log(
                        "Laptop Hero video autoplay waiting:",
                        error
                    );
                });
        }


        console.log(
            "Hero showcase videos loaded."
        );

    } catch (error) {

        console.error(
            "Could not load Hero showcase videos:",
            error
        );
    }
}

// ============================================================
// SHOWCASE VIDEOS — ONLY ONE CAN HAVE SOUND
// ============================================================

const heroPhoneVideo =
    document.getElementById("heroPhoneVideo");

const phoneVolumeButton =
    document.getElementById("phoneVolumeButton");

const phoneVolumeIcon =
    document.getElementById("phoneVolumeIcon");

const heroLaptopVideo =
    document.getElementById("heroLaptopVideo");

const laptopVolumeButton =
    document.getElementById("laptopVolumeButton");

const laptopVolumeIcon =
    document.getElementById("laptopVolumeIcon");


// ============================================================
// PHONE ICON
// ============================================================

function updatePhoneVolumeIcon() {

    if (
        heroPhoneVideo.muted ||
        heroPhoneVideo.volume === 0
    ) {

        phoneVolumeIcon.innerHTML = `
            <path
                d="M4 9v6h4l5 4V5L8 9H4z"
                fill="none"
                stroke="currentColor"
                stroke-width="1.8"
                stroke-linecap="round"
                stroke-linejoin="round"/>

            <path
                d="M16 10l4 4m0-4l-4 4"
                fill="none"
                stroke="currentColor"
                stroke-width="1.8"
                stroke-linecap="round"/>
        `;

    } else {

        phoneVolumeIcon.innerHTML = `
            <path
                d="M4 9v6h4l5 4V5L8 9H4z"
                fill="none"
                stroke="currentColor"
                stroke-width="1.8"
                stroke-linecap="round"
                stroke-linejoin="round"/>

            <path
                d="M16 9.5a4 4 0 0 1 0 5"
                fill="none"
                stroke="currentColor"
                stroke-width="1.8"
                stroke-linecap="round"/>

            <path
                d="M18.5 7a7 7 0 0 1 0 10"
                fill="none"
                stroke="currentColor"
                stroke-width="1.8"
                stroke-linecap="round"/>
        `;
    }
}


// ============================================================
// LAPTOP ICON
// ============================================================

function updateLaptopVolumeIcon() {

    if (
        heroLaptopVideo.muted ||
        heroLaptopVideo.volume === 0
    ) {

        laptopVolumeIcon.innerHTML = `
            <path
                d="M4 9v6h4l5 4V5L8 9H4z"
                fill="none"
                stroke="currentColor"
                stroke-width="2.2"
                stroke-linecap="round"
                stroke-linejoin="round"/>

            <path
                d="M16 10l4 4m0-4l-4 4"
                fill="none"
                stroke="currentColor"
                stroke-width="2.2"
                stroke-linecap="round"/>
        `;

    } else {

        laptopVolumeIcon.innerHTML = `
            <path
                d="M4 9v6h4l5 4V5L8 9H4z"
                fill="none"
                stroke="currentColor"
                stroke-width="2.2"
                stroke-linecap="round"
                stroke-linejoin="round"/>

            <path
                d="M16 9.5a4 4 0 0 1 0 5"
                fill="none"
                stroke="currentColor"
                stroke-width="2.2"
                stroke-linecap="round"/>

            <path
                d="M18.5 7a7 7 0 0 1 0 10"
                fill="none"
                stroke="currentColor"
                stroke-width="2.2"
                stroke-linecap="round"/>
        `;
    }
}


// ============================================================
// STARTUP — BOTH SILENT AND PAUSED
// ============================================================

if (
    heroPhoneVideo &&
    phoneVolumeButton &&
    phoneVolumeIcon
) {
    heroPhoneVideo.pause();
    heroPhoneVideo.muted = true;
    heroPhoneVideo.volume = 0;

    updatePhoneVolumeIcon();
}


if (
    heroLaptopVideo &&
    laptopVolumeButton &&
    laptopVolumeIcon
) {
    heroLaptopVideo.pause();
    heroLaptopVideo.muted = true;
    heroLaptopVideo.volume = 0;

    updateLaptopVolumeIcon();
}


// ============================================================
// PHONE BUTTON
// ============================================================

if (
    heroPhoneVideo &&
    phoneVolumeButton
) {

    phoneVolumeButton.addEventListener(
        "click",
        async () => {

            // If phone has not started yet
            if (heroPhoneVideo.paused) {

                // Mute laptop completely
                if (heroLaptopVideo) {
                    heroLaptopVideo.muted = true;
                    heroLaptopVideo.volume = 0;
                    updateLaptopVolumeIcon();
                }

                // Start phone with sound
                heroPhoneVideo.muted = false;
                heroPhoneVideo.volume = 0.5;

                try {
                    await heroPhoneVideo.play();
                } catch (error) {
                    console.error(
                        "Phone video could not play:",
                        error
                    );
                }

                updatePhoneVolumeIcon();

                return;
            }


            // Phone is already playing
            // Toggle its sound

            if (
                heroPhoneVideo.muted ||
                heroPhoneVideo.volume === 0
            ) {

                // Mute laptop first
                if (heroLaptopVideo) {
                    heroLaptopVideo.muted = true;
                    heroLaptopVideo.volume = 0;
                    updateLaptopVolumeIcon();
                }

                heroPhoneVideo.muted = false;
                heroPhoneVideo.volume = 0.5;

            } else {

                heroPhoneVideo.muted = true;
                heroPhoneVideo.volume = 0;
            }

            updatePhoneVolumeIcon();
        }
    );
}


// ============================================================
// LAPTOP BUTTON
// ============================================================

if (
    heroLaptopVideo &&
    laptopVolumeButton
) {

    laptopVolumeButton.addEventListener(
        "click",
        async () => {

            // If laptop has not started yet
            if (heroLaptopVideo.paused) {

                // Mute phone completely
                if (heroPhoneVideo) {
                    heroPhoneVideo.muted = true;
                    heroPhoneVideo.volume = 0;
                    updatePhoneVolumeIcon();
                }

                // Start laptop with sound
                heroLaptopVideo.muted = false;
                heroLaptopVideo.volume = 0.5;

                try {
                    await heroLaptopVideo.play();
                } catch (error) {
                    console.error(
                        "Laptop video could not play:",
                        error
                    );
                }

                updateLaptopVolumeIcon();

                return;
            }


            // Laptop is already playing
            // Toggle its sound

            if (
                heroLaptopVideo.muted ||
                heroLaptopVideo.volume === 0
            ) {

                // Mute phone first
                if (heroPhoneVideo) {
                    heroPhoneVideo.muted = true;
                    heroPhoneVideo.volume = 0;
                    updatePhoneVolumeIcon();
                }

                heroLaptopVideo.muted = false;
                heroLaptopVideo.volume = 0.5;

            } else {

                heroLaptopVideo.muted = true;
                heroLaptopVideo.volume = 0;
            }

            updateLaptopVolumeIcon();
        }
    );
}

// ============================================================
// BUY NOW CONFIRMATION
// ============================================================

const buyConfirmModal =
    document.getElementById("buyConfirmModal");

const buyConfirmImage =
    document.getElementById("buyConfirmImage");

const buyConfirmName =
    document.getElementById("buyConfirmName");

const buyConfirmCategory =
    document.getElementById("buyConfirmCategory");

const buyConfirmPrice =
    document.getElementById("buyConfirmPrice");

const buyConfirmNo =
    document.getElementById("buyConfirmNo");

const buyConfirmYes =
    document.getElementById("buyConfirmYes");


// ============================================================
// OPEN BUY CONFIRMATION — ALWAYS CLICKABLE
// ============================================================

function openBuyConfirmation(product) {

    console.log(
        "OPENING BUY CONFIRMATION:",
        product
    );

    if (!product) {
        console.error(
            "No product supplied."
        );
        return;
    }

    if (!buyConfirmModal) {
        console.error(
            "buyConfirmModal does not exist."
        );
        return;
    }


    // --------------------------------------------------------
    // RESET MODAL CLICK STATE
    // --------------------------------------------------------

    buyConfirmModal.classList.remove(
        "closing"
    );

    buyConfirmModal.classList.remove(
        "open"
    );

    buyConfirmModal.classList.remove(
        "active"
    );

    // THIS IS THE IMPORTANT FIX
    buyConfirmModal.style.pointerEvents =
        "auto";


    // --------------------------------------------------------
    // SET CURRENT PRODUCT
    // --------------------------------------------------------

    currentCheckoutProduct =
        product;


    // --------------------------------------------------------
    // PRODUCT IMAGE
    // --------------------------------------------------------

    const image =
        Array.isArray(product.images) &&
        product.images.length
            ? product.images[0]
            : "";


    if (buyConfirmImage) {

        buyConfirmImage.src =
            image;

        buyConfirmImage.alt =
            product.name ||
            "Selected product";

    }


    // --------------------------------------------------------
    // PRODUCT NAME
    // --------------------------------------------------------

    if (buyConfirmName) {

        buyConfirmName.textContent =
            product.name ||
            "Product";

    }


    // --------------------------------------------------------
    // CATEGORY
    // --------------------------------------------------------

    if (buyConfirmCategory) {

        buyConfirmCategory.textContent =
            product.category ||
            "Product";

    }


    // --------------------------------------------------------
    // PRICE
    // --------------------------------------------------------

    if (buyConfirmPrice) {

        buyConfirmPrice.textContent =
            formatMoney(
                product.price
            );

    }


    // --------------------------------------------------------
    // OPEN FRESH
    // --------------------------------------------------------

    buyConfirmModal.setAttribute(
        "aria-hidden",
        "false"
    );

    buyConfirmModal.classList.add(
        "open"
    );

    buyConfirmModal.classList.add(
        "active"
    );

    document.body.classList.add(
        "modal-open"
    );


    console.log(
        "BUY CONFIRMATION OPENED"
    );
}


// ============================================================
// CLOSE BUY CONFIRMATION
// ============================================================

function closeBuyConfirmation() {

    if (!buyConfirmModal) {
        return;
    }


    buyConfirmModal.classList.remove(
        "open"
    );

    buyConfirmModal.classList.remove(
        "active"
    );

    buyConfirmModal.classList.remove(
        "closing"
    );


    buyConfirmModal.setAttribute(
        "aria-hidden",
        "true"
    );


    // Block the invisible modal
    buyConfirmModal.style.pointerEvents =
        "none";


    // Only unlock the page if there
    // are no other open modals
    const anotherModalIsOpen =
        document.querySelector(
            ".modal.open, .modal.active"
        );


    if (!anotherModalIsOpen) {

        document.body.classList.remove(
            "modal-open"
        );

    }
}

if (buyConfirmNo) {

    buyConfirmNo.onclick = function (event) {

        event.preventDefault();
        event.stopPropagation();

        currentCheckoutProduct = null;

        closeBuyConfirmation();

        return false;
    };
}


if (buyConfirmModal) {

    buyConfirmModal
        .querySelectorAll("[data-close-buy-confirm]")
        .forEach(element => {

            element.onclick = function (event) {

                event.preventDefault();
                event.stopPropagation();

                currentCheckoutProduct = null;

                closeBuyConfirmation();

                return false;
            };
        });
}


if (buyConfirmYes) {

    buyConfirmYes.onclick = function (event) {

        event.preventDefault();
        event.stopPropagation();

        const product = currentCheckoutProduct;

        if (!product) {
            return;
        }

        closeBuyConfirmation();

        // Open the address/checkout step
        beginCheckout(product);

        return false;
    };
}



// ============================================================
// START HERO VIDEO LOADING
// ============================================================

loadHeroShowcaseVideos();

initializeStore();