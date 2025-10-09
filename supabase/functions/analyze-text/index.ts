import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const systemPrompt = `Você é um especialista em metodologia científica e normas ABNT/ABNT NBR 14724. 
Sua tarefa é analisar o conteúdo fornecido pelo usuário para uma seção de um trabalho acadêmico.

SEÇÕES POSSÍVEIS:
- objectives: Objetivos (verbos no infinitivo, clareza, alinhamento)
- literature: Revisão de Literatura (citações, atualidade, organização)
- introduction: Introdução (contextualização, clareza, estrutura)
- methodology: Metodologia (tempo passado, detalhamento, rigor)
- results: Resultados (objetividade, visualização, organização)

INSTRUÇÕES:
1. Gere 3 a 5 sugestões de melhoria focadas em rigor acadêmico, clareza e estrutura
2. As sugestões devem ser curtas e acionáveis
3. Considere as normas ABNT e boas práticas acadêmicas
4. Retorne EXCLUSIVAMENTE um JSON válido (array de objetos)

FORMATO DE SAÍDA (JSON):
[
  {
    "type": "estrutura" | "clareza" | "melhoria" | "referencia",
    "title": "Título curto da sugestão",
    "content": "Descrição acionável da sugestão",
    "icon": "Lightbulb" | "AlertCircle" | "BookOpen"
  }
]`;

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { section, content } = await req.json();
    
    console.log(`Analisando seção: ${section}, comprimento: ${content.length}`);

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY não configurada");
    }

    // Verificação de conteúdo mínimo
    if (!content || content.trim().length < 50) {
      return new Response(
        JSON.stringify({ suggestions: [] }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const userPrompt = `Analise o seguinte texto da seção "${section}" de um trabalho acadêmico:

"${content}"

Gere sugestões de melhoria específicas para esta seção, considerando as normas ABNT e boas práticas acadêmicas.`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt }
        ],
        max_tokens: 800,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        throw new Error("Limite de requisições excedido. Tente novamente em alguns instantes.");
      }
      if (response.status === 402) {
        throw new Error("Créditos insuficientes. Adicione créditos ao workspace.");
      }
      const errorText = await response.text();
      console.error("Erro da IA:", response.status, errorText);
      throw new Error(`Erro da IA: ${response.status}`);
    }

    const data = await response.json();
    let aiContent = data.choices?.[0]?.message?.content;

    if (!aiContent) {
      throw new Error("Resposta vazia da IA");
    }

    // Limpar markdown code blocks se existirem
    aiContent = aiContent.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();

    // Parse do JSON
    const suggestions = JSON.parse(aiContent);

    console.log(`Sugestões geradas: ${suggestions.length}`);

    return new Response(
      JSON.stringify({ suggestions }),
      { 
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200 
      }
    );

  } catch (error) {
    console.error("Erro em analyze-text:", error);
    
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : "Erro ao analisar texto",
        suggestions: []
      }),
      { 
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500 
      }
    );
  }
});
