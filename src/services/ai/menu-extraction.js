import { safeParseModelJson } from "@/lib/json-parser"
import { BedrockRuntimeClient, ConverseCommand } from "@aws-sdk/client-bedrock-runtime";
// Initialize the Bedrock Runtime client
const bedrockClient = new BedrockRuntimeClient({ region: "us-east-1" });
export async function extractMenuFromImage(fileBuffer, mimeType = "application/pdf") {
    // Normalize format strings
    const cleanMime = mimeType.toLowerCase().split(";")[0].trim();

    let contentBlock = {};

    // Core routing block to handle PDF split sheets vs Flat Image fallbacks
    if (cleanMime === "application/pdf" || cleanMime.endsWith("pdf")) {
        contentBlock = {
            document: {
                name: `MenuPage_${Date.now()}`,
                format: "pdf", // Bedrock standard document type
                source: {
                    bytes: new Uint8Array(fileBuffer)
                }
            }
        };
    } else {
        // Fallback processing if it's a standard image stream 
        let imageExt = cleanMime.replace("image/", "");
        if (imageExt === "jpg") imageExt = "jpeg";

        const allowedFormats = ["gif", "jpeg", "png", "webp"];
        if (!allowedFormats.includes(imageExt)) imageExt = "jpeg";

        contentBlock = {
            image: {
                format: imageExt,
                source: {
                    bytes: new Uint8Array(fileBuffer)
                }
            }
        };
    }

    const systemPromptText = `
You are an expert restaurant menu extraction engine. Your task is to extract menu information and pass it to the 'output_menu_json' tool configuration matching the precise schema requested. 
`;

    const promptText = `
Your task is to convert the provided restaurant menu PDF/image into structured JSON. Also make sure if any item have variants then do add variants for that item them.

==================================================
ABSOLUTE REQUIREMENTS
==================================================
1. Do not hallucinate menu items.
2. Preserve all visible prices exactly.
3. Preserve category hierarchy whenever possible.

==================================================
CATEGORY DETECTION RULES
==================================================
Categories are menu sections such as: Rice, Biryani, Pizza, Soups, Starters, Main Course, Chinese, Beverages, Desserts.
Subcategories are actual food groups.
Example:
Chinese
 ├── Fried Rice
 ├── Noodles

==================================================
CRITICAL VARIANT DETECTION RULES
==================================================
The following are NEVER categories/subcategories: HALF, FULL, SMALL, MEDIUM, LARGE, REGULAR, MINI, QUARTER, HALF PLATE, FULL PLATE, 250ML, 500ML, 750ML, 1LTR, 1L, 2L.
These ALWAYS represent variants. If you detect sections categorized under these keys, merge matching items together and generate variants instead.

If you see:
JEERA RICE
HALF 70
FULL 110

Output Option Array Structure:
- HALF -> 70
- FULL -> 110

==================================================
DESCRIPTION RULES
==================================================
description is mandatory. If missing from the physical menu, generate a concise food description between 5 to 12 words.

==================================================
VEG DETECTION RULES
==================================================
Set: VEG, NON_VEG, EGG, UNKNOWN based on menu headers, markers, or item names.

==================================================
PRICE RULES
==================================================
If an item has variants, "price" should equal the minimum variant price also it is mandatory to define the variants if exists "variants": [
                {
                  "property_name": "Portion",
                  "options": [
                    { "option_name": "Half", "price": 70 },
                    { "option_name": "Full", "price": 110 }
                  ]
                }
              ] . Never use 0 or null.

            
==================================================
VARIANTS RULES
==================================================

Show vairants only if a items has more that one vairants here is the sample for it {
                  "property_name": "Portion",
                  "options": [
                    { "option_name": "Half", "price": 70 },
                    { "option_name": "Full", "price": 110 }
                  ]
                }

==================================================
OUTPUT FORMAT
==================================================
You MUST structure your JSON output EXACTLY like this example. The root object MUST contain a "categories" array.
Return ONLY MINIFIED JSON. No whitespace, no newlines.
{
  "categories": [
    {
      "name": "Main Course",
      "sub_category": [
        {
          "name": "Rice Dishes",
          "items": [
            {
              "name": "Jeera Rice",
              "description": "Basmati rice cooked with cumin seeds",
              "price": 70,
              "is_veg": "VEG",
              "variants": [
                {
                  "property_name": "Portion",
                  "options": [
                    { "option_name": "Half", "price": 70 },
                    { "option_name": "Full", "price": 110 }
                  ]
                }
              ]
            }
          ]
        }
      ]
    }
  ]
}
`;

    const commandInput = {
        modelId: "amazon.nova-lite-v1:0",
        system: [
            {
                text: systemPromptText
            }
        ],
        messages: [
            {
                role: "user",
                content: [
                    contentBlock,
                    {
                        text: promptText
                    }
                ]
            }
        ],
        inferenceConfig: {
            maxTokens: 10000,
            temperature: 0.1
        }
    };

    try {
        const command = new ConverseCommand(commandInput);

        const response = await bedrockClient.send(command);

        const content =
            response?.output?.message?.content || [];

        console.log(
            "Nova Response:",
            JSON.stringify(content, null, 2)
        );

        /*
        ---------------------------------------------------
        FIRST PRIORITY
        TOOL OUTPUT
        ---------------------------------------------------
        */

        const toolBlock = content.find(
            block => block.toolUse
        );

        if (toolBlock?.toolUse?.input) {
            return toolBlock.toolUse.input;
        }

        /*
        ---------------------------------------------------
        SECOND PRIORITY
        RAW TEXT RECOVERY
        ---------------------------------------------------
        */

        const rawText = content
            .map(block => {
                if (block.text) {
                    return block.text;
                }

                if (block.toolUse?.input) {
                    return JSON.stringify(
                        block.toolUse.input
                    );
                }

                return "";
            })
            .join("\n");

        const recovered =
            safeParseModelJson(rawText);

        if (recovered) {
            console.log(
                "Recovered JSON from truncated response"
            );

            return recovered;
        }

        return {
            categories: []
        };
    } catch (error) {
        console.error(
            "Failed handling Nova Lite processing orchestration step:",
            error
        );

        return {
            categories: [],
            error: true,
            message: error.message
        };
    }
} 