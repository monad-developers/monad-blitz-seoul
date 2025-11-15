import { ListBucketsCommand } from "@aws-sdk/client-s3";
import { R2, R2_BUCKET, R2_ENDPOINT, R2_PUBLIC_ENDPOINT } from "./client";
import { Upload } from "@aws-sdk/lib-storage";
import { Readable } from "stream";

if (!R2_BUCKET) {
  throw new Error("R2_BUCKET environment variable is not set.");
}
if (!R2_ENDPOINT) {
  throw new Error("R2_ENDPOINT environment variable is not set.");
}
export function getR2Url(key: string): string {
  return `${R2_PUBLIC_ENDPOINT}/${key}`;
}

export async function uploadImage(
  data: Buffer,
  fileName: string
): Promise<string> {
  const key = `images/${fileName}.png`;

  const uploader = new Upload({
    client: R2,
    params: {
      Bucket: R2_BUCKET,
      Key: key,
      Body: data,
      ContentType: "image/jpeg",
    },
  });

  try {
    await uploader.done();
    console.log(`Image uploaded successfully to: ${key}`);
    return getR2Url(key);
  } catch (error) {
    console.error("Image upload failed:", error);
    throw error;
  }
}

export async function uploadJson(
  data: object,
  fileName: string
): Promise<string> {
  const key = `metadatas/${fileName}.json`;

  const jsonString = JSON.stringify(data, null, 0);

  const uploader = new Upload({
    client: R2,
    params: {
      Bucket: R2_BUCKET,
      Key: key,
      Body: jsonString,
      ContentType: "application/json; charset=utf-8",
    },
  });

  try {
    await uploader.done();
    console.log(`JSON uploaded successfully to: ${key}`);
    return getR2Url(key);
  } catch (error) {
    console.error("JSON upload failed:", error);
    throw error;
  }
}
