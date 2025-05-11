
'use server';

import { vectorizeImage, type VectorizeImageInput, type VectorizeImageOutput } from '@/ai/flows/vectorize-image';
import { configureGenkitInstance } from '@/ai/genkit';

export interface VectorizeResult {
  svgData: string | null;
  error: string | null;
}

export async function handleVectorizeImageAction(drawingDataUri: string, apiKey: string): Promise<VectorizeResult> {
  if (!apiKey || !apiKey.trim()) {
    return { svgData: null, error: 'API Key is required.' };
  }

  if (!drawingDataUri) {
    return { svgData: null, error: 'No drawing data provided. Please draw something on the canvas first.' };
  }
  
  if (!/^data:image\/(png|jpeg|gif|webp);base64,/.test(drawingDataUri)) {
    return { svgData: null, error: 'Invalid image data format. Expected a Base64 encoded image data URI.' };
  }

  try {
    // Configure Genkit with the provided API key for this specific action call
    await configureGenkitInstance(apiKey);

    const input: VectorizeImageInput = { drawingDataUri };
    const result: VectorizeImageOutput = await vectorizeImage(input);
    
    if (!result || !result.svgData) {
      return { svgData: null, error: 'AI model did not return SVG data. The drawing might be too complex or empty.' };
    }
    return { svgData: result.svgData, error: null };
  } catch (e) {
    console.error('Error vectorizing image:', e);
    let errorMessage = 'Failed to vectorize image due to an unexpected error.';
    if (e instanceof Error) {
        errorMessage = e.message;
    }
    
    // Check for specific Genkit/AI related errors if possible or provide more generic user-friendly messages
    if (errorMessage.toLowerCase().includes("api key not valid") || errorMessage.toLowerCase().includes("invalid api key")) {
        errorMessage = "The provided API key is not valid. Please check the key and try again.";
    } else if (errorMessage.includes('deadline') || errorMessage.toLowerCase().includes('timeout')) {
        errorMessage = 'The vectorization process timed out. Please try again with a simpler drawing or check your network connection.';
    } else if (errorMessage.toLowerCase().includes('quota')) {
        errorMessage = "The API key is valid, but an issue occurred (e.g. exceeded quota). Please check your Google Cloud console.";
    } else if (errorMessage.toLowerCase().includes("failed to configure ai service")) {
        // This specific message comes from our configureGenkitInstance
        // No need to change it further unless we want to hide details.
    }


    return { svgData: null, error: errorMessage };
  }
}

    