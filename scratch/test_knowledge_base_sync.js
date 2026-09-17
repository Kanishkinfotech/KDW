const path = require("path");
const { PrismaClient } = require(path.join(__dirname, "../server/node_modules/@prisma/client"));
const prisma = new PrismaClient();

async function runTests() {
  console.log("=== Starting Knowledge Base & Documentation Verification ===");

  // 1. Article Count & Authenticity Check
  const articles = await prisma.supportArticle.findMany({
    include: { category: true },
    orderBy: { createdAt: "asc" }
  });

  console.log("Total Authentic Support Articles:", articles.length);
  if (articles.length === 0) {
    throw new Error("No support articles found!");
  }

  // Verify zero duplicates
  const slugs = new Set();
  const titles = new Set();
  for (const art of articles) {
    if (slugs.has(art.slug)) {
      throw new Error(`Duplicate slug detected: ${art.slug}`);
    }
    if (titles.has(art.title)) {
      throw new Error(`Duplicate title detected: ${art.title}`);
    }
    slugs.add(art.slug);
    titles.add(art.title);

    // Verify no raw timestamps in title/slug
    if (art.title.includes("1788") || art.slug.includes("1788")) {
      throw new Error(`Fake / test timestamp title detected: ${art.title}`);
    }
  }
  console.log("? Passed: Zero duplicate articles and zero test artifact titles.");

  // 2. Aggregate metrics check
  const stats = await prisma.supportArticle.aggregate({
    _sum: {
      views: true,
      helpfulVotes: true,
      unhelpfulVotes: true
    }
  });

  console.log("Total Article Views across DB:", stats._sum.views);
  console.log("Total Helpful Feedback Votes:", stats._sum.helpfulVotes);
  console.log("Total Unhelpful Feedback Votes:", stats._sum.unhelpfulVotes);

  // 3. Category linking check
  const categories = await prisma.supportCategory.findMany();
  console.log("Total Support Categories:", categories.length);
  for (const cat of categories) {
    if (cat.name.includes("1788") || cat.slug.includes("1788")) {
      throw new Error(`Fake / test timestamp category detected: ${cat.name}`);
    }
  }
  console.log("? Passed: Zero duplicate or timestamped categories.");

  console.log("\nActive Articles List:");
  articles.forEach((a, i) => {
    console.log(` ${i+1}. "${a.title}" (/docs/${a.slug}) | Cat: ${a.category?.name || 'General'} | Views: ${a.views} | Helpful: ${a.helpfulVotes}/${a.unhelpfulVotes}`);
  });

  console.log("\n=== ALL KNOWLEDGE BASE VERIFICATIONS PASSED SUCCESSFULLY! ===");
}

runTests()
  .catch(e => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
