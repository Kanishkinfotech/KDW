# KDW — Phase 3 Functionality & Verification Matrix

**Date**: 2026-09-01  
**Project**: Kanishk Digital World (KDW)  
**Scope**: Product Reviews, Verified Buyer Verification, Review Moderation, Support Hub, FAQs, Help Desk Tickets, SLA Engine, Affiliates & Newsletter Subscriptions.

---

## 1. Master Phase 3 Functionality Matrix

| Module | Option | Sub-option | Route | Component | API Endpoint | Method | Auth | Persistence | Status |
| :--- | :--- | :--- | :--- | :--- | :--- | :---: | :---: | :---: | :--- |
| **Reviews** | Rating Overview | Aggregate & Average | `/product/:id` | `ProductReviews.tsx` | `/api/reviews/product/:id` | `GET` | Public | DB Aggregate | **COMPLETE** |
| **Reviews** | Star Breakdown | 5★–1★ Distribution | `/product/:id` | `ReviewSummary.tsx` | `/api/reviews/product/:id` | `GET` | Public | Computed Hist | **COMPLETE** |
| **Reviews** | Review List | Author & Cards | `/product/:id` | `ReviewCard.tsx` | `/api/reviews/product/:id` | `GET` | Public | DB Records | **COMPLETE** |
| **Reviews** | Verified Buyer | Order Check Badge | `/product/:id` | `ReviewCard.tsx` | `/api/reviews/product/:id` | `GET` | Public | DB Verified | **COMPLETE** |
| **Reviews** | Write Review | Star Selector & Form | `/product/:id` | `ReviewSubmissionModal.tsx`| `/api/reviews` | `POST` | Public/Auth | Database | **COMPLETE** |
| **Reviews** | Risk Screening | Profanity & Spam Filter | Server | `ReviewService` | `POST /api/reviews` | `INTERNAL`| Server | Auto Flag | **COMPLETE** |
| **Reviews** | Report Review | Reason & Details | `/product/:id` | `ReviewCard.tsx` | `/api/reviews/:id/report` | `POST` | Public/Auth | `ReviewReport` | **COMPLETE** |
| **Reviews** | Helpful Vote | Upvote Counter | `/product/:id` | `ReviewCard.tsx` | `/api/reviews/:id/vote` | `POST` | Public/Auth | DB Counter | **COMPLETE** |
| **Support** | Support Hub | Help Center Overview | `/support` | `Support.tsx` | `/api/support/contact` | `POST` | Public | Database | **COMPLETE** |
| **Support** | Quick Actions | Pre-selected Inquiries | `/support` | `Support.tsx` | `/api/support/contact` | `POST` | Public | Form State | **COMPLETE** |
| **Support** | Knowledge Base | FAQ Search & Accordion | `/faq` | `FAQ.tsx` | `/api/content/faqs` | `GET` | Public | `ContentFaq` | **COMPLETE** |
| **Support** | Customer Tickets | My Tickets Listing | `/support/my-tickets` | `CustomerMyTicketsPage.tsx`| `/api/support/my-tickets` | `GET` | Bearer | `SupportTicket`| **COMPLETE** |
| **Support** | Ticket Thread | Conversation Messages | `/support/my-tickets/:id` | `CustomerTicketDetailPage.tsx`| `/api/support/tickets/:id` | `GET` | Bearer | `SupportMessage`| **COMPLETE** |
| **Support** | Ticket Reply | Customer Message Box | `/support/my-tickets/:id` | `CustomerTicketDetailPage.tsx`| `/api/support/tickets/:id/reply` | `POST` | Bearer | `SupportMessage`| **COMPLETE** |
| **Support** | CSAT Survey | 1-5 Star Satisfaction | `/support/my-tickets/:id` | `CustomerTicketDetailPage.tsx`| `/api/support/satisfaction` | `POST` | Public/Auth | `SupportSatisfaction` | **COMPLETE** |
| **Support** | SLA Engine | Deadlines & Priority | Server | `slaEngine.ts` | `POST /api/support/contact` | `INTERNAL`| Server | `SupportSlaRecord` | **COMPLETE** |
| **Affiliate** | Partner Overview | 15% Program Benefits | `/affiliate` | `AffiliatePage.tsx` | `/api/affiliates/stats` | `GET` | Public/Auth | Content | **COMPLETE** |
| **Affiliate** | Application | Channel & UPI Registration | `/affiliate` | `AffiliatePage.tsx` | `/api/affiliates/apply` | `POST` | Bearer | `Coupon` | **COMPLETE** |
| **Affiliate** | Dashboard Stats| Clicks, Conversions, Earnings | `/affiliate` | `AffiliatePage.tsx` | `/api/affiliates/stats` | `GET` | Bearer | Computed Stats | **COMPLETE** |
| **Affiliate** | Referral Link | 1-Click Clipboard Copy | `/affiliate` | `AffiliatePage.tsx` | Client Clipboard | `LOCAL` | Bearer | Clipboard | **COMPLETE** |
| **Affiliate** | QR Code | Dynamic SVG/Canvas Code | `/affiliate` | `AffiliatePage.tsx` | QR API / Client SVG | `GET` | Bearer | None | **COMPLETE** |
| **Affiliate** | Payout Request | Min ₹1,000 Threshold | `/affiliate` | `AffiliatePage.tsx` | `/api/affiliates/payout-request` | `POST` | Bearer | DB Request | **COMPLETE** |
| **Newsletter**| Footer Form | Live Subscription | All Pages | `Footer.tsx` / `Newsletter.tsx`| `/api/newsletter/subscribe` | `POST` | Public | `CustomerConsent` | **COMPLETE** |
| **Newsletter**| Duplicate Guard| Friendly Already Subscribed | All Pages | `Newsletter.tsx` | `/api/newsletter/subscribe` | `POST` | Public | `CustomerConsent` | **COMPLETE** |

---

## 2. Option-by-Option Deep Verification Audit

### 1. Write Review & Verified Buyer Check
1. **UI Location**: Reviews section on Product Details page ([`ProductReviews.tsx`](file:///c:/Users/vishw/OneDrive/Desktop/kwd/front%20end/src/components/product/ProductReviews.tsx)).
2. **Route**: `/product/:id`
3. **Component**: `ReviewSubmissionModal.tsx`
4. **Function**: `handleSubmit(e)`
5. **API Service**: `reviewsApi.createReview(payload)`
6. **HTTP Method & Endpoint**: `POST /api/reviews`
7. **Request Payload**: `{ productId, rating, title, comment, pros, cons, orderId?, customerName?, customerEmail? }`
8. **Authentication & Authorization**: Authenticated or guest with verified order lookup.
9. **Validation**: Rating required (1-5), non-empty title & comment.
10. **Backend Verification Engine**: `ReviewService.verifyPurchase` checks whether the customer email/ID matches a `PAID` order containing `productId`. Sets `verifiedPurchase = true` and `verificationMethod = 'PAID_ORDER_ENTITLEMENT'`.
11. **Risk Screening**: `ReviewService.screenReviewContent` classifies spam URLs (`SPAM_FLAGGED`) and profanity (`PROFANITY_FLAGGED`). Clean verified reviews are auto-published; flagged reviews enter moderation.
12. **Success & UI Update**: Toasts confirmation, resets modal, triggers `fetchReviews()`, and dynamically updates the 5-star histogram.
13. **Test**: `server/src/tests/phase3_e2e.test.ts` (Tests 1, 2, 3, 4, 6).

### 2. Helpdesk Ticketing & SLA Engine
1. **UI Location**: Support Page ([`Support.tsx`](file:///c:/Users/vishw/OneDrive/Desktop/kwd/front%20end/src/pages/Support.tsx)) and Customer Inquiries ([`CustomerMyTicketsPage.tsx`](file:///c:/Users/vishw/OneDrive/Desktop/kwd/front%20end/src/pages/support/CustomerMyTicketsPage.tsx)).
2. **Route**: `/support` & `/support/my-tickets`
3. **Function**: `handleSubmit(e)`
4. **API Service**: `supportApi.submitContactQuery(payload)`
5. **HTTP Method & Endpoint**: `POST /api/support/contact`
6. **Request Payload**: `{ name, email, queryType, orderNumber, subject, message }`
7. **SLA Execution**: `calculateSlaDeadlines(priority)` sets `firstResponseDueAt` (120 min for High, 480 min for Medium) and creates a `SupportSlaRecord`.
8. **Conversation Thread**: `GET /api/support/tickets/:id` returns all customer-visible messages in chronological order.
9. **Reply & Close**: `POST /api/support/tickets/:id/reply` appends customer messages directly to the thread.
10. **CSAT Satisfaction**: `POST /api/support/satisfaction` records 1-5 star survey ratings and comments.
11. **Test**: `server/src/tests/phase3_e2e.test.ts` (Tests 7, 8, 9, 10).

### 3. Affiliate Partner Program & Payouts
1. **UI Location**: Affiliate Hub ([`AffiliatePage.tsx`](file:///c:/Users/vishw/OneDrive/Desktop/kwd/front%20end/src/pages/AffiliatePage.tsx)) and Dashboard Tab ([`Dashboard.tsx`](file:///c:/Users/vishw/OneDrive/Desktop/kwd/front%20end/src/pages/Dashboard.tsx)).
2. **Route**: `/affiliate` & `/account/affiliate`
3. **Function**: `fetchStats()`, `handleApply()`, `handlePayoutSubmit()`
4. **API Service**: `affiliatesApi.getStats()`, `affiliatesApi.apply()`, `affiliatesApi.requestPayout()`
5. **Metrics Computation**: 15% commission computed on total coupon sales volume, real-time clicks, conversions, and available payout balance.
6. **QR Code**: Displays authentic QR image encoding `/shop?ref=KDW-XXXX`.
7. **Payout Validation**: Enforces minimum ₹1,000 threshold and balance limit.
8. **Test**: `server/src/tests/phase3_e2e.test.ts` (Tests 12, 13).

### 4. Newsletter Subscription Engine
1. **UI Location**: Footer ([`Footer.tsx`](file:///c:/Users/vishw/OneDrive/Desktop/kwd/front%20end/src/components/layout/footer/Footer.tsx) & [`Newsletter.tsx`](file:///c:/Users/vishw/OneDrive/Desktop/kwd/front%20end/src/components/layout/footer/Newsletter.tsx)).
2. **Function**: `handleSubmit(e)`
3. **API Service**: `newsletterApi.subscribe(email)`
4. **HTTP Method & Endpoint**: `POST /api/newsletter/subscribe`
5. **Request Payload**: `{ email }`
6. **Persistence**: `CustomerConsent` record created with `consentType: 'MARKETING_EMAIL'`, `status: 'OPTED_IN'`, `source: 'BANNER'`.
7. **Duplicate Detection**: Returns `{ success: true, alreadySubscribed: true }` with polite friendly UI feedback.
8. **Test**: `server/src/tests/phase3_e2e.test.ts` (Tests 14, 15).
