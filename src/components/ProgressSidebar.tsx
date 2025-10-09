import { Project } from "@/contexts/ProjectContext";
import { Check, Circle, FileText, Loader2, CheckCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { useNavigate } from "react-router-dom";
import { getWordCountFromHtml } from "@/utils/wordCount";

interface Step {
  id: string;
  label: string;
  icon?: React.ReactNode;
  section?: "config" | "objectives" | "literature" | "introduction" | "methodology" | "results" | "abstract";
}

const steps: Step[] = [
  { id: "config", label: "Configuração do Projeto", section: "config" },
  { id: "objectives", label: "Objetivos da Pesquisa", section: "objectives" },
  { id: "literature", label: "Revisão Bibliográfica", section: "literature" },
  { id: "introduction", label: "Introdução", section: "introduction" },
  { id: "methodology", label: "Metodologia", section: "methodology" },
  { id: "results", label: "Resultados", section: "results" },
  { 
    id: "abstract", 
    label: "Resumo", 
    icon: <FileText className="w-4 h-4" />,
    section: "abstract"
  },
];

interface ProgressSidebarProps {
  project: Project;
  currentSection: "config" | "objectives" | "literature" | "introduction" | "methodology" | "results" | "abstract";
  sectionContents: {
    objectives: string;
    literature: string;
    introduction: string;
    methodology: string;
    results: string;
  };
  isSaving: boolean;
  onSectionChange: (section: "config" | "objectives" | "literature" | "introduction" | "methodology" | "results" | "abstract") => void;
}

export default function ProgressSidebar({
  project,
  currentSection,
  sectionContents,
  isSaving,
  onSectionChange,
}: ProgressSidebarProps) {
  const navigate = useNavigate();

  const isStepComplete = (stepId: string): boolean => {
    switch (stepId) {
      case "config":
        return !!(project.title && project.premise && project.area);
      case "objectives":
        return getWordCountFromHtml(sectionContents.objectives) >= 100;
      case "literature":
        return getWordCountFromHtml(sectionContents.literature) >= 150;
      case "abstract":
        return !!(project.abstractPT || project.abstractEN);
      case "introduction":
        return getWordCountFromHtml(sectionContents.introduction) >= 200;
      case "methodology":
        return getWordCountFromHtml(sectionContents.methodology) >= 150;
      case "results":
        return getWordCountFromHtml(sectionContents.results) >= 150;
      default:
        return false;
    }
  };

  const isStepEnabled = (step: Step, stepIndex: number): boolean => {
    // Config sempre habilitado
    if (step.id === "config") return true;
    
    // Objectives requer config completo
    if (step.id === "objectives") {
      return isStepComplete("config");
    }
    
    // Literature requer objectives completo
    if (step.id === "literature") {
      return isStepComplete("objectives");
    }
    
    // Introduction requer literature completo
    if (step.id === "introduction") {
      return isStepComplete("literature");
    }
    
    // Methodology requer introduction completo
    if (step.id === "methodology") {
      return isStepComplete("introduction");
    }
    
    // Results requer methodology completo
    if (step.id === "results") {
      return isStepComplete("methodology");
    }
    
    // Abstract requer results completo
    if (step.id === "abstract") {
      return isStepComplete("results");
    }
    
    return true;
  };

  const isStepCurrent = (step: Step): boolean => {
    return step.section === currentSection;
  };

  return (
    <div className="h-full border-r border-border bg-card overflow-y-auto">
      <div className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-foreground">Progresso</h3>
          {isSaving ? (
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <Loader2 className="w-3 h-3 animate-spin" />
              <span>Salvando...</span>
            </div>
          ) : (
            <div className="flex items-center gap-1 text-xs text-green-600">
              <CheckCircle className="w-3 h-3" />
              <span>Salvo</span>
            </div>
          )}
        </div>
        <nav className="space-y-1">
          {steps.map((step, index) => {
            const isComplete = isStepComplete(step.id);
            const isCurrent = isStepCurrent(step);
            const isEnabled = isStepEnabled(step, index);
            const isClickable = !!step.section && isEnabled;

            return (
              <button
                key={step.id}
                onClick={() => {
                  if (step.section) onSectionChange(step.section);
                }}
                disabled={!isClickable}
                className={cn(
                  "w-full flex items-center gap-3 px-3 py-2.5 rounded-md text-left transition-colors",
                  isClickable && "hover:bg-accent cursor-pointer",
                  !isClickable && "cursor-default",
                  !isEnabled && "opacity-50 cursor-not-allowed",
                  isCurrent && "bg-primary/10 text-primary"
                )}
              >
                <div className="flex-shrink-0">
                  {isComplete ? (
                    <div className="w-6 h-6 rounded-full bg-green-500 flex items-center justify-center">
                      <Check className="w-4 h-4 text-white" />
                    </div>
                  ) : isCurrent ? (
                    <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center">
                      <Circle className="w-3 h-3 text-white fill-white" />
                    </div>
                  ) : (
                    <div className="w-6 h-6 rounded-full border-2 border-muted flex items-center justify-center">
                      <span className="text-xs text-muted-foreground">{index + 1}</span>
                    </div>
                  )}
                </div>
                <span
                  className={cn(
                    "text-sm",
                    isComplete && "text-green-600 font-medium",
                    isCurrent && "text-primary font-medium",
                    !isComplete && !isCurrent && "text-muted-foreground"
                  )}
                >
                  {step.label}
                </span>
              </button>
            );
          })}
        </nav>
      </div>
    </div>
  );
}
