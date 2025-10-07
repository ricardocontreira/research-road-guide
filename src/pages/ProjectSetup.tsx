import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useProject } from "@/contexts/ProjectContext";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { RichTextEditor } from "@/components/RichTextEditor";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft } from "lucide-react";

export default function ProjectSetup() {
  const { currentProject, updateProject } = useProject();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [objectives, setObjectives] = useState("");
  const [literature, setLiterature] = useState("");
  const [lastSaved, setLastSaved] = useState<Date | null>(null);

  useEffect(() => {
    if (!currentProject) {
      navigate("/dashboard");
      return;
    }
    setObjectives(currentProject.objectives || "");
    setLiterature(currentProject.literature || "");
  }, [currentProject, navigate]);

  useEffect(() => {
    if (!currentProject) return;

    const timer = setTimeout(() => {
      if (objectives !== currentProject.objectives || literature !== currentProject.literature) {
        updateProject(currentProject.id, { objectives, literature });
        setLastSaved(new Date());
      }
    }, 2000);

    return () => clearTimeout(timer);
  }, [objectives, literature, currentProject, updateProject]);

  const handleContinue = () => {
    if (!currentProject) return;
    
    if (!objectives.trim() || !literature.trim()) {
      toast({
        title: "Campos obrigatórios",
        description: "Por favor, preencha os objetivos e a revisão de literatura",
        variant: "destructive",
      });
      return;
    }

    updateProject(currentProject.id, { objectives, literature });
    toast({
      title: "Seção salva!",
      description: "Vamos para a introdução do seu artigo",
    });
    navigate("/project/editor");
  };

  if (!currentProject) return null;

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
          <Button variant="ghost" size="sm" onClick={() => navigate("/dashboard")}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Voltar
          </Button>
          <div className="flex items-center gap-4">
            {lastSaved && (
              <span className="text-xs text-muted-foreground">
                Salvo às {lastSaved.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
              </span>
            )}
            <Button onClick={handleContinue}>
              Salvar e Continuar
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-12">
        <div className="mb-8">
          <h1 className="text-3xl font-semibold text-foreground mb-2">
            Configuração do Projeto
          </h1>
          <p className="text-muted-foreground">
            Defina os objetivos e o referencial teórico do seu trabalho
          </p>
        </div>

        <div className="bg-card rounded-lg border border-border p-8 space-y-8">
          <div className="space-y-3">
            <Label htmlFor="objectives" className="text-base font-semibold">
              Objetivos da Pesquisa
            </Label>
            <p className="text-sm text-muted-foreground">
              Descreva o que você pretende alcançar com esta pesquisa
            </p>
            <RichTextEditor
              value={objectives}
              onChange={setObjectives}
              placeholder="Liste os objetivos gerais e específicos do seu trabalho..."
              minHeight="200px"
              className="font-serif text-base"
            />
            <p className="text-xs text-muted-foreground text-right">
              {objectives.split(/\s+/).filter(Boolean).length} palavras
            </p>
          </div>

          <div className="space-y-3">
            <Label htmlFor="literature" className="text-base font-semibold">
              Revisão Bibliográfica
            </Label>
            <p className="text-sm text-muted-foreground">
              Contextualize seu trabalho dentro do campo de estudo
            </p>
            <RichTextEditor
              value={literature}
              onChange={setLiterature}
              placeholder="Apresente os principais autores e conceitos que fundamentam sua pesquisa..."
              minHeight="250px"
              className="font-serif text-base"
            />
            <p className="text-xs text-muted-foreground text-right">
              {literature.split(/\s+/).filter(Boolean).length} palavras
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
