const path = require("path");
const { PrismaClient } = require(path.join(__dirname, "../server/node_modules/@prisma/client"));
const prisma = new PrismaClient();

async function runTests() {
  console.log("=== Starting Articles Lifecycle and Sync Verification ===");
  const initialCount = await prisma.blogPost.count();
  console.log("Initial Blog Post Count:", initialCount);

  const testSlug = "test-verification-article-" + Date.now();
  const testPost = await prisma.blogPost.create({
    data: {
      title: "Automated Test: Enterprise Digital Pipeline Workflow",
      slug: testSlug,
      excerpt: "Comprehensive blueprint verifying article publishing lifecycle and database sync.",
      authorName: "Senior Workflow Specialist",
      readingTimeMinutes: 7,
      status: "PUBLISHED",
      publishedAt: new Date(),
      isFeatured: true,
      tags: ["Automation", "DevOps", "Verification"],
      contentJson: [
        { id: "b1", type: "heading", level: 2, text: "01. System Architecture", title: "01. System Architecture" },
        { id: "b2", type: "paragraph", text: "This pipeline orchestrates real-time verification across frontend and database.", content: "This pipeline orchestrates real-time verification across frontend and database." },
        { id: "b3", type: "checklist", title: "Production Checkpoints", items: ["Zero fake data", "Real-time database sync", "Intuitive non-blocking publishing"], features: ["Zero fake data", "Real-time database sync", "Intuitive non-blocking publishing"] },
        { id: "b4", type: "quote", text: "Reliability is built from simplicity.", content: "Reliability is built from simplicity.", subtitle: "Core Engineering Principle" }
      ]
    }
  });

  console.log("Created Article ID:", testPost.id);
  console.log("Created Article Title:", testPost.title);
  console.log("Created Article Status:", testPost.status);
  console.log("Created Article isFeatured:", testPost.isFeatured);

  const incrementedCount = await prisma.blogPost.count();
  console.log("Post Count After Creation:", incrementedCount);
  if (incrementedCount !== initialCount + 1) {
    throw new Error("Count did not increment properly!");
  }
  console.log("PASS: Blog Post count incremented accurately (" + initialCount + " -> " + incrementedCount + ")");

  const updatedPost = await prisma.blogPost.update({
    where: { id: testPost.id },
    data: {
      title: "Automated Test: Enterprise Digital Pipeline Workflow (Updated)",
      readingTimeMinutes: 9,
      isFeatured: false
    }
  });
  console.log("Updated Article Title:", updatedPost.title);
  console.log("Updated Article Reading Time:", updatedPost.readingTimeMinutes);
  console.log("Updated Article isFeatured:", updatedPost.isFeatured);
  if (updatedPost.readingTimeMinutes !== 9 || updatedPost.isFeatured !== false) {
    throw new Error("Article update failed!");
  }
  console.log("PASS: Article update persisted cleanly");

  await prisma.contentRevision.deleteMany({ where: { contentType: "BLOG", contentId: testPost.id } });
  await prisma.blogPost.delete({ where: { id: testPost.id } });

  const finalCount = await prisma.blogPost.count();
  console.log("Final Post Count After Cleanup:", finalCount);
  if (finalCount !== initialCount) {
    throw new Error("Count did not decrement back to initial count!");
  }
  console.log("PASS: Blog Post count accurately restored to " + initialCount);
  console.log("=== All 6 Articles Lifecycle and Sync Tests Passed Successfully! ===");
}
runTests()
  .catch(e => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
