// Utilitário para extrair texto de documentos PDF, DOCX e TXT

export async function parseDocument(file: File): Promise<string> {
  const fileType = file.type;
  
  if (fileType === 'application/pdf') {
    return await parsePDF(file);
  } else if (
    fileType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
    fileType === 'application/msword'
  ) {
    return await parseDOCX(file);
  } else if (fileType === 'text/plain') {
    return await parseTXT(file);
  } else {
    throw new Error('Formato de arquivo não suportado');
  }
}

async function parsePDF(file: File): Promise<string> {
  // PDF.js ESM + worker empacotado pelo Vite
  const pdfjs = await import('pdfjs-dist/build/pdf.mjs');
  // Aponta o worker para o arquivo dentro do pacote (Vite resolve para URL final)
  (pdfjs as any).GlobalWorkerOptions.workerSrc = new URL(
    'pdfjs-dist/build/pdf.worker.min.mjs',
    import.meta.url
  ).toString();

  const arrayBuffer = await file.arrayBuffer();
  const { getDocument } = pdfjs as any;
  const pdf = await (getDocument as any)({ data: arrayBuffer }).promise;

  let fullText = '';
  for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
    const page = await pdf.getPage(pageNum);
    const textContent = await page.getTextContent();
    const pageText = (textContent.items as any[])
      .map((item: any) => (item && typeof item.str === 'string' ? item.str : ''))
      .join(' ');
    fullText += pageText + '\n';
  }

  return fullText;
}

async function parseDOCX(file: File): Promise<string> {
  const mammoth = await import('mammoth');
  const arrayBuffer = await file.arrayBuffer();
  const result = await mammoth.extractRawText({ arrayBuffer });
  return result.value;
}

async function parseTXT(file: File): Promise<string> {
  return await file.text();
}

export function validateDocument(text: string): {
  isValid: boolean;
  errors: string[];
  warnings: string[];
} {
  const errors: string[] = [];
  const warnings: string[] = [];
  
  const lowercaseText = text.toLowerCase();
  
  // Verificar seções recomendadas (agora como warnings)
  const hasIntroduction = 
    lowercaseText.includes('introdução') || 
    lowercaseText.includes('introduction');
    
  const hasMethodology = 
    lowercaseText.includes('metodologia') || 
    lowercaseText.includes('método') ||
    lowercaseText.includes('methodology');
    
  const hasResults = 
    lowercaseText.includes('resultados') || 
    lowercaseText.includes('results');
  
  // Agora são warnings, não errors
  if (!hasIntroduction) {
    warnings.push('Seção "Introdução" não encontrada (recomendada)');
  }
  
  if (!hasMethodology) {
    warnings.push('Seção "Metodologia" não encontrada (recomendada)');
  }
  
  if (!hasResults) {
    warnings.push('Seção "Resultados" não encontrada (recomendada)');
  }
  
  // Avisos de tamanho
  if (text.length < 1000) {
    warnings.push('Documento muito curto (menos de 1000 caracteres)');
  }
  
  if (text.length > 50000) {
    warnings.push('Documento muito longo (mais de 50.000 caracteres). Análise pode demorar.');
  }
  
  // Só invalida se o documento estiver vazio ou corrompido
  if (text.length === 0) {
    errors.push('Documento vazio ou não foi possível extrair texto');
  }
  
  return {
    isValid: errors.length === 0,
    errors,
    warnings
  };
}
