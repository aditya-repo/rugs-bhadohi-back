import { Router } from "express";
import { mediaController } from "./media.controller";
import { authenticate } from "../../middlewares/auth.middleware";
import { upload, setUploadFolder } from "../../middlewares/upload.middleware";
import { UploadFolder } from "../../types/express";
import { Request, Response, NextFunction } from "express";

const router = Router();

router.use(authenticate);

router.post(
  "/:folder",
  (req: Request, _res: Response, next: NextFunction) => {
    setUploadFolder(req.params.folder as UploadFolder)(req, _res, next);
  },
  upload.array("files", 20),
  mediaController.upload,
);

export default router;
