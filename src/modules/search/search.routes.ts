import { Router } from "express";
import { searchController } from "./search.controller";
import { authenticate } from "../../middlewares/auth.middleware";
import { validateQuery } from "../../middlewares/validate.middleware";
import { globalSearchSchema, searchQuerySchema } from "./search.validator";

const router = Router();

router.use(authenticate);

router.get("/", validateQuery(globalSearchSchema), searchController.global);
router.get("/products", validateQuery(searchQuerySchema), searchController.products);
router.get("/orders", validateQuery(searchQuerySchema), searchController.orders);
router.get("/customers", validateQuery(searchQuerySchema), searchController.customers);
router.get("/categories", validateQuery(searchQuerySchema), searchController.categories);
router.get("/reviews", validateQuery(searchQuerySchema), searchController.reviews);

export default router;
