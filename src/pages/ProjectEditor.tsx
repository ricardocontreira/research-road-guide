import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useProject } from "@/contexts/ProjectContext";
import { useAuth } from "@/contexts/AuthContext";
import ProgressSidebar from "@/components/ProgressSidebar";
import SuggestionPanel from "@/components/SuggestionPanel";
import { Button } from "@/components/ui/button";
import { RichTextEditor } from "@/components/RichTextEditor";
import { ArrowLeft, FileDown, ArrowRight, Sparkles, Loader2, Check, AlertCircle } from "lucide-react";
import { getWordCountFromHtml } from "@/utils/wordCount";
import { generateAbstract } from "@/services/ai";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";

type Section = "introduction" | "methodology" | "results" | "abstract";

// Componente auxiliar para requisitos
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

// Componente de geração de abstract
interface AbstractGeneratorProps {
  project: any;
  onUpdate: (abstractPT: string, abstractEN: string) => void;
}

function AbstractGenerator({ project, onUpdate }: AbstractGeneratorProps) {
  const { toast } = useToast();
  const [language, setLanguage] = useState<'Português' | 'Inglês' | 'Ambos'>('Ambos');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedPT, setGeneratedPT] = useState(project.abstractPT || '');
  const [generatedEN, setGeneratedEN] = useState(project.abstractEN || '');
  const [error, setError] = useState('');

  const wordCounts = {
    introduction: getWordCountFromHtml(project.introduction),
    methodology: getWordCountFromHtml(project.methodology),
    results: getWordCountFromHtml(project.results)
  };

  const canGenerate = 
    project.objectives &&
    wordCounts.introduction >= 200 &&
    wordCounts.methodology >= 150 &&
    wordCounts.results >= 150;

  const handleGenerate = async () => {
    if (!canGenerate) return;
    
    setIsGenerating(true);
    setError('');
    
    try {
      const result = await generateAbstract({
        title: project.title,
        premise: project.premise,
        area: project.area,
        objectives: project.objectives,
        introduction: project.introduction,
        methodology: project.methodology,
        results: project.results
      }, language);
      
      const newPT = result.resumoPT || generatedPT;
      const newEN = result.resumoEN || generatedEN;
      
      setGeneratedPT(newPT);
      setGeneratedEN(newEN);
      
      if (newPT && getWordCountFromHtml(newPT) > 500) {
        toast({
          title: "Atenção",
          description: `O resumo em português possui mais de 500 palavras.`,
          variant: "destructive"
        });
      }
      
      if (newEN && getWordCountFromHtml(newEN) > 500) {
        toast({
          title: "Warning",
          description: `The abstract has more than 500 words.`,
          variant: "destructive"
        });
      }
      
      toast({
        title: "Resumo gerado!",
        description: "Revise o conteúdo antes de continuar.",
      });
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao gerar resumo');
      toast({
        title: "Erro na geração",
        description: "Não foi possível gerar o resumo.",
        variant: "destructive"
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleApprove = () => {
    onUpdate(generatedPT, generatedEN);
    toast({
      title: "Resumo salvo!",
      description: "Seu artigo está completo.",
    });
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Requisitos para Geração</CardTitle>
          <CardDescription>
            Verifique se o conteúdo necessário foi preenchido
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          <RequirementItem label="Objetivos" met={!!project.objectives} />
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
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Configurar Geração</CardTitle>
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
                Gerar Resumo com IA
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

      {(generatedPT || generatedEN) && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Resumo Gerado</CardTitle>
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
                  {getWordCountFromHtml(language === 'Português' ? generatedPT : generatedEN)} palavras
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
                Salvar Resumo
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

export default function ProjectEditor() {
  const { currentProject, updateProject } = useProject();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [currentSection, setCurrentSection] = useState<Section>("introduction");
  const [content, setContent] = useState("");
  const [lastSaved, setLastSaved] = useState<Date | null>(null);

  useEffect(() => {
    if (!currentProject) {
      navigate("/dashboard");
      return;
    }
    
    // ⚠️ Apenas carrega o conteúdo para as seções de edição de texto
    if (currentSection !== "abstract") {
      const projectKey = currentSection as keyof typeof currentProject;
      
      // Garante que o valor é uma string e atualiza. Caso contrário, limpa.
      if (typeof currentProject[projectKey] === 'string') {
        setContent((currentProject[projectKey] as string) || "");
      } else {
        setContent(""); 
      }
    } else {
       setContent(""); // Limpa o estado 'content' ao entrar na seção abstract
    }
  }, [currentProject, currentSection, navigate]);

  useEffect(() => {
    // ⚠️ CRITICAL FIX: Não salva se a seção for 'abstract'
    if (!currentProject || currentSection === "abstract") return; 

    const timer = setTimeout(() => {
      // Usando tipagem segura para evitar erros de TS e garantir que o valor não salvo seja diferente do salvo
      const projectKey = currentSection as keyof typeof currentProject;
      if (typeof currentProject[projectKey] === 'string' && content !== currentProject[projectKey]) {
        updateProject(currentProject.id, { [currentSection]: content });
        setLastSaved(new Date());
      }
    }, 2000);

    return () => clearTimeout(timer);
  }, [content, currentSection, currentProject, updateProject]);

  if (!currentProject) return null;

  const sectionLabels = {
    introduction: "Introdução",
    methodology: "Metodologia",
    results: "Resultados",
    abstract: "Resumo",
  };

  const sectionPlaceholders = {
    introduction: "A inteligência artificial tem revolucionado diversos setores da sociedade, trazendo mudanças significativas na forma como vivemos, trabalhamos e nos relacionamos...",
    methodology: "Esta pesquisa adotou uma abordagem qualitativa, utilizando entrevistas semiestruturadas com 20 participantes...",
    results: "Os dados coletados revelaram que 85% dos participantes relataram impactos positivos da tecnologia em suas atividades diárias...",
    abstract: "",
  };

  const sectionDescriptions = {
    introduction: "Contextualize seu trabalho e apresente o problema de pesquisa",
    methodology: "Descreva detalhadamente os métodos, técnicas e procedimentos utilizados",
    results: "Apresente os dados obtidos de forma clara e objetiva",
    abstract: "Gere automaticamente o resumo do seu artigo em português e/ou inglês",
  };

  const getNextSection = (current: Section): Section | null => {
    const order: Section[] = ["introduction", "methodology", "results", "abstract"];
    const currentIndex = order.indexOf(current);
    return currentIndex < order.length - 1 ? order[currentIndex + 1] : null;
  };

  const canContinue = (section: Section): boolean => {
    if (!currentProject) return false;
    
    // 1. Identifica se é uma seção de edição de texto
    const isEditableSection = ["introduction", "methodology", "results"].includes(section);
    
    // 2. Define o conteúdo a ser validado: 
    //    - Se for a seção atual e editável, usa o estado 'content' (não salvo).
    //    - Caso contrário, usa o valor do projeto (já salvo).
    const contentToValidate = section === currentSection && isEditableSection 
      ? content 
      : (currentProject[section as keyof typeof currentProject] as string) || "";
    
    switch (section) {
      case "introduction":
        return getWordCountFromHtml(contentToValidate) >= 200;
      case "methodology":
        return getWordCountFromHtml(contentToValidate) >= 150;
      case "results":
        return getWordCountFromHtml(contentToValidate) >= 150;
      case "abstract":
        return !!(currentProject.abstractPT || currentProject.abstractEN);
      default:
        return false;
    }
  };

  const wordCount = content.split(/\s+/).filter(Boolean).length;

  return (
    <div className="min-h-screen bg-background flex">
      {/* Sidebar de Progresso */}
      <ProgressSidebar
        project={currentProject}
        currentSection={currentSection}
        onSectionChange={setCurrentSection}
      />

      {/* Área Principal */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <header className="border-b border-border bg-card sticky top-0 z-10">
          <div className="px-6 py-4 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="sm" onClick={() => navigate("/dashboard")}>
                <ArrowLeft className="w-4 h-4 mr-2" />
                Voltar
              </Button>
              <div>
                <h1 className="text-lg font-semibold text-foreground line-clamp-1">
                  {currentProject.title}
                </h1>
                <p className="text-xs text-muted-foreground">
                  {currentProject.area}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              {lastSaved && (
                <span className="text-xs text-muted-foreground">
                  Salvo às {lastSaved.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                </span>
              )}
              <Button variant="outline" size="sm">
                <FileDown className="w-4 h-4 mr-2" />
                Exportar
              </Button>
              <div className="bg-primary text-primary-foreground rounded-full w-8 h-8 flex items-center justify-center font-semibold text-sm">
                {user?.name.charAt(0).toUpperCase()}
              </div>
            </div>
          </div>
        </header>

        {/* Conteúdo */}
        <div className="flex-1 flex">
          {/* Editor */}
          <div className="flex-1 overflow-y-auto">
            <div className="max-w-[800px] mx-auto px-6 py-12">
              <div className="mb-6">
                <h2 className="text-2xl font-semibold text-foreground mb-2">
                  {sectionLabels[currentSection]}
                </h2>
                <p className="text-sm text-muted-foreground">
                  {sectionDescriptions[currentSection]}
                </p>
              </div>

              {currentSection === "abstract" ? (
                <AbstractGenerator 
                  project={currentProject}
                  onUpdate={(abstractPT, abstractEN) => {
                    updateProject(currentProject.id, { abstractPT, abstractEN });
                  }}
                />
              ) : (
                <>
                  <RichTextEditor
                    value={content}
                    onChange={setContent}
                    placeholder={sectionPlaceholders[currentSection]}
                    minHeight="600px"
                    className="font-serif text-[17px] leading-relaxed border-0"
                  />

                  <div className="mt-4 flex items-center justify-between text-sm text-muted-foreground">
                    <span>{wordCount} palavras</span>
                    <span>{content.length} caracteres</span>
                  </div>
                </>
              )}

              {getNextSection(currentSection) && canContinue(currentSection) && (
                <div className="mt-8 p-4 bg-primary/5 border border-primary/20 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-medium text-foreground">
                        Próxima etapa disponível
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        {sectionLabels[getNextSection(currentSection)!]}
                      </p>
                    </div>
                    <Button 
                      onClick={() => setCurrentSection(getNextSection(currentSection)!)}
                      size="lg"
                    >
                      Continuar
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Painel de Sugestões */}
          {currentSection !== "abstract" && (
            <SuggestionPanel section={currentSection} content={content} />
          )}
        </div>
      </div>
    </div>
  );
}
