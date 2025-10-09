-- Criar bucket para documentos de artigos
INSERT INTO storage.buckets (id, name, public)
VALUES ('article-documents', 'article-documents', true)
ON CONFLICT (id) DO NOTHING;

-- RLS para permitir upload apenas do próprio usuário
CREATE POLICY "Users can upload own documents"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'article-documents' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Permitir leitura de documentos próprios
CREATE POLICY "Users can read own documents"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'article-documents' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Permitir deletar documentos próprios
CREATE POLICY "Users can delete own documents"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'article-documents' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Adicionar campos ao projeto para artigo inteligente
ALTER TABLE projects
ADD COLUMN IF NOT EXISTS document_url TEXT,
ADD COLUMN IF NOT EXISTS document_name TEXT,
ADD COLUMN IF NOT EXISTS document_size INTEGER,
ADD COLUMN IF NOT EXISTS ai_tips JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS ai_tips_completed JSONB DEFAULT '{}'::jsonb;

COMMENT ON COLUMN projects.document_url IS 'URL do documento carregado';
COMMENT ON COLUMN projects.document_name IS 'Nome do arquivo original';
COMMENT ON COLUMN projects.document_size IS 'Tamanho do arquivo em bytes';
COMMENT ON COLUMN projects.ai_tips IS '10 dicas geradas pela IA';
COMMENT ON COLUMN projects.ai_tips_completed IS 'Status de cada dica (id: boolean)';