import { Project } from "@/contexts/ProjectContext";
import { useProject } from "@/contexts/ProjectContext";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Calendar, FileText } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface ProjectCardProps {
  project: Project;
  onClick: () => void;
}

export default function ProjectCard({ project, onClick }: ProjectCardProps) {
  const { getProjectProgress } = useProject();
  const progress = getProjectProgress(project);

  return (
    <Card
      className="cursor-pointer hover:shadow-md transition-all hover:scale-[1.02] border-l-4 border-l-secondary"
      onClick={onClick}
    >
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-semibold text-foreground leading-tight line-clamp-2">
            {project.title}
          </h3>
          <FileText className="w-5 h-5 text-secondary flex-shrink-0" />
        </div>
        <Badge variant="secondary" className="w-fit mt-2">
          {project.area}
        </Badge>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground line-clamp-3">
          {project.premise}
        </p>
        
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>Progresso</span>
            <span className="font-medium">{progress}%</span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>

        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Calendar className="w-3 h-3" />
          <span>
            Atualizado em {format(project.updatedAt, "dd 'de' MMMM", { locale: ptBR })}
          </span>
        </div>
      </CardContent>
    </Card>
  );
}
