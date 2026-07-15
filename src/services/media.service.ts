import { v2 as cloudinary, type UploadApiResponse } from "cloudinary";
import { env } from "../config/env";
import { UploadFolder } from "../types/express";
import { ValidationError } from "../utils/errors";

const THUMBNAIL_WIDTH = 300;

export interface ProcessedImage {
  path: string;
  thumbnail: string;
  relativePath: string;
  relativeThumbnail: string;
}

function assertCloudinaryConfigured(): void {
  if (!env.CLOUDINARY_CLOUD_NAME || !env.CLOUDINARY_API_KEY || !env.CLOUDINARY_API_SECRET) {
    throw new ValidationError(
      "Cloudinary is not configured. Set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET.",
    );
  }
}

cloudinary.config({
  cloud_name: env.CLOUDINARY_CLOUD_NAME,
  api_key: env.CLOUDINARY_API_KEY,
  api_secret: env.CLOUDINARY_API_SECRET,
  secure: true,
});

function cloudFolder(folder: UploadFolder): string {
  return `${env.CLOUDINARY_FOLDER}/${folder}`;
}

function thumbnailUrl(publicId: string): string {
  return cloudinary.url(publicId, {
    secure: true,
    width: THUMBNAIL_WIDTH,
    crop: "limit",
    fetch_format: "auto",
    quality: "auto",
  });
}

function extractPublicId(imageUrl: string): string | null {
  try {
    const pathname = new URL(imageUrl).pathname;
    const uploadIdx = pathname.indexOf("/upload/");
    if (uploadIdx === -1) return null;

    const parts = pathname
      .slice(uploadIdx + "/upload/".length)
      .split("/")
      .filter(Boolean);

    let start = 0;
    while (start < parts.length) {
      const part = parts[start];
      if (/^v\d+$/.test(part)) {
        start += 1;
        break;
      }
      if (part.includes(",") || part.includes("_")) {
        start += 1;
        continue;
      }
      break;
    }

    const publicParts = parts.slice(start);
    if (publicParts.length === 0) return null;
    const last = publicParts[publicParts.length - 1];
    publicParts[publicParts.length - 1] = last.replace(/\.[^.]+$/, "");
    return publicParts.join("/");
  } catch {
    return null;
  }
}

function uploadBuffer(
  buffer: Buffer,
  folder: UploadFolder,
  originalName?: string,
): Promise<UploadApiResponse> {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder: cloudFolder(folder),
        resource_type: "image",
        format: "webp",
        overwrite: false,
        unique_filename: true,
        use_filename: Boolean(originalName),
        transformation: [{ quality: "auto:good", fetch_format: "webp" }],
      },
      (error, result) => {
        if (error || !result) {
          reject(error ?? new Error("Cloudinary upload failed"));
          return;
        }
        resolve(result);
      },
    );
    stream.end(buffer);
  });
}

export class MediaService {
  async processImage(file: Express.Multer.File, folder: UploadFolder): Promise<ProcessedImage> {
    assertCloudinaryConfigured();
    if (!file.buffer?.length) {
      throw new ValidationError("Uploaded file buffer is empty");
    }

    const result = await uploadBuffer(file.buffer, folder, file.originalname);
    const url = result.secure_url;
    const thumb = thumbnailUrl(result.public_id);

    return {
      path: url,
      thumbnail: thumb,
      relativePath: url,
      relativeThumbnail: thumb,
    };
  }

  async processMultiple(
    files: Express.Multer.File[],
    folder: UploadFolder,
  ): Promise<ProcessedImage[]> {
    return Promise.all(files.map((file) => this.processImage(file, folder)));
  }

  async deleteImage(storedPath: string): Promise<void> {
    if (!storedPath || !storedPath.includes("res.cloudinary.com")) return;

    assertCloudinaryConfigured();
    const publicId = extractPublicId(storedPath);
    if (publicId) {
      await cloudinary.uploader.destroy(publicId).catch(() => undefined);
    }
  }
}

export const mediaService = new MediaService();
