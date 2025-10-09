import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { input, language } = await req.json();
    
    console.log("Gerando resumo em:", language);

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY não configurada");
    }

    const generateInLanguage = async (lang: 'Português' | 'Inglês'): Promise<string> => {
      const systemPrompt = lang === 'Português'
        ? `Você é um especialista em redação acadêmica brasileira. Gere um resumo (abstract) acadêmico em português seguindo as normas ABNT.

REQUISITOS:
- Máximo de 500 palavras
- Estrutura: Contexto → Objetivo → Metodologia → Resultados → Conclusão
- Use linguagem formal e objetiva
- Foco em verbos no passado e presente
- Sem referências bibliográficas
- Texto corrido, sem parágrafos separados`
        : `You are an expert in academic writing. Generate an academic abstract in English following international standards.

REQUIREMENTS:
- Maximum 500 words
- Structure: Background → Objective → Methodology → Results → Conclusion
- Use formal and objective language
- Focus on past and present tense verbs
- No bibliographic references
- Continuous text, no separate paragraphs`;

      const userPrompt = lang === 'Português'
        ? `Com base nas informações abaixo, escreva um resumo acadêmico completo em português:

**Título:** ${input.title}
**Área:** ${input.area}
**Premissa:** ${input.premise}

**Objetivos:**
${input.objectives}

**Introdução:**
${input.introduction}

**Metodologia:**
${input.methodology}

**Resultados:**
${input.results}

Gere um resumo acadêmico coeso e bem estruturado, com no máximo 500 palavras.`
        : `Based on the information below, write a complete academic abstract in English:

**Title:** ${input.title}
**Area:** ${input.area}
**Premise:** ${input.premise}

**Objectives:**
${input.objectives}

**Introduction:**
${input.introduction}

**Methodology:**
${input.methodology}

**Results:**
${input.results}

Generate a cohesive and well-structured academic abstract, with a maximum of 500 words.`;

      console.log(`Chamando Lovable AI para ${lang}...`);

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
          temperature: 0.7,
          max_tokens: 1000,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`Erro da Lovable AI (${lang}):`, response.status, errorText);
        
        if (response.status === 429) {
          throw new Error("Limite de requisições excedido. Tente novamente em alguns instantes.");
        }
        if (response.status === 402) {
          throw new Error("Créditos insuficientes no Lovable AI. Adicione créditos ao workspace.");
        }
        
        throw new Error(`Erro ao gerar resumo: ${response.status}`);
      }

      const data = await response.json();
      const content = data.choices?.[0]?.message?.content;
      
      if (!content) {
        throw new Error("Resposta vazia da IA");
      }

      console.log(`Resumo gerado em ${lang}:`, content.substring(0, 100) + "...");
      return content;
    };

    let resumoPT: string | undefined;
    let resumoEN: string | undefined;

    if (language === 'Português' || language === 'Ambos') {
      resumoPT = await generateInLanguage('Português');
    }

    if (language === 'Inglês' || language === 'Ambos') {
      resumoEN = await generateInLanguage('Inglês');
    }

    return new Response(
      JSON.stringify({ resumoPT, resumoEN }),
      { 
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200 
      }
    );

  } catch (error) {
    console.error("Erro na generate-abstract:", error);
    
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : "Erro desconhecido ao gerar resumo" 
      }),
      { 
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500 
      }
    );
  }
});
