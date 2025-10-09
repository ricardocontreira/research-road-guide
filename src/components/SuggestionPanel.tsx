import { useState, useEffect } from "react";
import { Lightbulb, AlertCircle, BookOpen, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { getAcademicSuggestions, AISuggestion } from "@/services/ai";

type Section = "objectives" | "literature" | "introduction" | "methodology" | "results";

const iconMap = {
  Lightbulb,
  AlertCircle,
  BookOpen,
};

interface SuggestionPanelProps {
  section: Section;
  content: string;
}

export default function SuggestionPanel({ section, content }: SuggestionPanelProps) {
  const [aiSuggestions, setAiSuggestions] = useState<AISuggestion[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const timeoutId = setTimeout(async () => {
      if (!content || content.trim().length < 50) {
        setAiSuggestions([]);
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      setError(null);

      try {
        const suggestions = await getAcademicSuggestions(section, content);
        setAiSuggestions(suggestions);
      } catch (err) {
        console.error('Erro ao carregar sugestões:', err);
        setError('Não foi possível carregar sugestões');
      } finally {
        setIsLoading(false);
      }
    }, 1500);

    return () => clearTimeout(timeoutId);
  }, [section, content]);

  if (isLoading) {
    return (
      <div className="h-full border-l border-border bg-card overflow-y-auto">
        <div className="p-6">
          <h3 className="text-sm font-semibold text-foreground mb-4">
            Sugestões Inteligentes
          </h3>
          <div className="flex flex-col items-center justify-center py-12">
            <Loader2 className="w-8 h-8 text-primary animate-spin mb-4" />
            <p className="text-sm text-muted-foreground">
              Analisando seu conteúdo...
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (!content || content.trim().length < 50) {
    return (
      <div className="h-full border-l border-border bg-card overflow-y-auto">
        <div className="p-6">
          <h3 className="text-sm font-semibold text-foreground mb-4">
            Sugestões Inteligentes
          </h3>
          <div className="text-center py-12">
            <Lightbulb className="w-12 h-12 text-muted mx-auto mb-4" />
            <p className="text-sm text-muted-foreground">
              Continue escrevendo para receber sugestões personalizadas
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="h-full border-l border-border bg-card overflow-y-auto">
        <div className="p-6">
          <h3 className="text-sm font-semibold text-foreground mb-4">
            Sugestões Inteligentes
          </h3>
          <div className="text-center py-12">
            <AlertCircle className="w-12 h-12 text-destructive mx-auto mb-4" />
            <p className="text-sm text-muted-foreground">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  if (aiSuggestions.length === 0) {
    return (
      <div className="h-full border-l border-border bg-card overflow-y-auto">
        <div className="p-6">
          <h3 className="text-sm font-semibold text-foreground mb-4">
            Sugestões Inteligentes
          </h3>
          <div className="text-center py-12">
            <Lightbulb className="w-12 h-12 text-muted mx-auto mb-4" />
            <p className="text-sm text-muted-foreground">
              Nenhuma sugestão no momento
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full border-l border-border bg-card overflow-y-auto">
      <div className="p-6 space-y-4">
        <h3 className="text-sm font-semibold text-foreground mb-4">
          Sugestões Inteligentes
        </h3>

        {aiSuggestions.map((suggestion, index) => {
          const Icon = iconMap[suggestion.icon] || Lightbulb;
          const isHighlight = suggestion.type === "melhoria" || suggestion.type === "clareza";

          return (
            <div
              key={index}
              className={cn(
                "bg-background rounded-lg p-4 shadow-sm border-l-4 transition-all hover:shadow-md",
                isHighlight ? "border-l-accent" : "border-l-secondary",
                isHighlight && "bg-accent/5"
              )}
            >
              <div className="flex items-start gap-3">
                <div
                  className={cn(
                    "rounded-full p-2 flex-shrink-0",
                    isHighlight ? "bg-accent/20" : "bg-secondary/20"
                  )}
                >
                  <Icon
                    className={cn(
                      "w-4 h-4",
                      isHighlight ? "text-accent-foreground" : "text-secondary"
                    )}
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="font-medium text-sm text-foreground mb-1">
                    {suggestion.title}
                  </h4>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    {suggestion.content}
                  </p>
                  {suggestion.type === "referencia" && (
                    <button className="mt-3 text-xs text-secondary hover:underline font-medium">
                      Adicionar às referências
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
