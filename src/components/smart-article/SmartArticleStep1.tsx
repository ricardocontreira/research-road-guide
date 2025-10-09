import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { ArrowRight, FileText } from "lucide-react";

const areas = [
  "Ciências Exatas e da Terra",
  "Ciências Biológicas",
  "Engenharias",
  "Ciências da Saúde",
  "Ciências Agrárias",
  "Ciências Sociais Aplicadas",
  "Ciências Humanas",
  "Linguística, Letras e Artes",
  "Multidisciplinar",
];

interface Props {
  title: string;
  setTitle: (value: string) => void;
  premise: string;
  setPremise: (value: string) => void;
  area: string;
  setArea: (value: string) => void;
  canProceed: boolean;
  onNext: () => void;
}

export default function SmartArticleStep1({
  title,
  setTitle,
  premise,
  setPremise,
  area,
  setArea,
  canProceed,
  onNext
}: Props) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2 mb-2">
          <FileText className="w-5 h-5 text-primary" />
          <CardTitle>Informações Básicas</CardTitle>
        </div>
        <CardDescription>
          Preencha os dados fundamentais do seu artigo acadêmico
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-2">
          <Label htmlFor="title">
            Nome do Artigo <span className="text-destructive">*</span>
          </Label>
          <Input
            id="title"
            placeholder="Ex: Impactos da Inteligência Artificial na Educação"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            maxLength={200}
          />
          <p className="text-xs text-muted-foreground">
            {title.length}/200 caracteres
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="premise">
            Premissa do Artigo <span className="text-destructive">*</span>
          </Label>
          <Textarea
            id="premise"
            placeholder="Descreva a premissa central do seu artigo, a questão que você busca responder ou o problema que deseja resolver..."
            value={premise}
            onChange={(e) => setPremise(e.target.value)}
            maxLength={1000}
            rows={6}
          />
          <p className="text-xs text-muted-foreground">
            {premise.length}/1000 caracteres
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="area">
            Área do Artigo <span className="text-destructive">*</span>
          </Label>
          <Select value={area} onValueChange={setArea}>
            <SelectTrigger id="area">
              <SelectValue placeholder="Selecione a área de conhecimento" />
            </SelectTrigger>
            <SelectContent>
              {areas.map((a) => (
                <SelectItem key={a} value={a}>
                  {a}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex justify-end pt-4">
          <Button 
            size="lg"
            disabled={!canProceed}
            onClick={onNext}
          >
            Próximo
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
