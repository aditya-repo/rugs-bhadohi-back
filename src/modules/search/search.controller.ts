import { Response } from "express";
import { asyncHandler } from "../../utils/asyncHandler";
import { sendSuccess, buildPaginationMeta } from "../../utils/response";
import { AuthenticatedRequest } from "../../types/express";
import { parsePagination } from "../../utils/helpers";
import { searchService } from "./search.service";

export class SearchController {
  global = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const q = String(req.query.q);
    const results = await searchService.globalSearch(q);
    sendSuccess(res, results);
  });

  products = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const q = String(req.query.q);
    const { page, limit } = parsePagination(req.query as Record<string, string>);
    const result = await searchService.searchProducts(q, page, limit);
    sendSuccess(res, result.items, "Search results", 200, buildPaginationMeta(result.page, result.limit, result.total));
  });

  orders = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const q = String(req.query.q);
    const { page, limit } = parsePagination(req.query as Record<string, string>);
    const result = await searchService.searchOrders(q, page, limit);
    sendSuccess(res, result.items, "Search results", 200, buildPaginationMeta(result.page, result.limit, result.total));
  });

  customers = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const q = String(req.query.q);
    const { page, limit } = parsePagination(req.query as Record<string, string>);
    const result = await searchService.searchCustomers(q, page, limit);
    sendSuccess(res, result.items, "Search results", 200, buildPaginationMeta(result.page, result.limit, result.total));
  });

  categories = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const q = String(req.query.q);
    const { page, limit } = parsePagination(req.query as Record<string, string>);
    const result = await searchService.searchCategories(q, page, limit);
    sendSuccess(res, result.items, "Search results", 200, buildPaginationMeta(result.page, result.limit, result.total));
  });

  reviews = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const q = String(req.query.q);
    const { page, limit } = parsePagination(req.query as Record<string, string>);
    const result = await searchService.searchReviews(q, page, limit);
    sendSuccess(res, result.items, "Search results", 200, buildPaginationMeta(result.page, result.limit, result.total));
  });
}

export const searchController = new SearchController();
