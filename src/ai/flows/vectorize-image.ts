'use server';
/**
 * @fileOverview Converts a user-uploaded drawing into a clean, scalable SVG vector graphic.
 *
 * - vectorizeImage - A function that handles the image vectorization process.
 * - VectorizeImageInput - The input type for the vectorizeImage function.
 * - VectorizeImageOutput - The return type for the vectorizeImage function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

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
  return vectorizeImageFlow(input);
}

const prompt = ai.definePrompt({
  name: 'vectorizeImagePrompt',
  input: {schema: VectorizeImageInputSchema},
  output: {schema: VectorizeImageOutputSchema},
  prompt: `You are an expert graphic designer specializing in converting images to SVG vector graphics.

You will take the user's drawing and convert it into a clean, scalable SVG vector graphic.

Convert the following drawing to SVG:

Drawing: {{media url=drawingDataUri}}

Ensure the SVG is clean, efficient, and accurately represents the original drawing.`, 
});

const vectorizeImageFlow = ai.defineFlow(
  {
    name: 'vectorizeImageFlow',
    inputSchema: VectorizeImageInputSchema,
    outputSchema: VectorizeImageOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
