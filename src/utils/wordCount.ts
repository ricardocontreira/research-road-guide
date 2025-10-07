import { convert } from 'html-to-text';

/**
 * Conta o número de palavras em um conteúdo HTML
 * Converte HTML para texto plano e conta palavras separadas por espaços
 */
export function getWordCountFromHtml(htmlContent: string): number {
  if (!htmlContent || htmlContent.trim() === '') return 0;
  
  const plainText = convert(htmlContent, {
    wordwrap: false,
    selectors: [
      { selector: 'img', format: 'skip' },
      { selector: 'a', options: { ignoreHref: true } }
    ]
  });
  
  const words = plainText
    .trim()
    .split(/\s+/)
    .filter(word => word.length > 0);
  
  return words.length;
}
