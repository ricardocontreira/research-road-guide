import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useProject } from "@/contexts/ProjectContext";
import { useAuth } from "@/contexts/AuthContext";
import ProgressSidebar from "@/components/ProgressSidebar";
import SuggestionPanel from "@/components/SuggestionPanel";
import { Button } from "@/components/ui/button";
import { RichTextEditor } from "@/components/RichTextEditor";
import { ArrowLeft, FileDown, ArrowRight, Sparkles, Loader2, Check, AlertCircle, PanelLeft, PanelLeftClose, PanelRight, PanelRightClose } from "lucide-react";
import { getWordCountFromHtml } from "@/utils/wordCount";
import { generateAbstract } from "@/services/ai";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

type Section = "config" | "objectives" | "literature" | "introduction" | "methodology" | "results" | "abstract";

// Componente de geração de abstract
interface AbstractGeneratorProps {
  project: any;
  sectionContents: {
    introduction: string;
    methodology: string;
    results: string;
  };
  onUpdate: (abstractPT: string, abstractEN: string) => void;
}
function AbstractGenerator({
  project,
  sectionContents,
  onUpdate
}: AbstractGeneratorProps) {
  const {
    toast
  } = useToast();
  const [language, setLanguage] = useState<'Português' | 'Inglês' | 'Ambos'>('Ambos');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedPT, setGeneratedPT] = useState(project.abstractPT || '');
  const [generatedEN, setGeneratedEN] = useState(project.abstractEN || '');
  const [error, setError] = useState('');
  const wordCounts = {
    introduction: getWordCountFromHtml(sectionContents.introduction),
    methodology: getWordCountFromHtml(sectionContents.methodology),
    results: getWordCountFromHtml(sectionContents.results)
  };
  const canGenerate = project.objectives && wordCounts.introduction >= 200 && wordCounts.methodology >= 150 && wordCounts.results >= 150;
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
        introduction: sectionContents.introduction,
        methodology: sectionContents.methodology,
        results: sectionContents.results
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
        description: "Revise o conteúdo antes de continuar."
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
      description: "Seu artigo está completo."
    });
  };
  return <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Configurar Geração</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="text-sm font-medium mb-2 block">
              Idioma do Resumo
            </label>
            <Select value={language} onValueChange={v => setLanguage(v as any)}>
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

          <Button onClick={handleGenerate} disabled={!canGenerate || isGenerating} className="w-full" size="lg">
            {isGenerating ? <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Gerando resumo...
              </> : <>
                <Sparkles className="w-4 h-4 mr-2" />
                Gerar Resumo com IA
              </>}
          </Button>

          {error && <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>}
        </CardContent>
      </Card>

      {(generatedPT || generatedEN) && <Card>
          <CardHeader>
            <CardTitle className="text-lg">Resumo Gerado</CardTitle>
            <CardDescription>
              Revise e edite se necessário
            </CardDescription>
          </CardHeader>
          <CardContent>
            {language === 'Ambos' && generatedPT && generatedEN ? <Tabs defaultValue="pt">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="pt">Português</TabsTrigger>
                  <TabsTrigger value="en">English</TabsTrigger>
                </TabsList>
                <TabsContent value="pt" className="space-y-2">
                  <div className="text-sm text-muted-foreground">
                    {getWordCountFromHtml(generatedPT)} palavras
                  </div>
                  <Textarea value={generatedPT} onChange={e => setGeneratedPT(e.target.value)} rows={12} className="font-serif" />
                </TabsContent>
                <TabsContent value="en" className="space-y-2">
                  <div className="text-sm text-muted-foreground">
                    {getWordCountFromHtml(generatedEN)} words
                  </div>
                  <Textarea value={generatedEN} onChange={e => setGeneratedEN(e.target.value)} rows={12} className="font-serif" />
                </TabsContent>
              </Tabs> : <div className="space-y-2">
                <div className="text-sm text-muted-foreground">
                  {getWordCountFromHtml(language === 'Português' ? generatedPT : generatedEN)} palavras
                </div>
                <Textarea value={language === 'Português' ? generatedPT : generatedEN} onChange={e => language === 'Português' ? setGeneratedPT(e.target.value) : setGeneratedEN(e.target.value)} rows={12} className="font-serif" />
              </div>}

            <div className="flex gap-3 mt-4">
              <Button variant="outline" onClick={handleGenerate} disabled={isGenerating}>
                Gerar Novamente
              </Button>
              <Button onClick={handleApprove} className="flex-1">
                <Check className="w-4 h-4 mr-2" />
                Salvar Resumo
              </Button>
            </div>
          </CardContent>
        </Card>}
    </div>;
}

// Componente interno para edição de configuração
interface ConfigSectionProps {
  project: any;
  onUpdate: (updates: {
    title?: string;
    premise?: string;
    area?: string;
  }) => void;
}
function ConfigSection({
  project,
  onUpdate
}: ConfigSectionProps) {
  const [title, setTitle] = useState(project.title || "");
  const [premise, setPremise] = useState(project.premise || "");
  const [area, setArea] = useState(project.area || "");
  const areas = ["Ciências Exatas e da Terra", "Ciências Biológicas", "Engenharias", "Ciências da Saúde", "Ciências Sociais Aplicadas", "Ciências Humanas", "Linguística, Letras e Artes", "Multidisciplinar"];
  useEffect(() => {
    const timer = setTimeout(() => {
      const hasChanges = title !== project.title || premise !== project.premise || area !== project.area;
      if (hasChanges) {
        onUpdate({
          title,
          premise,
          area
        });
      }
    }, 1000);
    return () => clearTimeout(timer);
  }, [title, premise, area, project, onUpdate]);
  return <Card>
      <CardHeader>
        
        
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-2">
          <label className="text-sm font-medium">Título do Projeto</label>
          <input type="text" value={title} onChange={e => setTitle(e.target.value)} placeholder="Ex: Impactos da Inteligência Artificial na Educação Superior" maxLength={150} className="w-full px-3 py-2 border border-border rounded-md bg-background" />
          <p className="text-xs text-muted-foreground text-right">
            {title.length}/150 caracteres
          </p>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">Premissa da Pesquisa</label>
          <Textarea value={premise} onChange={e => setPremise(e.target.value)} placeholder="Descreva brevemente a questão central ou hipótese da sua pesquisa..." rows={6} />
          <p className="text-xs text-muted-foreground text-right">
            {premise.split(/\s+/).filter(Boolean).length} palavras
          </p>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">Área do Projeto</label>
          <Select value={area} onValueChange={setArea}>
            <SelectTrigger>
              <SelectValue placeholder="Selecione uma área" />
            </SelectTrigger>
            <SelectContent>
              {areas.map(areaOption => <SelectItem key={areaOption} value={areaOption}>
                  {areaOption}
                </SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      </CardContent>
    </Card>;
}
export default function ProjectEditor() {
  const {
    currentProject,
    updateProject
  } = useProject();
  const {
    user
  } = useAuth();
  const navigate = useNavigate();
  const [currentSection, setCurrentSection] = useState<Section>("config");
  const [content, setContent] = useState("");
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isProgressSidebarOpen, setIsProgressSidebarOpen] = useState(true);
  const [isSuggestionPanelOpen, setIsSuggestionPanelOpen] = useState(true);

  // Helper para obter conteúdo atualizado de cada seção
  const getSectionContent = (section: "introduction" | "methodology" | "results" | "objectives" | "literature"): string => {
    // Se for a seção atual, retorna o conteúdo não salvo
    if (section === currentSection) {
      return content;
    }
    // Caso contrário, retorna o conteúdo salvo do projeto
    return currentProject?.[section] as string || "";
  };

  // Função de navegação que salva antes de trocar de seção
  const navigateTo = async (section: Section) => {
    // Se estiver em uma seção editável e houver conteúdo não salvo, salvar primeiro
    const editableSections = ["objectives", "literature", "introduction", "methodology", "results"];
    if (editableSections.includes(currentSection) && content !== (currentProject?.[currentSection] as string || "")) {
      await handleSaveNow();
    }
    setCurrentSection(section);
  };
  const handleSaveNow = async () => {
    if (!currentProject || currentSection === "abstract" || currentSection === "config") return;
    setIsSaving(true);
    const projectKey = currentSection as keyof typeof currentProject;
    if (typeof currentProject[projectKey] === 'string' && content !== currentProject[projectKey]) {
      await updateProject(currentProject.id, {
        [currentSection]: content
      });
      setLastSaved(new Date());
    }
    setIsSaving(false);
  };
  const handleConfigUpdate = async (updates: {
    title?: string;
    premise?: string;
    area?: string;
  }) => {
    if (!currentProject) return;
    setIsSaving(true);
    await updateProject(currentProject.id, updates);
    setLastSaved(new Date());
    setIsSaving(false);
  };
  useEffect(() => {
    if (!currentProject) {
      navigate("/dashboard");
      return;
    }

    // Carrega o conteúdo para as seções de edição de texto
    const editableSections = ["objectives", "literature", "introduction", "methodology", "results"];
    if (editableSections.includes(currentSection)) {
      const projectKey = currentSection as keyof typeof currentProject;
      if (typeof currentProject[projectKey] === 'string') {
        setContent(currentProject[projectKey] as string || "");
      } else {
        setContent("");
      }
    } else {
      setContent(""); // Limpa o estado 'content' para seções não editáveis (config/abstract)
    }
  }, [currentProject, currentSection, navigate]);
  useEffect(() => {
    // Não salva se a seção for 'abstract' ou 'config'
    if (!currentProject || currentSection === "abstract" || currentSection === "config") return;
    setIsSaving(true);
    const timer = setTimeout(async () => {
      // Usando tipagem segura para evitar erros de TS e garantir que o valor não salvo seja diferente do salvo
      const projectKey = currentSection as keyof typeof currentProject;
      if (typeof currentProject[projectKey] === 'string' && content !== currentProject[projectKey]) {
        await updateProject(currentProject.id, {
          [currentSection]: content
        });
        setLastSaved(new Date());
      }
      setIsSaving(false);
    }, 2000);
    return () => {
      clearTimeout(timer);
      setIsSaving(false);
    };
  }, [content, currentSection, currentProject, updateProject]);
  if (!currentProject) return null;
  const sectionLabels = {
    config: "Configuração do Projeto",
    objectives: "Objetivos da Pesquisa",
    literature: "Revisão Bibliográfica",
    introduction: "Introdução",
    methodology: "Metodologia",
    results: "Resultados",
    abstract: "Resumo"
  };
  const sectionPlaceholders = {
    config: "",
    objectives: "Descreva os objetivos gerais e específicos da sua pesquisa, incluindo as questões que pretende responder e os resultados esperados...",
    literature: "Apresente o referencial teórico da sua pesquisa, citando autores relevantes e trabalhos anteriores relacionados ao tema...",
    introduction: "A inteligência artificial tem revolucionado diversos setores da sociedade, trazendo mudanças significativas na forma como vivemos, trabalhamos e nos relacionamos...",
    methodology: "Esta pesquisa adotou uma abordagem qualitativa, utilizando entrevistas semiestruturadas com 20 participantes...",
    results: "Os dados coletados revelaram que 85% dos participantes relataram impactos positivos da tecnologia em suas atividades diárias...",
    abstract: ""
  };
  const sectionDescriptions = {
    config: "Configure as informações básicas do seu projeto",
    objectives: "Defina o que você pretende alcançar com sua pesquisa (mínimo 100 palavras)",
    literature: "Apresente a fundamentação teórica do seu trabalho (mínimo 150 palavras)",
    introduction: "Contextualize seu trabalho e apresente o problema de pesquisa (mínimo 200 palavras)",
    methodology: "Descreva detalhadamente os métodos, técnicas e procedimentos utilizados (mínimo 150 palavras)",
    results: "Apresente os dados obtidos de forma clara e objetiva (mínimo 150 palavras)",
    abstract: "Gere automaticamente o resumo do seu artigo em português e/ou inglês"
  };
  const getNextSection = (current: Section): Section | null => {
    const order: Section[] = ["config", "objectives", "literature", "introduction", "methodology", "results", "abstract"];
    const currentIndex = order.indexOf(current);
    return currentIndex < order.length - 1 ? order[currentIndex + 1] : null;
  };
  const canContinue = (section: Section): boolean => {
    if (!currentProject) return false;
    const editableSections = ["objectives", "literature", "introduction", "methodology", "results"];
    const isEditableSection = editableSections.includes(section);
    const contentToValidate = section === currentSection && isEditableSection ? content : currentProject[section as keyof typeof currentProject] as string || "";
    switch (section) {
      case "config":
        return !!(currentProject.title && currentProject.premise && currentProject.area);
      case "objectives":
        return getWordCountFromHtml(contentToValidate) >= 100;
      case "literature":
        return getWordCountFromHtml(contentToValidate) >= 150;
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
  const wordCount = getWordCountFromHtml(content);
  return <div className="min-h-screen bg-background flex relative">
      {/* Sidebar de Progresso - Colapsável */}
      <div className={cn("transition-all duration-300 ease-in-out border-r border-border bg-card", isProgressSidebarOpen ? "w-64" : "w-0 overflow-hidden")}>
        <ProgressSidebar project={currentProject} currentSection={currentSection} sectionContents={{
          objectives: getSectionContent("objectives"),
          literature: getSectionContent("literature"),
          introduction: getSectionContent("introduction"),
          methodology: getSectionContent("methodology"),
          results: getSectionContent("results")
        }} isSaving={isSaving} onSectionChange={navigateTo} />
      </div>


      {/* Conteúdo Principal */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <header className="border-b border-border bg-card sticky top-0 z-10">
          <div className="px-6 py-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsProgressSidebarOpen(!isProgressSidebarOpen)}
                className="h-9 w-9"
              >
                {isProgressSidebarOpen ? (
                  <PanelLeftClose className="h-4 w-4" />
                ) : (
                  <PanelLeft className="h-4 w-4" />
                )}
              </Button>
              
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
              {currentSection !== "abstract" && currentSection !== "config" && <Button variant="outline" size="sm" onClick={handleSaveNow} disabled={isSaving}>
                  {isSaving ? <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Salvando...
                    </> : <>
                      <Check className="w-4 h-4 mr-2" />
                      Salvar Agora
                    </>}
                </Button>}
              {lastSaved && <span className="text-xs text-muted-foreground">
                  Salvo às {lastSaved.toLocaleTimeString('pt-BR', {
                hour: '2-digit',
                minute: '2-digit'
              })}
                </span>}
              <Button variant="outline" size="sm">
                <FileDown className="w-4 h-4 mr-2" />
                Exportar
              </Button>
              
              {currentSection !== "abstract" && currentSection !== "config" && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setIsSuggestionPanelOpen(!isSuggestionPanelOpen)}
                  className="h-9 w-9"
                >
                  {isSuggestionPanelOpen ? (
                    <PanelRightClose className="h-4 w-4" />
                  ) : (
                    <PanelRight className="h-4 w-4" />
                  )}
                </Button>
              )}
              
              <div className="bg-primary text-primary-foreground rounded-full w-8 h-8 flex items-center justify-center font-semibold text-sm">
                {user?.name.charAt(0).toUpperCase()}
              </div>
            </div>
          </div>
        </header>

        {/* Conteúdo */}
        <div className="flex-1 overflow-y-auto">
              <div className={cn(
                "mx-auto px-4 py-6 transition-all duration-300",
                isProgressSidebarOpen && isSuggestionPanelOpen && "max-w-[1200px]",
                (isProgressSidebarOpen && !isSuggestionPanelOpen) || (!isProgressSidebarOpen && isSuggestionPanelOpen) ? "max-w-[1600px]" : "",
                !isProgressSidebarOpen && !isSuggestionPanelOpen && "max-w-none px-12"
              )}>
            <div className="mb-6">
              <h2 className="text-2xl font-semibold text-foreground mb-2">
                {sectionLabels[currentSection]}
              </h2>
              <p className="text-sm text-muted-foreground">
                {sectionDescriptions[currentSection]}
              </p>
            </div>

            {currentSection === "config" ? <ConfigSection project={currentProject} onUpdate={handleConfigUpdate} /> : currentSection === "abstract" ? <AbstractGenerator project={currentProject} sectionContents={{
            introduction: getSectionContent("introduction"),
            methodology: getSectionContent("methodology"),
            results: getSectionContent("results")
          }} onUpdate={(abstractPT, abstractEN) => {
            updateProject(currentProject.id, {
              abstractPT,
              abstractEN
            });
          }} /> : <>
                <RichTextEditor key={currentSection} value={content} onChange={setContent} placeholder={sectionPlaceholders[currentSection]} minHeight="600px" className="font-serif text-[17px] leading-relaxed border-0" />

                <div className="mt-4 flex items-center justify-between text-sm text-muted-foreground">
                  <span>{wordCount} palavras</span>
                  <span>{content.length} caracteres</span>
                </div>
              </>}

            {getNextSection(currentSection) && canContinue(currentSection) && <div className="mt-8 p-4 bg-primary/5 border border-primary/20 rounded-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-medium text-foreground">
                      Próxima etapa disponível
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      {sectionLabels[getNextSection(currentSection)!]}
                    </p>
                  </div>
                  <Button onClick={() => navigateTo(getNextSection(currentSection)!)} size="lg">
                    Continuar
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </div>
              </div>}
          </div>
        </div>
      </div>


      {/* Suggestion Panel - Colapsável (Condicional) */}
      {currentSection !== "abstract" && currentSection !== "config" && <div className={cn("transition-all duration-300 ease-in-out border-l border-border bg-card", isSuggestionPanelOpen ? "w-96" : "w-0 overflow-hidden")}>
          <SuggestionPanel section={currentSection} content={content} />
        </div>}
    </div>;
}