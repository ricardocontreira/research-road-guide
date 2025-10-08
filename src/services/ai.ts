/**
 * ⚙️ CONFIGURAÇÃO DAS VARIÁVEIS DE AMBIENTE
 * 
 * Crie o arquivo .env.local na raiz do projeto com as seguintes chaves:
 * 
 * VITE_SUPABASE_URL="https://seu-projeto.supabase.co"
 * VITE_SUPABASE_ANON_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
 * 
 * 📍 Onde obter as chaves:
 * - Supabase: https://supabase.com/dashboard (Project Settings > API)
 * 
 * 🔐 A chave da OpenAI agora é configurada como secret no Supabase
 * e não precisa mais estar no .env.local (mais seguro!)
 * 
 * ⚠️ IMPORTANTE: Reinicie o servidor de desenvolvimento após criar/editar o .env.local
 */

import { supabase } from '@/integrations/supabase/client';
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
 * Gera um resumo acadêmico usando a API do OpenAI via Edge Function
 */
export async function generateAbstract(
  input: AbstractInput,
  language: 'Português' | 'Inglês' | 'Ambos'
): Promise<AbstractOutput> {
  // Converter HTML para texto plano
  const plainTextObjectives = htmlToPlainText(input.objectives);
  const plainTextIntroduction = htmlToPlainText(input.introduction);
  const plainTextMethodology = htmlToPlainText(input.methodology);
  const plainTextResults = htmlToPlainText(input.results);

  // Chamar Edge Function
  const { data, error } = await supabase.functions.invoke('generate-abstract', {
    body: {
      input: {
        title: input.title,
        premise: input.premise,
        area: input.area,
        objectives: plainTextObjectives,
        introduction: plainTextIntroduction,
        methodology: plainTextMethodology,
        results: plainTextResults,
      },
      language
    }
  });

  if (error) {
    throw new Error(`Erro ao gerar resumo: ${error.message}`);
  }

  return {
    resumoPT: data.resumoPT,
    resumoEN: data.resumoEN
  };
}
