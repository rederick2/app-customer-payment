import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request: NextRequest) {
  try {
    const { projectName, projectDescription } = await request.json();

    if (!projectName && !projectDescription) {
      return NextResponse.json({ error: 'Se requiere información del proyecto o descripción.' }, { status: 400 });
    }

    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json({ error: 'OpenAI API key not configured.' }, { status: 500 });
    }

    const prompt = `
    Eres un experto en construcción y estimación de costos enfocado en el mercado de Perú.
    
    Tu tarea es generar un listado de materiales necesarios para el siguiente proyecto, haciendo scraping real de Sodimac (Perú) y extrayendo los datos de alli.
    
    Información del Proyecto:
    ${projectName ? `Nombre: ${projectName}` : ''}
    ${projectDescription ? `Descripción: ${projectDescription}` : ''}
    
    Proporciona una lista detallada y realista de los materiales de construcción o acabado que se requerirían, estimando cantidades y precios haciendo scraping real de Sodimac (Perú). 
    Usa el idioma Español y moneda Soles para las descripciones de los materiales.
    
    Devuelve ÚNICAMENTE un objeto JSON con el siguiente formato, sin markdown extra:
    {
      "materials": [
        {
          "name": "Nombre corto del material (ej. Drywall 2.44 x 1.22)",
          "description": "Descripción más detallada o uso en el proyecto",
          "quantity": 10.5,
          "unit_price": 18.00 (Precio en Soles),
          "photo_url": "URL de la web de sodimac",
          "product_url": "URL de la web de sodimac"
        }
      ]
    }
    `;

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [{ role: "user", content: prompt }],
      response_format: { type: "json_object" },
    });

    const content = response.choices[0].message.content;
    if (!content) throw new Error("No content received from AI");

    const parsed = JSON.parse(content);

    return NextResponse.json({ materials: parsed.materials });
  } catch (error: any) {
    console.error('AI Materials Generation Error:', error);
    return NextResponse.json({ error: error.message || 'Error al generar los materiales con IA.' }, { status: 500 });
  }
}
