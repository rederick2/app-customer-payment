'use client';

import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Sparkles, Send, Loader2, BarChart2 } from 'lucide-react';
import { 
  ResponsiveContainer, 
  BarChart, 
  Bar, 
  LineChart, 
  Line, 
  PieChart, 
  Pie, 
  Tooltip, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Cell 
} from 'recharts';

type AIResponse = {
  answer: string;
  type: 'text' | 'table' | 'chart' | 'metric';
  chartData?: {
    type: 'bar' | 'line' | 'pie';
    data: any[];
    xAxisKey: string;
    dataKey: string;
  };
  tableData?: {
    headers: string[];
    rows: string[][];
  };
  metricData?: {
    label: string;
    value: string;
  };
};

const COLORS = ['#8b5cf6', '#10b981', '#f59e0b', '#ef4444', '#3b82f6', '#ec4899'];

export function DashboardAIChat() {
  const [prompt, setPrompt] = useState("");
  const [loading, setLoading] = useState(false);
  const [response, setResponse] = useState<AIResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleAsk = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt.trim()) return;

    setLoading(true);
    setResponse(null);
    setError(null);

    try {
      const res = await fetch('/api/dashboard-ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt })
      });

      if (!res.ok) {
        throw new Error('Failed to get answer from AI');
      }

      const data = await res.json();
      setResponse(data);
    } catch (err: any) {
      console.error(err);
      setError(err.message || "An error occurred fetching the AI response.");
    } finally {
      setLoading(false);
    }
  };

  const renderChart = (chartConfig: AIResponse['chartData']) => {
    if (!chartConfig || !chartConfig.data || chartConfig.data.length === 0) return null;
    
    const { type, data, xAxisKey, dataKey } = chartConfig;

    if (type === 'bar') {
      return (
        <div className="h-[300px] w-full mt-6">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} strokeOpacity={0.2} />
              <XAxis dataKey={xAxisKey} axisLine={false} tickLine={false} tick={{ fontSize: 12 }} />
              <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12 }} width={40} />
              <Tooltip cursor={{ fill: 'transparent' }} contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} />
              <Bar dataKey={dataKey} fill="#8b5cf6" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      );
    }

    if (type === 'line') {
      return (
        <div className="h-[300px] w-full mt-6">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} strokeOpacity={0.2} />
              <XAxis dataKey={xAxisKey} axisLine={false} tickLine={false} tick={{ fontSize: 12 }} />
              <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12 }} width={40} />
              <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} />
              <Line type="monotone" dataKey={dataKey} stroke="#8b5cf6" strokeWidth={3} dot={{ r: 4, fill: '#8b5cf6' }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      );
    }

    if (type === 'pie') {
      return (
        <div className="h-[300px] w-full mt-6 flex justify-center">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                dataKey={dataKey}
                nameKey={xAxisKey}
                cx="50%"
                cy="50%"
                outerRadius={100}
                fill="#8b5cf6"
                label={({ name, percent }) => `${name} ${((percent || 0) * 100).toFixed(0)}%`}
              >
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      );
    }
  };

  const renderContent = () => {
    if (loading) {
      return (
        <div className="flex flex-col items-center justify-center py-16 text-muted-foreground animate-pulse">
          <Loader2 className="h-10 w-10 animate-spin mb-4 text-purple-600" />
          <p>Analyzing your business data...</p>
        </div>
      );
    }

    if (error) {
      return (
        <div className="text-center py-10 text-red-600 font-medium">
          {error}
        </div>
      );
    }

    if (!response) {
      return (
        <div className="text-center py-16">
          <div className="bg-purple-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
            <Sparkles className="h-8 w-8 text-purple-600" />
          </div>
          <h3 className="text-lg font-bold">Ask the AI anything</h3>
          <p className="text-muted-foreground mt-2 max-w-sm mx-auto text-sm">
            Example: "Show me my top 5 most recent jobs" or "Graph my revenue over the last 6 months" or "What is my total active job count?"
          </p>
        </div>
      );
    }

    return (
      <div className="space-y-6 pt-4">
        {response.answer && (
          <div className="prose prose-sm md:prose-base max-w-none prose-p:leading-relaxed text-foreground">
            <p className="font-medium">{response.answer}</p>
          </div>
        )}

        {response.type === 'metric' && response.metricData && (
          <div className="bg-muted/50 rounded-2xl p-8 flex flex-col items-center justify-center text-center mt-6">
            <p className="text-muted-foreground font-semibold uppercase tracking-widest text-sm mb-2">{response.metricData.label}</p>
            <p className="text-5xl font-black font-serif text-primary tracking-tighter">{response.metricData.value}</p>
          </div>
        )}

        {response.type === 'chart' && response.chartData && renderChart(response.chartData)}

        {response.type === 'table' && response.tableData && response.tableData.rows.length > 0 && (
          <div className="mt-6 border border-border/50 rounded-xl overflow-hidden shadow-sm">
            <table className="w-full text-sm text-left">
              <thead className="bg-muted/50 text-muted-foreground text-xs uppercase tracking-wider">
                <tr>
                  {response.tableData.headers.map((header, idx) => (
                    <th key={idx} className="px-6 py-4 font-semibold">{header}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-border/50">
                {response.tableData.rows.map((row, rowIdx) => (
                  <tr key={rowIdx} className="hover:bg-muted/30 transition-colors">
                    {row.map((cell, cellIdx) => (
                      <td key={cellIdx} className="px-6 py-4 font-medium">{cell}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    );
  };

  return (
    <Card className="shadow-sm border-border/40 overflow-hidden">
      <div className="bg-gradient-to-r from-purple-600 to-indigo-600 px-6 py-8 text-white relative overflow-hidden">
        <div className="absolute top-0 right-0 p-8 opacity-10 scale-150 rotate-12">
          <BarChart2 className="w-32 h-32" />
        </div>
        <div className="relative z-10 flex items-center gap-3 mb-2">
          <Sparkles className="h-6 w-6 text-purple-200" />
          <h2 className="text-2xl font-bold font-serif tracking-tight">AI Assistant</h2>
        </div>
        <p className="text-purple-100/80 max-w-xl relative z-10 text-sm">
          Chat with your business data. Generate charts, metrics, and lists instantly using AI.
        </p>
      </div>
      
      <CardContent className="p-6">
        <form onSubmit={handleAsk} className="relative flex items-center mb-8">
          <Input 
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="E.g., Generate a pie chart of my job statuses..." 
            className="pr-24 h-14 rounded-2xl text-base shadow-sm border-2 border-muted focus-visible:ring-purple-500/20 focus-visible:border-purple-500 transition-all bg-card placeholder:text-muted-foreground"
          />
          <Button 
            type="submit" 
            disabled={loading || !prompt.trim()}
            className="absolute right-2 h-10 px-5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white transition-all shadow-sm"
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4 mr-2" />}
            {loading ? '' : 'Ask'}
          </Button>
        </form>

        <div className="min-h-[250px]">
          {renderContent()}
        </div>
      </CardContent>
    </Card>
  );
}
