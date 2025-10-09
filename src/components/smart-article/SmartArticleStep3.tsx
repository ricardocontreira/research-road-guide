import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Loader2, Sparkles } from "lucide-react";
import { analyzeDocumentForTips, type AiTip } from "@/services/ai";
import { useToast } from "@/hooks/use-toast";

interface Props {
  extractedText: string;
  area: string;
  premise: string;
  onComplete: (tips: AiTip[]) => void;
}

const processingSteps = [
  { message: "Conectando com Gemini AI...", progress: 20 },
  { message: "Lendo conteúdo do documento...", progress: 40 },
  { message: "Analisando estrutura e conteúdo...", progress: 60 },
  { message: "Gerando insights inteligentes...", progress: 80 },
  { message: "Finalizando análise...", progress: 100 },
];

export default function SmartArticleStep3({
  extractedText,
  area,
  premise,
  onComplete
}: Props) {
  const { toast } = useToast();
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  
  useEffect(() => {
    const processDocument = async () => {
      try {
        // Simular progresso
        for (let i = 0; i < processingSteps.length - 1; i++) {
          setCurrentStepIndex(i);
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
        
        // Chamar IA para gerar dicas
        setCurrentStepIndex(processingSteps.length - 1);
        const tips = await analyzeDocumentForTips(extractedText, area, premise);
        
        // Pequeno delay antes de completar
        await new Promise(resolve => setTimeout(resolve, 500));
        
        toast({
          title: "✨ Análise completa!",
          description: `${tips.length} dicas geradas com sucesso`,
        });
        
        onComplete(tips);
        
      } catch (error: any) {
        toast({
          title: "Erro na análise",
          description: error.message || "Não foi possível analisar o documento",
          variant: "destructive"
        });
      }
    };
    
    processDocument();
  }, [extractedText, area, premise, onComplete, toast]);
  
  const currentStep = processingSteps[currentStepIndex];
  
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2 mb-2">
          <Sparkles className="w-5 h-5 text-primary animate-pulse" />
          <CardTitle>Processamento Inteligente</CardTitle>
        </div>
        <CardDescription>
          Aguarde enquanto analisamos seu documento
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-8">
        <div className="flex flex-col items-center justify-center py-12">
          <Loader2 className="w-16 h-16 text-primary animate-spin mb-6" />
          <p className="text-lg font-medium mb-2">{currentStep.message}</p>
          <Progress value={currentStep.progress} className="w-full max-w-md mt-4" />
          <p className="text-sm text-muted-foreground mt-2">
            {currentStep.progress}%
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
