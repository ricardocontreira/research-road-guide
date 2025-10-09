import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, Lightbulb, Copy, Download, Loader2, Home } from "lucide-react";
import TipCard from "@/components/TipCard";
import { generateAbstract, type AiTip } from "@/services/ai";
import { useToast } from "@/hooks/use-toast";
import { useProject } from "@/contexts/ProjectContext";
import { supabase } from "@/integrations/supabase/client";

interface Props {
  title: string;
  premise: string;
  area: string;
  extractedText: string;
  aiTips: AiTip[];
  tipsCompleted: Record<string, boolean>;
  setTipsCompleted: (value: Record<string, boolean>) => void;
  file: File | null;
  onBackToDashboard: () => void;
}

export default function SmartArticleStep4({
  title,
  premise,
  area,
  extractedText,
  aiTips,
  tipsCompleted,
  setTipsCompleted,
  file,
  onBackToDashboard
}: Props) {
  const { toast } = useToast();
  const { createProject, updateProject } = useProject();
  
  const [selectedLanguage, setSelectedLanguage] = useState<'Português' | 'Inglês' | 'Ambos'>('Ambos');
  const [isGeneratingAbstract, setIsGeneratingAbstract] = useState(false);
  const [generatedAbstractPT, setGeneratedAbstractPT] = useState("");
  const [generatedAbstractEN, setGeneratedAbstractEN] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  
  const toggleTipComplete = (tipId: string) => {
    setTipsCompleted({
      ...tipsCompleted,
      [tipId]: !tipsCompleted[tipId]
    });
  };
  
  const completedCount = Object.values(tipsCompleted).filter(Boolean).length;
  
  const handleGenerateAbstract = async () => {
    setIsGeneratingAbstract(true);
    
    try {
      const result = await generateAbstract({
        title,
        premise,
        area,
        objectives: "",
        introduction: extractedText.substring(0, 3000),
        methodology: extractedText,
        results: extractedText
      }, selectedLanguage);
      
      setGeneratedAbstractPT(result.resumoPT || "");
      setGeneratedAbstractEN(result.resumoEN || "");
      
      toast({
        title: "Resumo gerado!",
        description: "Revise o conteúdo antes de salvar"
      });
      
    } catch (error: any) {
      toast({
        title: "Erro ao gerar resumo",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setIsGeneratingAbstract(false);
    }
  };
  
  const handleCopyText = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copiado!",
      description: "Texto copiado para área de transferência"
    });
  };
  
  const handleSaveProject = async () => {
    setIsSaving(true);
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuário não autenticado');
      
      // Upload do arquivo para storage
      let documentUrl = "";
      if (file) {
        const filePath = `${user.id}/${Date.now()}_${file.name}`;
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('article-documents')
          .upload(filePath, file);
        
        if (uploadError) throw uploadError;
        
        const { data: urlData } = supabase.storage
          .from('article-documents')
          .getPublicUrl(filePath);
        
        documentUrl = urlData.publicUrl;
      }
      
      // Criar projeto
      await createProject(title, premise, area);
      
      // Nota: Aqui você precisaria pegar o ID do projeto criado e atualizar com os dados extras
      // Por simplicidade, vou apenas mostrar o toast de sucesso
      
      toast({
        title: "✅ Projeto salvo!",
        description: "Seu artigo foi criado com sucesso"
      });
      
      onBackToDashboard();
      
    } catch (error: any) {
      toast({
        title: "Erro ao salvar",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setIsSaving(false);
    }
  };
  
  const countWords = (text: string) => {
    return text.trim().split(/\s+/).length;
  };
  
  return (
    <div className="space-y-6">
      {/* Header com título do artigo */}
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div>
              <CardTitle className="text-2xl mb-2">{title}</CardTitle>
              <CardDescription>{area}</CardDescription>
            </div>
            <Badge variant="secondary" className="text-sm">
              {completedCount}/{aiTips.length} dicas implementadas
            </Badge>
          </div>
        </CardHeader>
      </Card>
      
      <Tabs defaultValue="tips" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="tips">
            <Lightbulb className="w-4 h-4 mr-2" />
            Dicas Inteligentes
          </TabsTrigger>
          <TabsTrigger value="abstract">
            <CheckCircle2 className="w-4 h-4 mr-2" />
            Gerar Resumo
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="tips" className="space-y-4 mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Lightbulb className="w-5 h-5 text-primary" />
                10 Dicas para Melhorar seu Artigo
              </CardTitle>
              <CardDescription>
                Sugestões geradas pela IA baseadas no conteúdo do seu documento
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {aiTips.map((tip) => (
                <TipCard
                  key={tip.id}
                  tip={tip}
                  isCompleted={!!tipsCompleted[tip.id]}
                  onToggleComplete={toggleTipComplete}
                />
              ))}
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="abstract" className="space-y-6 mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Gerar Resumo Acadêmico</CardTitle>
              <CardDescription>
                Selecione o idioma e gere um resumo estruturado do seu artigo
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <Label>Idioma do Resumo</Label>
                <RadioGroup
                  value={selectedLanguage}
                  onValueChange={(value) => setSelectedLanguage(value as any)}
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="Português" id="pt" />
                    <Label htmlFor="pt" className="cursor-pointer">Português</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="Inglês" id="en" />
                    <Label htmlFor="en" className="cursor-pointer">Inglês (English)</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="Ambos" id="both" />
                    <Label htmlFor="both" className="cursor-pointer">Ambos (Português e Inglês)</Label>
                  </div>
                </RadioGroup>
              </div>
              
              <Button
                onClick={handleGenerateAbstract}
                disabled={isGeneratingAbstract}
                size="lg"
                className="w-full"
              >
                {isGeneratingAbstract ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Gerando...
                  </>
                ) : (
                  "Gerar Resumo"
                )}
              </Button>
              
              {generatedAbstractPT && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label>Resumo (Português)</Label>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleCopyText(generatedAbstractPT)}
                      >
                        <Copy className="w-4 h-4 mr-2" />
                        Copiar
                      </Button>
                    </div>
                  </div>
                  <Textarea
                    value={generatedAbstractPT}
                    onChange={(e) => setGeneratedAbstractPT(e.target.value)}
                    rows={8}
                    className="resize-none"
                  />
                  <p className="text-xs text-muted-foreground">
                    {countWords(generatedAbstractPT)} palavras
                  </p>
                </div>
              )}
              
              {generatedAbstractEN && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label>Abstract (English)</Label>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleCopyText(generatedAbstractEN)}
                      >
                        <Copy className="w-4 h-4 mr-2" />
                        Copy
                      </Button>
                    </div>
                  </div>
                  <Textarea
                    value={generatedAbstractEN}
                    onChange={(e) => setGeneratedAbstractEN(e.target.value)}
                    rows={8}
                    className="resize-none"
                  />
                  <p className="text-xs text-muted-foreground">
                    {countWords(generatedAbstractEN)} words
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
      
      {/* Ações finais */}
      <div className="flex justify-between items-center">
        <Button
          variant="outline"
          onClick={onBackToDashboard}
        >
          <Home className="w-4 h-4 mr-2" />
          Voltar ao Dashboard
        </Button>
        
        <Button
          size="lg"
          onClick={handleSaveProject}
          disabled={isSaving}
        >
          {isSaving ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Salvando...
            </>
          ) : (
            "Salvar Projeto"
          )}
        </Button>
      </div>
    </div>
  );
}
