import { Response } from "express";
import { asyncHandler } from "../../utils/asyncHandler";
import { sendCreated } from "../../utils/response";
import { AuthenticatedRequest, UploadFolder } from "../../types/express";
import { mediaService } from "../../services/media.service";
import { ValidationError } from "../../utils/errors";

const VALID_FOLDERS: UploadFolder[] = [
  "products",
  "categories",
  "banners",
  "collections",
  "reviews",
  "seo",
];

export class MediaController {
  upload = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const folder = req.params.folder as UploadFolder;
    if (!VALID_FOLDERS.includes(folder)) {
      throw new ValidationError("Invalid upload folder");
    }
    const files = req.files as Express.Multer.File[];
    const processed = await mediaService.processMultiple(files ?? [], folder);
    sendCreated(res, processed, "Files uploaded");
  });
}

export const mediaController = new MediaController();
