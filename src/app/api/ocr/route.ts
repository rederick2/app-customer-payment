import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request: NextRequest) {
  try {
    const { imageUrl } = await request.json();

    if (!imageUrl) {
      return NextResponse.json({ error: 'No image URL provided.' }, { status: 400 });
    }

    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json({ error: 'OpenAI API key not configured.' }, { status: 500 });
    }

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "user",
          content: [
            { 
              type: "text", 
              text: `Extract information from this receipt for an interior design project. 
              Respond ONLY with a JSON object containing:
              - place: (string) The name of the establishment.
              - date: (string) The date in YYYY-MM-DD format.
              - amount: (number) The total amount.
              - category: (string) A category related to interior design (e.g., "Materiales", "Mano de Obra", "Decoración", "Herramientas", "Otros").
              - description: (string) A brief description of the purchase.
              
              If information is missing, use null.`
            },
            {
              type: "image_url",
              image_url: {
                "url": imageUrl,
              },
            },
          ],
        },
      ],
      response_format: { type: "json_object" },
    });

    const content = response.choices[0].message.content;
    const data = content ? JSON.parse(content) : null;

    return NextResponse.json(data);
  } catch (error: any) {
    console.error('OCR OCR error:', error);
    return NextResponse.json({ error: error.message || 'OCR failed.' }, { status: 500 });
  }
}
