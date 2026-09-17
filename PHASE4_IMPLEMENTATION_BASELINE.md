# KDW — Phase 4 Implementation Baseline

**Date**: 2026-09-01  
**Project**: Kanishk Digital World (KDW)  
**Scope**: Admin Portal Control Plane, Product Management, Bundles, Orders, Coupons, Analytics KPIs, Inventory Stock Management, Immutable Audit Logs, and Platform Settings.

---

## 1. Executive Summary & Administrative Architecture

Phase 4 completes the full-stack administrative command and control center for the KDW platform.

### Core Architecture Principles:
- **Zero Schema Changes**: Utilizes the 139 existing Prisma models without modifying relations, fields, or adding migrations.
- **Strict Backend RBAC Authority**: All administrative mutations (`POST`, `PUT`, `PATCH`, `DELETE`) are guarded at the HTTP middleware layer with `authenticate` + `authorize('ADMIN', 'SUPER_ADMIN')`.
- **Frontend Route Protection**: `AdminRoute.tsx` strictly guards `/admin/*` routes checking `user.role` from `AuthContext`, handling loading states, redirection to `/admin/login`, and rendering a styled 403 Forbidden page for unauthorized customer accounts.
- **Zero Mock / Fake Admin Data**: All metrics, charts, tables, orders, products, coupons, inventory, and audit logs originate dynamically from the PostgreSQL database.
- **Credential Protection**: Gateway API secrets (`razorpay_key_secret`) and webhook signatures are masked server-side (`••••••••••••••••`) before transmission to the browser.

---

## 2. Model & Database Mapping

| Domain Entity | Prisma Model | Key Fields & Security Boundaries | Status |
| :--- | :--- | :--- | :---: |
| **Analytics & Orders** | `Order`, `OrderItem`, `Payment` | `id`, `orderNumber`, `customerId`, `guestEmail`, `totalAmount`, `subtotal`, `taxTotal`, `discountTotal`, `currency`, `paymentStatus`, `orderStatus`, `razorpayPaymentId`, `createdAt` | **CONNECTED** |
| **Products** | `Product`, `Category` | `id`, `name`, `slug`, `description`, `price`, `discountPrice`, `sku`, `stock`, `minStock`, `status` (`DRAFT`, `ACTIVE`, `ARCHIVED`), `categoryId`, `thumbnail`, `previewImages`, `googleDriveLinks`, `licenceKeyRequired` | **CONNECTED** |
| **Bundles** | `Bundle`, `BundleItem` | `id`, `title`, `slug`, `description`, `price`, `originalPrice`, `discountPercent`, `coverImage`, `status`, `sku`, `stock`, `minStock` | **CONNECTED** |
| **Coupons** | `Coupon`, `CouponRedemption` | `id`, `code`, `internalName`, `discountType`, `discountValue`, `minOrderValue`, `totalUsageLimit`, `usedCount`, `perCustomerLimit`, `status` (`ACTIVE`, `DISABLED`, `EXPIRED`) | **CONNECTED** |
| **Inventory** | `Product`, `Bundle` | `sku`, `stock` (`null` = Unlimited), `minStock`, stock alert calculations (`UNLIMITED`, `IN_STOCK`, `LOW_STOCK`, `OUT_OF_STOCK`) | **CONNECTED** |
| **Audit Logs** | `AuditLog` | `id`, `adminId`, `action`, `entity`, `details` (JSON with IP, userAgent, changes), `timestamp` | **CONNECTED** |
| **Support Helpdesk** | `SupportTicket`, `SupportMessage` | `id`, `ticketNumber`, `customerEmail`, `customerName`, `priority`, `status`, `subject`, `messages` | **CONNECTED** |
| **Site Settings** | `SiteSettings` | `id: 'DEFAULT'`, `companyName`, `supportEmail`, `phone`, `socialLinks` (JSON configuration, masked credentials) | **CONNECTED** |

---

## 3. Backend Route Mapping & Contracts

| Module | Route / Endpoint | HTTP | Auth Requirement | Controller Function | Description |
| :--- | :--- | :---: | :---: | :--- | :--- |
| **Dashboard** | `/api/analytics/dashboard` | `GET` | Admin / Staff | `getDashboardAnalytics` | Financial KPIs, revenue growth, order volume |
| **Dashboard** | `/api/analytics/revenue-chart` | `GET` | Admin / Staff | `getRevenueChart` | Revenue time-series for 7d, 30d, 90d, 1y |
| **Dashboard** | `/api/analytics/top-products` | `GET` | Admin / Staff | `getTopProducts` | Top-selling products and bundles |
| **Products** | `/api/products` | `GET`, `POST` | Public / Admin | `productController.ts` | Product catalog query & administrative creation |
| **Products** | `/api/products/:id` | `GET`, `PUT`, `DELETE`| Public / Admin | `productController.ts` | Product detail, modification, status & archiving |
| **Uploads** | `/api/upload` | `POST` | Admin / Staff | `uploadRoutes.ts` | Multipart upload for product thumbnails & ZIPs |
| **Bundles** | `/api/bundles` | `GET`, `POST` | Public / Admin | `bundleController.ts` | Bundle collection listing & creation |
| **Bundles** | `/api/bundles/:id` | `GET`, `PUT`, `DELETE`| Public / Admin | `bundleController.ts` | Bundle update, pricing & discount management |
| **Orders** | `/api/orders` / `/api/admin/orders` | `GET` | Bearer Admin | `getAdminOrders` | Order listing, search, date range, pagination |
| **Orders** | `/api/orders/:id` | `GET` | Bearer Admin | `getAdminOrderById` | Detailed order inspector with fulfillment metadata |
| **Orders** | `/api/orders/:id/refund` | `POST` | Bearer Admin | `processOrderRefund` | Validates & records order refunds |
| **Orders** | `/api/orders/:id/retry-fulfilment`| `POST` | Bearer Admin | `retryOrderFulfilment` | Re-triggers digital token & license generation |
| **Orders** | `/api/orders/:id/reset-downloads` | `POST` | Bearer Admin | `resetOrderDownloads` | Resets customer download counter |
| **Coupons** | `/api/coupons/admin` | `GET`, `POST` | Bearer Admin | `couponController.ts` | Coupon listing & creation |
| **Coupons** | `/api/coupons/admin/:id/status` | `PATCH` | Bearer Admin | `updateCouponStatus` | Toggles coupon `ACTIVE` / `DISABLED` |
| **Inventory** | `/api/inventory` | `GET` | Bearer Admin | `getInventoryList` | Full stock availability & low-stock alerts |
| **Inventory** | `/api/inventory/:type/:id` | `PATCH` | Bearer Admin | `updateInventory` | Updates SKU, stock count, and alert thresholds |
| **Audit Logs** | `/api/admin/audit-logs` | `GET` | Bearer Admin | `getAdminAuditLogs` | Immutable audit log history & search |
| **Settings** | `/api/admin/settings` | `GET`, `PUT` | Bearer Admin | `adminController.ts` | Platform configuration & masked credentials |
| **Settings** | `/api/settings/general` | `GET`, `PATCH`| Bearer Admin | `generalSettingsController.ts`| Maintenance mode & site metadata |
| **Support** | `/api/support/tickets` | `GET` | Bearer Admin | `supportTicketController.ts` | All customer support tickets & status filters |
| **Support** | `/api/support/tickets/:id/reply` | `POST` | Bearer Admin | `supportTicketController.ts` | Appends staff reply to ticket conversation |

---

## 4. Frontend Component & View Mapping

- `AdminRoute.tsx`: Route guard enforcing `user.role === 'ADMIN' | 'SUPER_ADMIN'` with automatic session verification and 403 screen.
- `AdminLayout.tsx` & `Sidebar.tsx`: Administrative layout featuring collapsible navigation, active state indicators, and responsive mobile drawer.
- `AdminDashboard.tsx`: High-level operations overview with financial KPIs, interactive revenue charts (7d, 30d, 90d, 1y), and top-selling assets.
- `AdminProducts.tsx` & `AdminProductForm.tsx`: Product catalog management with multi-criteria search, category filters, image/ZIP upload, and status lifecycle.
- `AdminBundles.tsx` & `AdminBundleForm.tsx`: Bundle builder with product item selector, discount percentage calculations, and cover art management.
- `AdminOrders.tsx` & `AdminOrderDetailModal.tsx`: Order management table with server-side pagination, date range filtering, and order inspector modal for access control and refunds.
- `AdminCoupons.tsx`: Coupon code creator with percentage/fixed discount rules, usage limits, and 1-click status activation/deactivation.
- `AdminInventory.tsx`: Real-time inventory table with stock status badges (`Unlimited`, `In Stock`, `Low Stock`, `Out of Stock`) and in-place inline editing.
- `AdminAuditLogs.tsx`: Read-only immutable security audit log viewer with live search across actions, entities, and admin emails.
- `AdminSettings.tsx` & `AdminGeneralSettings.tsx`: Platform configuration workspace with maintenance mode toggles and payment gateway status.
