import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { calculateSlaDeadlines } from '../controllers/support/slaEngine';

const prisma = new PrismaClient();

async function seedSupportSystem() {
  console.log('--- SEEDING COMPREHENSIVE KDW SUPPORT SYSTEM ---');

  // 1. Fetch reference users, orders, and products
  const [users, orders, products] = await Promise.all([
    prisma.user.findMany({ take: 10 }),
    prisma.order.findMany({ take: 10 }),
    prisma.product.findMany({ take: 10 })
  ]);

  if (users.length === 0) {
    console.error('No users found in database. Seed users first.');
    return;
  }

  const staff = users.find(u => u.role !== 'CUSTOMER') || users[0];
  const customer1 = users.find(u => u.role === 'CUSTOMER') || users[0];
  const customer2 = users[1] || users[0];

  const order1 = orders[0];
  const order2 = orders[1] || orders[0];
  const product1 = products[0];
  const product2 = products[1] || products[0];

  // 2. Clean previous demo support records
  await prisma.supportSatisfaction.deleteMany();
  await prisma.customerRequest.deleteMany();
  await prisma.supportSlaRecord.deleteMany();
  await prisma.supportTicketEvent.deleteMany();
  await prisma.supportMessage.deleteMany();
  await prisma.supportTicket.deleteMany();
  await prisma.cannedResponse.deleteMany();
  await prisma.supportCategoryConfig.deleteMany();

  console.log('Cleared previous support data.');

  // 3. Seed Support Categories Config
  const categoriesData = [
    { name: 'Download & Fulfillment', slug: 'download-fulfillment', defaultPriority: 'HIGH', defaultRoutingRole: 'SUPPORT_AGENT', slaResponseMinutes: 60, slaResolutionMinutes: 720 },
    { name: 'Licence & Activation', slug: 'licence-activation', defaultPriority: 'HIGH', defaultRoutingRole: 'SUPPORT_AGENT', slaResponseMinutes: 60, slaResolutionMinutes: 1440 },
    { name: 'Billing & Refunds', slug: 'billing-refunds', defaultPriority: 'HIGH', defaultRoutingRole: 'FINANCE_MANAGER', slaResponseMinutes: 120, slaResolutionMinutes: 1440 },
    { name: 'Payment Queries', slug: 'payment-queries', defaultPriority: 'HIGH', defaultRoutingRole: 'FINANCE_MANAGER', slaResponseMinutes: 60, slaResolutionMinutes: 720 },
    { name: 'Product Questions', slug: 'product-questions', defaultPriority: 'MEDIUM', defaultRoutingRole: 'SUPPORT_AGENT', slaResponseMinutes: 240, slaResolutionMinutes: 2880 },
    { name: 'Contact & Business', slug: 'contact-queries', defaultPriority: 'LOW', defaultRoutingRole: 'STORE_MANAGER', slaResponseMinutes: 720, slaResolutionMinutes: 4320 },
    { name: 'Customer Account & Privacy', slug: 'customer-requests', defaultPriority: 'MEDIUM', defaultRoutingRole: 'SUPER_ADMIN', slaResponseMinutes: 480, slaResolutionMinutes: 2880 },
    { name: 'Technical Support', slug: 'technical-support', defaultPriority: 'MEDIUM', defaultRoutingRole: 'CATALOG_MANAGER', slaResponseMinutes: 120, slaResolutionMinutes: 1440 }
  ];

  for (const cat of categoriesData) {
    await prisma.supportCategoryConfig.create({ data: cat });
  }
  console.log(`Created ${categoriesData.length} support category configs.`);

  // 4. Seed Canned Responses
  const cannedTemplates = [
    {
      name: 'Secure Download Link Resent',
      category: 'DOWNLOAD',
      body: 'Hello {{customer.first_name}},\n\nWe have refreshed your download access for {{product.name}} on Order #{{order.number}}. Please use the fresh link below within 72 hours:\n{{download.link}}\n\nIf you experience any interruptions, reply directly to this ticket.\n\nBest regards,\nKDW Support Team'
    },
    {
      name: 'Licence Key Activation Assistance',
      category: 'LICENCE',
      body: 'Hello {{customer.first_name}},\n\nYour licence activation slot for {{product.name}} has been verified. Here is your key and instructions:\nLicence Key: {{licence.key}}\n\nPlease enter this key inside your dashboard under Settings -> Activation.\n\nBest regards,\nKDW Support Team'
    },
    {
      name: 'Refund Request Under Finance Review',
      category: 'REFUND',
      body: 'Hello {{customer.first_name}},\n\nYour refund request for Order #{{order.number}} has been forwarded to our Finance team for policy review. You will receive an authoritative confirmation within 1 business day.\n\nThank you for your patience,\nKDW Accounts'
    },
    {
      name: 'Refund Approved & Processed',
      category: 'REFUND',
      body: 'Hello {{customer.first_name}},\n\nYour refund for Order #{{order.number}} has been approved. The amount will reflect in your original payment method in 3-5 business days.\n\nBest regards,\nKDW Accounts'
    },
    {
      name: 'GDPR Data Export Acknowledgement',
      category: 'DATA_REQUEST',
      body: 'Hello {{customer.first_name}},\n\nWe have received your personal data export request (Ticket #{{ticket.number}}). Your identity has been queued for verification. An encrypted download archive will be prepared upon verification.'
    }
  ];

  for (const t of cannedTemplates) {
    await prisma.cannedResponse.create({
      data: {
        name: t.name,
        category: t.category,
        body: t.body,
        variablesJson: ['customer.first_name', 'ticket.number', 'order.number', 'product.name', 'download.link', 'licence.key'],
        status: 'ACTIVE',
        createdById: staff.id,
        createdByName: staff.name
      }
    });
  }
  console.log(`Created ${cannedTemplates.length} canned response templates.`);

  // 5. Seed Realistic Support Tickets
  const ticketsToSeed = [
    {
      ticketNumber: 'TKT-202608-0001',
      userId: customer1.id,
      customerEmail: customer1.email,
      customerName: customer1.name,
      orderId: order1?.id,
      productId: product1?.id,
      type: 'DOWNLOAD_ISSUE',
      category: 'Download & Fulfillment',
      priority: 'CRITICAL',
      status: 'OPEN',
      source: 'ACCOUNT',
      subject: 'Google Drive permission error when downloading n8n Master Pack',
      description: 'I purchased the n8n Master Pack today but when I click the download button it gives a 403 Google Drive access denied error. Please help!',
      assignedToId: staff.id,
      assignedToName: staff.name,
      assignedToRole: 'SUPPORT_AGENT'
    },
    {
      ticketNumber: 'TKT-202608-0002',
      userId: customer2.id,
      customerEmail: customer2.email,
      customerName: customer2.name,
      orderId: order2?.id,
      productId: product2?.id,
      type: 'REFUND_REQUEST',
      category: 'Billing & Refunds',
      priority: 'HIGH',
      status: 'PENDING_FINANCE',
      source: 'PORTAL',
      subject: 'Refund Request: Incompatible CAD template format',
      description: 'The template was advertised as AutoCAD 2024 compatible but only opens in older versions without dynamic blocks. Requesting full refund.',
      assignedToId: staff.id,
      assignedToName: staff.name,
      assignedToRole: 'FINANCE_MANAGER'
    },
    {
      ticketNumber: 'TKT-202608-0003',
      userId: customer1.id,
      customerEmail: customer1.email,
      customerName: customer1.name,
      type: 'LICENCE_ISSUE',
      category: 'Licence & Activation',
      priority: 'HIGH',
      status: 'IN_PROGRESS',
      source: 'PORTAL',
      subject: 'Licence activation slot migration to new production server',
      description: 'We recently migrated our cloud instance and our licence key says maximum activation limit reached. Can you reset activation slots?',
      assignedToId: staff.id,
      assignedToName: staff.name,
      assignedToRole: 'SUPPORT_AGENT'
    },
    {
      ticketNumber: 'TKT-202608-0004',
      userId: customer2.id,
      customerEmail: customer2.email,
      customerName: customer2.name,
      type: 'CUSTOMER_REQUEST',
      category: 'Customer Account & Privacy',
      priority: 'MEDIUM',
      status: 'UNDER_REVIEW',
      source: 'ACCOUNT',
      subject: 'GDPR Personal Data Export Request',
      description: 'Please provide a complete export of all my personal transaction history and account telemetry under GDPR Article 15.',
      assignedToId: staff.id,
      assignedToName: staff.name,
      assignedToRole: 'SUPER_ADMIN'
    },
    {
      ticketNumber: 'TKT-202608-0005',
      userId: null,
      customerEmail: 'agency.partner@designpulse.co',
      customerName: 'Marcus Vance',
      isGuest: true,
      type: 'CONTACT_QUERY',
      category: 'Contact & Business',
      priority: 'LOW',
      status: 'NEW',
      source: 'WEB_CONTACT',
      subject: 'Agency bulk volume licensing enquiry',
      description: 'We are an agency with 25 designers. Do you offer an unlimited seat enterprise tier for the Complete Motion UI Bundle?',
      assignedToId: null
    },
    {
      ticketNumber: 'TKT-202608-0006',
      userId: customer1.id,
      customerEmail: customer1.email,
      customerName: customer1.name,
      orderId: order1?.id,
      productId: product1?.id,
      type: 'PAYMENT_QUERY',
      category: 'Payment & Invoicing',
      priority: 'HIGH',
      status: 'RESOLVED',
      source: 'CHECKOUT',
      subject: 'Duplicate payment deduction on UPI checkout',
      description: 'My UPI app debited twice for order #KDW-8821. Kindly check the second payment and refund.',
      assignedToId: staff.id,
      assignedToName: staff.name,
      assignedToRole: 'FINANCE_MANAGER',
      firstResponseAt: new Date(Date.now() - 48 * 60 * 60 * 1000),
      resolvedAt: new Date(Date.now() - 24 * 60 * 60 * 1000)
    }
  ];

  for (const t of ticketsToSeed) {
    const sla = calculateSlaDeadlines(t.priority);
    const createdTicket = await prisma.supportTicket.create({
      data: {
        ticketNumber: t.ticketNumber,
        userId: t.userId,
        customerEmail: t.customerEmail,
        customerName: t.customerName,
        isGuest: Boolean(t.isGuest),
        orderId: t.orderId,
        productId: t.productId,
        type: t.type,
        category: t.category,
        priority: t.priority,
        status: t.status,
        source: t.source,
        subject: t.subject,
        description: t.description,
        assignedToId: t.assignedToId,
        assignedToName: t.assignedToName,
        assignedToRole: t.assignedToRole,
        firstResponseAt: t.firstResponseAt,
        resolvedAt: t.resolvedAt,
        slaStatus: t.status === 'RESOLVED' ? 'COMPLETED' : 'HEALTHY',
        slaFirstResponseDueAt: sla.firstResponseDueAt,
        slaResolutionDueAt: sla.resolutionDueAt
      }
    });

    // Seed SLA Record
    await prisma.supportSlaRecord.create({
      data: {
        ticketId: createdTicket.id,
        priority: t.priority,
        firstResponseTargetMinutes: sla.firstResponseTargetMinutes,
        resolutionTargetMinutes: sla.resolutionTargetMinutes,
        firstResponseDueAt: sla.firstResponseDueAt,
        resolutionDueAt: sla.resolutionDueAt,
        firstResponseCompletedAt: t.firstResponseAt,
        resolutionCompletedAt: t.resolvedAt
      }
    });

    // Seed Initial Customer Message
    await prisma.supportMessage.create({
      data: {
        ticketId: createdTicket.id,
        senderId: t.userId,
        senderType: 'CUSTOMER',
        senderName: t.customerName,
        senderEmail: t.customerEmail,
        message: t.description,
        visibility: 'CUSTOMER',
        channel: 'PORTAL'
      }
    });

    // Seed Staff Reply for In-Progress / Resolved
    if (t.status === 'IN_PROGRESS' || t.status === 'RESOLVED' || t.status === 'PENDING_FINANCE') {
      await prisma.supportMessage.create({
        data: {
          ticketId: createdTicket.id,
          senderId: staff.id,
          senderType: 'AGENT',
          senderName: staff.name,
          senderEmail: staff.email,
          message: 'Hello! Thank you for reaching out. We are currently reviewing your account details and will have this resolved promptly.',
          visibility: 'CUSTOMER',
          channel: 'PORTAL'
        }
      });

      // Internal Note (isolated from customer)
      await prisma.supportMessage.create({
        data: {
          ticketId: createdTicket.id,
          senderId: staff.id,
          senderType: 'AGENT',
          senderName: staff.name,
          senderEmail: staff.email,
          message: 'Staff Note: Checked database logs. Payment capture ID verified with Razorpay gateway.',
          visibility: 'INTERNAL_NOTE',
          channel: 'PORTAL'
        }
      });
    }

    // Seed Customer Request if type is CUSTOMER_REQUEST
    if (t.type === 'CUSTOMER_REQUEST') {
      await prisma.customerRequest.create({
        data: {
          ticketId: createdTicket.id,
          customerId: t.userId,
          requestType: 'DATA_EXPORT',
          verificationStatus: 'VERIFIED',
          verificationMethod: 'LOGIN',
          status: 'UNDER_REVIEW',
          handledById: staff.id,
          handledByName: staff.name
        }
      });
    }

    // Seed CSAT for resolved ticket
    if (t.status === 'RESOLVED') {
      await prisma.supportSatisfaction.create({
        data: {
          ticketId: createdTicket.id,
          customerId: t.userId,
          customerEmail: t.customerEmail,
          rating: 5,
          comment: 'Extremely quick resolution by KDW support team. Got my duplicate charge refunded immediately!',
          isSatisfied: true
        }
      });
    }

    // Seed Initial Ticket Event
    await prisma.supportTicketEvent.create({
      data: {
        ticketId: createdTicket.id,
        eventType: 'CREATED',
        actorName: t.customerName,
        actorRole: 'CUSTOMER',
        newValue: 'NEW',
        reason: 'Ticket registered via ' + t.source
      }
    });
  }

  console.log(`Seeded ${ticketsToSeed.length} complete support tickets with SLA, messages, notes, and CSAT.`);
}

seedSupportSystem()
  .then(() => prisma.$disconnect())
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
