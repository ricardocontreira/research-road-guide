import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Lightbulb, CheckCircle2, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import type { AiTip } from "@/services/ai";

interface TipCardProps {
  tip: AiTip;
  isCompleted: boolean;
  onToggleComplete: (tipId: string) => void;
}

const iconMap = {
  Lightbulb,
  CheckCircle: CheckCircle2,
  AlertCircle,
};

const categoryColors = {
  "Metodologia": "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300",
  "Redação": "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300",
  "Resultados": "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300",
  "Estrutura": "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300",
  "Fundamentação": "bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-300",
};

export default function TipCard({ tip, isCompleted, onToggleComplete }: TipCardProps) {
  const Icon = iconMap[tip.icon] || Lightbulb;
  
  return (
    <Card 
      className={cn(
        "transition-all hover:shadow-md",
        isCompleted && "opacity-60"
      )}
    >
      <CardContent className="p-6">
        <div className="flex items-start gap-4">
          {/* Número */}
          <div className="flex-shrink-0 w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center font-bold text-primary">
            {tip.number}
          </div>
          
          {/* Conteúdo */}
          <div className="flex-1 space-y-3">
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-center gap-2">
                <Icon className="w-5 h-5 text-primary flex-shrink-0" />
                <h3 className={cn(
                  "font-semibold text-foreground",
                  isCompleted && "line-through"
                )}>
                  {tip.title}
                </h3>
              </div>
              <Badge className={categoryColors[tip.category]}>
                {tip.category}
              </Badge>
            </div>
            
            <p className="text-sm text-muted-foreground leading-relaxed">
              {tip.description}
            </p>
            
            {/* Checkbox de conclusão */}
            <div className="flex items-center gap-2 pt-2">
              <Checkbox 
                id={`tip-${tip.id}`}
                checked={isCompleted}
                onCheckedChange={() => onToggleComplete(tip.id)}
              />
              <label 
                htmlFor={`tip-${tip.id}`}
                className="text-sm text-muted-foreground cursor-pointer"
              >
                Marcar como implementada
              </label>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
