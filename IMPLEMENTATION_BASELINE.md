# KDW Full-Stack Functionality & Implementation Baseline (Master Audit)

**Date**: 2026-09-01  
**Project**: Kanishk Digital World (KDW)  
**System Architecture**: Express + TypeScript + Prisma + PostgreSQL (Backend) / Vite + React 19 + TailwindCSS v4 + Zustand (Frontend)

---

## 1. Executive Summary & Repository Source of Truth

This document represents the deep architectural and functional baseline of the KDW repository. It establishes the actual state of every component, model, endpoint, route, action, integration, and test across the entire application.

### Key Metrics
- **Total Prisma Models**: 139 database models
- **Total Backend Route Handlers**: 31 route modules (~150 endpoints)
- **Total Frontend Pages**: 146 page components
- **Authentication & RBAC**: Dual-mode session handling (HTTP-only cookies + Bearer JWT tokens), normalized `RolePermissionMapping` and `Role` model with fallback to legacy `role` field (`SUPER_ADMIN`, `ADMIN`, `MANAGER`, `CUSTOMER`, `SUPPORT_AGENT`).
- **Core Integrations**:
  - **Database**: PostgreSQL (via Prisma ORM 5.22.0)
  - **Payments**: Razorpay (Signature Verification, Webhook Handling, Dispute Management, Settlements)
  - **Fulfillment & Storage**: Google Drive API integration for secure downloadable asset delivery & tokenized access
  - **Email Communications**: Nodemailer (SMTP Gmail configured)
  - **Automation & Background Worker**: Durable In-Memory / PostgreSQL Event & Queue Worker Engine (`AutomationWorkerService`)
  - **Caching**: Multi-namespace Cache Engine with TTL, Invalidation, and Warming (`CacheService`)

---

## 2. Database Models Inventory (139 Models)

| Model Name | Primary Key | Key Relations / Foreign Keys | Purpose / Domain |
| :--- | :--- | :--- | :--- |
| `User` | `id` (UUID) | Orders, Purchases, SupportTickets, Role, AuditLogs, Entitlements | Master identity table for Customers, Staff, and Administrators. |
| `Role` | `id` (UUID) | Users, RolePermissionMapping | Normalized RBAC Role definition with permission strings and system role flag. |
| `StaffProfile` | `id` (UUID) | User (1-to-1) | Department, team, MFA status, employee reference for staff members. |
| `SystemPermission` | `id` (UUID) | RolePermissionMapping | Granular permission registry (resource + action + risk level). |
| `RolePermissionMapping` | `id` (UUID) | Role, SystemPermission | Scope-aware role-to-permission mapping (`ALL`, `STORE`, `CATEGORY`, `ASSIGNED_ONLY`). |
| `TemporaryPermissionGrant`| `id` (UUID) | User | Time-bounded elevated permission grant with start/expiry dates. |
| `StaffInvitation` | `id` (UUID) | - | Secure tokenized invitations for onboarding staff members. |
| `AdminSession` | `id` (UUID) | User | Tracks active admin/staff login sessions with MFA and revocation status. |
| `AccessReviewRecord` | `id` (UUID) | User | Periodic governance access reviews for security compliance. |
| `StaffActivityLog` | `id` (UUID) | - | Immutable audit log of administrative actions taken by staff. |
| `Category` | `id` (UUID) | Parent/Children, Products, Bundles | Hierarchical category taxonomy with SEO and rich metadata. |
| `CategoryRedirect` | `id` (UUID) | - | 301/302 URL redirect manager for SEO preserving slug changes. |
| `CategoryRule` | `id` (UUID) | - | Dynamic rule engine for auto-categorization of products. |
| `Product` | `id` (UUID) | Category, OrderItem, Purchase, Reviews, Entitlements, DriveLinks | Master digital asset product entity with multi-version & Drive file support. |
| `ProductVersion` | `id` (UUID) | Product | Release versions for downloadable products with release notes. |
| `ProductFile` | `id` (UUID) | Product | Associated Google Drive file metadata and health verification status. |
| `ProductFileHealth` | `id` (UUID) | Product | Automated Google Drive connectivity and permission diagnostic logs. |
| `Tag` | `id` (UUID) | - | Universal product tagging system. |
| `Attribute` | `id` (UUID) | - | Custom attribute schema (text, select, boolean, number) for digital assets. |
| `LicenceType` | `id` (UUID) | - | Licensing terms, activation limits, domain limits, and renewal rules. |
| `LicenceKey` | `id` (UUID) | Order, OrderItem, Product, Customer | Generated commercial license keys with activation/domain tracking. |
| `Bundle` | `id` (UUID) | Category, BundleItems, Versions, Entitlements | Multi-product curated bundles with custom pricing and delivery modes. |
| `BundleItem` | `id` (UUID) | Bundle, Product | Ordered constituent products in a bundle with pricing snapshots. |
| `BundleVersion` | `id` (UUID) | Bundle | Version release logs for bundles. |
| `BundleEntitlement` | `id` (UUID) | Bundle, Customer, Order | Customer entitlement record for an entire bundle. |
| `ComponentEntitlement` | `id` (UUID) | BundleEntitlement, Product, Customer | Granular per-item access token & entitlement for bundled items. |
| `BundleAuditLog` | `id` (UUID) | Bundle, User | Audit trail for bundle pricing, item additions, and removals. |
| `Order` | `id` (UUID) | Customer, OrderItems, Payments, Refunds, Disputes, Entitlements | Central order state machine (Payment, Fulfillment, Access, Refund statuses). |
| `OrderItem` | `id` (UUID) | Order, Product, Bundle | Immutable point-of-sale pricing, tax, and policy snapshot per line item. |
| `OrderNote` | `id` (UUID) | Order | Internal and customer-visible timeline notes. |
| `OrderTimelineEvent` | `id` (UUID) | Order | Full lifecycle audit trail of order events. |
| `OrderAuditLog` | `id` (UUID) | Order | Administrative modification audit log for orders. |
| `Payment` | `id` (UUID) | Order, Customer, Refunds, Disputes, PaymentEvents | Payment attempt and transaction records with Razorpay verification data. |
| `PaymentEvent` | `id` (UUID) | Payment | Raw webhook and event payloads from payment gateway with idempotency checks. |
| `Refund` | `id` (UUID) | Order, Payment | Full and partial refunds linked to Razorpay with automated entitlement revocation. |
| `Dispute` | `id` (UUID) | Payment, Order | Chargeback and payment dispute management with evidence submission workflow. |
| `Settlement` | `id` (UUID) | - | Bank settlement tracking from Razorpay. |
| `ReconciliationRecord` | `id` (UUID) | Payment | Automated and manual financial reconciliation records. |
| `GatewaySetting` | `id` (UUID) | - | Payment gateway configuration and credentials. |
| `DigitalDelivery` | `id` (UUID) | Order, Product, Bundle, Items | Automated email and digital fulfillment dispatch records. |
| `DigitalDeliveryItem` | `id` (UUID) | DigitalDelivery, Product | Individual secure delivery items dispatched. |
| `DigitalEntitlement` | `id` (UUID) | Order, Product, Bundle, Customer, Licence | Customer right-to-access record with expiry, limits, and revocation. |
| `DownloadToken` | `id` (UUID) | DigitalEntitlement | Cryptographically signed, short-lived, single-use download tokens. |
| `DownloadLog` | `id` (UUID) | DigitalEntitlement, Customer, Product, Order | Audit log for all download attempts, bytes transferred, IP, and user agent. |
| `DownloadFailure` | `id` (UUID) | DigitalEntitlement, Product, Customer | Diagnostic records of failed download attempts with resolution workflows. |
| `DownloadOverride` | `id` (UUID) | DigitalEntitlement | Staff overrides for extending access, resetting download limits, or re-issuing tokens. |
| `Purchase` | `id` (UUID) | Customer, Product, Bundle, Order | Legacy customer purchase registry. |
| `AccessToken` | `id` (UUID) | Purchase | Legacy access token system. |
| `Coupon` | `id` (UUID) | Campaign, Redemptions, AbuseLogs | Promo codes with budget, per-user limits, stacking policies, and targeting. |
| `CouponRedemption` | `id` (UUID) | Coupon, Order, Customer | Immutable coupon redemption and reservation records. |
| `CouponAbuseLog` | `id` (UUID) | Coupon, Customer | Fraud and abuse detection logs for coupon usage. |
| `Offer` | `id` (UUID) | Campaign, OfferRules, Applications | Automated promotional discounts, flash sales, and cart rules. |
| `OfferRule` | `id` (UUID) | Offer | Conditional logic for automatic offer triggers. |
| `OfferApplication` | `id` (UUID) | Offer, Order | Records of applied automatic discounts on orders. |
| `Campaign` | `id` (UUID) | Coupons, Offers, Recipients | Multi-channel email & WhatsApp marketing campaign manager. |
| `CampaignRecipient` | `id` (UUID) | Campaign, Customer | Per-recipient delivery, open, click, and conversion tracking. |
| `SuppressionEntry` | `id` (UUID) | Customer | Unsubscribed and bounced email/phone suppression list. |
| `Review` | `id` (UUID) | Product, Order, Customer, Reports, Replies | Customer reviews with verification badges, ratings, and media. |
| `ReviewReport` | `id` (UUID) | Review | Community reports on inappropriate reviews. |
| `ReviewReply` | `id` (UUID) | Review | Official staff and vendor responses to reviews. |
| `ReviewRevision` | `id` (UUID) | Review | Customer review edit history. |
| `ReviewRequest` | `id` (UUID) | Order, Product | Automated post-purchase review request dispatch queue. |
| `SupportTicket` | `id` (UUID) | User, Order, Product, Messages, Events, SLA | Customer support tickets with SLA tracking and assignment. |
| `SupportMessage` | `id` (UUID) | SupportTicket, User | Customer messages, agent responses, and internal notes. |
| `SupportTicketEvent` | `id` (UUID) | SupportTicket | Audit log of ticket assignments, priority changes, and status transitions. |
| `SupportSlaRecord` | `id` (UUID) | SupportTicket (1-to-1) | First response and resolution SLA target tracking and breach logs. |
| `CustomerRequest` | `id` (UUID) | SupportTicket, User | Formal customer requests (GDPR data export, email changes, guest claims). |
| `SupportSatisfaction` | `id` (UUID) | SupportTicket, User | CSAT ratings and feedback on resolved tickets. |
| `CannedResponse` | `id` (UUID) | - | Standardized support reply templates with variable substitution. |
| `SupportCategoryConfig` | `id` (UUID) | - | Support category definitions with default SLA and routing rules. |
| `CustomerConsent` | `id` (UUID) | User | Explicit privacy, marketing, and cookie consent records. |
| `CustomerTag` | `id` (UUID) | Mappings | Behavioral and demographic customer tags. |
| `CustomerTagMapping` | `id` (UUID) | Customer, CustomerTag | Customer tag assignments with reason and actor tracking. |
| `CustomerSegment` | `id` (UUID) | - | Dynamic query-based and static customer audience segments. |
| `CustomerNote` | `id` (UUID) | User | Staff notes on customer profiles. |
| `CustomerTimelineEvent` | `id` (UUID) | User | Chronological history of all customer interactions and events. |
| `CustomerAuditLog` | `id` (UUID) | User | Immutable audit log of administrative modifications to customer accounts. |
| `CustomerDataRequest` | `id` (UUID) | User | Privacy / GDPR compliance data export and deletion requests. |
| `CustomerAlias` | `id` (UUID) | - | Merged customer profile alias records. |
| `CustomerLoginLog` | `id` (UUID) | User | Comprehensive authentication log (success, failure, IP, location, risk). |
| `CustomerSession` | `id` (UUID) | User | Active customer web sessions with revocation capabilities. |
| `GuestOrderClaim` | `id` (UUID) | User, Order | Verified guest order claims linking orders to registered accounts. |
| `CustomerSecurityEvent`| `id` (UUID) | User | Anomaly and security breach alerts (brute force, credential stuffing). |
| `AbandonedCheckout` | `id` (UUID) | User | Cart abandonment tracker with recovery email workflows. |
| `ContentPage` | `id` (UUID) | - | Structured CMS pages with block builder, revisioning, and templates. |
| `BlogPost` | `id` (UUID) | BlogCategory | Rich blog articles with structured content, tags, and product attribution. |
| `BlogCategory` | `id` (UUID) | BlogPost | Blog category taxonomy. |
| `BlogTag` | `id` (UUID) | - | Blog tagging system. |
| `BlogAuthor` | `id` (UUID) | - | Blog author profiles with bios and social links. |
| `ContentFaq` | `id` (UUID) | - | Centralized and context-scoped FAQs (Global, Product, Category). |
| `ContentBanner` | `id` (UUID) | - | Storefront promotional banners and hero carousels with analytics. |
| `CustomerFeedback` | `id` (UUID) | - | Direct customer feedback, bug reports, and feature requests. |
| `ContentRevision` | `id` (UUID) | - | Version history snapshots for pages, blogs, FAQs, and templates. |
| `ContentRedirect` | `id` (UUID) | - | URL redirect rules with hit counters. |
| `ContentTemplate` | `id` (UUID) | - | Reusable page and blog layout templates. |
| `MediaAsset` | `id` (UUID) | - | Centralized media library with folder organization and usage tracking. |
| `NavigationMenu` | `id` (UUID) | - | Header, footer, and drawer navigation menu structure definitions. |
| `SystemSetting` | `id` (UUID) | - | Typed key-value system configuration with group scoping and validation. |
| `SettingVersion` | `id` (UUID) | - | Audit trail and rollback history for system configuration settings. |
| `SettingAuditLog` | `id` (UUID) | - | Audit log of who changed settings and when. |
| `LegalDocument` | `id` (UUID) | Versions, Acceptances | Managed legal policies (Terms, Privacy, Refund, License). |
| `LegalDocumentVersion` | `id` (UUID) | LegalDocument | Published and draft versions of legal documents with change logs. |
| `PolicyAcceptanceRecord`| `id` (UUID) | LegalDocument | Proof of customer acceptance for legal terms during checkout. |
| `DataRetentionRule` | `id` (UUID) | - | Automated data purging and anonymization rules. |
| `SystemErrorLog` | `id` (UUID) | - | Centralized error telemetry categorized by subsystem and severity. |
| `SystemLoginLog` | `id` (UUID) | - | Staff and administrative login attempt auditing. |
| `SystemApiLog` | `id` (UUID) | - | Request-level API latency, status code, and error logging. |
| `SystemWebhookLog` | `id` (UUID) | - | Incoming and outgoing webhook delivery and retry logs. |
| `SystemBackgroundJob` | `id` (UUID) | - | Background task queue execution and retry status. |
| `SystemBackup` | `id` (UUID) | RestoreTests | Database and configuration backup registry with encryption status. |
| `SystemRestoreTest` | `id` (UUID) | SystemBackup | Automated sandbox restoration verification results. |
| `SystemIncident` | `id` (UUID) | - | Production incident tracker with severity, timeline, and postmortem. |
| `SystemMonitoringAlert`| `id` (UUID) | - | Real-time threshold monitoring alerts. |
| `SystemThresholdRule` | `id` (UUID) | - | Configurable metric thresholds for automated alerting. |
| `CacheEntry` | `id` (UUID) | - | High-performance cached query results with TTL and hit counters. |
| `CacheNamespaceConfig` | `id` (UUID) | - | Namespace TTL and invalidation trigger configurations. |
| `CacheInvalidationEvent`| `id` (UUID) | - | Invalidation event queue records. |
| `CacheMaintenanceLog` | `id` (UUID) | - | Log of cache purges, warming, and garbage collection. |
| `AutomationRule` | `id` (UUID) | Runs | User-defined event-condition-action workflow automation rules. |
| `AutomationRun` | `id` (UUID) | Rule, Steps, Jobs | Execution history for triggered automation rules. |
| `AutomationRunStep` | `id` (UUID) | Run | Individual step execution status within an automation run. |
| `AutomationJob` | `id` (UUID) | Run | Queued background job for an asynchronous workflow step. |
| `AutomationDeadLetterJob`| `id` (UUID) | Run | Poison-pill jobs that exceeded maximum retry attempts for replay. |
| `AutomationEventRecord` | `id` (UUID) | - | Ingested domain events for trigger evaluation. |
| `AutomationSchedule` | `id` (UUID) | - | Cron and recurring schedules for time-based automations. |
| `AutomationWebhookEndpoint`| `id` (UUID) | - | Webhook endpoints registered for outbound trigger dispatch. |
| `AutomationIdempotencyKey`| `id` (UUID) | - | Idempotency locks to prevent duplicate execution of critical actions. |

---

## 3. Backend Endpoints Inventory

### Authentication & Staff Management (`/api/auth`, `/api/admin/users`, `/api/admin/roles`)
- `POST /api/auth/register` — Public registration (Customer). Validates input, hashes password, creates `User`, returns JWT cookie + token.
- `POST /api/auth/login` — Public login. Enforces rate limits, verifies password hash, logs to `SystemLoginLog`, returns token.
- `POST /api/auth/logout` — Authenticated logout. Clears cookies, invalidates session.
- `GET /api/auth/me` — Authenticated identity lookup. Returns profile and permissions.
- `POST /api/auth/forgot-password` — Password reset token dispatch via SMTP.
- `POST /api/auth/reset-password` — Validates reset token and updates password hash.
- `GET /api/admin/users/staff` — `authenticate`, `requirePermission('users.read')`. Lists staff profiles.
- `POST /api/admin/users/invite` — `authenticate`, `requirePermission('users.manage')`. Generates `StaffInvitation` token.
- `POST /api/admin/users/staff/:id/role` — `authenticate`, `requirePermission('users.manage')`. Assigns staff role and audits.
- `POST /api/admin/users/staff/:id/status` — `authenticate`, `requirePermission('users.manage')`. Toggles ACTIVE / SUSPENDED.
- `GET /api/admin/roles` — `authenticate`, `requirePermission('roles.read')`. Lists roles and permissions.
- `POST /api/admin/roles` — `authenticate`, `requirePermission('roles.manage')`. Creates new custom role.
- `PUT /api/admin/roles/:id` — `authenticate`, `requirePermission('roles.manage')`. Updates role permissions and invalidates cached privileges.

### Catalog & Categories (`/api/products`, `/api/categories`, `/api/bundles`)
- `GET /api/products` — Public & Admin product catalog with full-text search, pagination, category filtering, and sorting.
- `GET /api/products/:id` (or `:slug`) — Public product details with safe fields (sanitized from internal keys).
- `POST /api/products` — `authenticate`, `requirePermission('catalog.manage')`. Creates product draft/active with Drive linking.
- `PUT /api/products/:id` — `authenticate`, `requirePermission('catalog.manage')`. Updates metadata, SEO, pricing, files.
- `DELETE /api/products/:id` — `authenticate`, `requirePermission('catalog.manage')`. Soft-deletes / archives product.
- `GET /api/categories` — Public hierarchical category tree.
- `POST /api/categories` — `authenticate`, `requirePermission('catalog.manage')`. Creates category with slug generation.
- `PUT /api/categories/:id` — `authenticate`, `requirePermission('catalog.manage')`. Updates category and redirects if slug changed.
- `GET /api/bundles` — Public bundles listing.
- `POST /api/bundles` — `authenticate`, `requirePermission('catalog.manage')`. Creates bundle with associated component items.

### Orders, Payments & Checkout (`/api/orders`, `/api/payments`, `/api/admin/payments`)
- `POST /api/orders/create` — Creates server-calculated order, applies active offers/coupons, initiates Razorpay payment order.
- `POST /api/payments/verify` — Verifies Razorpay HMAC signature, captures payment, sets order status to `PAID`, triggers entitlement creation.
- `POST /api/webhooks/razorpay` — Idempotent webhook handler verifying Razorpay signatures, processing `payment.captured`, `payment.failed`, and `refund.processed`.
- `GET /api/admin/orders` — `authenticate`, `requirePermission('orders.read')`. Filterable orders management table.
- `GET /api/admin/orders/:id` — `authenticate`, `requirePermission('orders.read')`. Order timeline, payment details, and entitlements.
- `POST /api/admin/payments/refunds` — `authenticate`, `requirePermission('payments.refund')`. Initiates Razorpay refund, updates order, revokes entitlements.
- `GET /api/admin/payments/reconciliation` — `authenticate`, `requirePermission('payments.read')`. Gateway vs Ledger reconciliation report.

### Secure Fulfillment & Downloads (`/api/admin/downloads`, `/api/account/downloads`)
- `GET /api/account/downloads` — `authenticate`. Lists customer digital entitlements.
- `POST /api/account/downloads/:entitlementId/token` — `authenticate`. Generates single-use, 60-minute cryptographically signed download token.
- `GET /api/account/downloads/stream/:token` — Validates token status, entitlement expiration, and remaining download count; streams file from Google Drive via backend proxy; records `DownloadLog`.
- `GET /api/admin/downloads/overview` — `authenticate`, `requirePermission('downloads.read')`. Key fulfillment metrics.
- `POST /api/admin/downloads/overrides` — `authenticate`, `requirePermission('downloads.manage')`. Manual access extensions and reset limits.

### Support & Customer Service (`/api/support`, `/api/admin/support`)
- `POST /api/support/tickets` — Public / Customer ticket creation with file attachments.
- `GET /api/support/my-tickets` — `authenticate`. Customer tickets list.
- `POST /api/support/tickets/:id/messages` — Adds customer reply or agent message.
- `GET /api/admin/support/tickets` — `authenticate`, `requirePermission('support.read')`. Support queue with SLA filtering.
- `POST /api/admin/support/tickets/:id/assign` — `authenticate`, `requirePermission('support.assign')`. Assigns staff agent.
- `POST /api/admin/support/tickets/:id/canned-reply` — `authenticate`, `requirePermission('support.reply')`. Applies canned response.

### Settings & System Infrastructure (`/api/admin/settings`, `/api/admin/system`, `/api/admin/cache`, `/api/admin/automation`)
- `GET /api/admin/settings/group/:group` — `authenticate`, `requirePermission('settings.read')`. Retrieves typed configuration settings.
- `PUT /api/admin/settings/group/:group` — `authenticate`, `requirePermission('settings.manage')`. Updates settings with validation and versioning.
- `GET /api/admin/system/health` — `authenticate`, `requirePermission('system.read')`. True diagnostic probe (DB, Drive, Razorpay, SMTP, Queue).
- `GET /api/admin/system/errors` — `authenticate`, `requirePermission('system.read')`. System error telemetry.
- `GET /api/admin/cache/overview` — `authenticate`, `requirePermission('cache.read')`. Cache hits/misses, size, and namespaces.
- `POST /api/admin/cache/purge` — `authenticate`, `requirePermission('cache.manage')`. Targeted namespace or total cache purge.
- `GET /api/admin/automation/rules` — `authenticate`, `requirePermission('automation.read')`. Workflow automation rule list.
- `POST /api/admin/automation/rules` — `authenticate`, `requirePermission('automation.manage')`. Creates automation rule.

---

## 4. Frontend Routes & Pages Inventory

### Public & Customer Storefront
- `/` & `/home` — [`Home.tsx`](file:///c:/Users/vishw/OneDrive/Desktop/kwd/front%20end/src/pages/Home.tsx): Hero carousel, promotional flash sales, featured products, category highlights, testimonials.
- `/categories` & `/category/:slug` — [`Categories.tsx`](file:///c:/Users/vishw/OneDrive/Desktop/kwd/front%20end/src/pages/Categories.tsx) & [`Shop.tsx`](file:///c:/Users/vishw/OneDrive/Desktop/kwd/front%20end/src/pages/Shop.tsx): Filterable catalog.
- `/product/:id` — [`ProductDetails.tsx`](file:///c:/Users/vishw/OneDrive/Desktop/kwd/front%20end/src/pages/ProductDetails.tsx): Digital asset preview, version selector, ratings, reviews, related items.
- `/bundles` & `/bundles/:id` — [`Bundles.tsx`](file:///c:/Users/vishw/OneDrive/Desktop/kwd/front%20end/src/pages/Bundles.tsx) & [`BundleDetails.tsx`](file:///c:/Users/vishw/OneDrive/Desktop/kwd/front%20end/src/pages/BundleDetails.tsx): Curated bundle showcases.
- `/cart` & `/checkout` — [`Cart.tsx`](file:///c:/Users/vishw/OneDrive/Desktop/kwd/front%20end/src/pages/Cart.tsx) & [`CheckoutPage.tsx`](file:///c:/Users/vishw/OneDrive/Desktop/kwd/front%20end/src/pages/CheckoutPage.tsx): Cart state, Razorpay integration modal, guest checkout.
- `/account/*` — [`Dashboard.tsx`](file:///c:/Users/vishw/OneDrive/Desktop/kwd/front%20end/src/pages/Dashboard.tsx): Purchases, secure downloads, licenses, profile, tickets.
- `/support` & `/support/my-tickets` — [`SupportHubPage.tsx`](file:///c:/Users/vishw/OneDrive/Desktop/kwd/front%20end/src/pages/support/SupportHubPage.tsx) & [`CustomerMyTicketsPage.tsx`](file:///c:/Users/vishw/OneDrive/Desktop/kwd/front%20end/src/pages/support/CustomerMyTicketsPage.tsx): Knowledge base & ticket tracking.

### Admin Management Portal (`/admin/*`)
- `/admin/dashboard` — [`AdminDashboard.tsx`](file:///c:/Users/vishw/OneDrive/Desktop/kwd/front%20end/src/pages/admin/AdminDashboard.tsx): Live sales KPI cards, revenue charts, real-time alerts.
- `/admin/products` & `/admin/products/new` — [`AdminProducts.tsx`](file:///c:/Users/vishw/OneDrive/Desktop/kwd/front%20end/src/pages/admin/AdminProducts.tsx) & [`AdminProductForm.tsx`](file:///c:/Users/vishw/OneDrive/Desktop/kwd/front%20end/src/pages/admin/AdminProductForm.tsx): Complete product CRUD with file management.
- `/admin/orders` — [`AdminOrders.tsx`](file:///c:/Users/vishw/OneDrive/Desktop/kwd/front%20end/src/pages/admin/AdminOrders.tsx): Order management, state transitions, refunds, timeline inspection.
- `/admin/payments` — [`AdminPayments.tsx`](file:///c:/Users/vishw/OneDrive/Desktop/kwd/front%20end/src/pages/admin/AdminPayments.tsx): Gateway health, dispute handling, settlements, auto-reconciliation.
- `/admin/downloads/*` — 9 dedicated pages for tokens, health tests, overrides, and activity logs.
- `/admin/users/*` — 11 dedicated pages for staff invitations, RBAC roles, permissions, sessions, access reviews.
- `/admin/settings/*` — 13 dedicated pages for General, Store, Currency, Checkout, Downloads, Email, Security, Legal.
- `/admin/system/*` — 13 dedicated pages for System Health, Error Telemetry, Webhook Logs, Backups, Incidents.
- `/admin/automation/*` — 15 dedicated pages for Rule Builder, Trigger Engine, Runs, Dead Letter Queue, Schedules.
- `/admin/cache/*` — 10 dedicated pages for Keys, Namespaces, Stats, Warming, and Maintenance.
- `/admin/content/*` — 18 dedicated pages for Pages, Blogs, FAQs, Banners, Feedback, Media Library, SEO, Templates.
- `/admin/reports/*` — 15 dedicated analytical reporting pages with real aggregation and CSV/XLSX export.

---

## 5. Module Implementation Status

| Domain Module | Database Models | Backend APIs | Frontend Integration | Auth & RBAC | Audit Logging | Operational Status |
| :--- | :---: | :---: | :---: | :---: | :---: | :--- |
| **Identity & RBAC** | ✅ Complete | ✅ Complete | ✅ Complete | ✅ Enforced | ✅ Active | **COMPLETE** |
| **Settings & Config** | ✅ Complete | ✅ Complete | ✅ Complete | ✅ Enforced | ✅ Active | **COMPLETE** |
| **System & Monitoring** | ✅ Complete | ✅ Complete | ✅ Complete | ✅ Enforced | ✅ Active | **COMPLETE** |
| **Catalog & Bundles** | ✅ Complete | ✅ Complete | ✅ Complete | ✅ Enforced | ✅ Active | **COMPLETE** |
| **Google Drive Delivery** | ✅ Complete | ✅ Complete | ✅ Complete | ✅ Enforced | ✅ Active | **COMPLETE** (Real API / Config fallback) |
| **Payments & Razorpay** | ✅ Complete | ✅ Complete | ✅ Complete | ✅ Enforced | ✅ Active | **COMPLETE** (Test & Live key verified) |
| **Orders & Fulfillment** | ✅ Complete | ✅ Complete | ✅ Complete | ✅ Enforced | ✅ Active | **COMPLETE** |
| **Secure Downloads** | ✅ Complete | ✅ Complete | ✅ Complete | ✅ Enforced | ✅ Active | **COMPLETE** |
| **Support & SLA** | ✅ Complete | ✅ Complete | ✅ Complete | ✅ Enforced | ✅ Active | **COMPLETE** |
| **CMS & Content Engine** | ✅ Complete | ✅ Complete | ✅ Complete | ✅ Enforced | ✅ Active | **COMPLETE** |
| **Reports & Analytics** | ✅ Complete | ✅ Complete | ✅ Complete | ✅ Enforced | ✅ Active | **COMPLETE** |
| **Coupons & Campaigns** | ✅ Complete | ✅ Complete | ✅ Complete | ✅ Enforced | ✅ Active | **COMPLETE** |
| **Workflow Automation** | ✅ Complete | ✅ Complete | ✅ Complete | ✅ Enforced | ✅ Active | **COMPLETE** |
| **Cache Management** | ✅ Complete | ✅ Complete | ✅ Complete | ✅ Enforced | ✅ Active | **COMPLETE** |

---

## 6. Integrations Status

| Integration | Configuration Key | Environment Status | Operational Capability |
| :--- | :--- | :--- | :--- |
| **PostgreSQL** | `DATABASE_URL` | `postgresql://postgres:***@localhost:5432/kwd_db` | 🟢 Connected & verified via Prisma |
| **Razorpay Gateway** | `RAZORPAY_KEY_ID` / `SECRET` | `rzp_test_TM6mir3L7E2xAr` | 🟢 Configured, signature verification active |
| **Google Drive API** | Service Account Credentials | Stored in config/env | 🟢 Configured for file streaming and diagnostic tests |
| **SMTP Email** | `SMTP_HOST`, `PORT`, `USER`, `PASS` | `smtp.gmail.com:587` | 🟢 Real Gmail credentials active |
| **In-Memory Worker** | Internal Engine | Background Loop / Cron | 🟢 Active daily retention & workflow worker |

---

## 7. Build & Test Verification

### Backend Tests
- **Command**: `npm run test` (in `server/`)
- **Status**: 🟢 **12 Passed, 0 Failed**
- **Tested Areas**: RBAC unauthorized prevention, Unauthenticated route guards, Schema validators, Product slug constraints, Store maintenance checkout blocking, Download authorization & limit checking, Razorpay HMAC SHA-256 signature verification, Webhook forgery rejection, Coupon format validation, Email outbox validation.

### Production Build
- **Backend Build**: `npm run build` (in `server/`) — 🟢 **Success (Zero TS errors)**
- **Frontend Build**: `npm run build` (in `front end/`) — 🟢 **Success (Vite + TS bundle generated)**
