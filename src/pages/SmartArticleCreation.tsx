import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Brain, ArrowLeft } from "lucide-react";
import SmartArticleStep1 from "@/components/smart-article/SmartArticleStep1";
import SmartArticleStep2 from "@/components/smart-article/SmartArticleStep2";
import SmartArticleStep3 from "@/components/smart-article/SmartArticleStep3";
import SmartArticleStep4 from "@/components/smart-article/SmartArticleStep4";
import { cn } from "@/lib/utils";
import type { AiTip } from "@/services/ai";

type Step = 1 | 2 | 3 | 4;

export default function SmartArticleCreation() {
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [currentStep, setCurrentStep] = useState<Step>(1);
  
  // Dados do formulário
  const [title, setTitle] = useState("");
  const [premise, setPremise] = useState("");
  const [area, setArea] = useState("");
  const [file, setFile] = useState<File | null>(null);
  
  // Resultados da IA
  const [extractedText, setExtractedText] = useState("");
  const [aiTips, setAiTips] = useState<AiTip[]>([]);
  const [tipsCompleted, setTipsCompleted] = useState<Record<string, boolean>>({});
  
  const canProceedFromStep1 = !!(title.trim() && premise.trim() && area);
  const canProceedFromStep2 = file !== null;
  
  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <SmartArticleStep1
            title={title}
            setTitle={setTitle}
            premise={premise}
            setPremise={setPremise}
            area={area}
            setArea={setArea}
            canProceed={canProceedFromStep1}
            onNext={() => setCurrentStep(2)}
          />
        );
      case 2:
        return (
          <SmartArticleStep2
            file={file}
            setFile={setFile}
            canProceed={!!canProceedFromStep2}
            onBack={() => setCurrentStep(1)}
            onNext={(extractedTextContent) => {
              setExtractedText(extractedTextContent);
              setCurrentStep(3);
            }}
            title={title}
            premise={premise}
            area={area}
          />
        );
      case 3:
        return (
          <SmartArticleStep3
            extractedText={extractedText}
            area={area}
            premise={premise}
            onComplete={(tips) => {
              setAiTips(tips);
              setCurrentStep(4);
            }}
          />
        );
      case 4:
        return (
          <SmartArticleStep4
            title={title}
            premise={premise}
            area={area}
            extractedText={extractedText}
            aiTips={aiTips}
            tipsCompleted={tipsCompleted}
            setTipsCompleted={setTipsCompleted}
            file={file}
            onBackToDashboard={() => navigate("/dashboard")}
          />
        );
      default:
        return null;
    }
  };
  
  return (
    <div className="min-h-screen bg-background">
      {/* Header com progresso */}
      <header className="border-b border-border bg-card sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={() => navigate("/dashboard")}
              >
                <ArrowLeft className="w-5 h-5" />
              </Button>
              <div>
                <h1 className="text-xl font-semibold flex items-center gap-2">
                  <Brain className="w-6 h-6 text-primary" />
                  Criar Artigo Inteligente
                </h1>
                <p className="text-xs text-muted-foreground">
                  Análise automática com IA
                </p>
              </div>
            </div>
          </div>
          
          {/* Progress Bar */}
          <div className="flex items-center gap-2">
            {[1, 2, 3, 4].map((step) => (
              <div
                key={step}
                className={cn(
                  "h-2 rounded-full flex-1 transition-all",
                  step <= currentStep ? "bg-primary" : "bg-muted"
                )}
              />
            ))}
          </div>
        </div>
      </header>
      
      {/* Main Content */}
      <main className="max-w-5xl mx-auto px-6 py-12">
        {renderStep()}
      </main>
    </div>
  );
}
