// services/stabilityai.ts
const STABILITY_API_KEY = process.env.EXPO_PUBLIC_STABILITY_API_KEY;
const API_URL = "https://api.stability.ai/v2beta/stable-image/edit/inpaint";

export interface InpaintingResponse {
  image: string; // The base64 string
  seed: number;
  finish_reason: string;
}

export async function inpaint(
  imageUri: string,
  maskUri: string,
  prompt: string
): Promise<InpaintingResponse> {
  if (!STABILITY_API_KEY) {
    throw new Error("Stability AI API key missing.");
  }

  const formData = new FormData();

  // In React Native, we MUST use this structure for the bridge to send files
  formData.append("image", {
    uri: imageUri,
    name: "image.png",
    type: "image/png",
  } as any);

  formData.append("mask", {
    uri: maskUri,
    name: "mask.png",
    type: "image/png",
  } as any);

  formData.append("prompt", prompt);
  formData.append("output_format", "png");
  
  // MASK_IMAGE_WHITE: area you drew (white) is what gets changed
  formData.append("mask_source", "MASK_IMAGE_WHITE"); 

  const response = await fetch(API_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${STABILITY_API_KEY}`,
      Accept: "application/json",
      // IMPORTANT: Do NOT set 'Content-Type'. fetch does this automatically.
    },
    body: formData,
  });

  const responseData = await response.json();

  if (!response.ok) {
    const msg = responseData.errors ? JSON.stringify(responseData.errors) : responseData.message;
    throw new Error(`API Error: ${msg}`);
  }

  return responseData;
}