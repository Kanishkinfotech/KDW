import 'dotenv/config';
import { prisma } from '../database/db';

async function seedMasterAntigravityContent() {
  console.log('Seeding Master Antigravity Policies and FAQs...');

  const policies = [
    {
      title: 'Terms & Conditions',
      slug: 'terms',
      summary: 'Standard operating terms governing digital product acquisition, licences, and customer obligations.',
      template: 'POLICY',
      status: 'PUBLISHED',
      isPolicyPage: true,
      policyOwner: 'Operations & Legal',
      effectiveDate: new Date('2026-01-01'),
      reviewDate: new Date('2026-12-31'),
      publishedAt: new Date(),
      seoTitle: 'Terms & Conditions | Kanishk Digital World',
      seoDescription: 'Legal terms governing digital template licences, customer obligations, and usage permissions.',
      contentJson: [
        {
          type: 'callout',
          title: 'Working Draft — Review Before Use',
          content: 'This document represents a working operational draft for Kanishk Digital World. It will be superseded upon final legal certification.'
        },
        {
          type: 'text',
          title: '1. Platform Mission & Digital Products',
          content: 'Kanishk Digital World (KDW) provides outcome-focused templates, business agreements, design systems, website kits, and automation blueprints. All assets are digital items delivered through secure cloud storage.'
        },
        {
          type: 'text',
          title: '2. Grant of Licence, Not Ownership',
          content: 'Purchasing a product grants the customer a non-exclusive, perpetual commercial licence to deploy the assets for internal operations and client deliverables. Purchasing does not transfer intellectual property ownership or grant unrestricted public resale rights.'
        },
        {
          type: 'text',
          title: '3. Technical Support Boundaries',
          content: 'Each product page specifies format compatibility and standard support scope. Product support assists with file integrity, documentation guidance, and access token resolution.'
        }
      ]
    },
    {
      title: 'Privacy Policy',
      slug: 'privacy',
      summary: 'Our data protection principles, transaction logging, and access security guidelines.',
      template: 'POLICY',
      status: 'PUBLISHED',
      isPolicyPage: true,
      policyOwner: 'Compliance Team',
      effectiveDate: new Date('2026-01-01'),
      reviewDate: new Date('2026-12-31'),
      publishedAt: new Date(),
      seoTitle: 'Privacy Policy | Kanishk Digital World',
      seoDescription: 'Learn how KDW collects, processes, and safeguards customer delivery and access information.',
      contentJson: [
        {
          type: 'callout',
          title: 'Working Draft — Review Before Use',
          content: 'This policy is a working operational baseline. Final data retention schedules and statutory jurisdiction clauses will be incorporated prior to production launch.'
        },
        {
          type: 'text',
          title: '1. Information Collected for Digital Fulfillment',
          content: 'KDW collects customer name, delivery email address, and transaction references to provision Google Drive permissions and issue signed download access tokens.'
        },
        {
          type: 'text',
          title: '2. Zero Third-Party Monetization',
          content: 'Customer contact information is strictly utilized for transactional order notifications, download link regeneration, and support ticket triage. We never sell or license customer data.'
        },
        {
          type: 'text',
          title: '3. Access History & Telemetry',
          content: 'For fraud prevention and download allowance enforcement, timestamps and IP hashes associated with download token redemptions are recorded into immutable audit logs.'
        }
      ]
    },
    {
      title: 'Refund & Cancellation Policy',
      slug: 'refund-policy',
      summary: 'Equitable guidelines governing digital asset delivery, defects, and payment reversals.',
      template: 'POLICY',
      status: 'PUBLISHED',
      isPolicyPage: true,
      policyOwner: 'Operations Director',
      effectiveDate: new Date('2026-01-01'),
      reviewDate: new Date('2026-12-31'),
      publishedAt: new Date(),
      seoTitle: 'Refund & Cancellation Policy | KDW',
      seoDescription: 'Review our criteria for digital product satisfaction, technical defect remediation, and refund processing.',
      contentJson: [
        {
          type: 'callout',
          title: 'Working Draft — Review Before Use',
          content: 'Working operational policy. Subject to final merchant banking and statutory consumer protection review.'
        },
        {
          type: 'text',
          title: '1. Digital Goods Nature',
          content: 'Because digital templates, blueprints, and code assets are delivered immediately upon checkout confirmation, purchases are generally non-refundable once accessed or downloaded.'
        },
        {
          type: 'text',
          title: '2. Fair Support Evaluation',
          content: 'We provide fair resolution for edge cases including duplicate accidental billing, verified technical corruption of master files, or substantial mismatch between product specifications and delivered content.'
        },
        {
          type: 'text',
          title: '3. Revocation of Entitlements',
          content: 'Upon authorization of a refund or payment reversal, associated download tokens, cloud storage permissions, and commercial licences are automatically revoked on the server.'
        }
      ]
    },
    {
      title: 'Digital Delivery & Access Policy',
      slug: 'digital-delivery',
      summary: 'Rules governing server payment verification, signed download URLs, and entitlement allowances.',
      template: 'POLICY',
      status: 'PUBLISHED',
      isPolicyPage: true,
      policyOwner: 'Engineering & Delivery',
      effectiveDate: new Date('2026-01-01'),
      reviewDate: new Date('2026-12-31'),
      publishedAt: new Date(),
      seoTitle: 'Digital Delivery & Access Policy | KDW',
      seoDescription: 'Learn about tokenized download delivery, Google Drive access, and 5-attempt download safety limits.',
      contentJson: [
        {
          type: 'callout',
          title: 'Working Draft — Review Before Use',
          content: 'Working technical specification. Sourced from reference documentation for engineering and delivery review.'
        },
        {
          type: 'text',
          title: '1. Verified Backend Fulfillment',
          content: 'Product files and cloud access permissions are released solely after verified server-side HMAC validation of the transaction. Browser-side claims never authorize file access.'
        },
        {
          type: 'text',
          title: '2. Short-Lived Signed Download URLs',
          content: 'To prevent link hotlinking and unauthorized sharing, direct file URLs are signed with an approximate 10-minute expiration window.'
        },
        {
          type: 'text',
          title: '3. Download Allowance Safeguards',
          content: 'Each product purchase starts with an allowance of five successful downloads. Interrupted, failed, or timed-out download attempts do not consume this allowance. Support administrators may reset counters upon request.'
        },
        {
          type: 'text',
          title: '4. Guest Purchase Association',
          content: 'Orders placed as a guest using an email address can be linked to a central account whenever the customer creates an account with that verified email.'
        }
      ]
    },
    {
      title: 'Copyright & Intellectual Property Policy',
      slug: 'copyright',
      summary: 'Protection standards, attribution guidelines, and resale restrictions.',
      template: 'POLICY',
      status: 'PUBLISHED',
      isPolicyPage: true,
      policyOwner: 'Legal Operations',
      effectiveDate: new Date('2026-01-01'),
      reviewDate: new Date('2026-12-31'),
      publishedAt: new Date(),
      seoTitle: 'Copyright & IP Policy | KDW',
      seoDescription: 'Intellectual property boundaries, proprietary protection, and prohibition of unauthorized distribution.',
      contentJson: [
        {
          type: 'callout',
          title: 'Working Draft — Review Before Use',
          content: 'Working operational draft. Consult legal counsel before commercial redistribution claims.'
        },
        {
          type: 'text',
          title: '1. Proprietary Assets',
          content: 'All design frameworks, workflow JSONs, documentation templates, and code assets hosted on KDW are protected under copyright and intellectual property statutes.'
        },
        {
          type: 'text',
          title: '2. Distribution Restrictions',
          content: 'You may not redistribute, upload to public repositories, re-bundle, or resell raw KDW template files without a specific extended Developer or Reseller agreement.'
        }
      ]
    },
    {
      title: 'Commercial Licence Scope',
      slug: 'license',
      summary: 'Clear breakdown of Personal, Commercial, Agency, and Reseller licence tiers.',
      template: 'POLICY',
      status: 'PUBLISHED',
      isPolicyPage: true,
      policyOwner: 'Licensing Team',
      effectiveDate: new Date('2026-01-01'),
      reviewDate: new Date('2026-12-31'),
      publishedAt: new Date(),
      seoTitle: 'Commercial Licence Scope | KDW',
      seoDescription: 'Understand the permissions granted by KDW Standard Commercial, Agency, and Developer licences.',
      contentJson: [
        {
          type: 'callout',
          title: 'Working Draft — Review Before Use',
          content: 'Working legal framework draft. Review before deployment in multi-tenant commercial SaaS applications.'
        },
        {
          type: 'text',
          title: '1. Standard Commercial Licence',
          content: 'Allows deployment across unlimited internal business workflows, marketing campaigns, and client deliverables. No recurring attribution required.'
        },
        {
          type: 'text',
          title: '2. Agency Licence Scope',
          content: 'Permits your entire team or agency staff to utilize the assets across multiple concurrent client accounts and contract deliverables.'
        },
        {
          type: 'text',
          title: '3. Resale Prohibitions',
          content: 'Unrestricted resale of original raw files as standalone templates is strictly prohibited unless explicitly authorized under an enterprise agreement.'
        }
      ]
    }
  ];

  for (const p of policies) {
    await prisma.contentPage.upsert({
      where: { slug: p.slug },
      update: {
        title: p.title,
        summary: p.summary,
        contentJson: p.contentJson,
        status: 'PUBLISHED',
        isPolicyPage: true,
        updatedAt: new Date()
      },
      create: p
    });
    console.log(`✓ Seeded policy: ${p.slug}`);
  }

  // Also seed into Policy table if present
  try {
    for (const p of policies) {
      await (prisma as any).policy?.upsert({
        where: { slug: p.slug },
        update: {
          title: p.title,
          content: JSON.stringify(p.contentJson),
          version: '1.0.0-draft',
          status: 'PUBLISHED'
        },
        create: {
          title: p.title,
          slug: p.slug,
          content: JSON.stringify(p.contentJson),
          version: '1.0.0-draft',
          status: 'PUBLISHED'
        }
      });
    }
  } catch (err) {}

  // 2. Seed the 7 required FAQs
  console.log('Seeding Master FAQs...');
  const faqs = [
    {
      slug: 'faq-receive-product',
      question: 'How do I receive my product after checkout?',
      answer: 'Access is released immediately after backend payment verification and appears directly in your customer library. A secure download access link is also emailed once a verified email provider is configured.',
      scopeType: 'GLOBAL',
      displayOrder: 1,
      status: 'PUBLISHED'
    },
    {
      slug: 'faq-guest-purchase',
      question: 'Can I purchase as a guest without creating an account first?',
      answer: 'Yes. You can purchase using your delivery email address. If you later register an account with that same verified email, all previous purchases and download records will automatically link to your centralized customer library.',
      scopeType: 'GLOBAL',
      displayOrder: 2,
      status: 'PUBLISHED'
    },
    {
      slug: 'faq-download-links',
      question: 'How long do download links remain active?',
      answer: 'Direct file delivery tokens generate short-lived signed download links (valid for approximately 10 minutes) for security. Your overall product entitlement stored in your account determines ongoing access.',
      scopeType: 'GLOBAL',
      displayOrder: 3,
      status: 'PUBLISHED'
    },
    {
      slug: 'faq-download-limit',
      question: 'Is there a limit on how many times I can download my files?',
      answer: 'Purchases initially include five successful download attempts. Failed or interrupted download attempts do not count against your limit, and support administrators can reset your limit if needed.',
      scopeType: 'GLOBAL',
      displayOrder: 4,
      status: 'PUBLISHED'
    },
    {
      slug: 'faq-refunds',
      question: 'What is your refund policy on digital assets?',
      answer: 'Because digital files are received immediately upon delivery, products are generally non-refundable once accessed. However, genuine issues like duplicate charges, file corruption, or material discrepancies will be reviewed and refunded fairly through our support desk.',
      scopeType: 'GLOBAL',
      displayOrder: 5,
      status: 'PUBLISHED'
    },
    {
      slug: 'faq-licenses',
      question: 'How do Personal, Commercial, and Agency licences work?',
      answer: 'Personal licences cover individual private usage. Commercial and Agency licences allow you to deploy the templates and workflows across internal business operations and unlimited client deliverables.',
      scopeType: 'GLOBAL',
      displayOrder: 6,
      status: 'PUBLISHED'
    },
    {
      slug: 'faq-sharing-resale',
      question: 'Can I redistribute, share, or resell the raw files?',
      answer: 'No. Purchasing a licence grants you usage rights, not intellectual property ownership. Unrestricted redistribution, public sharing, or direct resale of the raw assets is strictly prohibited unless an explicit developer or reseller licence is attached.',
      scopeType: 'GLOBAL',
      displayOrder: 7,
      status: 'PUBLISHED'
    }
  ];

  for (const f of faqs) {
    try {
      await (prisma as any).fAQItem?.upsert({
        where: { id: f.slug },
        update: {
          question: f.question,
          answer: f.answer,
          displayOrder: f.displayOrder,
          status: 'PUBLISHED'
        },
        create: {
          id: f.slug,
          question: f.question,
          answer: f.answer,
          displayOrder: f.displayOrder,
          status: 'PUBLISHED',
          scopeType: f.scopeType
        }
      });
      console.log(`✓ Seeded FAQ: ${f.slug}`);
    } catch (e) {
      // If schema uses autogenerated ID
      const existing = await (prisma as any).fAQItem?.findFirst({ where: { question: f.question } });
      if (!existing) {
        await (prisma as any).fAQItem?.create({
          data: {
            question: f.question,
            answer: f.answer,
            displayOrder: f.displayOrder,
            status: 'PUBLISHED',
            scopeType: f.scopeType
          }
        });
      }
      console.log(`✓ Seeded FAQ fallback: ${f.slug}`);
    }
  }

  console.log('Master Antigravity Content Seed Complete!');
}

seedMasterAntigravityContent()
  .catch((e) => {
    console.error('Error seeding content:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
