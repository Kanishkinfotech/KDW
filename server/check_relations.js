const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();

async function run() {
  const items = await p.orderItem.findMany({
    select: { id: true, productId: true, orderId: true }
  });
  console.log('OrderItems count:', items.length, items);
  const reviews = await p.review.findMany({
    select: { id: true, productId: true }
  });
  console.log('Reviews count:', reviews.length, reviews);
  const bundles = await p.bundleProduct.findMany({
    select: { id: true, productId: true, bundleId: true }
  });
  console.log('BundleProducts count:', bundles.length, bundles);
  const tokens = await p.downloadToken.findMany({
    select: { id: true, productId: true }
  });
  console.log('DownloadTokens count:', tokens.length, tokens);
}

run().catch(console.error).finally(() => p.$disconnect());
