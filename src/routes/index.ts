import { Router } from "express";
import authRoutes from "../modules/auth/auth.routes";
import dashboardRoutes from "../modules/dashboard/dashboard.routes";
import categoryRoutes from "../modules/categories/category.routes";
import productRoutes from "../modules/products/product.routes";
import orderRoutes from "../modules/orders/order.routes";
import customerRoutes from "../modules/customers/customer.routes";
import reviewRoutes from "../modules/reviews/review.routes";
import returnRoutes from "../modules/returns/return.routes";
import bannerRoutes from "../modules/banners/banner.routes";
import collectionRoutes from "../modules/collections/collection.routes";
import settingsRoutes from "../modules/settings/settings.routes";
import searchRoutes from "../modules/search/search.routes";
import mediaRoutes from "../modules/media/media.routes";
import seoRoutes from "../modules/seo/seo.routes";
import wishlistRoutes from "../modules/wishlist/wishlist.routes";

const router = Router();

router.use("/auth", authRoutes);
router.use("/dashboard", dashboardRoutes);
router.use("/categories", categoryRoutes);
router.use("/collections", collectionRoutes);
router.use("/products", productRoutes);
router.use("/orders", orderRoutes);
router.use("/customers", customerRoutes);
router.use("/wishlist", wishlistRoutes);
router.use("/reviews", reviewRoutes);
router.use("/returns", returnRoutes);
router.use("/banners", bannerRoutes);
router.use("/settings", settingsRoutes);
router.use("/search", searchRoutes);
router.use("/media", mediaRoutes);
router.use("/seo", seoRoutes);

export default router;
