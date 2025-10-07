import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useProject } from "@/contexts/ProjectContext";
import { useAuth } from "@/contexts/AuthContext";
import ProgressSidebar from "@/components/ProgressSidebar";
import SuggestionPanel from "@/components/SuggestionPanel";
import { Button } from "@/components/ui/button";
import { RichTextEditor } from "@/components/RichTextEditor";
import { ArrowLeft, FileDown } from "lucide-react";

type Section = "introduction" | "methodology" | "results";

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
    setContent(currentProject[currentSection] || "");
  }, [currentProject, currentSection, navigate]);

  useEffect(() => {
    if (!currentProject) return;

    const timer = setTimeout(() => {
      if (content !== currentProject[currentSection]) {
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
  };

  const sectionPlaceholders = {
    introduction: "A inteligência artificial tem revolucionado diversos setores da sociedade, trazendo mudanças significativas na forma como vivemos, trabalhamos e nos relacionamos...",
    methodology: "Esta pesquisa adotou uma abordagem qualitativa, utilizando entrevistas semiestruturadas com 20 participantes...",
    results: "Os dados coletados revelaram que 85% dos participantes relataram impactos positivos da tecnologia em suas atividades diárias...",
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
                  {currentSection === "introduction" && "Contextualize seu trabalho e apresente o problema de pesquisa"}
                  {currentSection === "methodology" && "Descreva detalhadamente os métodos, técnicas e procedimentos utilizados"}
                  {currentSection === "results" && "Apresente os dados obtidos de forma clara e objetiva"}
                </p>
              </div>

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
            </div>
          </div>

          {/* Painel de Sugestões */}
          <SuggestionPanel section={currentSection} content={content} />
        </div>
      </div>
    </div>
  );
}
