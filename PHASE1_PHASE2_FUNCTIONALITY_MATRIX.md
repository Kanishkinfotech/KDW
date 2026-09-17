# KDW — Phase 1 & Phase 2 Functionality & Verification Matrix

**Date**: 2026-09-01  
**Project**: Kanishk Digital World (KDW)  
**Scope**: Phase 1 (Storefront, Auth, Catalog, Cart, Wishlist, Routing) + Phase 2 (Checkout, Payments, Orders, Fulfillment, Licenses, Downloads, Invoices, Account Hub)

---

## 1. Full Master Functionality Matrix

| Module | Option | Sub-option | Route | Component | API Endpoint | Method | Auth | Persistence | Status |
| :--- | :--- | :--- | :--- | :--- | :--- | :---: | :---: | :---: | :--- |
| **Auth** | Customer Register | Sign Up Form | `/register` | `Register.tsx` | `/api/auth/register` | `POST` | Public | `localStorage` | **COMPLETE** |
| **Auth** | Customer Login | Email / Password | `/login` | `Login.tsx` | `/api/auth/login` | `POST` | Public | `localStorage` | **COMPLETE** |
| **Auth** | Session Boot | Startup Verify | `*` | `AuthContext.tsx` | `/api/auth/me` | `GET` | Bearer | Memory / LS | **COMPLETE** |
| **Auth** | Logout | Clear Credentials | `*` | `Header.tsx` | `/api/auth/logout` | `POST` | Bearer | Clean LS | **COMPLETE** |
| **Auth** | Open Redirect Defense | Query Sanitizer | `/login` | `Login.tsx` | N/A | N/A | Public | None | **COMPLETE** |
| **Auth** | Protected Routes | Route Guard | `/account/*` | `ProtectedRoute.tsx` | `/api/auth/me` | `GET` | Bearer | Safe Query | **COMPLETE** |
| **Storefront** | Marketplace Landing | Hero & Collections | `/` | `Home.tsx` | `/api/products` | `GET` | Public | None | **COMPLETE** |
| **Catalog** | Catalog Hub | Grid Listing | `/shop` | `Shop.tsx` | `/api/products` | `GET` | Public | None | **COMPLETE** |
| **Catalog** | Debounced Search | Keystroke Debounce | `/shop?search=` | `Shop.tsx` | `/api/products` | `GET` | Public | URL Query | **COMPLETE** |
| **Catalog** | Category Filter | Hierarchy Selection | `/shop?category=` | `Shop.tsx` | `/api/products` | `GET` | Public | URL Query | **COMPLETE** |
| **Catalog** | Price Bounds | Min / Max Bounds | `/shop?minPrice=` | `Shop.tsx` | `/api/products` | `GET` | Public | URL Query | **COMPLETE** |
| **Catalog** | Sorting | Multi-field Sort | `/shop?sort=` | `Shop.tsx` | `/api/products` | `GET` | Public | URL Query | **COMPLETE** |
| **Catalog** | URL Sync | Back/Forward/Refresh | `/shop` | `Shop.tsx` | `/api/products` | `GET` | Public | URL State | **COMPLETE** |
| **Catalog** | Empty & Error States | Clear & Retry | `/shop` | `Shop.tsx` | `/api/products` | `GET` | Public | None | **COMPLETE** |
| **Product** | Product Details | Specs & Assets | `/product/:id` | `ProductDetails.tsx`| `/api/products/:id`| `GET` | Public | None | **COMPLETE** |
| **Product** | Image Switcher | Gallery Click | `/product/:id` | `ProductDetails.tsx`| N/A | N/A | Public | None | **COMPLETE** |
| **Product** | Customer Reviews | Submission & List | `/product/:id` | `ProductReviews.tsx`| `/api/reviews` | `GET`/`POST` | Auth/Public | DB | **COMPLETE** |
| **Cart** | Add to Cart | Digital Normalize (1) | `*` | `ProductCard.tsx` | N/A | N/A | Public | `localStorage` | **COMPLETE** |
| **Cart** | Duplicate Prevent | Single Unit Check | `*` | `CartContext.tsx` | N/A | N/A | Public | `localStorage` | **COMPLETE** |
| **Cart** | Subtotal Calculation | Dynamic Sum | `/cart` | `Cart.tsx` | N/A | N/A | Public | `localStorage` | **COMPLETE** |
| **Cart** | Cart Drawer | Slide-over UI | `*` | `CartDrawer.tsx` | N/A | N/A | Public | `localStorage` | **COMPLETE** |
| **Cart** | Cross-Tab Sync | Browser Storage Event | `*` | `CartContext.tsx` | N/A | N/A | Public | `localStorage` | **COMPLETE** |
| **Wishlist** | Guest Wishlist | Heart Toggle | `*` | `ProductCard.tsx` | N/A | N/A | Public | `localStorage` | **COMPLETE** |
| **Wishlist** | Wishlist Drawer & Page | Listing & Cart Move | `/wishlist` | `Wishlist.tsx` | N/A | N/A | Public | `localStorage` | **COMPLETE** |
| **Checkout** | Empty Cart Guard | Auto Redirect | `/checkout` | `CheckoutPage.tsx` | N/A | N/A | Public | None | **COMPLETE** |
| **Checkout** | Customer Prefill | Account Details | `/checkout` | `CheckoutPage.tsx` | `/api/auth/me` | `GET` | Auth/Guest | Form State | **COMPLETE** |
| **Checkout** | Coupon Validation | Server Rule Check | `/checkout` | `CheckoutPage.tsx` | `/api/coupons/validate` | `POST` | Public | None | **COMPLETE** |
| **Checkout** | Server Pricing | DB Authoritative | `/checkout` | `CheckoutPage.tsx` | `/api/payments/create-order` | `POST` | Public/Auth | Database | **COMPLETE** |
| **Payment** | Razorpay SDK | Dynamic Loader | `/checkout` | `CheckoutPage.tsx` | Checkout.js Script | `GET` | Gateway | None | **COMPLETE** |
| **Payment** | Gateway Trigger | UPI/Cards/Netbanking | `/checkout` | `CheckoutPage.tsx` | `/api/payments/create-order` | `POST` | Public/Auth | Gateway Order | **COMPLETE** |
| **Payment** | Dismissal & Failure | Cart Preserved | `/checkout` | `CheckoutPage.tsx` | N/A | N/A | Public/Auth | Cart Intact | **COMPLETE** |
| **Payment** | Cryptographic Verify | HMAC SHA-256 | `/checkout` | `CheckoutPage.tsx` | `/api/payments/verify-payment` | `POST` | Public/Auth | Database | **COMPLETE** |
| **Fulfillment**| Atomic Entitlement | Licenses & Purchases | Server | `orderFulfilmentService`| DB Transaction | `INTERNAL`| Server | Database | **COMPLETE** |
| **Success** | Order Confirmation | Entitlement Card | `/payment-success/:id`| `PaymentSuccess.tsx`| `/api/orders/:id` | `GET` | Public/Auth | DB Order | **COMPLETE** |
| **Account** | Customer Library | Owned Products | `/account/library` | `Dashboard.tsx` | `/api/purchases` | `GET` | Bearer | DB | **COMPLETE** |
| **Account** | Orders History | List & Status | `/account/orders` | `Dashboard.tsx` | `/api/purchases/invoices` | `GET` | Bearer | DB | **COMPLETE** |
| **Account** | PDF Invoice Download | PDFKit Streaming | `/account/orders` | `Dashboard.tsx` | `/api/purchases/invoices/:id/download` | `GET` | Bearer | PDF Stream | **COMPLETE** |
| **Account** | Secure Downloads | 1-Hour Single Token | `/account/downloads` | `Dashboard.tsx` | `/api/purchases/:id/download-token` | `GET` | Bearer | Token Link | **COMPLETE** |
| **Account** | Licenses & Copy Key | Commercial Licenses | `/account/licenses` | `Dashboard.tsx` | `/api/purchases` | `GET` | Bearer | Clipboard | **COMPLETE** |
| **Account** | Contact Support | Ticket Submission | `/account/support` | `Dashboard.tsx` | `/api/support/my-tickets` | `GET` | Bearer | DB | **COMPLETE** |

---

## 2. Option-by-Option Deep Verification Audit

### 1. Checkout & Payment Option
1. **Where is the UI?** [`CheckoutPage.tsx`](file:///c:/Users/vishw/OneDrive/Desktop/kwd/front%20end/src/pages/CheckoutPage.tsx).
2. **What happens on interaction?** User submits delivery contact form (Name, Email, Mobile).
3. **Which function executes?** `handleProceedToPayment(e)`.
4. **Which service is called?** `paymentsApi.createOrder`.
5. **Which backend API is called?** `POST /api/payments/create-order`.
6. **What request is sent?** `{ items, customerId, guestEmail, guestName, guestMobile, couponCode, notes }`.
7. **What response is expected?** `{ success: true, data: { orderId, orderNumber, razorpayOrderId, amount, currency, paymentMode } }`.
8. **How is state updated?** Opens Razorpay modal configured with backend order ID.
9. **Is persistence required?** Order is created in PostgreSQL (`PENDING_PAYMENT`).
10. **What happens on payment success?** Razorpay returns `{ razorpay_order_id, razorpay_payment_id, razorpay_signature }`. Frontend calls `paymentsApi.verifyPayment(payload)`.
11. **What happens on server verification?** Server executes HMAC SHA-256 check, confirms payment, updates status to `PAID`, triggers `OrderFulfilmentService`, and returns `{ success: true }`. Frontend clears cart and navigates to `/payment-success/:orderId`.
12. **What happens on failure or dismissal?** Modal closes, cart is **NOT** cleared, error banner is displayed with retry option.
13. **What test covers it?** `server/src/tests/phase1_phase2_e2e.test.ts` (Tests 11, 12).

### 2. Secure Tokenized Download Option
1. **Where is the UI?** Downloads tab in [`Dashboard.tsx`](file:///c:/Users/vishw/OneDrive/Desktop/kwd/front%20end/src/pages/Dashboard.tsx).
2. **What happens on click?** `handleDownload(productId)` runs.
3. **Which API is called?** `GET /api/purchases/:productId/download-token` with Bearer auth.
4. **What response is received?** `{ success: true, data: { downloadUrl: "/api/purchases/download/<token>?productId=..." } }`.
5. **How is the file streamed?** Browser requests `/api/purchases/download/<token>`. Server verifies customer ownership, ensures order is `PAID`, marks token as `USED`, increments `downloadCount`, logs entry in `DownloadLog`, and streams digital archive.
6. **What test covers it?** `server/src/tests/phase1_phase2_e2e.test.ts` (Test 13).

### 3. PDF Invoice Generation Option
1. **Where is the UI?** Orders tab in [`Dashboard.tsx`](file:///c:/Users/vishw/OneDrive/Desktop/kwd/front%20end/src/pages/Dashboard.tsx).
2. **What happens on click?** `handleDownloadInvoice(orderId)` opens `/api/purchases/invoices/:orderId/download`.
3. **What backend logic executes?** Server queries `Order` where `id = orderId` and `customerId = user.id`, creates `new PDFDocument()`, populates customer info, order number, line items, total amount, and pipes binary stream (`application/pdf`) to client.
4. **What test covers it?** `server/src/tests/phase1_phase2_e2e.test.ts` (Test 14).

### 4. License Management & Clipboard Option
1. **Where is the UI?** Licenses tab in [`Dashboard.tsx`](file:///c:/Users/vishw/OneDrive/Desktop/kwd/front%20end/src/pages/Dashboard.tsx).
2. **What happens on click?** "Copy Key" button generates sanitized alphanumeric commercial license key and copies to clipboard via `navigator.clipboard.writeText(...)`.
3. **User feedback?** Immediate toast notification (`License key copied to clipboard!`).
4. **What test covers it?** `server/src/tests/phase1_phase2_e2e.test.ts` (Test 15).
