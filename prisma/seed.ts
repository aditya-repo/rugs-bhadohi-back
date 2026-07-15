import { PrismaClient } from "@prisma/client";
import bcrypt from "bcrypt";
import dotenv from "dotenv";

dotenv.config();

const prisma = new PrismaClient();

async function main(): Promise<void> {
  const adminEmail = process.env.ADMIN_EMAIL ?? "admin@mail.com";
  const adminPassword = process.env.ADMIN_PASSWORD ?? "admin:";
  const adminName = process.env.ADMIN_NAME ?? "Admin";
  const passwordHash = await bcrypt.hash(adminPassword, 12);

  // Remove legacy admin if email changed
  await prisma.admin.deleteMany({ where: { email: "admin@rugcasa.com" } });

  const admin = await prisma.admin.upsert({
    where: { email: adminEmail },
    update: { passwordHash, name: adminName },
    create: { email: adminEmail, passwordHash, name: adminName },
  });

  console.log(`Admin seeded: ${admin.email}`);

  // Homepage storefront categories (featured)
  const homepageCategories = [
    {
      slug: "abstract",
      name: "Abstract",
      image:
        "https://images.unsplash.com/photo-1598928506311-c55ded91a20c?w=400&h=400&fit=crop",
      sortOrder: 1,
    },
    {
      slug: "irregular",
      name: "Irregular",
      image:
        "https://images.unsplash.com/photo-1583847268964-b28dc8f51f92?w=400&h=400&fit=crop",
      sortOrder: 2,
    },
    {
      slug: "traditional",
      name: "Traditional",
      image:
        "https://images.unsplash.com/photo-1762012751357-c3eba1d494e8?w=400&h=400&fit=crop",
      sortOrder: 3,
    },
    {
      slug: "modern",
      name: "Modern",
      image:
        "https://images.unsplash.com/photo-1618220179428-22790b461013?w=400&h=400&fit=crop",
      sortOrder: 4,
    },
    {
      slug: "transitional",
      name: "Transitional",
      image:
        "https://images.unsplash.com/photo-1616046229478-9901c5536a45?w=400&h=400&fit=crop",
      sortOrder: 5,
    },
    {
      slug: "patchwork",
      name: "Patchwork",
      image:
        "https://images.unsplash.com/photo-1578683010236-d716f9a3f461?w=400&h=400&fit=crop",
      sortOrder: 6,
    },
  ];

  for (const item of homepageCategories) {
    await prisma.category.upsert({
      where: { slug: item.slug },
      update: {
        name: item.name,
        image: item.image,
        status: "ACTIVE",
        isFeatured: true,
        sortOrder: item.sortOrder,
        deletedAt: null,
      },
      create: {
        name: item.name,
        slug: item.slug,
        image: item.image,
        status: "ACTIVE",
        isFeatured: true,
        sortOrder: item.sortOrder,
      },
    });
  }

  // Keep older product-demo categories, but off the homepage strip
  await prisma.category.updateMany({
    where: {
      slug: { in: ["living-room", "bedroom", "runners", "outdoor"] },
    },
    data: { isFeatured: false },
  });

  const categories = await Promise.all([
    prisma.category.upsert({
      where: { slug: "living-room" },
      update: {},
      create: {
        name: "Living Room",
        slug: "living-room",
        status: "ACTIVE",
        sortOrder: 10,
        isFeatured: false,
      },
    }),
    prisma.category.upsert({
      where: { slug: "bedroom" },
      update: {},
      create: { name: "Bedroom", slug: "bedroom", status: "ACTIVE", sortOrder: 11 },
    }),
    prisma.category.upsert({
      where: { slug: "runners" },
      update: {},
      create: { name: "Runners", slug: "runners", status: "ACTIVE", sortOrder: 12 },
    }),
    prisma.category.upsert({
      where: { slug: "outdoor" },
      update: {},
      create: { name: "Outdoor", slug: "outdoor", status: "DRAFT", sortOrder: 13 },
    }),
  ]);

  console.log(`Homepage categories seeded: ${homepageCategories.length}`);

  const defaultCollections = [
    {
      title: "Dreamers",
      slug: "dreamers",
      sortOrder: 1,
      description: "Dreamers artist rug with abstract face motifs",
    },
    {
      title: "Metamorphosis",
      slug: "metamorphosis",
      sortOrder: 2,
      description: "Metamorphosis artist rug in blue and yellow tones",
    },
    {
      title: "Caminantes",
      slug: "caminantes",
      sortOrder: 3,
      description: "Caminantes artist rugs with organic abstract patterns",
    },
    {
      title: "Aurora",
      slug: "aurora",
      sortOrder: 4,
      description: "Aurora artist rug with soft tonal gradients",
    },
    {
      title: "Solstice",
      slug: "solstice",
      sortOrder: 5,
      description: "Solstice artist rug with warm textured weave",
    },
  ];

  // Remove legacy room-based collections so artist collections own the list
  await prisma.collection.deleteMany({
    where: {
      slug: {
        in: ["living-room", "bedroom", "runners", "outdoor", "handwoven", "vintage"],
      },
    },
  });

  for (const item of defaultCollections) {
    await prisma.collection.upsert({
      where: { slug: item.slug },
      update: {
        title: item.title,
        description: item.description,
        // Images are uploaded manually via dashboard → Cloudinary
        status: "ACTIVE",
        sortOrder: item.sortOrder,
        deletedAt: null,
      },
      create: {
        title: item.title,
        slug: item.slug,
        description: item.description,
        status: "ACTIVE",
        sortOrder: item.sortOrder,
      },
    });
  }

  console.log(`Collections seeded: ${defaultCollections.length}`);

  const artistRugs = [
    {
      title: "Dreamers",
      slug: "dreamers-artist-rug",
      shortDescription: "Dreamers artist rug with abstract face motifs",
      dimensions: "10x6'9",
      price: 506260,
      sku: "RB-AC-1-01",
    },
    {
      title: "Metamorphosis",
      slug: "metamorphosis-artist-rug",
      shortDescription: "Metamorphosis artist rug in blue and yellow tones",
      dimensions: "5'7x8'2",
      price: 580190,
      sku: "RB-AC-2-01",
    },
    {
      title: "Caminantes",
      slug: "caminantes-artist-rug-5-10x10-5",
      shortDescription: "Caminantes artist rug with red and blue organic pattern",
      dimensions: "5'10x10'5",
      price: 1163080,
      sku: "RB-AC-3-01",
    },
    {
      title: "Caminantes",
      slug: "caminantes-artist-rug-6-3x10-3",
      shortDescription: "Caminantes artist rug in darker abstract tones",
      dimensions: "6'3x10'3",
      price: 1279390,
      sku: "RB-AC-4-01",
    },
    {
      title: "Caminantes",
      slug: "caminantes-artist-rug-7-10x7-11",
      shortDescription: "Caminantes artist rug with orange and blue accents",
      dimensions: "7'10x7'11",
      price: 1482660,
      sku: "RB-AC-5-01",
    },
    {
      title: "Aurora",
      slug: "aurora-artist-rug",
      shortDescription: "Aurora artist rug with soft tonal gradients",
      dimensions: "8x10",
      price: 945000,
      sku: "RB-AC-6-01",
    },
    {
      title: "Solstice",
      slug: "solstice-artist-rug",
      shortDescription: "Solstice artist rug with warm textured weave",
      dimensions: "6x9",
      price: 728500,
      sku: "RB-AC-7-01",
    },
  ] as const;

  const material = "hand knotted - wool and bamboo silk";
  const abstractCategory = await prisma.category.findFirst({
    where: { slug: "abstract", deletedAt: null },
  });

  for (const [index, rug] of artistRugs.entries()) {
    await prisma.product.upsert({
      where: { slug: rug.slug },
      update: {
        title: rug.title,
        shortDescription: rug.shortDescription,
        description: `${rug.shortDescription}. ${material}. Size ${rug.dimensions}.`,
        collection: rug.title,
        brand: "Rugs Bhadohi",
        designer: "Artist Collection",
        isFeatured: true,
        status: "PUBLISHED",
        deletedAt: null,
        categoryId: abstractCategory?.id ?? categories[0].id,
      },
      create: {
        title: rug.title,
        slug: rug.slug,
        skuPrefix: `RB-AC-${index + 1}`,
        shortDescription: rug.shortDescription,
        description: `${rug.shortDescription}. ${material}. Size ${rug.dimensions}.`,
        categoryId: abstractCategory?.id ?? categories[0].id,
        collection: rug.title,
        origin: "India",
        brand: "Rugs Bhadohi",
        designer: "Artist Collection",
        isFeatured: true,
        status: "PUBLISHED",
        seo: {
          create: {
            seoTitle: `${rug.title} Artist Rug | Rugs Bhadohi`,
            seoDescription: rug.shortDescription,
            sitemapPriority: 0.8,
            changeFrequency: "weekly",
          },
        },
        // Product images uploaded manually via dashboard → Cloudinary
        variants: {
          create: [
            {
              sku: rug.sku,
              price: rug.price,
              stock: 3,
              attributes: {
                size: rug.dimensions,
                material,
                technique: "Hand-knotted",
                origin: "India",
              },
            },
          ],
        },
      },
    });
  }

  console.log(`Artist collection products seeded: ${artistRugs.length}`);

  const product = await prisma.product.upsert({
    where: { slug: "vintage-distressed-rug" },
    update: {},
    create: {
      title: "Vintage Distressed Rug",
      slug: "vintage-distressed-rug",
      skuPrefix: "RC-VD",
      shortDescription: "Handcrafted vintage-style distressed rug",
      description: "A beautiful vintage distressed rug perfect for living spaces.",
      categoryId: categories[0].id,
      collection: null,
      origin: "India",
      brand: "Rugs Bhadohi",
      isFeatured: true,
      status: "PUBLISHED",
      seo: {
        create: {
          seoTitle: "Vintage Distressed Rug | Rugs Bhadohi",
          seoDescription: "Shop vintage distressed rugs handcrafted in India.",
          sitemapPriority: 0.8,
          changeFrequency: "weekly",
        },
      },
      variants: {
        create: [
          {
            sku: "RC-VD-58-5X7",
            price: 3199,
            salePrice: 2799,
            stock: 24,
            attributes: {
              size: "5x7",
              material: "Wool",
              color: "Beige",
              technique: "Hand-knotted",
              style: "Geometric",
              thickness: "Medium pile",
              origin: "India",
            },
          },
          {
            sku: "RC-VD-58-8X10",
            price: 5499,
            stock: 12,
            attributes: {
              size: "8x10",
              material: "Wool",
              color: "Beige",
              technique: "Hand-knotted",
              style: "Geometric",
              thickness: "Medium pile",
              origin: "India",
            },
          },
        ],
      },
    },
  });

  const customers = await Promise.all([
    prisma.customer.upsert({
      where: { email: "priya.n@example.com" },
      update: {},
      create: { email: "priya.n@example.com", firstName: "Priya", lastName: "Nair", totalSpend: 12100 },
    }),
    prisma.customer.upsert({
      where: { email: "rahul.m@example.com" },
      update: {},
      create: { email: "rahul.m@example.com", firstName: "Rahul", lastName: "Mehta", totalSpend: 8499 },
    }),
  ]);

  const order = await prisma.order.upsert({
    where: { orderNumber: "RC12891" },
    update: {},
    create: {
      orderNumber: "RC12891",
      customerId: customers[0].id,
      status: "CONFIRMED",
      paymentStatus: "PAID",
      paymentMethod: "UPI",
      subtotal: 4999,
      tax: 599,
      total: 4999,
      items: {
        create: [{
          productId: product.id,
          title: product.title,
          sku: "RC-VD-58-5X7",
          quantity: 1,
          price: 4999,
          total: 4999,
        }],
      },
      statusHistory: { create: [{ status: "PENDING" }, { status: "CONFIRMED" }] },
    },
  });

  await prisma.review.upsert({
    where: { id: "seed-review-1" },
    update: {},
    create: {
      id: "seed-review-1",
      productId: product.id,
      customerId: customers[0].id,
      orderId: order.id,
      rating: 5,
      content: "Beautiful quality, colours match the photos.",
      status: "PENDING",
      isVerifiedPurchase: true,
    },
  });

  await prisma.returnRequest.upsert({
    where: { requestNumber: "RET101" },
    update: {},
    create: {
      requestNumber: "RET101",
      orderId: order.id,
      customerId: customers[0].id,
      type: "RETURN",
      status: "PENDING",
      reason: "Size mismatch",
      amount: 4999,
      statusHistory: { create: [{ status: "PENDING" }] },
    },
  });

  await prisma.banner.upsert({
    where: { id: "seed-banner-1" },
    update: {},
    create: {
      id: "seed-banner-1",
      title: "Summer Collection",
      type: "HOMEPAGE",
      image:
        "https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?w=1600&h=900&fit=crop",
      linkUrl: "/collections/summer",
      buttonText: "Shop Now",
      sortOrder: 1,
      status: "ENABLED",
    },
  });

  const defaultSettings = [
    { key: "websiteName", value: { value: "Rugs Bhadohi" }, group: "general" },
    { key: "currency", value: { value: "INR" }, group: "commerce" },
    { key: "invoicePrefix", value: { value: "INV" }, group: "commerce" },
  ];

  for (const setting of defaultSettings) {
    await prisma.siteSetting.upsert({
      where: { key: setting.key },
      update: {},
      create: setting,
    });
  }

  console.log("Seed completed successfully");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
