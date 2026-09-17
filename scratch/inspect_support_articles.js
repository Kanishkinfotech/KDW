const path = require("path");
const { PrismaClient } = require(path.join(__dirname, "../server/node_modules/@prisma/client"));
const prisma = new PrismaClient();

async function main() {
  const articles = await prisma.supportArticle.findMany({
    include: { category: true },
    orderBy: { createdAt: "asc" }
  });
  console.log("Total SupportArticles:", articles.length);
  articles.forEach((a, i) => {
    console.log(`${i+1}. [${a.id}] "${a.title}" (slug: ${a.slug}) | Cat: ${a.category?.name} | Views: ${a.views} | Helpful: ${a.helpfulVotes}/${a.unhelpfulVotes}`);
  });

  const categories = await prisma.supportCategory.findMany();
  console.log("\nTotal SupportCategories:", categories.length);
  categories.forEach(c => console.log(` - [${c.id}] ${c.name} (${c.slug})`));

  const faqs = await prisma.supportFAQ.findMany();
  console.log("\nTotal SupportFAQs:", faqs.length);
}
main()
  .catch(e => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
