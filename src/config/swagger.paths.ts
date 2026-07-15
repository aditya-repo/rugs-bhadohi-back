type ParameterObject = {
  name: string;
  in: "query" | "path" | "header";
  required?: boolean;
  schema?: Record<string, unknown>;
};

type ResponsesObject = Record<string, { description: string; content?: Record<string, unknown> }>;
const bearer = { security: [{ bearerAuth: [] }] };

const pageParams: ParameterObject[] = [
  { name: "page", in: "query", schema: { type: "integer", default: 1 } },
  { name: "limit", in: "query", schema: { type: "integer", default: 20 } },
];

const idParam: ParameterObject = {
  name: "id",
  in: "path",
  required: true,
  schema: { type: "string" },
};

function ok(description = "Success"): ResponsesObject {
  return {
    200: {
      description,
      content: { "application/json": { schema: { $ref: "#/components/schemas/ApiResponse" } } },
    },
    401: { description: "Unauthorized", content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } } },
  };
}

function created(description = "Created"): ResponsesObject {
  return {
    201: {
      description,
      content: { "application/json": { schema: { $ref: "#/components/schemas/ApiResponse" } } },
    },
    401: { description: "Unauthorized", content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } } },
  };
}

export const swaggerPaths: Record<string, unknown> = {
  "/health": {
    get: {
      tags: ["Health"],
      summary: "Health check",
      responses: { 200: { description: "Server is running" } },
    },
  },

  // ─── Auth ───────────────────────────────────────────────────────────────────
  "/api/v1/auth/login": {
    post: {
      tags: ["Auth"],
      summary: "Admin login",
      description: "Default credentials after seed: **admin@mail.com** / **admin:**",
      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: { $ref: "#/components/schemas/LoginRequest" },
            example: { email: "admin@mail.com", password: "admin:" },
          },
        },
      },
      responses: {
        200: {
          description: "Returns accessToken, refreshToken, and admin profile",
          content: { "application/json": { schema: { $ref: "#/components/schemas/ApiResponse" } } },
        },
        401: { description: "Invalid credentials", content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } } },
      },
    },
  },
  "/api/v1/auth/refresh": {
    post: {
      tags: ["Auth"],
      summary: "Refresh access token",
      requestBody: {
        required: true,
        content: { "application/json": { schema: { type: "object", required: ["refreshToken"], properties: { refreshToken: { type: "string" } } } } },
      },
      responses: ok("New access token"),
    },
  },
  "/api/v1/auth/logout": {
    post: {
      tags: ["Auth"],
      summary: "Logout (invalidate refresh token)",
      requestBody: {
        required: true,
        content: { "application/json": { schema: { type: "object", required: ["refreshToken"], properties: { refreshToken: { type: "string" } } } } },
      },
      responses: ok(),
    },
  },
  "/api/v1/auth/forgot-password": {
    post: {
      tags: ["Auth"],
      summary: "Request password reset email",
      requestBody: {
        required: true,
        content: { "application/json": { schema: { type: "object", required: ["email"], properties: { email: { type: "string", format: "email" } } } } },
      },
      responses: ok(),
    },
  },
  "/api/v1/auth/reset-password": {
    post: {
      tags: ["Auth"],
      summary: "Reset password with token",
      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: {
              type: "object",
              required: ["token", "password"],
              properties: { token: { type: "string" }, password: { type: "string", minLength: 8 } },
            },
          },
        },
      },
      responses: ok(),
    },
  },
  "/api/v1/auth/profile": {
    get: { tags: ["Auth"], summary: "Get admin profile", ...bearer, responses: ok() },
    put: {
      tags: ["Auth"],
      summary: "Update admin profile",
      ...bearer,
      requestBody: { content: { "application/json": { schema: { type: "object", properties: { name: { type: "string" }, avatar: { type: "string" } } } } } },
      responses: ok(),
    },
  },
  "/api/v1/auth/change-password": {
    put: {
      tags: ["Auth"],
      summary: "Change password",
      ...bearer,
      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: {
              type: "object",
              required: ["currentPassword", "newPassword"],
              properties: { currentPassword: { type: "string" }, newPassword: { type: "string", minLength: 8 } },
            },
          },
        },
      },
      responses: ok(),
    },
  },

  // ─── Dashboard ────────────────────────────────────────────────────────────
  "/api/v1/dashboard": {
    get: { tags: ["Dashboard"], summary: "Dashboard overview (products, orders, revenue stats)", ...bearer, responses: ok() },
  },
  "/api/v1/dashboard/analytics": {
    get: { tags: ["Dashboard"], summary: "Analytics (monthly sales, top products, low stock)", ...bearer, responses: ok() },
  },
  "/api/v1/dashboard/latest": {
    get: { tags: ["Dashboard"], summary: "Latest orders, customers, reviews", ...bearer, responses: ok() },
  },

  // ─── Categories ─────────────────────────────────────────────────────────────
  "/api/v1/categories": {
    get: {
      tags: ["Categories"],
      summary: "List categories",
      ...bearer,
      parameters: [...pageParams, { name: "search", in: "query", schema: { type: "string" } }, { name: "status", in: "query", schema: { type: "string", enum: ["ACTIVE", "DRAFT", "INACTIVE"] } }],
      responses: ok(),
    },
    post: {
      tags: ["Categories"],
      summary: "Create category",
      ...bearer,
      requestBody: { required: true, content: { "application/json": { schema: { $ref: "#/components/schemas/CreateCategory" } } } },
      responses: created(),
    },
  },
  "/api/v1/categories/tree": {
    get: { tags: ["Categories"], summary: "Get nested category tree", ...bearer, responses: ok() },
  },
  "/api/v1/categories/{id}": {
    get: { tags: ["Categories"], summary: "Get category by ID", ...bearer, parameters: [idParam], responses: ok() },
    put: {
      tags: ["Categories"],
      summary: "Update category",
      ...bearer,
      parameters: [idParam],
      requestBody: { content: { "application/json": { schema: { $ref: "#/components/schemas/CreateCategory" } } } },
      responses: ok(),
    },
    delete: { tags: ["Categories"], summary: "Delete category (soft)", ...bearer, parameters: [idParam], responses: ok() },
  },

  // ─── Products ───────────────────────────────────────────────────────────────
  "/api/v1/products": {
    get: {
      tags: ["Products"],
      summary: "List products",
      ...bearer,
      parameters: [...pageParams, { name: "search", in: "query", schema: { type: "string" } }, { name: "status", in: "query", schema: { type: "string", enum: ["DRAFT", "PUBLISHED", "ARCHIVED"] } }, { name: "categoryId", in: "query", schema: { type: "string" } }],
      responses: ok(),
    },
    post: {
      tags: ["Products"],
      summary: "Create product with variants",
      ...bearer,
      requestBody: { required: true, content: { "application/json": { schema: { $ref: "#/components/schemas/CreateProduct" } } } },
      responses: created(),
    },
  },
  "/api/v1/products/export": {
    get: { tags: ["Products"], summary: "Export products", ...bearer, parameters: pageParams, responses: ok() },
  },
  "/api/v1/products/bulk/delete": {
    post: {
      tags: ["Products"],
      summary: "Bulk delete products",
      ...bearer,
      requestBody: { required: true, content: { "application/json": { schema: { type: "object", required: ["ids"], properties: { ids: { type: "array", items: { type: "string" } } } } } } },
      responses: ok(),
    },
  },
  "/api/v1/products/bulk/publish": {
    post: { tags: ["Products"], summary: "Bulk publish products", ...bearer, requestBody: { required: true, content: { "application/json": { schema: { type: "object", properties: { ids: { type: "array", items: { type: "string" } } } } } } }, responses: ok() },
  },
  "/api/v1/products/bulk/draft": {
    post: { tags: ["Products"], summary: "Bulk move products to draft", ...bearer, requestBody: { required: true, content: { "application/json": { schema: { type: "object", properties: { ids: { type: "array", items: { type: "string" } } } } } } }, responses: ok() },
  },
  "/api/v1/products/bulk/category": {
    post: {
      tags: ["Products"],
      summary: "Bulk update product category",
      ...bearer,
      requestBody: { required: true, content: { "application/json": { schema: { type: "object", properties: { ids: { type: "array", items: { type: "string" } }, categoryId: { type: "string", nullable: true } } } } } },
      responses: ok(),
    },
  },
  "/api/v1/products/{id}": {
    get: { tags: ["Products"], summary: "Get product by ID", ...bearer, parameters: [idParam], responses: ok() },
    put: { tags: ["Products"], summary: "Update product", ...bearer, parameters: [idParam], requestBody: { content: { "application/json": { schema: { $ref: "#/components/schemas/CreateProduct" } } } }, responses: ok() },
    delete: { tags: ["Products"], summary: "Soft delete product", ...bearer, parameters: [idParam], responses: ok() },
  },
  "/api/v1/products/{id}/duplicate": {
    post: { tags: ["Products"], summary: "Duplicate product", ...bearer, parameters: [idParam], responses: created() },
  },
  "/api/v1/products/{id}/publish": {
    put: { tags: ["Products"], summary: "Publish product", ...bearer, parameters: [idParam], responses: ok() },
  },
  "/api/v1/products/{id}/draft": {
    put: { tags: ["Products"], summary: "Move product to draft", ...bearer, parameters: [idParam], responses: ok() },
  },
  "/api/v1/products/{id}/archive": {
    put: { tags: ["Products"], summary: "Archive product", ...bearer, parameters: [idParam], responses: ok() },
  },
  "/api/v1/products/{id}/images": {
    post: {
      tags: ["Products"],
      summary: "Upload product images (multipart/form-data, field: images)",
      ...bearer,
      parameters: [idParam],
      requestBody: { content: { "multipart/form-data": { schema: { type: "object", properties: { images: { type: "array", items: { type: "string", format: "binary" } } } } } } },
      responses: created(),
    },
  },
  "/api/v1/products/{id}/images/reorder": {
    put: {
      tags: ["Products"],
      summary: "Reorder product images",
      ...bearer,
      parameters: [idParam],
      requestBody: { content: { "application/json": { schema: { type: "object", properties: { images: { type: "array", items: { type: "object", properties: { id: { type: "string" }, sortOrder: { type: "integer" }, isFeatured: { type: "boolean" } } } } } } } } },
      responses: ok(),
    },
  },
  "/api/v1/products/{id}/images/{imageId}": {
    delete: {
      tags: ["Products"],
      summary: "Delete product image",
      ...bearer,
      parameters: [idParam, { name: "imageId", in: "path", required: true, schema: { type: "string" } }],
      responses: ok(),
    },
  },

  // ─── Orders ─────────────────────────────────────────────────────────────────
  "/api/v1/orders": {
    get: {
      tags: ["Orders"],
      summary: "List orders",
      ...bearer,
      parameters: [...pageParams, { name: "search", in: "query", schema: { type: "string" } }, { name: "status", in: "query", schema: { type: "string" } }],
      responses: ok(),
    },
  },
  "/api/v1/orders/{id}": {
    get: { tags: ["Orders"], summary: "Get order details", ...bearer, parameters: [idParam], responses: ok() },
  },
  "/api/v1/orders/{id}/status": {
    put: {
      tags: ["Orders"],
      summary: "Update order status",
      ...bearer,
      parameters: [idParam],
      requestBody: { required: true, content: { "application/json": { schema: { type: "object", required: ["status"], properties: { status: { type: "string" }, note: { type: "string" } } } } } },
      responses: ok(),
    },
  },
  "/api/v1/orders/{id}/notes": {
    post: {
      tags: ["Orders"],
      summary: "Add order note",
      ...bearer,
      parameters: [idParam],
      requestBody: { required: true, content: { "application/json": { schema: { type: "object", required: ["note"], properties: { note: { type: "string" }, isInternal: { type: "boolean" } } } } } },
      responses: ok(),
    },
  },
  "/api/v1/orders/{id}/invoice": {
    post: { tags: ["Orders"], summary: "Generate invoice", ...bearer, parameters: [idParam], responses: ok() },
  },

  // ─── Customers ──────────────────────────────────────────────────────────────
  "/api/v1/customers": {
    get: {
      tags: ["Customers"],
      summary: "List customers",
      ...bearer,
      parameters: [...pageParams, { name: "search", in: "query", schema: { type: "string" } }, { name: "status", in: "query", schema: { type: "string", enum: ["ACTIVE", "INACTIVE", "BLOCKED"] } }],
      responses: ok(),
    },
  },
  "/api/v1/customers/{id}": {
    get: { tags: ["Customers"], summary: "Get customer details (orders, addresses, wishlist, reviews)", ...bearer, parameters: [idParam], responses: ok() },
  },
  "/api/v1/customers/{id}/status": {
    put: {
      tags: ["Customers"],
      summary: "Update customer status",
      ...bearer,
      parameters: [idParam],
      requestBody: { required: true, content: { "application/json": { schema: { type: "object", required: ["status"], properties: { status: { type: "string", enum: ["ACTIVE", "INACTIVE", "BLOCKED"] } } } } } },
      responses: ok(),
    },
  },

  // ─── Reviews ────────────────────────────────────────────────────────────────
  "/api/v1/reviews": {
    get: {
      tags: ["Reviews"],
      summary: "List reviews",
      ...bearer,
      parameters: [...pageParams, { name: "search", in: "query", schema: { type: "string" } }, { name: "status", in: "query", schema: { type: "string", enum: ["PENDING", "APPROVED", "REJECTED", "REPORTED"] } }, { name: "rating", in: "query", schema: { type: "integer" } }],
      responses: ok(),
    },
  },
  "/api/v1/reviews/{id}": {
    get: { tags: ["Reviews"], summary: "Get review by ID", ...bearer, parameters: [idParam], responses: ok() },
    delete: { tags: ["Reviews"], summary: "Delete review", ...bearer, parameters: [idParam], responses: ok() },
  },
  "/api/v1/reviews/{id}/approve": {
    put: { tags: ["Reviews"], summary: "Approve review", ...bearer, parameters: [idParam], responses: ok() },
  },
  "/api/v1/reviews/{id}/reject": {
    put: { tags: ["Reviews"], summary: "Reject review", ...bearer, parameters: [idParam], responses: ok() },
  },
  "/api/v1/reviews/{id}/reply": {
    put: {
      tags: ["Reviews"],
      summary: "Reply to review",
      ...bearer,
      parameters: [idParam],
      requestBody: { required: true, content: { "application/json": { schema: { type: "object", required: ["reply"], properties: { reply: { type: "string" } } } } } },
      responses: ok(),
    },
  },

  // ─── Returns ────────────────────────────────────────────────────────────────
  "/api/v1/returns": {
    get: {
      tags: ["Returns"],
      summary: "List return/exchange requests",
      ...bearer,
      parameters: [...pageParams, { name: "search", in: "query", schema: { type: "string" } }, { name: "status", in: "query", schema: { type: "string" } }, { name: "type", in: "query", schema: { type: "string", enum: ["RETURN", "EXCHANGE"] } }],
      responses: ok(),
    },
  },
  "/api/v1/returns/{id}": {
    get: { tags: ["Returns"], summary: "Get return request details", ...bearer, parameters: [idParam], responses: ok() },
  },
  "/api/v1/returns/{id}/status": {
    put: {
      tags: ["Returns"],
      summary: "Update return status",
      ...bearer,
      parameters: [idParam],
      requestBody: { content: { "application/json": { schema: { type: "object", properties: { status: { type: "string" }, note: { type: "string" }, adminNotes: { type: "string" } } } } } },
      responses: ok(),
    },
  },
  "/api/v1/returns/{id}/approve": {
    put: { tags: ["Returns"], summary: "Approve return request", ...bearer, parameters: [idParam], responses: ok() },
  },
  "/api/v1/returns/{id}/reject": {
    put: { tags: ["Returns"], summary: "Reject return request", ...bearer, parameters: [idParam], responses: ok() },
  },

  // ─── Banners ────────────────────────────────────────────────────────────────
  "/api/v1/banners": {
    get: {
      tags: ["Banners"],
      summary: "List banners",
      ...bearer,
      parameters: [...pageParams, { name: "type", in: "query", schema: { type: "string", enum: ["HOMEPAGE", "CATEGORY", "OFFER", "COLLECTION", "POPUP", "MOBILE", "DESKTOP"] } }, { name: "status", in: "query", schema: { type: "string", enum: ["ENABLED", "DISABLED", "SCHEDULED"] } }],
      responses: ok(),
    },
    post: {
      tags: ["Banners"],
      summary: "Create banner",
      ...bearer,
      requestBody: { required: true, content: { "application/json": { schema: { $ref: "#/components/schemas/CreateBanner" } } } },
      responses: created(),
    },
  },
  "/api/v1/banners/upload": {
    post: {
      tags: ["Banners"],
      summary: "Upload banner images (multipart/form-data, field: images)",
      ...bearer,
      requestBody: { content: { "multipart/form-data": { schema: { type: "object", properties: { images: { type: "array", items: { type: "string", format: "binary" } } } } } } },
      responses: created(),
    },
  },
  "/api/v1/banners/{id}": {
    get: { tags: ["Banners"], summary: "Get banner by ID", ...bearer, parameters: [idParam], responses: ok() },
    put: { tags: ["Banners"], summary: "Update banner", ...bearer, parameters: [idParam], requestBody: { content: { "application/json": { schema: { $ref: "#/components/schemas/CreateBanner" } } } }, responses: ok() },
    delete: { tags: ["Banners"], summary: "Delete banner", ...bearer, parameters: [idParam], responses: ok() },
  },
  "/api/v1/banners/{id}/enable": {
    put: { tags: ["Banners"], summary: "Enable banner", ...bearer, parameters: [idParam], responses: ok() },
  },
  "/api/v1/banners/{id}/disable": {
    put: { tags: ["Banners"], summary: "Disable banner", ...bearer, parameters: [idParam], responses: ok() },
  },

  // ─── Settings ───────────────────────────────────────────────────────────────
  "/api/v1/settings": {
    get: { tags: ["Settings"], summary: "Get all site settings", ...bearer, responses: ok() },
    put: {
      tags: ["Settings"],
      summary: "Update site settings",
      ...bearer,
      requestBody: { required: true, content: { "application/json": { schema: { type: "object", required: ["settings"], properties: { settings: { type: "object" } } } } } },
      responses: ok(),
    },
  },
  "/api/v1/settings/robots.txt": {
    get: { tags: ["Settings"], summary: "Get robots.txt content", responses: { 200: { description: "Plain text robots.txt" } } },
  },

  // ─── Search ─────────────────────────────────────────────────────────────────
  "/api/v1/search": {
    get: {
      tags: ["Search"],
      summary: "Global search (products, orders, customers, categories, reviews)",
      ...bearer,
      parameters: [{ name: "q", in: "query", required: true, schema: { type: "string" } }],
      responses: ok(),
    },
  },
  "/api/v1/search/products": {
    get: { tags: ["Search"], summary: "Search products", ...bearer, parameters: [{ name: "q", in: "query", required: true, schema: { type: "string" } }, ...pageParams], responses: ok() },
  },
  "/api/v1/search/orders": {
    get: { tags: ["Search"], summary: "Search orders", ...bearer, parameters: [{ name: "q", in: "query", required: true, schema: { type: "string" } }, ...pageParams], responses: ok() },
  },
  "/api/v1/search/customers": {
    get: { tags: ["Search"], summary: "Search customers", ...bearer, parameters: [{ name: "q", in: "query", required: true, schema: { type: "string" } }, ...pageParams], responses: ok() },
  },
  "/api/v1/search/categories": {
    get: { tags: ["Search"], summary: "Search categories", ...bearer, parameters: [{ name: "q", in: "query", required: true, schema: { type: "string" } }, ...pageParams], responses: ok() },
  },
  "/api/v1/search/reviews": {
    get: { tags: ["Search"], summary: "Search reviews", ...bearer, parameters: [{ name: "q", in: "query", required: true, schema: { type: "string" } }, ...pageParams], responses: ok() },
  },

  // ─── Media ──────────────────────────────────────────────────────────────────
  "/api/v1/media/{folder}": {
    post: {
      tags: ["Media"],
      summary: "Upload media files (folder: products | categories | banners | reviews | seo)",
      ...bearer,
      parameters: [{ name: "folder", in: "path", required: true, schema: { type: "string", enum: ["products", "categories", "banners", "reviews", "seo"] } }],
      requestBody: { content: { "multipart/form-data": { schema: { type: "object", properties: { files: { type: "array", items: { type: "string", format: "binary" } } } } } } },
      responses: created(),
    },
  },

  // ─── SEO ────────────────────────────────────────────────────────────────────
  "/api/v1/seo/products/{productId}": {
    get: { tags: ["SEO"], summary: "Get product SEO data", ...bearer, parameters: [{ name: "productId", in: "path", required: true, schema: { type: "string" } }], responses: ok() },
    put: { tags: ["SEO"], summary: "Update product SEO", ...bearer, parameters: [{ name: "productId", in: "path", required: true, schema: { type: "string" } }], responses: ok() },
  },
  "/api/v1/seo/slug/generate": {
    post: {
      tags: ["SEO"],
      summary: "Generate unique slug from title",
      ...bearer,
      requestBody: { required: true, content: { "application/json": { schema: { type: "object", required: ["title"], properties: { title: { type: "string" } } } } } },
      responses: ok(),
    },
  },
  "/api/v1/seo/slug/preview": {
    post: {
      tags: ["SEO"],
      summary: "Preview slug from title",
      ...bearer,
      requestBody: { required: true, content: { "application/json": { schema: { type: "object", required: ["title"], properties: { title: { type: "string" } } } } } },
      responses: ok(),
    },
  },
};
