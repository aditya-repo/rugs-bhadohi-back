import swaggerJsdoc from "swagger-jsdoc";
import { env } from "./env";
import { swaggerPaths } from "./swagger.paths";

const options: swaggerJsdoc.Options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "Rug Casa Admin API",
      version: "1.0.0",
      description: [
        "Complete admin backend API for Rug Casa ecommerce platform.",
        "",
        "### Authentication",
        "1. Call `POST /api/v1/auth/login` with your admin credentials",
        "2. Copy **only** the `accessToken` string from `data.accessToken` in the response",
        "3. Click the green **Authorize** button (top right)",
        "4. Paste the token **without** the word `Bearer` — Swagger adds that automatically",
        "5. Click **Authorize**, then **Close**",
        "",
        "### Default admin (after seed)",
        "- **Email:** `admin@mail.com`",
        "- **Password:** `admin:`",
      ].join("\n"),
      contact: { name: "Rug Casa", email: "admin@mail.com" },
    },
    servers: [{ url: env.APP_URL, description: env.NODE_ENV }],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT",
          description: "Paste ONLY the accessToken value from login (do NOT type 'Bearer')",
        },
      },
      schemas: {
        ApiResponse: {
          type: "object",
          properties: {
            success: { type: "boolean", example: true },
            message: { type: "string", example: "Success" },
            data: { type: "object" },
            meta: {
              type: "object",
              properties: {
                page: { type: "integer" },
                limit: { type: "integer" },
                total: { type: "integer" },
                totalPages: { type: "integer" },
                hasNext: { type: "boolean" },
                hasPrev: { type: "boolean" },
              },
            },
          },
        },
        LoginRequest: {
          type: "object",
          required: ["email", "password"],
          properties: {
            email: { type: "string", format: "email", example: "admin@mail.com" },
            password: { type: "string", example: "admin:" },
          },
        },
        ErrorResponse: {
          type: "object",
          properties: {
            success: { type: "boolean", example: false },
            message: { type: "string", example: "Invalid email or password" },
            error: { type: "object", properties: { code: { type: "string" } } },
          },
        },
        CreateCategory: {
          type: "object",
          required: ["name"],
          properties: {
            name: { type: "string", example: "Living Room" },
            slug: { type: "string" },
            description: { type: "string" },
            parentId: { type: "string", nullable: true },
            status: { type: "string", enum: ["ACTIVE", "DRAFT", "INACTIVE"] },
            isFeatured: { type: "boolean" },
            seoTitle: { type: "string" },
            seoDescription: { type: "string" },
          },
        },
        CreateProduct: {
          type: "object",
          required: ["title", "variants"],
          properties: {
            title: { type: "string", example: "Vintage Distressed Rug" },
            slug: { type: "string" },
            categoryId: { type: "string" },
            status: { type: "string", enum: ["DRAFT", "PUBLISHED", "ARCHIVED"] },
            variants: {
              type: "array",
              items: {
                type: "object",
                required: ["sku", "price"],
                properties: {
                  sku: { type: "string", example: "RC-VD-001" },
                  price: { type: "number", example: 3199 },
                  salePrice: { type: "number" },
                  stock: { type: "integer", example: 10 },
                },
              },
            },
          },
        },
        CreateBanner: {
          type: "object",
          required: ["title", "type", "image"],
          properties: {
            title: { type: "string", example: "Summer Sale" },
            type: { type: "string", enum: ["HOMEPAGE", "CATEGORY", "OFFER", "COLLECTION", "POPUP", "MOBILE", "DESKTOP"] },
            image: { type: "string", example: "https://res.cloudinary.com/demo/image/upload/sample.webp" },
            linkUrl: { type: "string" },
            buttonText: { type: "string" },
            status: { type: "string", enum: ["ENABLED", "DISABLED", "SCHEDULED"] },
          },
        },
      },
    },
    tags: [
      { name: "Health", description: "Server health" },
      { name: "Auth", description: "Admin authentication" },
      { name: "Dashboard", description: "Dashboard statistics and analytics" },
      { name: "Categories", description: "Category management" },
      { name: "Products", description: "Product management" },
      { name: "Orders", description: "Order management" },
      { name: "Customers", description: "Customer management" },
      { name: "Reviews", description: "Review moderation" },
      { name: "Returns", description: "Return and exchange management" },
      { name: "Banners", description: "Banner management" },
      { name: "Settings", description: "Site settings" },
      { name: "Search", description: "Search APIs" },
      { name: "Media", description: "Media upload" },
      { name: "SEO", description: "SEO management" },
    ],
    paths: swaggerPaths,
  },
  apis: [],
};

export const swaggerSpec = swaggerJsdoc(options);
