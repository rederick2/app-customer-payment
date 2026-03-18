import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request: NextRequest) {
  try {
    const { projectName, projectDescription } = await request.json();

    if (!projectName) {
      return NextResponse.json({ error: 'El nombre del proyecto es obligatorio.' }, { status: 400 });
    }

    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json({ error: 'OpenAI API key not configured.' }, { status: 500 });
    }

    const prompt = `
    Eres un experto en estimación y presupuestos para una empresa de diseño de interiores y remodelaciones premium llamada "EstudioPro".
    
    Tu tarea es generar un listado de conceptos (items) para una nueva proforma/cotización basada en la siguiente información:
    
    Nombre del Proyecto: ${projectName}
    ${projectDescription ? `Descripción del Proyecto: ${projectDescription}` : ''}
    
    Debes desglosar el proyecto en items lógicos y profesionales. Por ejemplo:
    - Mano de obra especializada
    - Materiales específicos
    - Gestión de proyecto
    - Mobiliario o acabados
    
    Cada item debe incluir:
    1. Nombre (breve y profesional)
    2. Descripción detallada (explicando qué incluye el servicio o material)
    3. Cantidad (un número lógico, p.ej. 1 global, o metros cuadrados si aplica)
    4. Precio Unitario (un monto en USD que sea realista para el mercado premium de diseño)
    
    Devuelve ÚNICAMENTE un objeto JSON con el siguiente formato:
    {
      "items": [
        {
          "description": "Nombre del Item (en español)",
          "details": "Descripción detallada del item (en español)",
          "quantity": 1,
          "unit_price": 500.00
        }
      ]
    }
    
    Genera entre 3 y 8 items que cubran el alcance sugerido por el nombre y la descripción.
    Asegúrate de que los precios y cantidades sean coherentes entre sí.
    `;

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [{ role: "user", content: prompt }],
      response_format: { type: "json_object" },
    });

    const content = response.choices[0].message.content;
    if (!content) throw new Error("No content received from AI");

    const parsed = JSON.parse(content);

    return NextResponse.json({ items: parsed.items });
  } catch (error: any) {
    console.error('AI Proforma Generation Error:', error);
    return NextResponse.json({ error: error.message || 'Error al generar la proforma con IA.' }, { status: 500 });
  }
}
