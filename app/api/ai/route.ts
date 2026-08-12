import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const SYSTEM_PROMPT = `You are an org-chart assistant. You receive the current tab's tree structure as JSON and a user instruction. Return ONLY valid JSON — the modified roots array. No markdown, no explanation.

Each node has this shape:
{
  "id": "string",
  "title": "string (role/name)",
  "subtitle": "string (optional subtitle)",
  "description": "string (optional)",
  "reportsTo": "string (parent's title, empty for roots)",
  "color": "string (hex color)",
  "children": [... nested nodes],
  "jobDescription": "string (optional)",
  "requiredSkills": ["string"] (optional)
}

Rules:
- Generate unique IDs using the format "ai-" + random 8 chars for new nodes
- Set "reportsTo" to the parent node's title for children, empty string for roots
- Keep existing node IDs unchanged when modifying (don't regenerate IDs for nodes that already exist)
- Use hex colors from this palette: #990011, #5C000A, #2F3C7E, #C9A227, #0F6E56, #5F5E5A, #1A5276, #7D3C98
- Return the full roots array with modifications applied
- If the instruction is unclear, make your best interpretation`;

export async function POST(req: NextRequest) {
  try {
    const { roots, prompt, tabLabel } = await req.json();

    if (!process.env.ANTHROPIC_API_KEY) {
      return NextResponse.json({ error: "ANTHROPIC_API_KEY not configured" }, { status: 500 });
    }

    const message = await client.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 4096,
      system: SYSTEM_PROMPT,
      messages: [
        {
          role: "user",
          content: `Tab: "${tabLabel}"

Current structure:
${JSON.stringify(roots, null, 2)}

Instruction: ${prompt}`,
        },
      ],
    });

    const text = message.content[0].type === "text" ? message.content[0].text : "";
    const jsonMatch = text.match(/\[[\s\S]*\]/);
    if (!jsonMatch) {
      return NextResponse.json({ error: "AI did not return valid JSON" }, { status: 400 });
    }

    const newRoots = JSON.parse(jsonMatch[0]);
    return NextResponse.json({ roots: newRoots });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Unknown error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
