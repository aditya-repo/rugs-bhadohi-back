import multer from "multer";
import { NextFunction, Request, Response } from "express";
import { env } from "../config/env";
import { UploadFolder } from "../types/express";

const fileFilter: multer.Options["fileFilter"] = (_req, file, cb) => {
  const allowed = ["image/jpeg", "image/png", "image/webp", "image/gif", "image/avif"];
  if (allowed.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error("Only image files are allowed"));
  }
};

export const upload = multer({
  storage: multer.memoryStorage(),
  fileFilter,
  limits: { fileSize: env.MAX_FILE_SIZE },
});

export function setUploadFolder(folder: UploadFolder) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    (req as { uploadFolder?: UploadFolder }).uploadFolder = folder;
    next();
  };
}
