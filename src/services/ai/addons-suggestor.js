import { BedrockRuntimeClient, ConverseCommand } from "@aws-sdk/client-bedrock-runtime";
import { safeParseModelJson } from "@/lib/json-parser";

const bedrockClient = new BedrockRuntimeClient({ region: "ap-southeast-2" });

export async function suggestAddons(menuItems) {
    const systemPromptText = `
You are an expert restaurant menu strategist and menu engineer. Your goal is to analyze a given list of menu items and suggest highly relevant, profitable Addon Groups (modifiers) that enhance the dining experience and increase the average order value.

Guidelines:
1. Suggest 3 to 5 distinct Addon Groups that make logical sense for the provided menu items. For example, if there are Pizzas, suggest "Extra Toppings" or "Crust Options". If there are Burgers, suggest "Dips & Sauces" or "Make it a Meal".
2. Each Addon Group should have 3 to 6 practical Options (e.g., "Extra Cheese", "Mayonnaise", "Coke").
3. Assign realistic, small addon prices for each option (in Indian Rupees).
4. Accurately label the veg/non-veg status for each option (VEG, NON_VEG, or EGG).
5. Specify the exact list of \`item_ids\` that this Addon Group should be assigned to. Only assign an Addon Group to relevant items. (e.g., don't assign "Extra Cheese" to a milkshake).

Output exactly one JSON object wrapped in \`\`\`json ... \`\`\` with the following structure:
{
  "addons": [
    {
      "name": "Addon Group Name (e.g. Extra Toppings)",
      "min": 0,
      "max": 3,
      "allow_multiple": true,
      "max_per_item": 2,
      "options": [
        {
          "name": "Option Name (e.g. Extra Cheese)",
          "price": 30,
          "is_veg": "VEG" // Must be one of VEG, NON_VEG, EGG, or NONE
        }
      ],
      "item_ids": [123, 456] // The IDs of the items this group should be attached to
    }
  ]
}
`;

    const promptText = `
Here are the existing menu items:
${JSON.stringify(menuItems, null, 2)}

Please suggest the addon groups and their assignments based on these items.
`;

    try {
        const command = new ConverseCommand({
            modelId: "amazon.nova-lite-v1:0",
            messages: [
                {
                    role: "user",
                    content: [{ text: promptText }]
                }
            ],
            system: [{ text: systemPromptText }],
            inferenceConfig: {
                maxTokens: 4096,
                temperature: 0.2,
                topP: 0.9
            }
        });

        const response = await bedrockClient.send(command);
        const text = response.output.message.content[0].text;
        
        return safeParseModelJson(text);
    } catch (error) {
        console.error("Error suggesting addons via Bedrock:", error);
        throw error;
    }
}
