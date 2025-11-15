import { S3Client } from "@aws-sdk/client-s3";

export const R2_ENDPOINT = process.env.NEXT_PUBLIC_R2_ENDPOINT;
export const R2_ACCESS_KEY_ID = process.env.NEXT_PUBLIC_R2_ACCESS_KEY_ID;
export const R2_SECRET_ACCESS_KEY =
  process.env.NEXT_PUBLIC_R2_SECRET_ACCESS_KEY;
export const R2_BUCKET = process.env.NEXT_PUBLIC_R2_BUCKET;
export const R2_PUBLIC_ENDPOINT = process.env.NEXT_PUBLIC_R2_PUBLIC_ENDPOINT;

if (!R2_ENDPOINT || !R2_ACCESS_KEY_ID || !R2_SECRET_ACCESS_KEY) {
  throw new Error(
    "R2 connection variables (ENDPOINT, ACCESS_KEY_ID, SECRET_ACCESS_KEY) are not set."
  );
}

export const R2 = new S3Client({
  region: "auto",
  endpoint: R2_ENDPOINT,
  credentials: {
    accessKeyId: R2_ACCESS_KEY_ID,
    secretAccessKey: R2_SECRET_ACCESS_KEY,
  },
});
