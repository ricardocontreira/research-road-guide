import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { input, language } = await req.json();
    const openAIApiKey = Deno.env.get('OPENAI_API_KEY');
    
    if (!openAIApiKey) {
      throw new Error('OPENAI_API_KEY não configurada no Supabase');
    }

    // Função auxiliar para gerar resumo em um idioma específico
    async function generateInLanguage(lang: 'Português' | 'Inglês'): Promise<string> {
      const systemPrompt = lang === 'Português'
        ? 'Você é um assistente especializado em redação científica acadêmica. Sua tarefa é gerar resumos (abstracts) para artigos científicos seguindo rigorosamente as normas da ABNT NBR 6028:2021. O resumo deve ter entre 150 e 500 palavras, ser escrito em parágrafo único, tempo verbal no passado ou presente, e conter: contextualização, objetivos, metodologia, principais resultados e conclusões. Não use citações bibliográficas.'
        : 'You are a specialized assistant in academic scientific writing. Your task is to generate abstracts for scientific papers following rigorous academic standards. The abstract should be between 150 and 500 words, written in a single paragraph, using past or present tense, and contain: contextualization, objectives, methodology, main results and conclusions. Do not use bibliographic citations.';

      const userPrompt = lang === 'Português'
        ? `Gere um resumo acadêmico em português para o seguinte artigo da área de ${input.area}:

TÍTULO: ${input.title}

PREMISSA: ${input.premise}

OBJETIVOS: ${input.objectives}

INTRODUÇÃO: ${input.introduction}

METODOLOGIA: ${input.methodology}

RESULTADOS: ${input.results}

Gere um resumo completo, coeso e acadêmico seguindo todas as diretrizes.`
        : `Generate an academic abstract in English for the following article in the field of ${input.area}:

TITLE: ${input.title}

PREMISE: ${input.premise}

OBJECTIVES: ${input.objectives}

INTRODUCTION: ${input.introduction}

METHODOLOGY: ${input.methodology}

RESULTS: ${input.results}

Generate a complete, cohesive and academic abstract following all guidelines.`;

      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${openAIApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt }
          ],
          temperature: 0.7,
          max_tokens: 800
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error('OpenAI API error:', errorData);
        throw new Error(errorData.error?.message || 'Erro ao chamar API OpenAI');
      }

      const data = await response.json();
      const generatedText = data.choices[0]?.message?.content;
      
      if (!generatedText) {
        throw new Error('Resposta vazia da API do OpenAI');
      }

      return generatedText.trim();
    }

    // Executar geração conforme idioma selecionado
    let resumoPT: string | undefined;
    let resumoEN: string | undefined;

    if (language === 'Ambos') {
      [resumoPT, resumoEN] = await Promise.all([
        generateInLanguage('Português'),
        generateInLanguage('Inglês')
      ]);
    } else if (language === 'Português') {
      resumoPT = await generateInLanguage('Português');
    } else {
      resumoEN = await generateInLanguage('Inglês');
    }

    return new Response(
      JSON.stringify({ resumoPT, resumoEN }),
      { 
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        } 
      }
    );
  } catch (error) {
    console.error('Erro na generate-abstract:', error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'Erro desconhecido' 
      }),
      { 
        status: 500, 
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        } 
      }
    );
  }
});
