import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useProject } from "@/contexts/ProjectContext";
import { useAuth } from "@/contexts/AuthContext";
import { generateAbstract } from "@/services/ai";
import { getWordCountFromHtml } from "@/utils/wordCount";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { Sparkles, Loader2, Check, AlertCircle, FileText, ArrowLeft } from "lucide-react";

function RequirementItem({ 
  label, 
  met, 
  current 
}: { 
  label: string; 
  met: boolean; 
  current?: number 
}) {
  return (
    <div className="flex items-center justify-between p-2 rounded bg-secondary/50">
      <span className="text-sm">{label}</span>
      <div className="flex items-center gap-2">
        {current !== undefined && (
          <span className="text-xs text-muted-foreground">
            {current} palavras
          </span>
        )}
        {met ? (
          <Check className="w-4 h-4 text-green-600" />
        ) : (
          <AlertCircle className="w-4 h-4 text-yellow-600" />
        )}
      </div>
    </div>
  );
}

export default function ProjectAbstract() {
  const navigate = useNavigate();
  const { currentProject, updateProject } = useProject();
  const { isAuthenticated } = useAuth();
  const { toast } = useToast();

  const [language, setLanguage] = useState<'Português' | 'Inglês' | 'Ambos'>('Ambos');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedPT, setGeneratedPT] = useState('');
  const [generatedEN, setGeneratedEN] = useState('');
  const [error, setError] = useState('');
  const [wordCounts, setWordCounts] = useState({
    introduction: 0,
    methodology: 0,
    results: 0
  });

  // Redirecionar se não estiver autenticado ou sem projeto
  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
    } else if (!currentProject) {
      navigate('/dashboard');
    }
  }, [isAuthenticated, currentProject, navigate]);

  // Calcular contagem de palavras
  useEffect(() => {
    if (currentProject) {
      setWordCounts({
        introduction: getWordCountFromHtml(currentProject.introduction),
        methodology: getWordCountFromHtml(currentProject.methodology),
        results: getWordCountFromHtml(currentProject.results)
      });
    }
  }, [currentProject]);

  // Carregar resumos existentes
  useEffect(() => {
    if (currentProject) {
      if (currentProject.abstractPT) setGeneratedPT(currentProject.abstractPT);
      if (currentProject.abstractEN) setGeneratedEN(currentProject.abstractEN);
    }
  }, [currentProject]);

  const canGenerate = 
    currentProject?.objectives &&
    wordCounts.introduction >= 200 &&
    wordCounts.methodology >= 150 &&
    wordCounts.results >= 150;

  const handleGenerate = async () => {
    if (!currentProject || !canGenerate) return;
    
    setIsGenerating(true);
    setError('');
    
    try {
      const result = await generateAbstract({
        title: currentProject.title,
        premise: currentProject.premise,
        area: currentProject.area,
        objectives: currentProject.objectives,
        introduction: currentProject.introduction,
        methodology: currentProject.methodology,
        results: currentProject.results
      }, language);
      
      if (result.resumoPT) {
        setGeneratedPT(result.resumoPT);
        const wordCount = getWordCountFromHtml(result.resumoPT);
        if (wordCount > 500) {
          toast({
            title: "Atenção",
            description: `O resumo em português possui ${wordCount} palavras. Recomenda-se no máximo 500.`,
            variant: "destructive"
          });
        }
      }
      
      if (result.resumoEN) {
        setGeneratedEN(result.resumoEN);
        const wordCount = getWordCountFromHtml(result.resumoEN);
        if (wordCount > 500) {
          toast({
            title: "Warning",
            description: `The abstract has ${wordCount} words. Maximum recommended is 500.`,
            variant: "destructive"
          });
        }
      }
      
      toast({
        title: "Resumo gerado com sucesso!",
        description: "Revise o conteúdo e clique em 'Aprovar Resumo' para continuar.",
      });
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao gerar resumo');
      toast({
        title: "Erro na geração",
        description: "Não foi possível gerar o resumo. Tente novamente.",
        variant: "destructive"
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleApprove = () => {
    if (!currentProject) return;
    
    updateProject(currentProject.id, {
      abstractPT: generatedPT,
      abstractEN: generatedEN
    });
    
    toast({
      title: "Resumo salvo!",
      description: "Você pode prosseguir para a próxima etapa.",
    });
    
    navigate('/project/editor');
  };

  if (!currentProject) return null;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <FileText className="w-6 h-6 text-primary" />
            <div>
              <h1 className="text-lg font-semibold">{currentProject.title}</h1>
              <p className="text-sm text-muted-foreground">Geração de Resumo</p>
            </div>
          </div>
          <Button variant="outline" onClick={() => navigate('/project/editor')}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Voltar ao Editor
          </Button>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-6 py-8">
        {/* Card de Requisitos */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Requisitos para Geração</CardTitle>
            <CardDescription>
              Verifique se o conteúdo mínimo foi preenchido
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <RequirementItem
                label="Objetivos preenchidos"
                met={!!currentProject.objectives}
              />
              <RequirementItem
                label="Introdução (mín. 200 palavras)"
                met={wordCounts.introduction >= 200}
                current={wordCounts.introduction}
              />
              <RequirementItem
                label="Metodologia (mín. 150 palavras)"
                met={wordCounts.methodology >= 150}
                current={wordCounts.methodology}
              />
              <RequirementItem
                label="Resultados (mín. 150 palavras)"
                met={wordCounts.results >= 150}
                current={wordCounts.results}
              />
            </div>
          </CardContent>
        </Card>

        {/* Card de Configuração */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Configurar Geração</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-2 block">
                Idioma do Resumo
              </label>
              <Select value={language} onValueChange={(v) => setLanguage(v as any)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Português">Apenas Português</SelectItem>
                  <SelectItem value="Inglês">Apenas Inglês</SelectItem>
                  <SelectItem value="Ambos">Ambos (PT + EN)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Button
              onClick={handleGenerate}
              disabled={!canGenerate || isGenerating}
              className="w-full"
              size="lg"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Gerando resumo...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 mr-2" />
                  Gerar Resumo
                </>
              )}
            </Button>

            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>

        {/* Card de Resultado */}
        {(generatedPT || generatedEN) && (
          <Card>
            <CardHeader>
              <CardTitle>Resumo Gerado</CardTitle>
              <CardDescription>
                Revise e edite se necessário
              </CardDescription>
            </CardHeader>
            <CardContent>
              {language === 'Ambos' && generatedPT && generatedEN ? (
                <Tabs defaultValue="pt">
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="pt">Português</TabsTrigger>
                    <TabsTrigger value="en">English</TabsTrigger>
                  </TabsList>
                  <TabsContent value="pt" className="space-y-2">
                    <div className="text-sm text-muted-foreground">
                      {getWordCountFromHtml(generatedPT)} palavras
                    </div>
                    <Textarea
                      value={generatedPT}
                      onChange={(e) => setGeneratedPT(e.target.value)}
                      rows={12}
                      className="font-serif"
                    />
                  </TabsContent>
                  <TabsContent value="en" className="space-y-2">
                    <div className="text-sm text-muted-foreground">
                      {getWordCountFromHtml(generatedEN)} words
                    </div>
                    <Textarea
                      value={generatedEN}
                      onChange={(e) => setGeneratedEN(e.target.value)}
                      rows={12}
                      className="font-serif"
                    />
                  </TabsContent>
                </Tabs>
              ) : (
                <div className="space-y-2">
                  <div className="text-sm text-muted-foreground">
                    {getWordCountFromHtml(language === 'Português' ? generatedPT : generatedEN)} {language === 'Português' ? 'palavras' : 'words'}
                  </div>
                  <Textarea
                    value={language === 'Português' ? generatedPT : generatedEN}
                    onChange={(e) => language === 'Português' ? setGeneratedPT(e.target.value) : setGeneratedEN(e.target.value)}
                    rows={12}
                    className="font-serif"
                  />
                </div>
              )}

              <div className="flex gap-3 mt-4">
                <Button
                  variant="outline"
                  onClick={handleGenerate}
                  disabled={isGenerating}
                >
                  Gerar Novamente
                </Button>
                <Button
                  onClick={handleApprove}
                  className="flex-1"
                >
                  <Check className="w-4 h-4 mr-2" />
                  Aprovar Resumo
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
}
