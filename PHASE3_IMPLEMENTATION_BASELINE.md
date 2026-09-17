# KDW — Phase 3 Implementation Baseline

**Date**: 2026-09-01  
**Project**: Kanishk Digital World (KDW)  
**Scope**: Post-Purchase Engagement, Reviews, Verified Buyers, Review Moderation, Support Hub, FAQs, Help Desk Tickets, SLA Engine, Affiliates, and Newsletter Subscriptions.

---

## 1. Executive Summary & Architecture Baseline

Phase 3 builds upon the verified foundations of Phase 1 (Auth, Catalog, Cart, Wishlist) and Phase 2 (Checkout, Payments, Automatic Fulfillment, Invoices, Downloads, Account Hub) to deliver full customer lifecycle engagement.

All implementations strictly adhere to:
- **Zero Schema Changes**: Utilizes existing 139 Prisma models without modifications.
- **Strict Backend Authority**: Reviews, tickets, CSAT satisfaction ratings, affiliate metrics, and newsletter subscriptions are validated and persisted server-side.
- **Zero Mock / Fake Production Data**: Dynamic API responses and live database records.

---

## 2. Model & Database Mapping

| Domain Entity | Prisma Model | Key Fields & Security Boundaries | Status |
| :--- | :--- | :--- | :---: |
| **Reviews** | `Review` | `id`, `productId`, `customerId`, `orderId`, `rating` (1-5), `title`, `comment`, `pros`, `cons`, `verifiedPurchase`, `verificationMethod`, `riskScore`, `reportCount`, `status` (`PENDING`, `APPROVED`, `PUBLISHED`, `REPORTED`, `HIDDEN`) | **CONNECTED** |
| **Review Reports** | `ReviewReport` | `id`, `reviewId`, `reporterId`, `reporterEmail`, `reason` (`SPAM`, `PROFANITY`, `IRRELEVANT`, `PERSONAL_INFO`, `COMPETITOR_PROMO`, `FAKE_REVIEW`, `OTHER`), `status` (`OPEN`, `RESOLVED`, `DISMISSED`) | **CONNECTED** |
| **Support Tickets** | `SupportTicket` | `id`, `ticketNumber`, `userId`, `customerEmail`, `customerName`, `type`, `category`, `priority` (`LOW`, `MEDIUM`, `HIGH`, `URGENT`), `status` (`NEW`, `OPEN`, `IN_PROGRESS`, `RESOLVED`, `CLOSED`), `slaFirstResponseDueAt`, `slaResolutionDueAt` | **CONNECTED** |
| **Support SLA** | `SupportSlaRecord` | `id`, `ticketId`, `priority`, `firstResponseTargetMinutes`, `resolutionTargetMinutes`, `firstResponseDueAt`, `resolutionDueAt` | **CONNECTED** |
| **Support Messages** | `SupportMessage` | `id`, `ticketId`, `senderType` (`CUSTOMER`, `STAFF`, `SYSTEM`), `senderName`, `message`, `visibility` (`CUSTOMER`, `INTERNAL_NOTE`), `attachmentsJson` | **CONNECTED** |
| **CSAT Satisfaction** | `SupportSatisfaction` | `id`, `ticketId`, `customerId`, `customerEmail`, `rating` (1-5), `comment`, `isSatisfied` (`rating >= 4`), `submittedAt` | **CONNECTED** |
| **Knowledge Base** | `ContentFaq` | `id`, `question`, `answer`, `scopeType` (`GLOBAL`, `PRODUCT`), `categoryName`, `status` (`PUBLISHED`, `DRAFT`) | **CONNECTED** |
| **File Uploads** | Multer Engine | `/api/upload` supports local multipart storage up to 20MB (`/uploads/`) | **CONNECTED** |
| **Affiliate Program** | `Coupon` & `User` | `Coupon` model (`discountType: 'AFFILIATE'`, `affiliateId`, `code: 'KDW-XXXX'`), 15% commission calculation, redemptions tracking | **CONNECTED** |
| **Newsletter Consents** | `CustomerConsent` | `customerId`, `consentType: 'MARKETING_EMAIL'`, `status: 'OPTED_IN'`, `source: 'BANNER'`, `consentTextVersion: '1.0'` | **CONNECTED** |

---

## 3. Backend Route Mapping & Contracts

| Module | Route / Endpoint | HTTP | Auth Requirement | Controller Function | Description |
| :--- | :--- | :---: | :---: | :--- | :--- |
| **Reviews** | `/api/reviews/product/:productId` | `GET` | Public | `getPublicProductReviews` | Fetches approved reviews + live rating breakdown |
| **Reviews** | `/api/reviews` | `POST` | Public / Auth | `createPublicReview` | Validates rating, purchase verification & spam screening |
| **Reviews** | `/api/reviews/:id/report` | `POST` | Public / Auth | `createReviewReport` | Records review report & triggers threshold escalation |
| **Reviews** | `/api/reviews/:id/vote` | `POST` | Public / Auth | `voteReview` | Upvotes helpful review |
| **Support** | `/api/support/contact` | `POST` | Public / Auth | `submitContactQuery` | Registers inquiry, auto-classifies SLA & creates ticket |
| **Support** | `/api/support/my-tickets` | `GET` | Bearer Auth | `getCustomerTickets` | Fetches customer's ticket list & history |
| **Support** | `/api/support/tickets/:id` | `GET` | Bearer Auth | `getCustomerTicketDetail` | Retrieves conversation thread & messages |
| **Support** | `/api/support/tickets/:id/reply` | `POST` | Bearer Auth | `replyTicket` | Appends customer message to ticket thread |
| **Support** | `/api/support/satisfaction` | `POST` | Public / Auth | `submitSatisfactionSurvey` | Submits 1-5 star CSAT feedback on resolved ticket |
| **Support** | `/api/content/faqs` | `GET` | Public | `getStorefrontFaqs` | Retrieves published FAQs by category or product |
| **Affiliates** | `/api/affiliates/stats` | `GET` | Bearer Auth | `affiliateRoutes.ts` | Calculates clicks, conversions, commission & balance |
| **Affiliates** | `/api/affiliates/apply` | `POST` | Bearer Auth | `affiliateRoutes.ts` | Onboards partner & generates affiliate coupon |
| **Affiliates** | `/api/affiliates/payout-request` | `POST` | Bearer Auth | `affiliateRoutes.ts` | Validates minimum ₹1,000 threshold & requests payout |
| **Newsletter** | `/api/newsletter/subscribe` | `POST` | Public | `newsletterRoutes.ts` | Registers marketing email consent with duplicate guard |

---

## 4. Frontend Component & View Mapping

- `ProductReviews.tsx`: Product detail reviews hub with 5-star distribution breakdown, image/video gallery, helpful upvoting, report modal, and review submission modal.
- `ReviewCard.tsx`: Formats review author, verified buyer badge, pros & cons, star ratings, and expandable text.
- `Support.tsx`: Help desk overview with quick actions (License Reset, Download Extension, Billing Inquiry) and direct contact query form with automatic SLA triage.
- `FAQ.tsx`: Dynamic FAQ search and accordion connected to `/api/content/faqs`.
- `CustomerMyTicketsPage.tsx` & `CustomerTicketDetailPage.tsx`: Helpdesk customer ticket list, live chronological thread, customer reply input, and CSAT rating card.
- `AffiliatePage.tsx`: Dedicated Partner Hub featuring 15% commission metrics, unique referral link with 1-click clipboard copy, SVG QR code, partner application form, and payout modal.
- `Footer.tsx` & `Newsletter.tsx`: Real-time newsletter subscription form with duplicate detection and immediate feedback.
