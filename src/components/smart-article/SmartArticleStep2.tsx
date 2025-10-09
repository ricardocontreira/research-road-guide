import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ArrowLeft, ArrowRight, Upload, X, FileText, Info } from "lucide-react";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { parseDocument, validateDocument } from "@/utils/documentParser";

interface Props {
  file: File | null;
  setFile: (file: File | null) => void;
  canProceed: boolean;
  onBack: () => void;
  onNext: (extractedText: string) => void;
  title: string;
  premise: string;
  area: string;
}

export default function SmartArticleStep2({
  file,
  setFile,
  canProceed,
  onBack,
  onNext,
  title,
  premise,
  area
}: Props) {
  const { toast } = useToast();
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  
  const handleFileSelect = (selectedFile: File) => {
    const maxSize = 10 * 1024 * 1024; // 10MB
    
    if (selectedFile.size > maxSize) {
      toast({
        title: "Arquivo muito grande",
        description: "O arquivo deve ter no máximo 10MB",
        variant: "destructive"
      });
      return;
    }
    
    const validTypes = [
      'application/pdf',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/msword',
      'text/plain'
    ];
    
    if (!validTypes.includes(selectedFile.type)) {
      toast({
        title: "Formato inválido",
        description: "Apenas PDF, DOCX e TXT são aceitos",
        variant: "destructive"
      });
      return;
    }
    
    setFile(selectedFile);
  };
  
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile) {
      handleFileSelect(droppedFile);
    }
  };
  
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };
  
  const handleDragLeave = () => {
    setIsDragging(false);
  };
  
  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };
  
  const handleProceed = async () => {
    if (!file) return;
    
    setIsProcessing(true);
    
    try {
      // Extrair texto do arquivo
      const extractedText = await parseDocument(file);
      
      // Validar documento
      const validation = validateDocument(extractedText);
      
      if (!validation.isValid) {
        toast({
          title: "Documento inválido",
          description: validation.errors.join('. '),
          variant: "destructive"
        });
        setIsProcessing(false);
        return;
      }
      
      if (validation.warnings.length > 0) {
        validation.warnings.forEach(warning => {
          toast({
            title: "Aviso",
            description: warning,
          });
        });
      }
      
      onNext(extractedText);
      
    } catch (error: any) {
      toast({
        title: "Erro ao processar documento",
        description: error.message || "Não foi possível processar o arquivo",
        variant: "destructive"
      });
      setIsProcessing(false);
    }
  };
  
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2 mb-2">
          <Upload className="w-5 h-5 text-primary" />
          <CardTitle>Upload de Documento</CardTitle>
        </div>
        <CardDescription>
          Envie o arquivo do seu artigo para análise inteligente
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <Alert>
          <Info className="h-4 w-4" />
          <AlertDescription>
            Recomenda-se que o documento contenha as seções: <strong>Introdução</strong>, <strong>Metodologia</strong> e <strong>Resultados</strong>
          </AlertDescription>
        </Alert>

        {!file ? (
          <div
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            className={cn(
              "border-2 border-dashed rounded-lg p-12 text-center transition-colors cursor-pointer",
              isDragging
                ? "border-primary bg-primary/5"
                : "border-muted-foreground/25 hover:border-primary/50"
            )}
            onClick={() => document.getElementById('file-input')?.click()}
          >
            <Upload className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
            <p className="text-sm font-medium mb-2">
              Arraste e solte seu arquivo aqui
            </p>
            <p className="text-xs text-muted-foreground mb-4">
              ou clique para selecionar
            </p>
            <p className="text-xs text-muted-foreground">
              PDF, DOCX ou TXT (máximo 10MB)
            </p>
            <input
              id="file-input"
              type="file"
              accept=".pdf,.docx,.doc,.txt"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleFileSelect(file);
              }}
              className="hidden"
            />
          </div>
        ) : (
          <div className="border rounded-lg p-6 bg-card">
            <div className="flex items-start justify-between">
              <div className="flex items-start gap-4">
                <div className="p-3 rounded-lg bg-primary/10">
                  <FileText className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <p className="font-medium">{file.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {formatFileSize(file.size)}
                  </p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setFile(null)}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          </div>
        )}

        <div className="flex justify-between pt-4">
          <Button 
            variant="outline"
            onClick={onBack}
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Voltar
          </Button>
          <Button 
            size="lg"
            disabled={!canProceed || isProcessing}
            onClick={handleProceed}
          >
            {isProcessing ? "Processando..." : "Iniciar Análise"}
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
