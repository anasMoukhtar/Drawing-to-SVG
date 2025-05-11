
import { genkit, type Genkit } from 'genkit';
import { googleAI } from '@genkit-ai/googleai';

const DEFAULT_MODEL_NAME = 'googleai/gemini-2.0-flash';

// Initialize with no plugins. It will be configured by configureGenkitInstance.
// Calls to ai.generate will fail if made before configuration.
export let ai: Genkit = genkit({ plugins: [] });

let lastConfiguredApiKey: string | undefined = undefined;

export async function configureGenkitInstance(apiKey: string) {
  if (!apiKey) {
    // If the key is cleared, reset Genkit to an unconfigured state
    if (lastConfiguredApiKey !== undefined) {
      console.warn("API key removed or missing. AI features will be disabled.");
      ai = genkit({ plugins: [] });
      lastConfiguredApiKey = undefined;
    }
    // Throw an error if no API key is provided when configuration is attempted
    throw new Error("API Key is required to use AI features.");
  }

  // Avoid reconfiguring if the key hasn't changed, unless 'ai' seems unconfigured.
  // A more robust check would be to see if the googleAI plugin is active with the same key.
  // For now, if API key is the same, assume it's configured. This is a light optimization.
  // However, to ensure flows use the latest config, re-init is safer if state is complex.
  // Given the current setup (re-assigning global `ai`), we should re-init if key changes or was never set.

  if (apiKey === lastConfiguredApiKey) {
     // A simple check: if ai.getModels() (or similar) throws, it might mean not configured.
     // However, ai.getModels() doesn't exist. ai.listModels() can be used.
     try {
        // If we have models, assume it's configured. This isn't foolproof for all plugins.
        if (Object.keys(ai.registry.models).length > 0) {
            // console.log("Genkit appears to be already configured with this API key.");
            return;
        }
     } catch (e) {
        // Fall through to reconfigure
     }
  }


  console.log("Configuring Genkit with Google AI plugin...");
  try {
    // Re-assign the global 'ai' instance with the new configuration
    ai = genkit({
      plugins: [googleAI({ apiKey })],
      model: DEFAULT_MODEL_NAME, // This sets the default model for this 'ai' instance
    });
    lastConfiguredApiKey = apiKey;
    console.log("Genkit configured successfully.");

    // Optional: Perform a quick test like listing models to ensure connection
    // This is an async operation, so configureGenkitInstance should be async.
    // await ai.listModels(); 
    // console.log("Models listed successfully after configuration.");

  } catch (error) {
    console.error("Failed to configure Genkit with API key:", error);
    ai = genkit({ plugins: [] }); // Fallback to a non-functional instance
    lastConfiguredApiKey = undefined; // Clear the record of the last key

    let userErrorMessage = "Failed to configure AI service with the provided API key. Please check the key and try again.";
    if (error instanceof Error) {
        if (error.message.toLowerCase().includes("api key not valid") || error.message.toLowerCase().includes("invalid api key")) {
            userErrorMessage = "The provided API key is not valid. Please check the key and try again.";
        } else if (error.message.toLowerCase().includes("quota")) {
            userErrorMessage = "The API key may be valid, but an issue occurred (e.g., quota exceeded). Please check your Google Cloud console.";
        } else if (error.message.toLowerCase().includes("permission denied")) {
            userErrorMessage = "The API key may be valid, but lacks permissions for the Gemini API. Please ensure the API is enabled in your Google Cloud project and the key has the 'AI Platform Model User' or 'Vertex AI User' role.";
        }
    }
    throw new Error(userErrorMessage);
  }
}

    