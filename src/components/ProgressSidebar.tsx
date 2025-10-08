import { Project } from "@/contexts/ProjectContext";
import { Check, Circle, FileText } from "lucide-react";
import { cn } from "@/lib/utils";
import { useNavigate } from "react-router-dom";

interface Step {
  id: string;
  label: string;
  icon?: React.ReactNode;
  section?: "introduction" | "methodology" | "results" | "abstract";
}

const steps: Step[] = [
  { id: "config", label: "Configuração do Projeto" },
  { id: "objectives", label: "Objetivos e Revisão" },
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
  currentSection: "introduction" | "methodology" | "results" | "abstract";
  onSectionChange: (section: "introduction" | "methodology" | "results" | "abstract") => void;
}

export default function ProgressSidebar({
  project,
  currentSection,
  onSectionChange,
}: ProgressSidebarProps) {
  const navigate = useNavigate();

  const isStepComplete = (stepId: string): boolean => {
    switch (stepId) {
      case "config":
        return !!(project.title && project.premise && project.area);
      case "objectives":
        return !!(project.objectives && project.literature);
      case "abstract":
        return !!(project.abstractPT || project.abstractEN);
      case "introduction":
        return !!project.introduction;
      case "methodology":
        return !!project.methodology;
      case "results":
        return !!project.results;
      default:
        return false;
    }
  };

  const isStepEnabled = (step: Step, stepIndex: number): boolean => {
    // Sempre permite Config e Objectives
    if (stepIndex <= 1) return true;
    
    // Introduction requer objectives completo
    if (step.id === "introduction") {
      return isStepComplete("objectives");
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
    <aside className="w-64 border-r border-border bg-card flex-shrink-0">
      <div className="p-6">
        <h3 className="text-sm font-semibold text-foreground mb-4">Progresso</h3>
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
    </aside>
  );
}
