// ============================================================
// MOBILE STORE — ADMIN DASHBOARD
// ============================================================

import {
    db,
    doc,
    setDoc,
    getDoc,
    updateDoc,
    deleteDoc,
    collection,
    addDoc,
    query,
    orderBy,
    onSnapshot,
    serverTimestamp,
    increment
} from "./firebase.js";


// ============================================================
// RAILWAY UPLOAD SERVER
// ============================================================

const RAILWAY_UPLOAD_URL =
    "https://mobilestorecom-production.up.railway.app/upload";


// ============================================================
// ELEMENTS
// ============================================================

const productForm =
    document.getElementById("productForm");

const productImages =
    document.getElementById("productImages");

const imageFileNames =
    document.getElementById("imageFileNames");

const uploadProductButton =
    document.getElementById("uploadProductButton");

const uploadStatus =
    document.getElementById("uploadStatus");

const adminProductsList =
    document.getElementById("adminProductsList");

const adminOrdersList =
    document.getElementById("adminOrdersList");

const totalVisitors =
    document.getElementById("totalVisitors");

const todayVisitors =
    document.getElementById("todayVisitors");

const todaySales =
    document.getElementById("todaySales");

const totalSales =
    document.getElementById("totalSales");


// ============================================================
// HELPERS
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
    const number = Number(value) || 0;

    return "₦" + number.toLocaleString("en-NG", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    });
}


function formatDate(timestamp) {
    if (!timestamp) {
        return "No date";
    }

    try {
        const date = timestamp.toDate
            ? timestamp.toDate()
            : new Date(timestamp);

        return date.toLocaleString("en-NG", {
            dateStyle: "medium",
            timeStyle: "short"
        });

    } catch (error) {
        return "No date";
    }
}


function showStatus(message, type = "") {
    if (!uploadStatus) {
        return;
    }

    uploadStatus.textContent = message;

    uploadStatus.className = "upload-status";

    if (type) {
        uploadStatus.classList.add(type);
    }

    uploadStatus.classList.add("show");
}


function setButtonLoading(loading) {
    if (!uploadProductButton) {
        return;
    }

    uploadProductButton.disabled = loading;

    uploadProductButton.textContent =
        loading
            ? "Uploading Product..."
            : "Upload Product";
}


// ============================================================
// PRODUCT IMAGE SELECTION — 4 IMAGES
// ============================================================

let selectedProductImages = [];


// ============================================================
// DISPLAY SELECTED IMAGES
// ============================================================

function displaySelectedFiles() {

    if (!imageFileNames) {
        return;
    }

    const count =
        selectedProductImages.length;


    if (!count) {

        imageFileNames.innerHTML = `
            <div class="selected-files-count">
                0/4 images selected
            </div>
        `;

        return;
    }


    imageFileNames.innerHTML = `

        <div class="selected-files-count">
            ${count}/4 images selected
        </div>

        ${selectedProductImages.map(
            (file, index) => {

                const sizeMB =
                    (
                        file.size /
                        (1024 * 1024)
                    ).toFixed(2);


                return `
                    <div class="selected-file">

                        <span>
                            ${index + 1}/4 —
                            ${escapeHTML(file.name)}
                        </span>

                        <small>
                            ${sizeMB} MB
                        </small>

                    </div>
                `;

            }
        ).join("")}


        ${
            count >= 4
                ? `
                    <div class="selected-files-ready">
                        ✓ 4/4 images ready — Click Upload Product
                    </div>
                `
                : `
                    <div class="selected-files-next">
                        Select ${4 - count}
                        more image${4 - count === 1 ? "" : "s"}
                    </div>
                `
        }

    `;
}


// ============================================================
// ADD IMAGES WITHOUT REPLACING PREVIOUS SELECTION
// ============================================================

if (productImages) {

    productImages.addEventListener(
        "change",
        event => {

            const files =
                Array.from(
                    event.target.files || []
                );


            for (const file of files) {

                // Stop at 4 images
                if (
                    selectedProductImages.length >= 4
                ) {
                    break;
                }


                // Prevent duplicate files
                const duplicate =
                    selectedProductImages.some(
                        existingFile =>
                            existingFile.name === file.name &&
                            existingFile.size === file.size &&
                            existingFile.lastModified === file.lastModified
                    );


                if (!duplicate) {

                    selectedProductImages.push(
                        file
                    );

                }

            }


            displaySelectedFiles();


            // Clear the native input.
            // This allows the user to open the
            // file picker again and add another image.
            productImages.value = "";

        }
    );
}


if (productImages) {
    productImages.addEventListener(
        "change",
        () => {
            displaySelectedFiles(
                productImages,
                imageFileNames
            );
        }
    );
}


// ============================================================
// RAILWAY IMAGE UPLOAD
// ============================================================

async function uploadFileToRailway(file) {

    if (!file) {
        throw new Error("Invalid image file.");
    }

    const formData =
        new FormData();

    formData.append(
        "file",
        file,
        file.name
    );

    showStatus(
        `Sending ${file.name} to upload server...`,
        "loading"
    );

    let response;

    try {

        response = await fetch(
            RAILWAY_UPLOAD_URL,
            {
                method: "POST",
                body: formData
            }
        );

    } catch (error) {

        console.error(
            "Railway connection error:",
            error
        );

        throw new Error(
            "Could not connect to the Railway upload server."
        );
    }


    let data;

    try {

        data =
            await response.json();

    } catch (error) {

        throw new Error(
            `Railway returned an invalid response (${response.status}).`
        );
    }


    console.log(
        "Railway response:",
        data
    );


    if (!response.ok) {

        throw new Error(
            data?.error ||
            `Railway image upload failed (${response.status}).`
        );
    }


    if (
        !data ||
        data.success !== true ||
        !data.url
    ) {

        throw new Error(
            data?.error ||
            "Railway did not return a valid image URL."
        );
    }


    // --------------------------------------------------------
    // FORCE HTTPS
    // --------------------------------------------------------

    let imageURL =
        String(data.url).trim();

    if (imageURL.startsWith("http://")) {
        imageURL =
            "https://" +
            imageURL.substring(7);
    }


    if (
        !imageURL.startsWith("https://")
    ) {

        throw new Error(
            "Railway returned an invalid image URL."
        );
    }


    console.log(
        "Final image URL:",
        imageURL
    );


    return imageURL;
}


// ============================================================
// UPLOAD MULTIPLE IMAGES
// ============================================================

async function uploadImages(files) {

    const urls = [];

    const total =
        files.length;

    for (
        let index = 0;
        index < total;
        index++
    ) {

        showStatus(
            `Uploading image ${index + 1} of ${total}...`,
            "loading"
        );

        const url =
            await uploadFileToRailway(
                files[index]
            );

        urls.push(url);

        console.log(
            `Image ${index + 1}/${total}:`,
            url
        );
    }

    return urls;
}


// ============================================================
// CREATE PRODUCT
// ============================================================

async function createProduct() {

    const categoryElement =
        document.getElementById("productCategory");

    const nameElement =
        document.getElementById("productName");

    const priceElement =
        document.getElementById("productPrice");

    const madeInElement =
        document.getElementById("productMadeIn");

    const conditionElement =
        document.getElementById("productCondition");

    const storageElement =
        document.getElementById("productStorage");

    const modelElement =
        document.getElementById("productModel");

    const usedInElement =
        document.getElementById("productUsedIn");


    if (
        !categoryElement ||
        !nameElement ||
        !priceElement ||
        !madeInElement ||
        !conditionElement ||
        !storageElement ||
        !modelElement ||
        !usedInElement
    ) {
        throw new Error(
            "Product form fields could not be found."
        );
    }


    const category =
        categoryElement.value.trim();

    const name =
        nameElement.value.trim();

    const price =
        Number(priceElement.value);

    const madeIn =
        madeInElement.value.trim();

    const condition =
        conditionElement.value.trim();

    const storage =
        storageElement.value.trim();

    const model =
        modelElement.value.trim();

    const usedIn =
        usedInElement.value.trim();


const images =
    [...selectedProductImages];


    // --------------------------------------------------------
    // VALIDATION
    // --------------------------------------------------------

    if (!category) {
        throw new Error(
            "Please select a product category."
        );
    }

    if (!name) {
        throw new Error(
            "Please enter the product name."
        );
    }

    if (
        !Number.isFinite(price) ||
        price < 0
    ) {
        throw new Error(
            "Please enter a valid product price."
        );
    }

if (!images.length) {
    throw new Error(
        "Please select at least 1 product image."
    );
}

    // --------------------------------------------------------
    // UPLOAD IMAGES
    // --------------------------------------------------------

    const imageURLs =
        await uploadImages(
            images
        );


    if (!imageURLs.length) {
        throw new Error(
            "No product images were uploaded."
        );
    }


    // --------------------------------------------------------
    // SAVE TO FIRESTORE
    // --------------------------------------------------------

    showStatus(
        "Saving product to Firebase...",
        "loading"
    );


    const productData = {

        category,

        name,

        price,

        madeIn,

        condition,

        storage,

        model,

        usedIn,

        images: imageURLs,

        imageCount:
            imageURLs.length,

        uploadStatus:
            "complete",

        createdAt:
            serverTimestamp(),

        updatedAt:
            serverTimestamp()
    };


    console.log(
        "Product being saved:",
        productData
    );


    const productRef =
        await addDoc(
            collection(
                db,
                "products"
            ),
            productData
        );


    console.log(
        "Product created:",
        productRef.id
    );


    return productRef.id;
}


// ============================================================
// PRODUCT FORM
// ============================================================

if (productForm) {

    productForm.addEventListener(
        "submit",
        async event => {

            event.preventDefault();

            console.log(
                "UPLOAD PRODUCT BUTTON CLICKED"
            );


            if (
                uploadProductButton &&
                uploadProductButton.disabled
            ) {
                return;
            }


            try {

                setButtonLoading(true);

                showStatus(
                    "Preparing product...",
                    "loading"
                );


                const productId =
                    await createProduct();


                console.log(
                    "UPLOAD COMPLETE:",
                    productId
                );


                productForm.reset();


productForm.reset();

selectedProductImages = [];

if (imageFileNames) {
    imageFileNames.innerHTML = `
        <div class="selected-files-count">
            0/4 images selected
        </div>
    `;
}


                showStatus(
                    "Product uploaded successfully.",
                    "success"
                );


            } catch (error) {

                console.error(
                    "Product upload error:",
                    error
                );


                showStatus(
                    error?.message ||
                    "Something went wrong while uploading the product.",
                    "error"
                );


            } finally {

                setButtonLoading(false);

            }

        }
    );

} else {

    console.error(
        "ERROR: productForm was not found."
    );
}


// ============================================================
// PRODUCT LISTENER
// ============================================================

function listenForProducts() {

    if (!adminProductsList) {
        return;
    }


    const productsQuery =
        query(
            collection(
                db,
                "products"
            ),
            orderBy(
                "createdAt",
                "desc"
            )
        );


    onSnapshot(
        productsQuery,

        snapshot => {

            if (snapshot.empty) {

                adminProductsList.innerHTML = `
                    <div class="empty-state">
                        <strong>
                            No products yet
                        </strong>

                        <span>
                            Uploaded products will appear here.
                        </span>
                    </div>
                `;

                return;
            }


            adminProductsList.innerHTML =
                snapshot.docs
                    .map(productDoc =>
                        renderAdminProduct(
                            productDoc.id,
                            productDoc.data()
                        )
                    )
                    .join("");


            attachProductActions();

        },

        error => {

            console.error(
                "Products listener error:",
                error
            );


            adminProductsList.innerHTML = `
                <div class="empty-state">
                    <strong>
                        Could not load products
                    </strong>

                    <span>
                        ${escapeHTML(error.message)}
                    </span>
                </div>
            `;

        }
    );
}


// ============================================================
// ADMIN PRODUCT CARD
// ============================================================

// ============================================================
// ADMIN PRODUCT CARD — DELETE ONLY
// ============================================================

function renderAdminProduct(id, product) {

    return `
        <article
            class="admin-product-card"
            data-product-id="${escapeHTML(id)}"
        >

            <button
                type="button"
                class="delete-product-button"
                data-product-id="${escapeHTML(id)}"
            >
                Delete Product
            </button>

        </article>
    `;
}


// ============================================================
// PRODUCT ACTIONS
// ============================================================

function attachProductActions() {

    document
        .querySelectorAll(
            ".delete-product-button"
        )
        .forEach(button => {

            button.addEventListener(
                "click",
                async () => {

                    const productId =
                        button.dataset.productId;


                    if (!productId) {
                        return;
                    }


                    const confirmed =
                        window.confirm(
                            "Delete this product from the store?"
                        );


                    if (!confirmed) {
                        return;
                    }


                    button.disabled = true;

                    button.textContent =
                        "Deleting...";


                    try {

                        await deleteDoc(
                            doc(
                                db,
                                "products",
                                productId
                            )
                        );


                    } catch (error) {

                        console.error(
                            "Delete product error:",
                            error
                        );


                        alert(
                            "Could not delete this product."
                        );


                        button.disabled = false;

                        button.textContent =
                            "Delete Product";
                    }

                }
            );

        });
}


// ============================================================
// ORDER LISTENER
// ============================================================

function listenForOrders() {

    if (!adminOrdersList) {
        return;
    }


    const ordersQuery =
        query(
            collection(
                db,
                "orders"
            ),
            orderBy(
                "createdAt",
                "desc"
            )
        );


    onSnapshot(
        ordersQuery,

        snapshot => {

            if (snapshot.empty) {

                adminOrdersList.innerHTML = `
                    <div class="empty-state">
                        <strong>
                            No order requests
                        </strong>

                        <span>
                            Customer requests will appear here.
                        </span>
                    </div>
                `;

                return;
            }


            adminOrdersList.innerHTML =
                snapshot.docs
                    .map(orderDoc =>
                        renderOrder(
                            orderDoc.id,
                            orderDoc.data()
                        )
                    )
                    .join("");


            attachOrderActions();

        },

        error => {

            console.error(
                "Orders listener error:",
                error
            );


            adminOrdersList.innerHTML = `
                <div class="empty-state">
                    <strong>
                        Could not load orders
                    </strong>

                    <span>
                        ${escapeHTML(error.message)}
                    </span>
                </div>
            `;

        }
    );
}


function renderOrder(id, order) {

    const product = order.product || {};
    const customer = order.customer || {};

    const status =
        String(order.status || "pending").toLowerCase();

    const productName = escapeHTML(
        order.productName ||
        product.name ||
        "Product"
    );

    const productCategory = escapeHTML(
        order.productCategory ||
        product.category ||
        "Not specified"
    );

    const productModel = escapeHTML(
        order.productModel ||
        product.model ||
        "Not specified"
    );

    const productStorage = escapeHTML(
        order.productStorage ||
        product.storage ||
        "Not specified"
    );

    const productCondition = escapeHTML(
        order.productCondition ||
        product.condition ||
        "Not specified"
    );

    const productMadeIn = escapeHTML(
        order.productMadeIn ||
        product.madeIn ||
        "Not specified"
    );

    const productUsedIn = escapeHTML(
        order.productUsedIn ||
        product.usedIn ||
        "Not specified"
    );

    const productImage = escapeHTML(
        order.productImage ||
        (
            Array.isArray(product.images)
                ? product.images[0] || ""
                : ""
        )
    );

    const customerName = escapeHTML(
        order.name ||
        customer.name ||
        "Not provided"
    );

    const phone = escapeHTML(
        order.phone ||
        customer.phone ||
        "Not provided"
    );

    const state = escapeHTML(
        order.state ||
        customer.state ||
        "Not provided"
    );

    const city = escapeHTML(
        order.city ||
        customer.city ||
        "Not provided"
    );

    const area = escapeHTML(
        order.area ||
        customer.area ||
        "Not provided"
    );

    const address = escapeHTML(
        order.address ||
        customer.address ||
        "Not provided"
    );

    const deviceId = escapeHTML(
        order.deviceId ||
        customer.deviceId ||
        "Not provided"
    );

    const price =
        Number(order.price || product.price || 0);

    const advancePay =
        Number(order.advancePay || 0);

    const remainingAmount =
        order.remainingAmount !== undefined
            ? Number(order.remainingAmount) || 0
            : Math.max(price - advancePay, 0);

    const submittedDate =
        escapeHTML(formatDate(order.createdAt));


    return `
        <article
            class="order-item"
            data-order-id="${escapeHTML(id)}"
        >

            <!-- HEADER -->
            <div class="order-top">

                <div class="order-top-left">

                    <span class="order-label">
                        ORDER REQUEST
                    </span>

                    <h3 class="order-title">
                        ${productName}
                    </h3>

                </div>

                <span class="order-status ${escapeHTML(status)}">
                    ${escapeHTML(status)}
                </span>

            </div>


            <!-- PRODUCT -->
            <div class="order-product">

                <div class="order-product-image">

                    ${
                        productImage
                            ? `
                                <img
                                    src="${productImage}"
                                    alt="${productName}"
                                    loading="lazy"
                                >
                            `
                            : `
                                <span>
                                    No Image
                                </span>
                            `
                    }

                </div>

                <div class="order-product-info">

                    <span class="order-product-category">
                        ${productCategory}
                    </span>

                    <strong>
                        ${productName}
                    </strong>

                    <span class="order-product-price">
                        ${formatMoney(price)}
                    </span>

                </div>

            </div>


            <!-- PRODUCT DETAILS -->
            <div class="order-details">

                <div class="order-detail">
                    <span>Model</span>
                    <strong>${productModel}</strong>
                </div>

                <div class="order-detail">
                    <span>Storage</span>
                    <strong>${productStorage}</strong>
                </div>

                <div class="order-detail">
                    <span>Condition</span>
                    <strong>${productCondition}</strong>
                </div>

                <div class="order-detail">
                    <span>Made In</span>
                    <strong>${productMadeIn}</strong>
                </div>

                <div class="order-detail">
                    <span>Used In</span>
                    <strong>${productUsedIn}</strong>
                </div>

            </div>


            <!-- CUSTOMER -->
            <section class="order-customer">

                <div class="order-section-title" Style="color: forestgreen";>
                    Customer Information
                </div>

                <div class="order-customer-grid">

                    <div class="order-customer-item">
                        <span>Full Name</span>
                        <strong>${customerName}</strong>
                    </div>

                    <div class="order-customer-item">
                        <span>Phone Number</span>
                        <strong>${phone}</strong>
                    </div>

                    <div class="order-customer-item full">
                        <span>Device ID</span>
                        <strong>${deviceId}</strong>
                    </div>

                </div>

            </section>


            <!-- DELIVERY -->
            <section class="order-delivery">

                <div class="order-delivery-title">
                    Delivery Information
                </div>

                <div class="order-customer-grid">

                    <div class="order-customer-item">
                        <span>State</span>
                        <strong>${state}</strong>
                    </div>

                    <div class="order-customer-item">
                        <span>City / Town</span>
                        <strong>${city}</strong>
                    </div>

                    <div class="order-customer-item">
                        <span>Area / Neighborhood</span>
                        <strong>${area}</strong>
                    </div>

                    <div class="order-customer-item full">
                        <span>Full Delivery Address</span>
                        <strong>${address}</strong>
                    </div>

                </div>

            </section>


            <!-- PAYMENT -->
            <section class="order-payment">

                <div class="order-payment-box">

                    <span>
                        Product Price
                    </span>

                    <strong>
                        ${formatMoney(price)}
                    </strong>

                </div>

                <div class="order-payment-box advance">

                    <span>
                        Advance Pay
                    </span>

                    <strong>
                        ${formatMoney(advancePay)}
                    </strong>

                </div>

                <div class="order-payment-box remaining">

                    <span>
                        Remaining
                    </span>

                    <strong>
                        ${formatMoney(remainingAmount)}
                    </strong>

                </div>

            </section>


            <!-- SUBMITTED -->
            <div class="order-submitted">

                <span>
                    Submitted
                </span>

                <strong>
                    ${submittedDate}
                </strong>

            </div>


            <!-- ACTIONS -->
            <div class="order-actions">

                ${
                    status === "pending"
                        ? `
                            <button
                                type="button"
                                class="order-action approve-button approve-order-button"
                                data-order-id="${escapeHTML(id)}"
                            >
                                Approve
                            </button>

                            <button
                                type="button"
                                class="order-action reject-button reject-order-button"
                                data-order-id="${escapeHTML(id)}"
                            >
                                Reject
                            </button>
                        `
                        : ""
                }

                <button
                    type="button"
                    class="order-action delete-order-button"
                    data-order-id="${escapeHTML(id)}"
                >
                    Delete
                </button>

            </div>

        </article>
    `;
}


// ============================================================
// ORDER ACTIONS
// ============================================================

function attachOrderActions() {

    document
        .querySelectorAll(
            ".approve-order-button"
        )
        .forEach(button => {

            button.addEventListener(
                "click",
                () =>
                    approveOrder(
                        button.dataset.orderId
                    )
            );

        });


    document
        .querySelectorAll(
            ".reject-order-button"
        )
        .forEach(button => {

            button.addEventListener(
                "click",
                () =>
                    rejectOrder(
                        button.dataset.orderId
                    )
            );

        });


    document
        .querySelectorAll(
            ".delete-order-button"
        )
        .forEach(button => {

            button.addEventListener(
                "click",
                () =>
                    deleteOrder(
                        button.dataset.orderId
                    )
            );

        });
}


// ============================================================
// APPROVE ORDER
// ============================================================

async function approveOrder(orderId) {

    if (!orderId) {
        return;
    }


    const confirmed =
        window.confirm(
            "Approve this order and record it as a sale?"
        );


    if (!confirmed) {
        return;
    }


    try {

        const orderRef =
            doc(
                db,
                "orders",
                orderId
            );


        const orderSnap =
            await getDoc(orderRef);


        if (!orderSnap.exists()) {

            alert(
                "This order no longer exists."
            );

            return;
        }


        const order =
            orderSnap.data();


        if (
            order.saleRecorded === true
        ) {

            await updateDoc(
                orderRef,
                {
                    status:
                        "approved",

                    approvedAt:
                        serverTimestamp()
                }
            );

            return;
        }


        const saleAmount =
            Number(
                order.price ||
                order.product?.price ||
                0
            );


        await updateDoc(
            orderRef,
            {
                status:
                    "approved",

                saleRecorded:
                    true,

                approvedAt:
                    serverTimestamp()
            }
        );


        const statsRef =
            doc(
                db,
                "stats",
                "store"
            );


        await setDoc(
            statsRef,
            {
                totalSales:
                    increment(
                        saleAmount
                    ),

                todaySales:
                    increment(
                        saleAmount
                    ),

                updatedAt:
                    serverTimestamp()

            },
            {
                merge: true
            }
        );


    } catch (error) {

        console.error(
            "Approve order error:",
            error
        );


        alert(
            "Could not approve this order."
        );

    }
}


// ============================================================
// REJECT ORDER
// ============================================================

async function rejectOrder(orderId) {

    if (!orderId) {
        return;
    }


    const confirmed =
        window.confirm(
            "Reject this order?"
        );


    if (!confirmed) {
        return;
    }


    try {

        await updateDoc(
            doc(
                db,
                "orders",
                orderId
            ),
            {
                status:
                    "rejected",

                rejectedAt:
                    serverTimestamp()
            }
        );


    } catch (error) {

        console.error(
            "Reject order error:",
            error
        );


        alert(
            "Could not reject this order."
        );

    }
}


// ============================================================
// DELETE ORDER
// ============================================================

async function deleteOrder(orderId) {

    if (!orderId) {
        return;
    }


    const confirmed =
        window.confirm(
            "Permanently delete this order?"
        );


    if (!confirmed) {
        return;
    }


    try {

        await deleteDoc(
            doc(
                db,
                "orders",
                orderId
            )
        );


    } catch (error) {

        console.error(
            "Delete order error:",
            error
        );


        alert(
            "Could not delete this order."
        );

    }
}


// ============================================================
// STORE STATISTICS
// ============================================================

function listenForStats() {

    const statsRef =
        doc(
            db,
            "stats",
            "store"
        );


    onSnapshot(
        statsRef,

        snapshot => {

            if (!snapshot.exists()) {

                updateStatsUI({
                    totalVisitors: 0,
                    todayVisitors: 0,
                    todaySales: 0,
                    totalSales: 0
                });

                return;
            }


            updateStatsUI(
                snapshot.data()
            );

        },

        error => {

            console.error(
                "Stats listener error:",
                error
            );

        }
    );
}


// ============================================================
// STATS UI
// ============================================================

function updateStatsUI(stats) {

    if (totalVisitors) {

        totalVisitors.textContent =
            Number(
                stats.totalVisitors || 0
            ).toLocaleString(
                "en-NG"
            );

    }


    if (todayVisitors) {

        todayVisitors.textContent =
            Number(
                stats.todayVisitors || 0
            ).toLocaleString(
                "en-NG"
            );

    }


    if (todaySales) {

        todaySales.textContent =
            formatMoney(
                stats.todaySales || 0
            );

    }


    if (totalSales) {

        totalSales.textContent =
            formatMoney(
                stats.totalSales || 0
            );

    }
}


// ============================================================
// INITIALIZE
// ============================================================

function initializeAdminDashboard() {

    console.log(
        "Mobile Store Admin Dashboard started."
    );

    listenForProducts();

    listenForOrders();

    listenForStats();
}

// ============================================================
// HERO SHOWCASE VIDEO UPLOADS
// ============================================================

const heroPhoneVideo =
    document.getElementById("heroPhoneVideo");

const heroLaptopVideo =
    document.getElementById("heroLaptopVideo");

const heroPhoneVideoName =
    document.getElementById("heroPhoneVideoName");

const heroLaptopVideoName =
    document.getElementById("heroLaptopVideoName");

const uploadHeroPhoneButton =
    document.getElementById("uploadHeroPhoneButton");

const uploadHeroLaptopButton =
    document.getElementById("uploadHeroLaptopButton");

const heroPhoneVideoStatus =
    document.getElementById("heroPhoneVideoStatus");

const heroLaptopVideoStatus =
    document.getElementById("heroLaptopVideoStatus");


function showHeroVideoStatus(
    element,
    message,
    type = ""
) {
    if (!element) {
        return;
    }

    element.textContent = message;

    element.className =
        "hero-video-status";

    if (type) {
        element.classList.add(type);
    }

    element.classList.add("show");
}


function displayHeroVideoName(
    input,
    container
) {
    if (!input || !container) {
        return;
    }

    const file =
        input.files?.[0];

    if (!file) {
        container.textContent = "";
        return;
    }

    const sizeMB =
        (
            file.size /
            (1024 * 1024)
        ).toFixed(2);

    container.textContent =
        `${file.name} • ${sizeMB} MB`;
}


if (heroPhoneVideo) {
    heroPhoneVideo.addEventListener(
        "change",
        () => {
            displayHeroVideoName(
                heroPhoneVideo,
                heroPhoneVideoName
            );
        }
    );
}


if (heroLaptopVideo) {
    heroLaptopVideo.addEventListener(
        "change",
        () => {
            displayHeroVideoName(
                heroLaptopVideo,
                heroLaptopVideoName
            );
        }
    );
}


async function uploadHeroVideo(
    file,
    type
) {
    if (!file) {
        throw new Error(
            "Please select a video first."
        );
    }

    if (!file.type.startsWith("video/")) {
        throw new Error(
            "Please select a valid video file."
        );
    }

    const formData =
        new FormData();

    formData.append(
        "file",
        file,
        file.name
    );

    const response =
        await fetch(
            RAILWAY_UPLOAD_URL,
            {
                method: "POST",
                body: formData
            }
        );

    let data;

    try {
        data =
            await response.json();
    } catch (error) {
        throw new Error(
            "Upload server returned an invalid response."
        );
    }

    if (!response.ok) {
        throw new Error(
            data?.error ||
            "Video upload failed."
        );
    }

    if (
        !data ||
        data.success !== true ||
        !data.url
    ) {
        throw new Error(
            data?.error ||
            "Upload server did not return a video URL."
        );
    }

    let videoURL =
        String(data.url).trim();

    if (
        videoURL.startsWith("http://")
    ) {
        videoURL =
            "https://" +
            videoURL.substring(7);
    }

    if (
        !videoURL.startsWith("https://")
    ) {
        throw new Error(
            "Upload server returned an invalid video URL."
        );
    }

    const settingsRef =
        doc(
            db,
            "settings",
            "hero"
        );

    await setDoc(
        settingsRef,
        {
            [type]: videoURL,
            updatedAt:
                serverTimestamp()
        },
        {
            merge: true
        }
    );

    return videoURL;
}


async function handleHeroVideoUpload(
    input,
    button,
    statusElement,
    type,
    label
) {
    const file =
        input?.files?.[0];

    if (!file) {
        showHeroVideoStatus(
            statusElement,
            `Please select the ${label} video first.`,
            "error"
        );

        return;
    }

    try {

        button.disabled = true;

        button.textContent =
            "Uploading...";

        showHeroVideoStatus(
            statusElement,
            `Uploading ${label} video...`,
            "loading"
        );

        await uploadHeroVideo(
            file,
            type
        );

        showHeroVideoStatus(
            statusElement,
            `${label} video uploaded successfully.`,
            "success"
        );

        button.textContent =
            "Video Uploaded";

    } catch (error) {

        console.error(
            `Hero ${label} video upload error:`,
            error
        );

        showHeroVideoStatus(
            statusElement,
            error?.message ||
            `Could not upload the ${label} video.`,
            "error"
        );

        button.textContent =
            `Upload ${label} Video`;

    } finally {

        button.disabled = false;
    }
}


if (uploadHeroPhoneButton) {
    uploadHeroPhoneButton.addEventListener(
        "click",
        () =>
            handleHeroVideoUpload(
                heroPhoneVideo,
                uploadHeroPhoneButton,
                heroPhoneVideoStatus,
                "phoneVideo",
                "Phone"
            )
    );
}


if (uploadHeroLaptopButton) {
    uploadHeroLaptopButton.addEventListener(
        "click",
        () =>
            handleHeroVideoUpload(
                heroLaptopVideo,
                uploadHeroLaptopButton,
                heroLaptopVideoStatus,
                "laptopVideo",
                "Laptop"
            )
    );
}

initializeAdminDashboard();
