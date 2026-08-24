"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
const products = [
    {
        name: 'AI Small Business Automation Kit',
        slug: 'ai-small-business-automation-kit',
        categoryName: 'Automation',
        price: 1999,
        discountPrice: 1299,
        shortDescription: 'Transform the way you run your small business with a complete AI-powered automation toolkit.',
        description: 'Transform the way you run your small business with a complete AI-powered automation toolkit. This system helps you streamline customer support, lead management, sales follow-ups, content creation, email communication, and everyday business operations. Includes ready-to-use AI workflows, prompts, SOP templates, customer-management tools, and automation blueprints designed to save hours of repetitive work and help your business operate more efficiently.',
        features: 'AI customer-support workflows, Lead management system, Sales follow-up workflows, Email automation templates, Social media workflows, Customer management tools, SOP templates, AI prompt library, Automation blueprints, Business workflow guides',
        tags: 'AI, automation, small business, business tools, productivity, AI workflows, entrepreneurship, CRM, business automation',
        image: '/images/products/ai_business_automation_1786372746195.jpg'
    },
    {
        name: 'AI Marketing Manager System',
        slug: 'ai-marketing-manager-system',
        categoryName: 'Automation',
        price: 1999,
        discountPrice: 1299,
        shortDescription: 'Build a complete AI-powered marketing workflow without needing a large marketing team.',
        description: 'Build a complete AI-powered marketing workflow without needing a large marketing team. The AI Marketing Manager System brings together customer research, competitor analysis, content strategy, SEO planning, social-media campaigns, email marketing, advertising copy, and campaign tracking in one organized system. Designed for entrepreneurs, freelancers, marketers, and growing businesses that want to create better marketing campaigns faster.',
        features: 'Customer research workflow, Competitor analysis system, Marketing strategy planner, SEO planning tools, Content strategy system, Social media campaign planner, Email marketing workflows, Advertising copy workflows, Campaign tracker, AI marketing prompts',
        tags: 'AI marketing, marketing, SEO, content marketing, social media, email marketing, business, marketing automation',
        image: '/images/products/ai_marketing_manager_1786372760826.jpg'
    },
    {
        name: 'AI Sales & Lead Generation System',
        slug: 'ai-sales-lead-generation-system',
        categoryName: 'Business Templates',
        price: 2199,
        discountPrice: 1399,
        shortDescription: 'Turn scattered leads into an organized sales pipeline with an AI-powered lead-generation and sales system.',
        description: 'Turn scattered leads into an organized sales pipeline with an AI-powered lead-generation and sales system. Manage prospects, qualify leads, create personalized outreach, automate follow-ups, prepare proposals, and monitor your entire sales pipeline from one place. Includes AI sales workflows, outreach templates, CRM tools, follow-up sequences, and sales-performance tracking.',
        features: 'Lead database, Lead qualification workflow, CRM pipeline, Cold email templates, LinkedIn outreach workflows, Follow-up sequences, Proposal templates, AI sales prompts, Sales pipeline dashboard, Conversion tracking',
        tags: 'sales, lead generation, CRM, AI sales, outreach, cold email, business development, sales automation',
        image: '/images/products/ai_sales_system_1786372771879.jpg'
    },
    {
        name: 'UGC Creator Business Kit',
        slug: 'ugc-creator-business-kit',
        categoryName: 'Social Media Bundles',
        price: 1299,
        discountPrice: 799,
        shortDescription: 'Everything a UGC creator needs to build, manage, and grow a professional creator business.',
        description: 'Everything a UGC creator needs to build, manage, and grow a professional creator business. Create compelling brand pitches, organize campaigns, manage clients, present your portfolio, track payments, and plan content with ready-to-use resources. Includes UGC hooks, video scripts, pitch templates, media-kit layouts, rate cards, campaign trackers, and AI-assisted content workflows.',
        features: 'UGC portfolio structure, Media kit template, Rate card template, Brand pitch templates, Client tracker, Campaign tracker, Invoice template, Content planner, UGC hooks, UGC scripts, AI content workflows',
        tags: 'UGC, creator, content creator, influencer, social media, brand deals, creator business, TikTok, Instagram',
        image: '/images/products/ugc_creator_kit_1786372786640.jpg'
    },
    {
        name: 'Freelancer Business OS',
        slug: 'freelancer-business-os',
        categoryName: 'Business Templates',
        price: 1499,
        discountPrice: 999,
        shortDescription: 'Run your entire freelance business from one organized digital workspace.',
        description: 'Run your entire freelance business from one organized digital workspace. Manage leads, clients, projects, proposals, invoices, payments, expenses, deadlines, and business performance without juggling multiple disconnected tools. The Freelancer Business OS gives independent professionals a structured system for managing both client work and the business behind it.',
        features: 'Lead management, Client CRM, Project management, Proposal system, Invoice tracker, Payment tracker, Expense tracking, Deadline management, Client portal, Business performance dashboard',
        tags: 'freelancer, business OS, freelance, CRM, client management, project management, invoices, productivity',
        image: '/images/products/freelancer_os_1786372803471.jpg'
    },
    {
        name: 'Digital Agency Operating System',
        slug: 'digital-agency-operating-system',
        categoryName: 'Agency Kits',
        price: 2999,
        discountPrice: 1999,
        shortDescription: 'A complete operating system for digital agencies to manage clients, projects, teams, sales, and operations.',
        description: 'A complete operating system for digital agencies that need to manage clients, projects, teams, sales, finances, and recurring operations in one place. Organize client onboarding, proposals, project delivery, team responsibilities, invoices, assets, SOPs, and profitability while maintaining a clear view of agency performance.',
        features: 'Agency CRM, Sales pipeline, Client onboarding, Proposal management, Project management, Team management, Invoice management, SOP library, Financial tracking, Client portal, Agency performance dashboard',
        tags: 'agency, digital agency, business OS, client management, project management, CRM, agency operations, SaaS',
        image: '/images/products/agency_os_1786372831343.jpg'
    },
    {
        name: 'E-commerce Seller Dashboard',
        slug: 'ecommerce-seller-dashboard',
        categoryName: 'Business Templates',
        price: 899,
        discountPrice: 599,
        shortDescription: 'Take control of your online store with a centralized e-commerce management dashboard.',
        description: 'Take control of your online store with a centralized e-commerce management dashboard. Track products, inventory, orders, suppliers, costs, revenue, profit margins, and product performance in one organized system. Built for online sellers who want better visibility into what is selling, what is underperforming, and where their money is going.',
        features: 'Product database, Inventory tracker, Order tracker, Supplier tracker, Revenue dashboard, COGS tracking, Profit margin tracking, Best seller analysis, Slow moving product analysis, Reorder tracking, E-commerce KPI dashboard',
        tags: 'ecommerce, seller dashboard, inventory, Shopify, online store, orders, profit, products, business analytics',
        image: '/images/products/ecommerce_dashboard_1786372844210.jpg'
    },
    {
        name: 'Small Business Finance Dashboard',
        slug: 'small-business-finance-dashboard',
        categoryName: 'Business Templates',
        price: 999,
        discountPrice: 699,
        shortDescription: 'Simplify your business finances with a complete financial tracking and reporting system.',
        description: 'Simplify your business finances with a complete financial tracking and reporting system. Monitor income, expenses, profit, cash flow, invoices, outstanding payments, monthly performance, and financial trends through an easy-to-use dashboard. Designed for small-business owners who want a clear picture of their financial health without complicated accounting software.',
        features: 'Income tracker, Expense tracker, Profit and loss, Cash flow tracking, Invoice tracker, Outstanding payment tracker, Monthly reports, Financial dashboard, Revenue analysis, Expense analysis',
        tags: 'finance, small business, accounting, cash flow, profit, expenses, income, finance dashboard, bookkeeping',
        image: '/images/products/finance_dashboard_1786372857882.jpg'
    },
    {
        name: 'AI Content Creation System',
        slug: 'ai-content-creation-system',
        categoryName: 'AI Prompt Bundles',
        price: 1499,
        discountPrice: 999,
        shortDescription: 'Build a repeatable content engine using AI for idea generation, research, and scripting.',
        description: 'Build a repeatable content engine using AI. Move from idea generation to research, scripting, captions, publishing, and performance analysis through a structured content workflow. The system includes AI content prompts, hooks, scripts, content calendars, publishing trackers, and performance tools for creators, marketers, and businesses.',
        features: 'Content idea generator, Research workflow, Hook library, Script workflows, Caption generation, Content calendar, Publishing tracker, Content database, Performance tracker, AI content prompts',
        tags: 'AI content, content creation, ChatGPT, creator, marketing, content calendar, social media, AI tools',
        image: '/images/products/ai_content_system_1786372871748.jpg'
    },
    {
        name: 'Social Media Growth System',
        slug: 'social-media-growth-system',
        categoryName: 'Social Media Bundles',
        price: 999,
        discountPrice: 699,
        shortDescription: 'Create a consistent social-media strategy with a complete system for planning, producing, and analyzing.',
        description: 'Create a consistent social-media strategy with a complete system for planning, producing, publishing, and analyzing content. Includes content calendars, hooks, Reel ideas, caption frameworks, hashtag organization, campaign planning, content tracking, and performance analysis to help creators and businesses build a stronger social presence.',
        features: '90-day content calendar, Reel ideas, Hook library, Caption frameworks, Hashtag organizer, Campaign planner, Content tracker, Social analytics, Growth tracker, Content strategy guide',
        tags: 'social media, Instagram, TikTok, content calendar, social growth, marketing, creator, Reels',
        image: '/images/products/social_media_growth_1786372912072.jpg'
    },
    {
        name: 'Real Estate Agent Business Kit',
        slug: 'real-estate-agent-business-kit',
        categoryName: 'Agency Kits',
        price: 1399,
        discountPrice: 899,
        shortDescription: 'A complete digital toolkit for real estate professionals to manage leads, properties, and clients.',
        description: 'A complete digital toolkit for real estate professionals to manage leads, properties, clients, marketing, follow-ups, and daily business operations. Includes lead-management tools, property trackers, social-media resources, client communication templates, content planning tools, and AI-powered workflows for generating listings and marketing content.',
        features: 'Real estate CRM, Lead tracker, Property database, Client tracker, Follow-up system, Listing templates, Social media templates, Content calendar, AI property description workflows, Commission tracker',
        tags: 'real estate, realtor, property, CRM, real estate marketing, leads, listings, agent tools',
        image: '/images/products/real_estate_business_kit_1786372940636.jpg'
    },
    {
        name: 'Social Media Analytics Dashboard',
        slug: 'social-media-analytics-dashboard',
        categoryName: 'Social Media Bundles',
        price: 899,
        discountPrice: 599,
        shortDescription: 'Understand what is actually working across your social-media channels with a centralized dashboard.',
        description: 'Understand what is actually working across your social-media channels with a centralized performance dashboard. Track followers, reach, engagement, views, content performance, growth rates, and top-performing posts to make better decisions about your content strategy.',
        features: 'Follower tracking, Reach tracking, Engagement tracking, Views, Growth rate, Top performing content, Monthly comparison, Platform comparison, Content performance, Analytics dashboard',
        tags: 'social analytics, Instagram analytics, TikTok analytics, YouTube analytics, dashboard, marketing, growth',
        image: '/images/products/social_media_analytics.svg'
    },
    {
        name: 'Creator Content Management System',
        slug: 'creator-content-management-system',
        categoryName: 'Agency Kits',
        price: 1199,
        discountPrice: 799,
        shortDescription: 'Manage your entire content operation from one organized workspace.',
        description: 'Manage your entire content operation from one organized workspace. Capture ideas, plan content, write scripts, manage production, schedule publishing, organize assets, and monitor performance. Built for YouTubers, Instagram creators, TikTok creators, and independent content businesses.',
        features: 'Content idea database, Content calendar, Script management, Production pipeline, Asset library, Publishing tracker, Content status, Collaboration tools, Analytics tracker, Creator dashboard',
        tags: 'creator, YouTube, Instagram, TikTok, content management, content creator, creator workflow, content calendar',
        image: '/images/products/creator_content_management.svg'
    },
    {
        name: 'Freelancer Finance & Invoice System',
        slug: 'freelancer-finance-invoice-system',
        categoryName: 'Business Templates',
        price: 699,
        discountPrice: 499,
        shortDescription: 'Keep freelance finances simple and organized with a dedicated tracking system.',
        description: 'Keep freelance finances simple and organized with a dedicated system for tracking income, expenses, invoices, client payments, outstanding balances, and profitability. Built for freelancers who need an easy way to understand their business finances while spending less time maintaining spreadsheets.',
        features: 'Invoice tracker, Income tracker, Expense tracker, Client payment tracker, Outstanding balance tracker, Profit tracker, Monthly financial dashboard, Invoice templates, Payment status, Financial summary',
        tags: 'freelancer, invoice, finance, income, expenses, payments, accounting, freelance business',
        image: '/images/products/freelancer_finance_invoice.svg'
    },
    {
        name: 'Shopify & E-commerce Business Toolkit',
        slug: 'shopify-ecommerce-business-toolkit',
        categoryName: 'Business Templates',
        price: 1299,
        discountPrice: 799,
        shortDescription: 'Build a more organized e-commerce operation with a practical toolkit.',
        description: 'Build a more organized e-commerce operation with a practical toolkit for product research, pricing, inventory, suppliers, orders, profitability, and marketing performance. Designed for online store owners who want better control over their products and business numbers without complicated software.',
        features: 'Product research tracker, Product database, Inventory management, Supplier tracker, Pricing calculator, Profit calculator, Order tracker, Marketing tracker, Ad ROI tracker, Product performance dashboard',
        tags: 'Shopify, ecommerce, online store, product research, inventory, suppliers, profit, marketing, seller',
        image: '/images/products/shopify_ecommerce_toolkit.svg'
    }
];
async function seed() {
    console.log('Starting seed process for products to existing categories...');
    try {
        const allCategories = await prisma.category.findMany();
        for (const prod of products) {
            const category = allCategories.find(c => c.name === prod.categoryName);
            if (!category) {
                console.warn(`Category not found for product: ${prod.name} (Expected: ${prod.categoryName})`);
                continue;
            }
            const existingProduct = await prisma.product.findUnique({
                where: { slug: prod.slug }
            });
            if (existingProduct) {
                await prisma.product.update({
                    where: { slug: prod.slug },
                    data: {
                        name: prod.name,
                        description: prod.description,
                        shortDescription: prod.shortDescription,
                        price: prod.price,
                        discountPrice: prod.discountPrice,
                        thumbnail: prod.image,
                        features: JSON.stringify(prod.features.split(',').map(f => f.trim())),
                        tags: JSON.stringify(prod.tags.split(',').map(t => t.trim())),
                        categoryId: category.id,
                    }
                });
                console.log(`Updated product: ${prod.name}`);
            }
            else {
                await prisma.product.create({
                    data: {
                        name: prod.name,
                        slug: prod.slug,
                        description: prod.description,
                        shortDescription: prod.shortDescription,
                        price: prod.price,
                        discountPrice: prod.discountPrice,
                        thumbnail: prod.image,
                        features: JSON.stringify(prod.features.split(',').map(f => f.trim())),
                        tags: JSON.stringify(prod.tags.split(',').map(t => t.trim())),
                        categoryId: category.id,
                        status: 'DRAFT',
                        fileSize: '1.0 MB',
                        version: '1.0.0'
                    }
                });
                console.log(`Created product: ${prod.name}`);
            }
        }
        console.log('Seed completed successfully!');
    }
    catch (error) {
        console.error('Seed failed:', error);
    }
    finally {
        await prisma.$disconnect();
    }
}
seed();
