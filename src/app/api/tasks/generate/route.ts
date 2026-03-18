import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { format, addDays } from 'date-fns';
import { createClient } from '@supabase/supabase-js'; // We need admin/service role client if not in request context, or use standard next/server client

// For server side in api route without cookies we can use service role to read items, but next/server is better inside app router.
// Let's create a client. We can use the environment variables explicitly since it's a backend operation.
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request: NextRequest) {
  try {
    const { projectId, projectName, projectDescription, startDate } = await request.json();

    if (!projectId || !projectName) {
      return NextResponse.json({ error: 'Faltan datos del proyecto.' }, { status: 400 });
    }

    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json({ error: 'OpenAI API key not configured.' }, { status: 500 });
    }

    // Fetch the line items for this project
    const { data: items, error: itemsError } = await supabase
      .from('proforma_items')
      .select('id, description, quantity, is_optional, details')
      .eq('proforma_id', projectId);

    const itemListings = items && items.length > 0 
      ? items.map(i => `- ID: ${i.id} | Servicio/Producto: ${i.description} | Cantidad: ${i.quantity} ${i.details ? `| Detalles: ${i.details}` : ''}`).join('\n')
      : 'No hay items específicos asociados al proyecto todavía.';

    const defaultStartDate = startDate || new Date().toISOString();

    const prompt = `
    You are an expert project manager for an interior design and remodeling company.
    Generate a logical sequence of tasks for the following project:
    Proyecto: ${projectName}
    ${projectDescription ? `Descripción del cliente: ${projectDescription}` : ''}
    
    The project has the following ITEMS (Products/Services sold):
    ${itemListings}
    
    The project starts on ${format(new Date(defaultStartDate), 'yyyy-MM-dd')}.
    
    Please review the ITEMS sold and generate tasks that directly address completing these services or providing these products. You can also add general project management tasks (like Kickoff, Final inspection).
    
    Return ONLY a JSON response in this exact format:
    {
      "tasks": [
        {
          "title": "Task title (in Spanish)",
          "description": "Brief task description (in Spanish)",
          "daysOffsetStart": 0,  // Number of days after the project start date that this task begins
          "durationDays": 2,     // Duration of the task in days
          "proformaItemId": "uuid-here" // IMPORTANT: The exact ID of the item this task relates to from the list above. Return null if it's a general task.
        }
      ]
    }
    Generate between 3 and 10 essential tasks, ensuring a logical chronological flow.
    Make sure titles are concise and descriptive.
    `;

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [{ role: "user", content: prompt }],
      response_format: { type: "json_object" },
    });

    const content = response.choices[0].message.content;
    if (!content) throw new Error("No content received from AI");

    const parsed = JSON.parse(content);
    
    // Convert offsets into actual dates based on the startDate provided.
    const baseDate = new Date(defaultStartDate);
    
    const formedTasks = parsed.tasks.map((t: any) => {
      const start = addDays(baseDate, t.daysOffsetStart || 0);
      const end = addDays(start, (t.durationDays || 1) - 1 > 0 ? t.durationDays - 1 : 0); 
      
      return {
        title: t.title,
        description: t.description,
        due_date: start.toISOString(),
        end_date: end.toISOString(),
        proforma_item_id: t.proformaItemId || null
      };
    });

    return NextResponse.json({ tasks: formedTasks });
  } catch (error: any) {
    console.error('AI Task Generation Error:', error);
    return NextResponse.json({ error: error.message || 'Error generating tasks.' }, { status: 500 });
  }
}
