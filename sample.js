import ModelClient, { isUnexpected } from "@azure-rest/ai-inference";
import { AzureKeyCredential } from "@azure/core-auth";
import * as fs from "fs/promises"; // Import Node.js File System promises API

const token = process.env["GITHUB_TOKEN"];
const endpoint = "https://models.github.ai/inference";
const model = "meta/Llama-3.2-90B-Vision-Instruct"; // Confirm this model supports image input

export async function main() {
  if (!token) {
    throw new Error("GITHUB_TOKEN environment variable not set.");
  }

  const client = ModelClient(
    endpoint,
    new AzureKeyCredential(token),
  );

  // --- 1. Load and encode the image ---
  const imagePath = "./contoso_layout_sketch.jpg"; // Replace with the actual path to your image file
  let imageBase64;
  try {
    const imageBuffer = await fs.readFile(imagePath);
    imageBase64 = imageBuffer.toString("base64");
  } catch (error) {
    console.error(`Error reading image file at ${imagePath}:`, error);
    throw new Error(`Could not load image. Make sure '${imagePath}' exists and is accessible.`);
  }

  // --- 2. Construct the messages array with image and text parts ---
  const messages = [
    { role: "system", content: "You are a helpful assistant that can generate code from visual inputs." },
    {
      role: "user",
      content: [
        {
          type: "text",
          text: "Write HTML and CSS code for a web page based on the following hand-drawn sketch.",
        },
        {
          type: "image_url", // Or "image_bytes" if the API prefers raw bytes with media_type
          image_url: {
            url: `data:image/png;base64,${imageBase64}`, // Data URL format for Base64 image
          },
          // Alternatively, if the API expects image_bytes:
          // type: "image_bytes",
          // image_bytes: {
          //   data: imageBase64,
          //   media_type: "image/png", // Make sure to specify the correct image type
          // },
        },
      ],
    },
  ];

  // --- 3. Make the API call with the updated messages ---
  const response = await client.path("/chat/completions").post({
    body: {
      messages: messages, // Pass the new messages array
      temperature: 0.7, // Adjust temperature for code generation (lower for less creativity)
      top_p: 1.0,
      model: model,
      // You might need to add max_tokens for code generation to ensure full response
      // max_tokens: 4000,
    },
  });

  if (isUnexpected(response)) {
    console.error("API Error Response:", response.body); // Log full error body
    throw new Error(`API Error: ${response.body.error?.message || "Unknown error"}`);
  }

  console.log(response.body.choices[0].message.content);
}

main().catch((err) => {
  console.error("The sample encountered an error:", err);
});