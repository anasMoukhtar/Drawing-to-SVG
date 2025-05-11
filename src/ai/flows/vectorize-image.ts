
'use server';
/**
 * @fileOverview Converts a user-uploaded drawing into a clean, scalable SVG vector graphic.
 *
 * - vectorizeImage - A function that handles the image vectorization process.
 * - VectorizeImageInput - The input type for the vectorizeImage function.
 * - VectorizeImageOutput - The return type for the vectorizeImage function.
 */

import { ai } from '@/ai/genkit'; // ai is mutable and configured by actions.ts before this function is called
import { z } from 'zod';

const VectorizeImageInputSchema = z.object({
  drawingDataUri: z
    .string()
    .describe(
      "A drawing, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
});
export type VectorizeImageInput = z.infer<typeof VectorizeImageInputSchema>;

const VectorizeImageOutputSchema = z.object({
  svgData: z
    .string()
    .describe('The SVG data representing the vectorized image.'),
});
export type VectorizeImageOutput = z.infer<typeof VectorizeImageOutputSchema>;

export async function vectorizeImage(input: VectorizeImageInput): Promise<VectorizeImageOutput> {
  const { drawingDataUri } = input;

  // The 'ai' object here is the global instance from '@/ai/genkit.ts',
  // which should have been configured by `configureGenkitInstance(apiKey)`
  // in `actions.ts` before this function is invoked.

  try {
    const generationResult = await ai.generate({
      prompt: [ // Using multimodal prompt for Gemini
        { 
          text: `You are an expert graphic designer specializing in converting raster images (like user drawings) to SVG vector graphics.
Analyze the provided drawing and convert it into a clean, scalable, and semantically correct SVG vector graphic.
The SVG should accurately represent the original drawing's shapes, lines, and overall composition.
Prioritize clarity and efficiency in the SVG code. Ensure the output is only the SVG data string.
Do not include any explanatory text, markdown formatting, or anything other than the raw SVG string in your output.
The output must be a single SVG string that starts with "<svg" and ends with "</svg>".
For example: "<svg width='100' height='100' xmlns='http://www.w3.org/2000/svg'><circle cx='50' cy='50' r='40' stroke='black' stroke-width='3' fill='red' /></svg>"
Input Drawing:`
        },
        { media: { url: drawingDataUri } }
      ],
      output: { schema: VectorizeImageOutputSchema },
      // The model is typically set on the 'ai' instance when it's configured.
      // If not, or to override, specify here: model: 'googleai/gemini-2.0-flash'
      // Add safety settings if necessary
      // config: {
      //   safetySettings: [
      //     { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_NONE' },
      //   ],
      // },
    });

    const output = generationResult.output;
    if (!output || !output.svgData) { // Check svgData specifically based on schema
      console.error("AI model output missing svgData:", output);
      throw new Error('AI model did not return the expected SVG data format.');
    }
    
    // Basic validation: does it look like an SVG?
    const trimmedSvg = output.svgData.trim();
    if (!trimmedSvg.startsWith('<svg') || !trimmedSvg.endsWith('</svg>')) {
        console.warn("Output doesn't look like a valid SVG:", trimmedSvg);
        // Depending on strictness, one might throw an error here or try to use it.
        // For now, we'll proceed but this indicates a potential issue with the prompt or model response.
        // throw new Error("The AI model returned data that does not appear to be a valid SVG string.");
    }

    return output; // Zod schema validation is implicitly handled by Genkit if output schema is provided
  } catch (e) {
    console.error("Error during AI generation in vectorizeImage:", e);
    if (e instanceof Error && e.message.includes("model is not available")) {
        throw new Error("The AI model is currently unavailable or not configured correctly. Please check the API key and model name.");
    }
    // Re-throw other errors to be handled by the caller (actions.ts)
    throw e;
  }
}

// Removed ai.definePrompt and ai.defineFlow as this is now a direct function call
// using a dynamically configured 'ai' instance.

    