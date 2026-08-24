// Define column structures and mock data for all generic admin pages

export type TableColumn = {
  key: string;
  label: string;
  type?: 'text' | 'badge' | 'currency' | 'date';
};

export type TableConfig = {
  title: string;
  description: string;
  columns: TableColumn[];
  data: any[];
};

export const adminTableConfig: Record<string, TableConfig> = {
  bundles: {
    title: 'Bundles',
    description: 'Manage product bundles and collections.',
    columns: [
      { key: 'name', label: 'Bundle Name' },
      { key: 'products', label: 'Products Included' },
      { key: 'price', label: 'Price', type: 'currency' },
      { key: 'status', label: 'Status', type: 'badge' }
    ],
    data: [
      { id: '1', name: 'UI/UX Mega Pack', products: 12, price: 149.99, status: 'Active' },
      { id: '2', name: 'Frontend Developer Starter', products: 5, price: 89.00, status: 'Active' },
      { id: '3', name: 'Ultimate Icons Bundle', products: 25, price: 49.00, status: 'Hidden' },
    ]
  },
  drive: {
    title: 'Google Drive Files',
    description: 'Manage synced files from Google Drive.',
    columns: [
      { key: 'filename', label: 'File Name' },
      { key: 'size', label: 'Size' },
      { key: 'linkedProduct', label: 'Linked Product' },
      { key: 'status', label: 'Sync Status', type: 'badge' }
    ],
    data: [
      { id: '1', filename: 'Figma_UI_Kit_v2.zip', size: '245 MB', linkedProduct: 'Ultimate UI Kit', status: 'Synced' },
      { id: '2', filename: 'React_Dashboard_Source.zip', size: '12 MB', linkedProduct: 'Admin Dashboard', status: 'Synced' },
      { id: '3', filename: 'Video_Course_Part1.mp4', size: '1.2 GB', linkedProduct: 'Mastering React', status: 'Pending' },
    ]
  },
  invoices: {
    title: 'Invoices',
    description: 'View and manage customer invoices.',
    columns: [
      { key: 'invoiceId', label: 'Invoice ID' },
      { key: 'customer', label: 'Customer' },
      { key: 'amount', label: 'Amount', type: 'currency' },
      { key: 'date', label: 'Date', type: 'date' },
      { key: 'status', label: 'Status', type: 'badge' }
    ],
    data: [
      { id: '1', invoiceId: 'INV-2024-001', customer: 'John Doe', amount: 49.00, date: '2024-07-23', status: 'Paid' },
      { id: '2', invoiceId: 'INV-2024-002', customer: 'Sarah Connor', amount: 29.00, date: '2024-07-22', status: 'Paid' },
      { id: '3', invoiceId: 'INV-2024-003', customer: 'TechCorp LLC', amount: 999.00, date: '2024-07-20', status: 'Overdue' },
    ]
  },
  payments: {
    title: 'Payments',
    description: 'Transaction logs from Razorpay and Stripe.',
    columns: [
      { key: 'transactionId', label: 'Transaction ID' },
      { key: 'gateway', label: 'Gateway' },
      { key: 'amount', label: 'Amount', type: 'currency' },
      { key: 'status', label: 'Status', type: 'badge' }
    ],
    data: [
      { id: '1', transactionId: 'txn_1P1234567890', gateway: 'Stripe', amount: 49.00, status: 'Successful' },
      { id: '2', transactionId: 'pay_OM1234567890', gateway: 'Razorpay', amount: 29.00, status: 'Successful' },
      { id: '3', transactionId: 'txn_1P0987654321', gateway: 'Stripe', amount: 99.00, status: 'Failed' },
    ]
  },
  coupons: {
    title: 'Coupons',
    description: 'Manage discount codes and promotions.',
    columns: [
      { key: 'code', label: 'Coupon Code' },
      { key: 'discount', label: 'Discount' },
      { key: 'usage', label: 'Usage Limit' },
      { key: 'status', label: 'Status', type: 'badge' }
    ],
    data: [
      { id: '1', code: 'SUMMER24', discount: '20% OFF', usage: '45 / 100', status: 'Active' },
      { id: '2', code: 'WELCOME10', discount: '10% OFF', usage: 'Unlimited', status: 'Active' },
      { id: '3', code: 'BLACKFRIDAY', discount: '50% OFF', usage: '500 / 500', status: 'Expired' },
    ]
  },
  guests: {
    title: 'Guest Purchases',
    description: 'Manage orders made by non-registered users.',
    columns: [
      { key: 'email', label: 'Email' },
      { key: 'purchases', label: 'Total Purchases' },
      { key: 'spent', label: 'Total Spent', type: 'currency' }
    ],
    data: [
      { id: '1', email: 'guest123@gmail.com', purchases: 1, spent: 49.00 },
      { id: '2', email: 'hello@agency.co', purchases: 3, spent: 147.00 },
    ]
  },
  memberships: {
    title: 'Memberships',
    description: 'Manage subscription tiers and members.',
    columns: [
      { key: 'plan', label: 'Plan Name' },
      { key: 'members', label: 'Active Members' },
      { key: 'mrr', label: 'MRR', type: 'currency' },
      { key: 'status', label: 'Status', type: 'badge' }
    ],
    data: [
      { id: '1', plan: 'Pro Monthly', members: 450, mrr: 4500.00, status: 'Active' },
      { id: '2', plan: 'Lifetime Access', members: 120, mrr: 0, status: 'Active' },
    ]
  },
  affiliates: {
    title: 'Affiliates',
    description: 'Manage affiliate marketers and payouts.',
    columns: [
      { key: 'name', label: 'Affiliate Name' },
      { key: 'referrals', label: 'Total Referrals' },
      { key: 'earnings', label: 'Total Earnings', type: 'currency' },
      { key: 'status', label: 'Status', type: 'badge' }
    ],
    data: [
      { id: '1', name: 'Jane Marketer', referrals: 145, earnings: 1450.00, status: 'Active' },
      { id: '2', name: 'Tech Reviews Inc', referrals: 890, earnings: 8900.00, status: 'Active' },
    ]
  },
  downloads: {
    title: 'Downloads',
    description: 'Track file access and download limits.',
    columns: [
      { key: 'customer', label: 'Customer' },
      { key: 'product', label: 'Product' },
      { key: 'ip', label: 'IP Address' },
      { key: 'date', label: 'Date', type: 'date' }
    ],
    data: [
      { id: '1', customer: 'John Doe', product: 'Ultimate UI Kit', ip: '192.168.1.1', date: '2024-07-23' },
      { id: '2', customer: 'Sarah Connor', product: 'ChatGPT Prompts', ip: '10.0.0.4', date: '2024-07-23' },
    ]
  },
  licenses: {
    title: 'Licenses',
    description: 'Manage software and asset licenses.',
    columns: [
      { key: 'key', label: 'License Key' },
      { key: 'type', label: 'License Type' },
      { key: 'customer', label: 'Customer' },
      { key: 'status', label: 'Status', type: 'badge' }
    ],
    data: [
      { id: '1', key: 'KDW-PRO-XXXX-1234', type: 'Commercial', customer: 'John Doe', status: 'Active' },
      { id: '2', key: 'KDW-AGN-YYYY-5678', type: 'Agency', customer: 'TechCorp LLC', status: 'Active' },
      { id: '3', key: 'KDW-PER-ZZZZ-9012', type: 'Personal', customer: 'Sarah Connor', status: 'Revoked' },
    ]
  },
  'landing-pages': {
    title: 'Landing Pages',
    description: 'Manage custom sales pages for specific products.',
    columns: [
      { key: 'page', label: 'Page Name' },
      { key: 'url', label: 'URL Slug' },
      { key: 'conversion', label: 'Conversion Rate' },
      { key: 'status', label: 'Status', type: 'badge' }
    ],
    data: [
      { id: '1', page: 'Black Friday Sale', url: '/black-friday', conversion: '8.4%', status: 'Published' },
      { id: '2', page: 'UI Kit Launch', url: '/ui-kit-launch', conversion: '4.2%', status: 'Published' },
      { id: '3', page: 'Summer Promo', url: '/summer-promo', conversion: '0%', status: 'Draft' },
    ]
  },
  emails: {
    title: 'Email Center',
    description: 'Manage templates and newsletter broadcasts.',
    columns: [
      { key: 'campaign', label: 'Campaign / Template Name' },
      { key: 'type', label: 'Type' },
      { key: 'sent', label: 'Sent Count' },
      { key: 'status', label: 'Status', type: 'badge' }
    ],
    data: [
      { id: '1', campaign: 'Order Confirmation', type: 'Transactional', sent: 15430, status: 'Active' },
      { id: '2', campaign: 'July Newsletter', type: 'Broadcast', sent: 8400, status: 'Completed' },
      { id: '3', campaign: 'Abandoned Cart', type: 'Automated', sent: 1200, status: 'Active' },
    ]
  },
  blog: {
    title: 'Blog',
    description: 'Manage articles, tutorials, and announcements.',
    columns: [
      { key: 'title', label: 'Post Title' },
      { key: 'author', label: 'Author' },
      { key: 'views', label: 'Views' },
      { key: 'status', label: 'Status', type: 'badge' }
    ],
    data: [
      { id: '1', title: 'Top 10 Figma Tips', author: 'Kanishk', views: 4500, status: 'Published' },
      { id: '2', title: 'Why use Tailwind CSS?', author: 'Kanishk', views: 3200, status: 'Published' },
      { id: '3', title: 'Upcoming 2025 Features', author: 'Kanishk', views: 0, status: 'Draft' },
    ]
  },
  seo: {
    title: 'SEO Settings',
    description: 'Manage global metadata and sitemaps.',
    columns: [
      { key: 'page', label: 'Target Page' },
      { key: 'title', label: 'Meta Title' },
      { key: 'score', label: 'SEO Score' },
      { key: 'status', label: 'Status', type: 'badge' }
    ],
    data: [
      { id: '1', page: 'Homepage', title: 'KDW - Premium Digital Assets', score: '98/100', status: 'Optimized' },
      { id: '2', page: 'Shop', title: 'Browse All Templates & UI Kits', score: '95/100', status: 'Optimized' },
      { id: '3', page: 'Blog', title: 'Design & Dev Tutorials', score: '70/100', status: 'Needs Work' },
    ]
  },
  support: {
    title: 'Support Tickets',
    description: 'Handle customer inquiries and issues.',
    columns: [
      { key: 'ticketId', label: 'Ticket ID' },
      { key: 'subject', label: 'Subject' },
      { key: 'customer', label: 'Customer' },
      { key: 'status', label: 'Status', type: 'badge' }
    ],
    data: [
      { id: '1', ticketId: '#TK-1001', subject: 'Cannot download UI kit', customer: 'John Doe', status: 'Open' },
      { id: '2', ticketId: '#TK-1002', subject: 'Invoice for order 2024-002', customer: 'Sarah Connor', status: 'Resolved' },
      { id: '3', ticketId: '#TK-1003', subject: 'Refund request', customer: 'TechCorp LLC', status: 'Pending' },
    ]
  },
  notifications: {
    title: 'Notifications',
    description: 'System alerts and admin announcements.',
    columns: [
      { key: 'message', label: 'Notification Message' },
      { key: 'type', label: 'Type' },
      { key: 'date', label: 'Date', type: 'date' }
    ],
    data: [
      { id: '1', message: 'New order #ORD-2024-001 received', type: 'Order', date: '2024-07-23' },
      { id: '2', message: 'System backup completed successfully', type: 'System', date: '2024-07-23' },
      { id: '3', message: 'Failed payment from john@example.com', type: 'Alert', date: '2024-07-22' },
    ]
  },
  admins: {
    title: 'Administrators',
    description: 'Manage staff accounts and access levels.',
    columns: [
      { key: 'name', label: 'Name' },
      { key: 'email', label: 'Email' },
      { key: 'role', label: 'Role' },
      { key: 'status', label: 'Status', type: 'badge' }
    ],
    data: [
      { id: '1', name: 'Kanishk', email: 'admin@kdw.com', role: 'Super Admin', status: 'Active' },
      { id: '2', name: 'Alice Smith', email: 'support@kdw.com', role: 'Support Agent', status: 'Active' },
      { id: '3', name: 'Bob Jones', email: 'marketing@kdw.com', role: 'Marketing', status: 'Suspended' },
    ]
  },
  roles: {
    title: 'Roles & Permissions',
    description: 'Configure access controls for staff members.',
    columns: [
      { key: 'roleName', label: 'Role Name' },
      { key: 'users', label: 'Assigned Users' },
      { key: 'permissions', label: 'Permissions Level' },
    ],
    data: [
      { id: '1', roleName: 'Super Admin', users: 1, permissions: 'All Access' },
      { id: '2', roleName: 'Support Agent', users: 3, permissions: 'Read/Write Support' },
      { id: '3', roleName: 'Marketing', users: 2, permissions: 'Read/Write Marketing' },
    ]
  },
  audit: {
    title: 'Audit Logs',
    description: 'Security logs tracking all admin actions.',
    columns: [
      { key: 'action', label: 'Action Performed' },
      { key: 'admin', label: 'Admin User' },
      { key: 'ip', label: 'IP Address' },
      { key: 'date', label: 'Timestamp', type: 'date' }
    ],
    data: [
      { id: '1', action: 'Deleted product "Old Theme"', admin: 'Kanishk', ip: '192.168.1.1', date: '2024-07-23 14:30' },
      { id: '2', action: 'Issued refund for #ORD-004', admin: 'Alice Smith', ip: '10.0.0.5', date: '2024-07-23 11:15' },
      { id: '3', action: 'Logged in', admin: 'Kanishk', ip: '192.168.1.1', date: '2024-07-23 09:00' },
    ]
  },
  health: {
    title: 'System Health',
    description: 'Server status and API connection health.',
    columns: [
      { key: 'service', label: 'Service Name' },
      { key: 'ping', label: 'Latency (ms)' },
      { key: 'uptime', label: 'Uptime' },
      { key: 'status', label: 'Status', type: 'badge' }
    ],
    data: [
      { id: '1', service: 'PostgreSQL Database', ping: '12ms', uptime: '99.99%', status: 'Healthy' },
      { id: '2', service: 'Stripe API', ping: '45ms', uptime: '100%', status: 'Healthy' },
      { id: '3', service: 'Google Drive API', ping: '120ms', uptime: '99.95%', status: 'Healthy' },
      { id: '4', service: 'Redis Cache', ping: '2ms', uptime: '99.99%', status: 'Healthy' },
    ]
  }
};
