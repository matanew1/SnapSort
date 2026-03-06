// services/stabilityai.ts
import * as FileSystem from "expo-file-system/legacy";

const STABILITY_API_KEY = process.env.EXPO_PUBLIC_STABILITY_API_KEY;
const API_URL = "https://api.stability.ai/v2beta/stable-image/edit/inpaint";

export interface InpaintingResponse {
  image: string; // base64 string
  seed: number;
  finish_reason: string;
}

/**
 * Ensure the URI is a reachable file:// path.
 * expo-image-picker on iOS can return ph:// or assets-library:// URIs —
 * copying to cache gives us a guaranteed file:// URI with a known extension.
 */
async function toCacheUri(uri: string, filename: string): Promise<string> {
  const dest = `${FileSystem.cacheDirectory}${filename}`;
  const src = uri.startsWith("file://") ? uri : `file://${uri}`;
  await FileSystem.copyAsync({ from: src, to: dest });
  return dest;
}

function getMimeType(uri: string): string {
  const lower = uri.toLowerCase();
  if (lower.includes(".jpg") || lower.includes(".jpeg")) return "image/jpeg";
  if (lower.includes(".webp")) return "image/webp";
  return "image/png";
}

/**
 * Multipart upload via XMLHttpRequest.
 *
 * React Native's FormData supports a special {uri, name, type} object for
 * file parts — this is the only reliable way to send binary files on Hermes.
 * fetch() + Blob hits multiple Hermes limitations (no ArrayBuffer Blob,
 * fetch(dataUri).blob() returns untyped blobs); XHR avoids all of these.
 */
function xhrPost(
  url: string,
  headers: Record<string, string>,
  body: FormData
): Promise<any> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("POST", url);
    Object.entries(headers).forEach(([k, v]) => xhr.setRequestHeader(k, v));
    xhr.responseType = "text";

    xhr.onload = () => {
      try {
        const json = JSON.parse(xhr.responseText);
        if (xhr.status >= 200 && xhr.status < 300) {
          resolve(json);
        } else {
          const msg = json.errors
            ? JSON.stringify(json.errors)
            : json.message ?? `HTTP ${xhr.status}`;
          reject(new Error(`Stability AI API Error: ${msg}`));
        }
      } catch {
        reject(
          new Error(`Stability AI: unexpected response — ${xhr.responseText}`)
        );
      }
    };

    xhr.onerror = () =>
      reject(new Error("XHR network error — check connectivity and API key"));
    xhr.ontimeout = () => reject(new Error("Request timed out"));
    xhr.timeout = 60000; // inpainting can be slow
    xhr.send(body);
  });
}

export async function inpaint(
  imageUri: string,
  maskUri: string,
  prompt: string
): Promise<InpaintingResponse> {
  if (!STABILITY_API_KEY) {
    throw new Error(
      "Stability AI API key missing. Set EXPO_PUBLIC_STABILITY_API_KEY in your .env"
    );
  }

  // Copy both files into cache so we have guaranteed file:// URIs
  const ts = Date.now();
  const [cachedImage, cachedMask] = await Promise.all([
    toCacheUri(imageUri, `inpaint_image_${ts}.png`),
    toCacheUri(maskUri, `inpaint_mask_${ts}.png`),
  ]);

  const imageMime = getMimeType(imageUri);

  // React Native's {uri, name, type} file object — the only Hermes-safe
  // way to include binary file data in a multipart form request.
  const formData = new FormData();
  formData.append("image", {
    uri: cachedImage,
    name: "image.png",
    type: imageMime,
  } as any);
  formData.append("mask", {
    uri: cachedMask,
    name: "mask.png",
    type: "image/png",
  } as any);
  formData.append("prompt", prompt);
  formData.append("output_format", "png");
  // MASK_IMAGE_WHITE: white-painted areas are what gets inpainted
  formData.append("mask_source", "MASK_IMAGE_WHITE");

  return xhrPost(
    API_URL,
    {
      Authorization: `Bearer ${STABILITY_API_KEY}`,
      Accept: "application/json",
      // Do NOT set Content-Type — XHR sets it automatically with the correct
      // multipart/form-data boundary
    },
    formData
  );
}