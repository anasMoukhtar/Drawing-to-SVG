'use server';

import { vectorizeImage, type VectorizeImageInput, type VectorizeImageOutput } from '@/ai/flows/vectorize-image';

export interface VectorizeResult {
  svgData: string | null;
  error: string | null;
}

export async function handleVectorizeImageAction(drawingDataUri: string): Promise<VectorizeResult> {
  if (!drawingDataUri) {
    return { svgData: null, error: 'No drawing data provided. Please draw something on the canvas first.' };
  }

  try {
    const input: VectorizeImageInput = { drawingDataUri };
    // Adding a basic check for data URI format
    if (!/^data:image\/(png|jpeg|gif|webp);base64,/.test(drawingDataUri)) {
        return { svgData: null, error: 'Invalid image data format. Expected a Base64 encoded image data URI.' };
    }
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
    if (errorMessage.includes('deadline')) errorMessage = 'The vectorization process timed out. Please try again with a simpler drawing.';
    if (errorMessage.includes('API key')) errorMessage = 'There is an issue with the AI service configuration. Please contact support.';
    
    return { svgData: null, error: errorMessage };
  }
}
