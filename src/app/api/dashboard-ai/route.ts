import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(req: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { prompt } = await req.json();
    if (!prompt) {
      return NextResponse.json({ error: 'Prompt is required' }, { status: 400 });
    }

    // Fetch aggregate context for the AI
    // 1. Clients
    const { data: clientsData, error: clientsError } = await supabase
      .from('clients')
      .select('id, name, company_name, created_at, street_1, city, province, postal_code');

    console.log('clientsData', clientsError);

    // 2. Proformas & Revenue
    const { data: proformasData, error: proformasError } = await supabase
      .from('proformas')
      .select(`
        id, 
        project_name, 
        status, 
        total, 
        created_at,
        is_template,
        clients(name, company_name)
      `)
      .eq('is_template', false);

    // Prepare context payload safely without overloading token limits
    // Sum total revenue
    const validProformas = proformasData || [];
    const revenueGeneratingStatuses = ['job', 'job_terminated'];
    const totalRevenue = validProformas
      .filter(p => p.status && revenueGeneratingStatuses.includes(p.status))
      .reduce((acc, p) => acc + (p.total || 0), 0);

    // Status breakdown
    const statusCounts = validProformas.reduce((acc: any, p) => {
      acc[p.status || 'draft'] = (acc[p.status || 'draft'] || 0) + 1;
      return acc;
    }, {});

    // Last 6 months revenue array
    const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const now = new Date();
    const monthlyRevenueMap: Record<string, number> = {};

    // Initialize last 6 months to 0
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = `${monthNames[d.getMonth()]} ${d.getFullYear().toString().substring(2)}`;
      monthlyRevenueMap[key] = 0;
    }

    // Populate revenue
    validProformas.forEach(p => {
      if (p.status && revenueGeneratingStatuses.includes(p.status) && p.created_at) {
        const d = new Date(p.created_at);
        const key = `${monthNames[d.getMonth()]} ${d.getFullYear().toString().substring(2)}`;
        if (monthlyRevenueMap[key] !== undefined) {
          monthlyRevenueMap[key] += (p.total || 0);
        }
      }
    });

    const monthlyRevenue = Object.entries(monthlyRevenueMap).map(([month, rev]) => ({
      month,
      revenue: rev
    }));
    const simplifiedClients = (clientsData || []).map(c => ({
      name: c.name || c.company_name || 'Desconocido',
      city: c.city || 'No Registrada',
      state: c.province || 'No Registrado',
      address: c.street_1 || 'No Registrada',
      zip: c.postal_code || ''
    }));

    // System context to inject
    const systemInstruction = `
You are a highly capable AI assistant for a business dashboard. The user is asking you for insights, lists, or charts based on their business data.

Here is a live summary of their business data:
- Total Clients: ${(clientsData || []).length}
- Total Jobs/Quotes: ${validProformas.length}
- Total Revenue (from active & completed jobs): $${totalRevenue.toLocaleString()}
- Projects Breakdown by Status: ${JSON.stringify(statusCounts)}
- Revenue Trend (Last 6 Months): ${JSON.stringify(monthlyRevenue)}

Below is the list of all clients and their location data (useful for grouping by city/state or lists):
${JSON.stringify(simplifiedClients)}

Below is the list of top 20 most recent projects for context (Project Name | Status | Total | Client):
${validProformas.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()).slice(0, 20).map(p =>
      `- ${p.project_name} | ${p.status} | $${p.total} | ${p.clients ? (p.clients as any).name || (p.clients as any).company_name : 'No Client'}`
    ).join('\n')}

Based on the user's prompt, you must return a strictly valid JSON response containing EXACTLY the following structure:
{
  "answer": "A friendly conversational answer addressing the prompt.",
  "type": "text" | "table" | "chart" | "metric",
  "chartData": {
     // ONLY IF type === "chart"
     "type": "bar" | "line" | "pie",
     "data": [ { "name": "Category", "value": 100 } ... ], // Array of objects mapping X-axis names to Y-axis values
     "xAxisKey": "string (the key in data representing the X axis label, e.g. 'name')",
     "dataKey": "string (the key in data representing the numerical value, e.g. 'value')"
  },
  "tableData": {
     // ONLY IF type === "table"
     "headers": ["Col 1", "Col 2"],
     "rows": [["Val1", "Val2"], ["Val3", "Val4"]]
  },
  "metricData": {
     // ONLY IF type === "metric"
     "label": "Small label, e.g. 'Total Jobs'",
     "value": "Big value string, e.g. 150"
  }
}
If the user asks for a chart and the data isn't exact, use the summary variables to approximate or plot what you can. Make sure names and keys match perfectly in "chartData".
Return ONLY valid JSON.
`;

    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: systemInstruction },
        { role: "user", content: prompt }
      ],
      response_format: { type: "json_object" },
      temperature: 0.1,
    });

    const aiMessage = response.choices[0].message.content;
    const parsedData = JSON.parse(aiMessage || "{}");

    return NextResponse.json(parsedData);

  } catch (error: any) {
    console.error('Error in Dashboard AI route:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
