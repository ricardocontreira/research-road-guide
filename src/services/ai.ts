/**
 * ⚙️ CONFIGURAÇÃO DAS VARIÁVEIS DE AMBIENTE
 * 
 * Crie o arquivo .env.local na raiz do projeto com as seguintes chaves:
 * 
 * VITE_SUPABASE_URL="https://seu-projeto.supabase.co"
 * VITE_SUPABASE_ANON_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
 * VITE_OPENAI_API_KEY="sk-proj-..."
 * 
 * 📍 Onde obter as chaves:
 * - Supabase: https://supabase.com/dashboard (Project Settings > API)
 * - OpenAI: https://platform.openai.com/api-keys
 * 
 * ⚠️ IMPORTANTE: Reinicie o servidor de desenvolvimento após criar/editar o .env.local
 */

import axios from 'axios';
import { convert } from 'html-to-text';

export interface AbstractInput {
  title: string;
  premise: string;
  area: string;
  objectives: string;
  introduction: string;
  methodology: string;
  results: string;
}

export interface AbstractOutput {
  resumoPT?: string;
  resumoEN?: string;
}

/**
 * Converte HTML para texto plano
 */
function htmlToPlainText(html: string): string {
  return convert(html, {
    wordwrap: false,
    selectors: [
      { selector: 'img', format: 'skip' },
      { selector: 'a', options: { ignoreHref: true } }
    ]
  });
}

/**
 * Gera um resumo acadêmico usando a API do OpenAI
 */
export async function generateAbstract(
  input: AbstractInput,
  language: 'Português' | 'Inglês' | 'Ambos'
): Promise<AbstractOutput> {
  const apiKey = import.meta.env.VITE_OPENAI_API_KEY;
  
  if (!apiKey) {
    throw new Error(
      'VITE_OPENAI_API_KEY não configurada. Adicione a chave no arquivo .env.local'
    );
  }

  // Converter HTML para texto plano
  const plainTextObjectives = htmlToPlainText(input.objectives);
  const plainTextIntroduction = htmlToPlainText(input.introduction);
  const plainTextMethodology = htmlToPlainText(input.methodology);
  const plainTextResults = htmlToPlainText(input.results);

  // Função auxiliar para gerar resumo em um idioma específico
  async function generateInLanguage(lang: 'Português' | 'Inglês'): Promise<string> {
    const systemPrompt = lang === 'Português'
      ? 'Você é um assistente especializado em redação científica acadêmica. Sua tarefa é gerar resumos (abstracts) para artigos científicos seguindo rigorosamente as normas da ABNT NBR 6028:2021. O resumo deve ter entre 150 e 500 palavras, ser escrito em parágrafo único, tempo verbal no passado ou presente, e conter: contextualização, objetivos, metodologia, principais resultados e conclusões. Não use citações bibliográficas.'
      : 'You are a specialized assistant in academic scientific writing. Your task is to generate abstracts for scientific papers following rigorous academic standards. The abstract should be between 150 and 500 words, written in a single paragraph, using past or present tense, and contain: contextualization, objectives, methodology, main results and conclusions. Do not use bibliographic citations.';

    const userPrompt = lang === 'Português'
      ? `Gere um resumo acadêmico em português para o seguinte artigo da área de ${input.area}:

TÍTULO: ${input.title}

PREMISSA: ${input.premise}

OBJETIVOS: ${plainTextObjectives}

INTRODUÇÃO: ${plainTextIntroduction}

METODOLOGIA: ${plainTextMethodology}

RESULTADOS: ${plainTextResults}

Gere um resumo completo, coeso e acadêmico seguindo todas as diretrizes.`
      : `Generate an academic abstract in English for the following article in the field of ${input.area}:

TITLE: ${input.title}

PREMISE: ${input.premise}

OBJECTIVES: ${plainTextObjectives}

INTRODUCTION: ${plainTextIntroduction}

METHODOLOGY: ${plainTextMethodology}

RESULTS: ${plainTextResults}

Generate a complete, cohesive and academic abstract following all guidelines.`;

    try {
      const response = await axios.post(
        'https://api.openai.com/v1/chat/completions',
        {
          model: 'gpt-4o-mini',
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt }
          ],
          temperature: 0.7,
          max_tokens: 800
        },
        {
          headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json'
          }
        }
      );

      const generatedText = response.data.choices[0]?.message?.content;
      
      if (!generatedText) {
        throw new Error('Resposta vazia da API do OpenAI');
      }

      return generatedText.trim();
    } catch (error) {
      if (axios.isAxiosError(error)) {
        const message = error.response?.data?.error?.message || error.message;
        throw new Error(`Erro ao gerar resumo: ${message}`);
      }
      throw error;
    }
  }

  // Executar geração conforme idioma selecionado
  if (language === 'Ambos') {
    const [resumoPT, resumoEN] = await Promise.all([
      generateInLanguage('Português'),
      generateInLanguage('Inglês')
    ]);
    return { resumoPT, resumoEN };
  } else if (language === 'Português') {
    const resumoPT = await generateInLanguage('Português');
    return { resumoPT };
  } else {
    const resumoEN = await generateInLanguage('Inglês');
    return { resumoEN };
  }
}
