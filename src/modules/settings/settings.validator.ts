import { z } from "zod";

export const updateSettingsSchema = z.object({
  settings: z.record(z.unknown()),
});

export const DEFAULT_SETTINGS: Record<string, { value: unknown; group: string }> = {
  websiteName: { value: "Rugs Bhadohi", group: "general" },
  websiteLogo: { value: "", group: "general" },
  favicon: { value: "", group: "general" },
  contactEmail: { value: "hello@rugsbhadohi.com", group: "contact" },
  contactPhone: { value: "+91 9876543210", group: "contact" },
  contactAddress: { value: "", group: "contact" },
  socialLinks: { value: { facebook: "", instagram: "", twitter: "", pinterest: "" }, group: "social" },
  footerContent: { value: "", group: "general" },
  currency: { value: "INR", group: "commerce" },
  currencySymbol: { value: "₹", group: "commerce" },
  gstNumber: { value: "", group: "commerce" },
  gstRate: { value: 18, group: "commerce" },
  invoicePrefix: { value: "INV", group: "commerce" },
  maintenanceMode: { value: false, group: "general" },
  analyticsScript: { value: "", group: "analytics" },
  facebookPixel: { value: "", group: "analytics" },
  googleAnalytics: { value: "", group: "analytics" },
  googleSearchConsole: { value: "", group: "analytics" },
  robotsTxt: { value: "User-agent: *\nAllow: /", group: "seo" },
  sitemapEnabled: { value: true, group: "seo" },
  sitemapChangeFreq: { value: "weekly", group: "seo" },
  emailSettings: {
    value: { host: "", port: 587, user: "", from: "noreply@rugsbhadohi.com" },
    group: "email",
  },
};
