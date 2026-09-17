# KDW — Phase 1 Implementation Baseline

**Date**: 2026-09-01  
**Project**: Kanishk Digital World (KDW)  
**Phase**: Phase 1 — Storefront + Authentication + Catalog + Cart + Wishlist + Routing

---

## 1. Executive Overview & Architecture Constraint Verification

Phase 1 focuses on establishing the complete customer-facing storefront, authentication, catalog discovery, cart operations, wishlist management, and routing workflows without altering the database schema or modifying existing backend endpoint contracts.

### Critical Constraints Verified
- **Database Schema**: Unchanged. Existing 139 models in `schema.prisma` are strictly preserved.
- **Backend Route Contracts**: Unchanged. Existing Express route definitions and parameter signatures are preserved.
- **Frontend Architecture**: Centralized Axios API client, typed API services (`src/api/auth.api.ts`, `src/api/products.api.ts`), dedicated React Contexts (`AuthContext`, `CartContext`, `WishlistContext`), and URL-synchronized state in `Shop.tsx`.

---

## 2. Existing Backend Route & Contract Audit

| Endpoint | HTTP Method | Auth Required | Request Payload / Query Params | Response Structure | Frontend Consumer |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `/api/auth/register` | `POST` | None | `{ name, email, password, mobile? }` | `{ success: true, token, user: { id, name, email, role } }` | `src/api/auth.api.ts`, `Register.tsx` |
| `/api/auth/login` | `POST` | None | `{ email, password }` | `{ success: true, token, user: { id, name, email, role } }` | `src/api/auth.api.ts`, `Login.tsx` |
| `/api/auth/me` | `GET` | `Bearer <token>` / Cookie | None | `{ success: true, user: { id, customerCode, name, email, mobile, profileImage, role, emailVerified, customerType } }` | `src/api/auth.api.ts`, `AuthContext.tsx` |
| `/api/auth/logout` | `POST` | None | None | `{ success: true, message }` | `src/api/auth.api.ts`, `AuthContext.tsx` |
| `/api/auth/profile` | `PUT` | `Bearer <token>` / Cookie | `{ name?, mobile?, profileImage? }` | `{ success: true, user }` | `src/api/auth.api.ts`, `Dashboard.tsx` |
| `/api/auth/forgot-password` | `POST` | None | `{ email }` | `{ success: true, message, token? }` | `src/api/auth.api.ts`, `ForgotPassword.tsx` |
| `/api/auth/reset-password/:token` | `POST` | None | `{ password, email? }` | `{ success: true, message }` | `src/api/auth.api.ts`, `ResetPassword.tsx` |
| `/api/products` | `GET` | None | `?category=&subcategory=&search=&minPrice=&maxPrice=&sort=&status=&page=&limit=` | `{ success: true, data: Product[], total: number, summary: { totalProducts, draftProducts, filesConnected, totalDownloads } }` | `src/api/products.api.ts`, `Shop.tsx`, `useStore.ts` |
| `/api/products/:id` | `GET` | None | URL parameter: UUID or slug | `{ success: true, data: ProductDetail }` (with category, reviews, versions, files) | `src/api/products.api.ts`, `ProductDetails.tsx` |
| `/api/products/:id/related` | `GET` | None | URL parameter: UUID or slug | `{ success: true, data: Product[] }` | `src/api/products.api.ts`, `ProductDetails.tsx` |
| `/api/categories` | `GET` | None | None | `{ success: true, data: Category[] }` (hierarchical parent-child tree) | `src/api/products.api.ts`, `Shop.tsx`, `Header.tsx` |
| `/api/categories/:id` | `GET` | None | URL parameter: UUID or slug | `{ success: true, data: CategoryDetail }` (with children, FAQs, SEO) | `src/api/products.api.ts`, `Shop.tsx` |
| `/api/bundles` | `GET` | None | None | `{ success: true, data: Bundle[] }` | `src/api/products.api.ts`, `Bundles.tsx`, `Shop.tsx` |
| `/api/bundles/:id` | `GET` | None | URL parameter: UUID or slug | `{ success: true, data: BundleDetail }` | `src/api/products.api.ts`, `BundleDetails.tsx` |

---

## 3. Frontend Architecture Baseline

### 3.1 Authentication & Session Life Cycle
- **Storage Keys**: `authToken`, `token`, `user`.
- **Boot Workflow**: `AuthContext` initializes with `isLoading = true`. It inspects localStorage for `authToken` or `token`. If found, `GET /api/auth/me` is invoked to retrieve fresh user and role information. If valid, `isAuthenticated = true`; otherwise, invalid credentials are wiped and `isAuthenticated = false`. Finally, `isLoading = false`.
- **Protected Routes**: Protected routes block rendering until `isLoading === false`. Unauthenticated users are redirected to `/login?redirect=<target_path>`.

### 3.2 Catalog Discovery & URL Synchronization (`Shop.tsx`)
- **Query Parameters**: `category`, `search`, `minPrice`, `maxPrice`, `sort`, `page`, `limit`.
- **URL Synchronization**: URL parameter changes immediately update filter states. Changes in UI controls update URL parameters via `useSearchParams`, ensuring complete browser back/forward and refresh persistence.
- **Search Debounce**: Input changes are debounced (300ms) before triggering API queries.

### 3.3 Cart Operations
- **State Engine**: Client-side `CartContext` backed by `localStorage` persistence with cross-tab `window.addEventListener('storage', ...)` synchronization.
- **Digital Product Normalization**: Digital products have `quantity = 1`. Duplicate additions are prevented and notified.
- **Subtotal Calculation**: Dynamic server-price derived computation: `subtotal = sum(price * quantity)`.

### 3.4 Wishlist Operations
- **Guest vs Authenticated Handling**: In Phase 1, wishlist items are managed via local client storage (`localStorage`) with full persistence, toggle add/remove, badge counter, and wishlist drawer/page views, conforming strictly to the "do not invent fake backend endpoints or modify schema" constraint.

---

## 4. Discovered Contract Alignments & Resolutions

1. **Token Key Unification**: Both `authToken` and `token` are supported by the Axios interceptor and `AuthContext` to ensure backward compatibility across all modules.
2. **Product Identifier Flexibility**: Backend `GET /api/products/:id` natively supports querying by either UUID `id` or string `slug`, enabling clean SEO URLs (`/product/react-dashboard-kit`).
3. **Currency Standardization**: Replaced any raw `$` symbols in wishlist and cart components with centralized `formatCurrency` (INR / ₹) matching site-wide currency settings.
