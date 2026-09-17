# KDW — Phase 4 Functionality & Verification Matrix

**Date**: 2026-09-01  
**Project**: Kanishk Digital World (KDW)  
**Scope**: Admin Portal, Product Management, Bundles, Orders, Coupons, Analytics, Inventory, Audit Logs, Platform Settings.

---

## 1. Master Phase 4 Functionality Matrix

| Module | Option | Sub-option | Route | Component | API Endpoint | Method | Auth | Persistence | Status |
| :--- | :--- | :--- | :--- | :--- | :--- | :---: | :---: | :---: | :--- |
| **Auth** | Route Guard | Role RBAC | `/admin/*` | `AdminRoute.tsx` | `AuthContext` | `INTERNAL`| Admin | Session | **COMPLETE** |
| **Auth** | 403 Page | Forbidden Screen | `/admin/*` | `AdminRoute.tsx` | Client UI | `LOCAL` | Customer | Client State | **COMPLETE** |
| **Dashboard** | KPI Cards | Net Revenue & Orders | `/admin/dashboard` | `AdminDashboard.tsx` | `/api/analytics/dashboard` | `GET` | Bearer Admin | Database | **COMPLETE** |
| **Dashboard** | Sales Chart | 7d, 30d, 90d, 1y | `/admin/dashboard` | `AdminDashboard.tsx` | `/api/analytics/revenue-chart` | `GET` | Bearer Admin | Database | **COMPLETE** |
| **Dashboard** | Top Assets | Products & Bundles | `/admin/dashboard` | `AdminDashboard.tsx` | `/api/analytics/top-products` | `GET` | Bearer Admin | Database | **COMPLETE** |
| **Products** | Search & Filter| Category & Status | `/admin/products` | `AdminProducts.tsx` | `/api/products` | `GET` | Bearer Admin | Database | **COMPLETE** |
| **Products** | Create Product | Metadata & Pricing | `/admin/products/new`| `AdminProductForm.tsx` | `/api/products` | `POST` | Bearer Admin | `Product` | **COMPLETE** |
| **Products** | Edit Product | Price & Details | `/admin/products/edit/:id`| `AdminProductForm.tsx`| `/api/products/:id` | `PUT` | Bearer Admin | `Product` | **COMPLETE** |
| **Products** | Status Toggle | Draft / Published | `/admin/products` | `AdminProducts.tsx` | `/api/products/:id` | `PUT` | Bearer Admin | `Product` | **COMPLETE** |
| **Products** | Asset Upload | Multipart Images/ZIP | Forms | `AdminProductForm.tsx` | `/api/upload` | `POST` | Bearer Admin | File Storage | **COMPLETE** |
| **Bundles** | List & Search | Bundle Collections | `/admin/bundles` | `AdminBundles.tsx` | `/api/bundles` | `GET` | Bearer Admin | Database | **COMPLETE** |
| **Bundles** | Create Bundle | Products & Discount | `/admin/bundles/new` | `AdminBundleForm.tsx` | `/api/bundles` | `POST` | Bearer Admin | `Bundle` | **COMPLETE** |
| **Bundles** | Edit Bundle | Pricing & Items | `/admin/bundles/edit/:id`| `AdminBundleForm.tsx` | `/api/bundles/:id` | `PUT` | Bearer Admin | `Bundle` | **COMPLETE** |
| **Orders** | List & Filters | Payment & Status | `/admin/orders` | `AdminOrders.tsx` | `/api/admin/orders` | `GET` | Bearer Admin | Database | **COMPLETE** |
| **Orders** | Inspector | Customer & Items | Modal | `AdminOrderDetailModal.tsx`| `/api/admin/orders/:id` | `GET` | Bearer Admin | Database | **COMPLETE** |
| **Orders** | Status Update | Refunding / Fulfilled | Modal | `AdminOrderDetailModal.tsx`| `/api/admin/orders/:id/status`| `PUT` | Bearer Admin | `Order` | **COMPLETE** |
| **Orders** | Reset Access | Downloads & Tokens | Modal | `AdminOrderDetailModal.tsx`| `/api/orders/:id/reset-downloads`| `POST` | Bearer Admin | `Purchase` | **COMPLETE** |
| **Coupons** | Coupon List | Rules & Limits | `/admin/coupons` | `AdminCoupons.tsx` | `/api/coupons/admin` | `GET` | Bearer Admin | Database | **COMPLETE** |
| **Coupons** | Create Coupon | % / Fixed Discounts | `/admin/coupons` | `AdminCoupons.tsx` | `/api/coupons/admin` | `POST` | Bearer Admin | `Coupon` | **COMPLETE** |
| **Coupons** | Status Toggle | Active / Disabled | `/admin/coupons` | `AdminCoupons.tsx` | `/api/coupons/admin/:id/status`| `PATCH` | Bearer Admin | `Coupon` | **COMPLETE** |
| **Inventory** | Stock Table | Low-Stock Alerts | `/admin/inventory` | `AdminInventory.tsx` | `/api/inventory` | `GET` | Bearer Admin | Database | **COMPLETE** |
| **Inventory** | Edit Stock | Inline SKU & Counts | `/admin/inventory` | `AdminInventory.tsx` | `/api/inventory/:type/:id` | `PATCH` | Bearer Admin | Database | **COMPLETE** |
| **Audit Logs**| Log Viewer | Search & Filter | `/admin/logs` | `AdminAuditLogs.tsx` | `/api/admin/audit-logs` | `GET` | Bearer Admin | `AuditLog` | **COMPLETE** |
| **Settings** | Site Config | Name, Email, Address | `/admin/settings` | `AdminSettings.tsx` | `/api/admin/settings` | `PUT` | Bearer Admin | `SiteSettings`| **COMPLETE** |
| **Settings** | Masked Secrets| Gateway Credentials | `/admin/settings` | `AdminSettings.tsx` | `/api/admin/settings` | `GET` | Bearer Admin | Masked String | **COMPLETE** |
| **Support** | Tickets Admin | List & Reply Thread | `/admin/support` | `AdminSupportPage.tsx` | `/api/support/tickets` | `GET`/`POST` | Bearer Admin | `SupportTicket`| **COMPLETE** |

---

## 2. Option-by-Option Deep Verification Audit

### 1. Admin Authentication & Role RBAC
1. **UI Location**: Admin Root Entry ([`AdminRoute.tsx`](file:///c:/Users/vishw/OneDrive/Desktop/kwd/front%20end/src/routes/AdminRoute.tsx)).
2. **Route**: `/admin/*`
3. **Function**: `AdminRoute()`
4. **State**: `authState`, `user.role`
5. **Enforcement**: Checks `['ADMIN', 'SUPER_ADMIN', 'STAFF', 'MANAGER'].includes(user.role)`.
6. **Failure Action**: Unauthenticated users redirect to `/admin/login`. Authenticated customers receive a styled 403 Forbidden screen with a direct link back to the storefront.
7. **Backend Authorization**: Every admin API route is guarded by `authenticate, authorize('ADMIN')`.
8. **Test**: `server/src/tests/phase4_e2e.test.ts` (Tests 1a, 1b).

### 2. Product Management & File Uploads
1. **UI Location**: Products Management ([`AdminProducts.tsx`](file:///c:/Users/vishw/OneDrive/Desktop/kwd/front%20end/src/pages/admin/AdminProducts.tsx) & [`AdminProductForm.tsx`](file:///c:/Users/vishw/OneDrive/Desktop/kwd/front%20end/src/pages/admin/AdminProductForm.tsx)).
2. **Route**: `/admin/products`, `/admin/products/new`, `/admin/products/edit/:id`
3. **Function**: `handleSubmit(e)`, `handleUpload(file)`
4. **API Service**: `adminProductsApi.createProduct`, `adminProductsApi.updateProduct`, `adminProductsApi.uploadFile`
5. **HTTP Method & Endpoint**: `POST /api/products`, `PUT /api/products/:id`, `POST /api/upload`
6. **Payload**: Product metadata (name, slug, description, price, sku, stock, categoryId, status, thumbnail, googleDriveLinks).
7. **Backend Logic**: Validates non-negative price, SKU formatting, category existence, and uploads assets via Multer storage.
8. **Test**: `server/src/tests/phase4_e2e.test.ts` (Tests 3a, 3b).

### 3. Orders Management & Entitlement Actions
1. **UI Location**: Orders Table ([`AdminOrders.tsx`](file:///c:/Users/vishw/OneDrive/Desktop/kwd/front%20end/src/pages/admin/AdminOrders.tsx)) and Order Modal ([`AdminOrderDetailModal.tsx`](file:///c:/Users/vishw/OneDrive/Desktop/kwd/front%20end/src/components/admin/AdminOrderDetailModal.tsx)).
2. **Route**: `/admin/orders`
3. **Function**: `fetchOrders()`, `handleStatusUpdate()`, `handleResetDownloads()`, `handleRefund()`
4. **API Service**: `adminOrdersApi.getOrders`, `adminOrdersApi.updateOrderStatus`, `adminOrdersApi.refundOrder`, `adminOrdersApi.resetDownloads`
5. **HTTP Method & Endpoint**: `GET /api/admin/orders`, `PUT /api/admin/orders/:id/status`, `POST /api/orders/:id/refund`, `POST /api/orders/:id/reset-downloads`
6. **Backend Logic**: Modifies order status, updates access status on customer purchase records, and records refund records in the database.
7. **Test**: `server/src/tests/phase4_e2e.test.ts` (Tests 5a, 5b).

### 4. Inventory Stock & Alert Management
1. **UI Location**: Inventory Management ([`AdminInventory.tsx`](file:///c:/Users/vishw/OneDrive/Desktop/kwd/front%20end/src/pages/admin/AdminInventory.tsx)).
2. **Route**: `/admin/inventory`
3. **Function**: `fetchInventory()`, `handleSave(id, type)`
4. **API Service**: `adminSystemApi.getInventory`, `adminSystemApi.updateInventory`
5. **HTTP Method & Endpoint**: `GET /api/inventory`, `PATCH /api/inventory/:type/:id`
6. **Payload**: `{ sku, stock, minStock }`
7. **Threshold Calculation**: Status dynamically marked as `UNLIMITED` (stock=null), `OUT_OF_STOCK` (stock<=0), `LOW_STOCK` (stock<=minStock), or `IN_STOCK`.
8. **Test**: `server/src/tests/phase4_e2e.test.ts` (Tests 7a, 7b).

### 5. Platform Settings & Credential Safety
1. **UI Location**: Settings Page ([`AdminSettings.tsx`](file:///c:/Users/vishw/OneDrive/Desktop/kwd/front%20end/src/pages/admin/AdminSettings.tsx)).
2. **Route**: `/admin/settings`
3. **Function**: `handleSaveSettings(e)`
4. **API Service**: `adminSystemApi.getGeneralSettings`, `adminSystemApi.updateGeneralSettings`
5. **HTTP Method & Endpoint**: `GET /api/admin/settings`, `PUT /api/admin/settings`
6. **Masking Security**: Sensitive keys (`razorpay_key_secret`) are masked as `'••••••••••••••••'` before sending JSON to the client.
7. **Test**: `server/src/tests/phase4_e2e.test.ts` (Test 9).
