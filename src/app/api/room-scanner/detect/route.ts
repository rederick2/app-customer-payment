import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import OpenAI from 'openai';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { imageBase64 } = await req.json();
    if (!imageBase64) return NextResponse.json({ error: 'Image required' }, { status: 400 });

    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      response_format: { type: 'json_object' },
      max_tokens: 800,
      messages: [
        {
          role: 'system',
          content: `You are a room scanning assistant. Your task is to identify the corners of a room floor from a photo.
Return ONLY a JSON object with a "corners" key containing an array of [x, y] coordinate pairs.
Each coordinate must be normalized between 0 and 1 (0 = top/left edge, 1 = bottom/right edge of the image).
Order the corners clockwise starting from the top-left most visible corner of the floor.
Identify between 3 and 8 corners. Focus on where the walls meet the floor.
Only include clearly visible floor corners, not furniture corners.
Example response: {"corners": [[0.14, 0.62], [0.87, 0.58], [0.91, 0.95], [0.11, 0.97]]}`
        },
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text: 'Please identify all visible floor corners in this room photo. Return their normalized [x, y] coordinates as described.'
            },
            {
              type: 'image_url',
              image_url: {
                url: imageBase64,
                detail: 'high'
              }
            }
          ]
        }
      ]
    });

    const content = response.choices[0]?.message?.content;
    if (!content) return NextResponse.json({ error: 'No response from AI' }, { status: 500 });

    let parsed: { corners?: number[][] };
    try {
      parsed = JSON.parse(content);
    } catch {
      return NextResponse.json({ error: 'Invalid AI response format' }, { status: 500 });
    }

    const corners = (parsed.corners || []).filter(
      (c): c is number[] =>
        Array.isArray(c) && c.length === 2 &&
        typeof c[0] === 'number' && typeof c[1] === 'number' &&
        c[0] >= 0 && c[0] <= 1 && c[1] >= 0 && c[1] <= 1
    );

    return NextResponse.json({ corners });
  } catch (err) {
    console.error('Room scanner detect error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
