# KDW — Phase 1 & Phase 2 Implementation Baseline

**Date**: 2026-09-01  
**Project**: Kanishk Digital World (KDW)  
**Scope**: Phase 1 (Storefront, Auth, Catalog, Cart, Wishlist, Routing) + Phase 2 (Checkout, Customer Details, Billing, Coupons, Razorpay, Verification, Orders, Fulfillment, Licenses, Downloads, Invoices, Customer Account Hub)

---

## 1. Executive Summary & Audit Baseline

A comprehensive end-to-end audit of all 139 database models, 31 backend route controllers, and all frontend components was executed. The database schema and route contracts were strictly preserved without breaking changes.

```text
USER ACTION
 ↓
STOREFRONT / CATALOG / SEARCH / FILTER
 ↓
PRODUCT DETAIL (Image Switcher / Specs / Reviews)
 ↓
WISHLIST / CART (Digital Quantity = 1 Normalization)
 ↓
CHECKOUT (/checkout)
 ↓
AUTHENTICATION / GUEST DETAILS
 ↓
COUPON VALIDATION (Server-Side)
 ↓
SERVER-AUTHORITATIVE ORDER (POST /api/payments/create-order)
 ↓
RAZORPAY GATEWAY (UPI / Cards / NetBanking / Wallets)
 ↓
SERVER CRYPTOGRAPHIC VERIFICATION (HMAC SHA-256)
 ↓
FULFILLMENT ENGINE (Digital Entitlements / Licenses / Google Drive Tokens / Email)
 ↓
PAYMENT SUCCESS CONFIRMATION (/payment-success/:orderId)
 ↓
CUSTOMER ACCOUNT DASHBOARD (/account)
 ├── My Library (/account/library)
 ├── Orders & Invoices (/account/orders + /api/purchases/invoices/:id/download)
 ├── Downloads (/account/downloads + /api/purchases/:id/download-token)
 ├── Licenses (/account/licenses + Copy Key)
 └── Support (/account/support)
```

---

## 2. Existing Database Models Mapped

| Category | Primary Models in `schema.prisma` | Role & Integrity |
| :--- | :--- | :--- |
| **Authentication & Users** | `User`, `StaffRole`, `CustomerConsent`, `DataPrivacyRequest` | User identity, RBAC (`SUPER_ADMIN`, `ADMIN`, `STAFF`, `CUSTOMER`), session tracking |
| **Customer Master** | `Customer`, `CustomerActivityLog`, `CustomerSegment` | Unified customer registry (Account + Guest) |
| **Catalog & Bundles** | `Product`, `Category`, `Bundle`, `BundleItem`, `ProductVersion`, `ProductFile` | Digital goods, versioning, hierarchy, pricing, and Google Drive links |
| **Orders & Payments** | `Order`, `OrderItem`, `OrderTimelineEvent`, `Payment`, `PaymentRefund` | Authoritative order persistence, timeline events, Razorpay settlement |
| **Offers & Coupons** | `Coupon`, `CouponRedemption`, `CouponAbuseLog`, `OfferRule` | Server-side validation, discount calculations, usage quotas |
| **Digital Fulfillment** | `DigitalEntitlement`, `LicenceKey`, `Purchase`, `AccessToken`, `DownloadToken`, `DownloadLog`, `DownloadFailure` | Idempotent entitlement provisioning, machine activations, secure 1-hour expiry tokens |
| **Invoices** | Direct PDF generation via `pdfkit` over `Order` data | Official downloadable PDF invoices (`INV-KDW-...`) |

---

## 3. Backend Route Contracts & API Mapping

| Route | Method | Payload / Params | Response | Auth / Role | Frontend Consumer |
| :--- | :---: | :--- | :--- | :---: | :--- |
| `/api/auth/register` | `POST` | `{ name, email, password, mobile? }` | `{ success: true, token, user }` | Public | `authApi.register` |
| `/api/auth/login` | `POST` | `{ email, password }` | `{ success: true, token, user }` | Public | `authApi.login` |
| `/api/auth/me` | `GET` | Bearer Token / Cookie | `{ success: true, user }` | Authenticated | `authApi.getMe` |
| `/api/auth/logout` | `POST` | Cookie Session | `{ success: true, message }` | Authenticated | `authApi.logout` |
| `/api/auth/profile` | `PUT` | `{ name, mobile }` | `{ success: true, user }` | Authenticated | `Dashboard.tsx` |
| `/api/products` | `GET` | `?category=&search=&minPrice=&maxPrice=&sort=&page=&limit=` | `{ success: true, data: Product[], total }` | Public | `productsApi.getProducts` |
| `/api/products/:id` | `GET` | UUID or Slug in URL | `{ success: true, data: ProductDetail }` | Public | `productsApi.getProductByIdOrSlug` |
| `/api/categories` | `GET` | None | `{ success: true, data: Category[] }` | Public | `productsApi.getCategories` |
| `/api/bundles` | `GET` | None | `{ success: true, data: Bundle[] }` | Public | `productsApi.getBundles` |
| `/api/coupons/validate` | `POST` | `{ code, cartTotal?, cartItems? }` | `{ success: true, data: { calculatedDiscount, ... } }` | Public | `couponsApi.validateCoupon` |
| `/api/payments/create-order` | `POST` | `{ items, customerId?, guestEmail, guestName, guestMobile, couponCode, notes }` | `{ success: true, data: { orderId, orderNumber, razorpayOrderId, amount, currency, paymentMode } }` | Public / Auth | `paymentsApi.createOrder` |
| `/api/payments/verify-payment`| `POST` | `{ razorpay_order_id, razorpay_payment_id, razorpay_signature }` | `{ success: true, message, payment }` | Public / Auth | `paymentsApi.verifyPayment` |
| `/api/orders/my-orders` | `GET` | Bearer Token | `{ success: true, data: Order[] }` | Authenticated | `ordersApi.getMyOrders` |
| `/api/orders/:id` | `GET` | UUID or Order Number | `{ success: true, data: OrderDetail }` | Public / Auth | `ordersApi.getOrderById` |
| `/api/purchases` | `GET` | Bearer Token | `{ success: true, purchases: Purchase[] }` | Authenticated | `purchasesApi.getPurchases` |
| `/api/purchases/invoices` | `GET` | Bearer Token | `{ success: true, invoices: Invoice[] }` | Authenticated | `purchasesApi.getInvoices` |
| `/api/purchases/invoices/:orderId/download` | `GET` | `orderId` in URL + Bearer Token | PDF Binary Stream (`application/pdf`) | Authenticated | `purchasesApi.getInvoiceDownloadUrl` |
| `/api/purchases/:productId/download-token` | `GET` | `productId` in URL + Bearer Token | `{ success: true, data: { downloadUrl } }` | Authenticated | `purchasesApi.generateDownloadToken` |
| `/api/purchases/download/:token` | `GET` | `token` in URL | ZIP Binary Stream (`application/zip`) | Token Auth | Browser Direct Stream |
| `/api/support/my-tickets` | `GET` | Bearer Token | `{ success: true, tickets: Ticket[] }` | Authenticated | `Dashboard.tsx` |

---

## 4. Frontend Route & Page Mapping

| Frontend Route | Component | Purpose & Features |
| :--- | :--- | :--- |
| `/` | `Home.tsx` | Storefront landing with hero banners, popular systems, and bundle showcases |
| `/shop` | `Shop.tsx` | Full URL-synchronized product catalog with debounced search, categories, price range, and sort filters |
| `/product/:id` | `ProductDetails.tsx` | Product detail hub with real database fields, image gallery switcher, deliverables checklist, specifications, reviews, Add to Cart, Wishlist, and Buy Now |
| `/cart` | `Cart.tsx` | Cart view with derived subtotal, digital item normalization, and checkout initiation |
| `/checkout` | `CheckoutPage.tsx` | End-to-end checkout with customer contact form, real-time coupon validation, server order calculation, Razorpay SDK modal, and cryptographic verification |
| `/payment-success/:orderId` | `PaymentSuccess.tsx` | Verified payment and entitlement confirmation with direct links to Customer Library |
| `/wishlist` | `Wishlist.tsx` | Saved products list with local persistence, cross-tab sync, and single-click cart transfer |
| `/login` | `Login.tsx` | Zod-validated authentication with open-redirect defense and session restoration |
| `/register` | `Register.tsx` | Customer onboarding with auto-login and safe routing |
| `/account` / `/dashboard` | `Dashboard.tsx` | Customer Account Hub with tabs for Library, Orders & Invoices, Downloads (secure tokenized links), Licenses (with key copy), and Support |

---

## 5. Security & Architectural Safeguards

1. **Server-Authoritative Pricing**: Frontend total amounts are strictly informational. Final amounts and coupon discounts are calculated directly from database records during `POST /api/payments/create-order`.
2. **Cryptographic Signature Verification**: Razorpay payment captures are verified server-side using HMAC SHA-256 matching `razorpay_order_id + "|" + razorpay_payment_id` against `RAZORPAY_KEY_SECRET`.
3. **Fulfillment Atomicity**: `OrderFulfilmentService` executes within a Prisma transaction to provision `DigitalEntitlement`, `LicenceKey`, `Purchase`, and `AccessToken` atomically upon verified payment.
4. **Time-Limited Secure Downloads**: Downloads use one-hour single-use tokens (`/api/purchases/:productId/download-token`) rather than exposing raw file URLs.
5. **No Fake Data or Responses**: Every screen is backed by real Prisma database operations and authentic API endpoints.
