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
  const pdfParse = await import('pdf-parse');
  const arrayBuffer = await file.arrayBuffer();
  // Converter ArrayBuffer para Uint8Array que funciona no navegador
  const uint8Array = new Uint8Array(arrayBuffer);
  const data = await (pdfParse as any).default(uint8Array);
  return data.text;
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
  
  // Verificar seções obrigatórias
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
  
  if (!hasIntroduction) {
    errors.push('Seção "Introdução" não encontrada');
  }
  
  if (!hasMethodology) {
    errors.push('Seção "Metodologia" não encontrada');
  }
  
  if (!hasResults) {
    errors.push('Seção "Resultados" não encontrada');
  }
  
  // Avisos
  if (text.length < 1000) {
    warnings.push('Documento muito curto (menos de 1000 caracteres)');
  }
  
  if (text.length > 50000) {
    warnings.push('Documento muito longo (mais de 50.000 caracteres). Análise pode demorar.');
  }
  
  return {
    isValid: errors.length === 0,
    errors,
    warnings
  };
}
