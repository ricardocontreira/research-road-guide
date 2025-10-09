import { useMemo } from "react";
import { Lightbulb, AlertCircle, BookOpen } from "lucide-react";
import { cn } from "@/lib/utils";

type Section = "objectives" | "literature" | "introduction" | "methodology" | "results";

interface Suggestion {
  type: "structure" | "clarity" | "improvement" | "reference";
  title: string;
  content: string;
  highlight?: string;
  icon: typeof Lightbulb;
}

interface SuggestionPanelProps {
  section: Section;
  content: string;
}

export default function SuggestionPanel({ section, content }: SuggestionPanelProps) {
  const suggestions = useMemo((): Suggestion[] => {
    const wordCount = content.split(/\s+/).filter(Boolean).length;

    if (section === "objectives") {
      return [
        {
          type: "structure",
          title: "Objetivos Claros",
          content: "Divida seus objetivos em Geral (o propósito central da pesquisa) e Específicos (metas mensuráveis para alcançar o objetivo geral).",
          icon: Lightbulb,
        },
        wordCount > 30 && {
          type: "clarity",
          title: "Verbos de Ação",
          content: "Use verbos precisos como 'analisar', 'investigar', 'avaliar', 'identificar' ao invés de 'estudar' ou 'conhecer'.",
          icon: AlertCircle,
        },
        {
          type: "improvement",
          title: "Alinhamento",
          content: "Certifique-se de que seus objetivos específicos respondem diretamente ao objetivo geral e estão alinhados com sua premissa.",
          icon: Lightbulb,
        },
      ].filter(Boolean) as Suggestion[];
    }

    if (section === "literature") {
      return [
        {
          type: "structure",
          title: "Revisão Crítica",
          content: "Não apenas descreva o que outros autores disseram - faça conexões, identifique lacunas e posicione sua pesquisa no contexto existente.",
          icon: Lightbulb,
        },
        wordCount > 50 && {
          type: "reference",
          title: "Atualidade das Fontes",
          content: "Priorize referências dos últimos 5 anos, especialmente em áreas com rápida evolução tecnológica ou conceitual.",
          icon: BookOpen,
        },
        {
          type: "improvement",
          title: "Organização Temática",
          content: "Organize sua revisão por temas ou conceitos, não apenas cronologicamente ou por autor.",
          icon: AlertCircle,
        },
      ].filter(Boolean) as Suggestion[];
    }

    if (section === "introduction") {
      return [
        {
          type: "structure",
          title: "Estrutura da Introdução",
          content: "Sua introdução poderia começar contextualizando o problema de forma mais ampla. Considere apresentar dados estatísticos ou um panorama geral do tema.",
          icon: Lightbulb,
        },
        wordCount > 50 && {
          type: "clarity",
          title: "Clareza na Escrita",
          content: "Algumas frases estão muito longas. Considere dividi-las para melhorar a legibilidade.",
          icon: AlertCircle,
        },
        {
          type: "reference",
          title: "Referência Sugerida",
          content: "Silva et al. (2023). Inteligência Artificial na Educação: Uma revisão sistemática. Este trabalho apresenta um panorama atualizado do uso de IA em contextos educacionais.",
          icon: BookOpen,
        },
      ].filter(Boolean) as Suggestion[];
    }

    if (section === "methodology") {
      return [
        {
          type: "structure",
          title: "Tempo Verbal",
          content: "A metodologia deve estar em tempo passado, descrevendo os procedimentos que foram realizados.",
          icon: AlertCircle,
        },
        wordCount > 30 && {
          type: "improvement",
          title: "Detalhamento Necessário",
          content: "Em Ciências Humanas, é importante especificar o perfil dos participantes da pesquisa com mais detalhes (faixa etária, formação, etc.).",
          icon: Lightbulb,
        },
        {
          type: "reference",
          title: "Referência Metodológica",
          content: "Creswell, J. W. (2014). Projeto de pesquisa: métodos qualitativo, quantitativo e misto. Esta obra é referência em metodologia de pesquisa.",
          icon: BookOpen,
        },
      ].filter(Boolean) as Suggestion[];
    }

    if (section === "results") {
      return [
        {
          type: "structure",
          title: "Separação de Seções",
          content: "Evite interpretar resultados nesta seção. Reserve as interpretações e discussões para a seção de Discussão.",
          icon: AlertCircle,
        },
        {
          type: "improvement",
          title: "Visualização de Dados",
          content: "Considere adicionar elementos visuais (tabelas, gráficos) para ilustrar os dados de forma mais clara.",
          icon: Lightbulb,
        },
        wordCount > 40 && {
          type: "clarity",
          title: "Organização dos Resultados",
          content: "Organize os resultados de forma lógica, do geral ao específico, para facilitar a compreensão.",
          icon: Lightbulb,
        },
      ].filter(Boolean) as Suggestion[];
    }

    return [];
  }, [section, content]);

  if (suggestions.length === 0) {
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

  return (
    <div className="h-full border-l border-border bg-card overflow-y-auto">
      <div className="p-6 space-y-4">
        <h3 className="text-sm font-semibold text-foreground mb-4">
          Sugestões Inteligentes
        </h3>

        {suggestions.map((suggestion, index) => {
          const Icon = suggestion.icon;
          const isHighlight = suggestion.type === "improvement" || suggestion.type === "clarity";

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
                  {suggestion.type === "reference" && (
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
