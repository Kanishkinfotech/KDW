import { Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// 1. Get All Legal Documents
export const getLegalDocuments = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const docs = await prisma.legalDocument.findMany({
      include: {
        versions: {
          orderBy: { versionNumber: 'desc' },
          take: 5
        }
      },
      orderBy: { name: 'asc' }
    });

    res.json({
      success: true,
      data: docs
    });
  } catch (error) {
    next(error);
  }
};

// 2. Get Single Legal Document Details with Full Version History
export const getLegalDocumentBySlug = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const slug = req.params.slug as string;

    const doc = await prisma.legalDocument.findUnique({
      where: { slug },
      include: {
        versions: {
          orderBy: { versionNumber: 'desc' }
        }
      }
    });

    if (!doc) {
      return res.status(404).json({ success: false, message: 'Legal document not found' });
    }

    res.json({
      success: true,
      data: doc
    });
  } catch (error) {
    next(error);
  }
};

// 3. Save / Update Legal Document Version (Draft)
export const saveLegalDocumentDraft = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const slug = req.params.slug as string;
    const { title, content, summary, changeLog } = req.body;
    const authUser = (req as any).user;

    if (!content || !title) {
      return res.status(400).json({ success: false, message: 'Title and content are required.' });
    }

    const doc = await prisma.legalDocument.findUnique({
      where: { slug },
      include: { versions: { orderBy: { versionNumber: 'desc' }, take: 1 } }
    });

    if (!doc) {
      return res.status(404).json({ success: false, message: 'Legal document not found' });
    }

    const nextVersionNumber = (doc.versions[0]?.versionNumber || doc.currentVersion || 0) + 1;

    const version = await prisma.legalDocumentVersion.create({
      data: {
        documentId: doc.id,
        versionNumber: nextVersionNumber,
        title,
        content,
        summary: summary || null,
        changeLog: changeLog || 'Draft revision',
        status: 'DRAFT',
        authorId: authUser?.id || null,
        authorName: authUser?.name || 'Administrator'
      }
    });

    await prisma.legalDocument.update({
      where: { id: doc.id },
      data: {
        currentVersion: nextVersionNumber,
        status: 'DRAFT'
      }
    });

    res.status(201).json({
      success: true,
      message: `New draft version ${nextVersionNumber}.0.0 saved.`,
      version
    });
  } catch (error) {
    next(error);
  }
};

// 4. Publish Legal Document Version
export const publishLegalDocument = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const slug = req.params.slug as string;
    const { versionNumber, title, content, summary, changeLog, effectiveDate } = req.body;
    const authUser = (req as any).user;

    const doc = await prisma.legalDocument.findUnique({
      where: { slug },
      include: { versions: { orderBy: { versionNumber: 'desc' } } }
    });

    if (!doc) {
      return res.status(404).json({ success: false, message: 'Legal document not found' });
    }

    const now = new Date();
    const finalEffectiveDate = effectiveDate ? new Date(effectiveDate) : now;

    // If new content/title was provided directly with publish action
    if (content && title) {
      const nextVersionNumber = (doc.versions[0]?.versionNumber || doc.currentVersion || 0) + 1;

      await prisma.$transaction(async (tx) => {
        // Archive previously published versions
        await tx.legalDocumentVersion.updateMany({
          where: { documentId: doc.id, status: 'PUBLISHED' },
          data: { status: 'ARCHIVED' }
        });

        // Create and publish new version immediately
        const newVersion = await tx.legalDocumentVersion.create({
          data: {
            documentId: doc.id,
            versionNumber: nextVersionNumber,
            title,
            content,
            summary: summary || null,
            changeLog: changeLog || 'Published revision',
            status: 'PUBLISHED',
            authorId: authUser?.id || null,
            authorName: authUser?.name || 'Administrator',
            reviewerId: authUser?.id || null,
            reviewerName: authUser?.name || 'Administrator',
            effectiveDate: finalEffectiveDate,
            publishedAt: now
          }
        });

        // Update parent document
        await tx.legalDocument.update({
          where: { id: doc.id },
          data: {
            currentVersion: nextVersionNumber,
            publishedVersion: nextVersionNumber,
            status: 'PUBLISHED',
            effectiveDate: finalEffectiveDate,
            publishedAt: now
          }
        });

        // Log audit
        await tx.settingAuditLog.create({
          data: {
            actorId: authUser?.id || null,
            actorName: authUser?.name || 'Administrator',
            actorRole: authUser?.role || 'ADMIN',
            action: 'PUBLISHED',
            group: 'LEGAL',
            details: `Published version ${nextVersionNumber}.0.0 of policy document '${doc.name}' (${doc.slug})`
          }
        });
      });

      return res.json({
        success: true,
        message: `Version ${nextVersionNumber}.0.0 of ${doc.name} published and active on storefront.`
      });
    }

    const targetVerNum = parseInt(String(versionNumber || doc.currentVersion), 10);
    const targetVersion = doc.versions.find(v => v.versionNumber === targetVerNum);

    if (!targetVersion) {
      return res.status(404).json({ success: false, message: `Version ${targetVerNum} not found` });
    }

    await prisma.$transaction(async (tx) => {
      // Archive previously published versions
      await tx.legalDocumentVersion.updateMany({
        where: { documentId: doc.id, status: 'PUBLISHED' },
        data: { status: 'ARCHIVED' }
      });

      // Mark target version as PUBLISHED
      await tx.legalDocumentVersion.update({
        where: { id: targetVersion.id },
        data: {
          status: 'PUBLISHED',
          reviewerId: authUser?.id || null,
          reviewerName: authUser?.name || 'Administrator',
          effectiveDate: finalEffectiveDate,
          publishedAt: now
        }
      });

      // Update parent document
      await tx.legalDocument.update({
        where: { id: doc.id },
        data: {
          publishedVersion: targetVerNum,
          status: 'PUBLISHED',
          effectiveDate: finalEffectiveDate,
          publishedAt: now
        }
      });

      // Create Audit Log
      await tx.settingAuditLog.create({
        data: {
          actorId: authUser?.id || null,
          actorName: authUser?.name || 'Administrator',
          actorRole: authUser?.role || 'ADMIN',
          action: 'PUBLISHED',
          group: 'LEGAL',
          details: `Published version ${targetVerNum}.0.0 of policy document '${doc.name}' (${doc.slug})`
        }
      });
    });

    res.json({
      success: true,
      message: `Version ${targetVerNum}.0.0 of ${doc.name} is now published and active.`
    });
  } catch (error) {
    next(error);
  }
};

// 5. Public Storefront Endpoint: Get Published Policy
export const getPublicLegalDocument = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const slug = req.params.slug as string;

    const doc = await prisma.legalDocument.findUnique({
      where: { slug },
      include: {
        versions: {
          where: { status: 'PUBLISHED' },
          orderBy: { versionNumber: 'desc' },
          take: 1
        }
      }
    });

    if (!doc || doc.versions.length === 0) {
      // Return default placeholder policy if not yet published
      return res.json({
        success: true,
        data: {
          slug,
          name: slug.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase()),
          versionNumber: 1,
          effectiveDate: new Date(),
          content: `# ${slug.replace(/-/g, ' ').toUpperCase()}\n\nThis policy document is currently in review by the KDW legal team.`
        }
      });
    }

    const published = doc.versions[0];

    res.json({
      success: true,
      data: {
        id: doc.id,
        slug: doc.slug,
        name: doc.name,
        versionNumber: published.versionNumber,
        title: published.title,
        content: published.content,
        effectiveDate: published.effectiveDate || doc.effectiveDate,
        publishedAt: published.publishedAt || doc.publishedAt
      }
    });
  } catch (error) {
    next(error);
  }
};

// 6. Record Policy Acceptance at Checkout
export const recordPolicyAcceptance = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { documentSlug, versionNumber = 1, customerId, customerEmail, orderId } = req.body;

    if (!documentSlug || !customerEmail) {
      return res.status(400).json({ success: false, message: 'Document slug and customer email are required.' });
    }

    const record = await prisma.policyAcceptanceRecord.create({
      data: {
        documentSlug,
        versionNumber: parseInt(String(versionNumber), 10) || 1,
        customerId: customerId || null,
        customerEmail,
        orderId: orderId || null,
        ipAddress: req.ip || null,
        userAgent: req.get('User-Agent') || null
      }
    });

    res.status(201).json({
      success: true,
      message: 'Policy acceptance recorded securely.',
      recordId: record.id
    });
  } catch (error) {
    next(error);
  }
};
