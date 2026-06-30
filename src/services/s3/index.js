import fs from "fs";
import path from "path";
import mime from "mime-types";
import { randomUUID } from "crypto";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";

const s3 = new S3Client({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

const ALLOWED_EXTENSIONS = [
  ".jpg",
  ".jpeg",
  ".png",
  ".webp",
  ".gif",
  ".svg",

  ".pdf",
  ".doc",
  ".docx",
  ".xls",
  ".xlsx",
  ".csv",
  ".txt",

  ".json",
  ".zip",
];

export async function uploadToS3({
  file,
  folder = "",
  bucketName = process.env.AWS_S3_BUCKET,
  fileName = null,
}) {
  if (!file) {
    throw new Error("File is required");
  }

  let body;
  let originalName;

  if (typeof file.arrayBuffer === "function") {
    body = Buffer.from(await file.arrayBuffer());
    originalName = file.name;
  } else if (Buffer.isBuffer(file)) {
    body = file;
    originalName = fileName || randomUUID();
  } else if (typeof file === "string") {
    body = fs.readFileSync(file);
    originalName = path.basename(file);
  } else {
    throw new Error("Unsupported file format");
  }

  const extension = path.extname(originalName).toLowerCase();

  if (extension && !ALLOWED_EXTENSIONS.includes(extension)) {
    throw new Error(`Unsupported file type: ${extension}`);
  }

  const finalFileName = fileName || `${Date.now()}-${randomUUID()}${extension}`;

  const key = folder
    ? `${folder.replace(/^\/|\/$/g, "")}/${finalFileName}`
    : finalFileName;

  const contentType = mime.lookup(extension) || "application/octet-stream";

  await s3.send(
    new PutObjectCommand({
      Bucket: bucketName,
      Key: key,
      Body: body,
      ContentType: contentType,
    }),
  );

  return {
    success: true,
    bucket: bucketName,
    key,
    fileName: finalFileName,
    contentType,
    url: `https://${bucketName}.s3.${process.env.AWS_REGION}.amazonaws.com/${key}`,
  };
}
