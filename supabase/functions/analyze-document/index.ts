import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const systemPrompt = `Você é um especialista acadêmico em redação científica e normas ABNT.

TAREFA:
Analise o documento fornecido e gere EXATAMENTE 10 dicas práticas e específicas para melhorar este artigo acadêmico.

CATEGORIAS DAS DICAS (distribuir entre):
1. Metodologia (2-3 dicas)
2. Redação (2-3 dicas)
3. Resultados (2 dicas)
4. Estrutura (2 dicas)
5. Fundamentação (1 dica)

FORMATO DE SAÍDA (JSON):
{
  "tips": [
    {
      "id": "tip-1",
      "number": 1,
      "category": "Metodologia" | "Redação" | "Resultados" | "Estrutura" | "Fundamentação",
      "title": "Título curto e direto",
      "description": "Descrição detalhada e acionável da melhoria sugerida",
      "icon": "Lightbulb" | "CheckCircle" | "AlertCircle"
    }
  ]
}

REGRAS:
- Seja específico ao conteúdo fornecido
- Evite dicas genéricas
- Foque em melhorias práticas
- Considere as normas ABNT
- Numere de 1 a 10`;

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { documentText, area, premise } = await req.json();

    console.log(`Analisando documento da área: ${area}`);

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY não configurada");
    }

    const userPrompt = `Analise este documento da área de ${area}:
    
Premissa: ${premise}

CONTEÚDO DO DOCUMENTO:
${documentText}

Gere 10 dicas de melhoria seguindo o formato especificado.`;

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
        max_tokens: 2000,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Erro da Lovable AI:`, response.status, errorText);
      
      if (response.status === 429) {
        throw new Error("Limite de requisições excedido. Tente novamente em alguns instantes.");
      }
      if (response.status === 402) {
        throw new Error("Créditos insuficientes no Lovable AI. Adicione créditos ao workspace.");
      }
      
      throw new Error(`Erro ao analisar documento: ${response.status}`);
    }

    const data = await response.json();
    let aiContent = data.choices?.[0]?.message?.content || "";

    if (!aiContent) {
      throw new Error("Resposta vazia da IA");
    }

    // Limpar markdown code blocks
    aiContent = aiContent.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();

    const result = JSON.parse(aiContent);

    console.log(`Dicas geradas: ${result.tips?.length || 0}`);

    return new Response(
      JSON.stringify(result),
      { 
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200 
      }
    );

  } catch (error) {
    console.error("Erro em analyze-document:", error);
    
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : "Erro ao analisar documento",
        tips: []
      }),
      { 
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500 
      }
    );
  }
});
