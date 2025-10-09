import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useProject } from "@/contexts/ProjectContext";
import { Button } from "@/components/ui/button";
import { BookOpen, LogOut, FileText } from "lucide-react";
import ProjectCard from "@/components/ProjectCard";

export default function Dashboard() {
  const { user, logout } = useAuth();
  const { projects, deleteProject, setCurrentProject } = useProject();
  const navigate = useNavigate();

  const handleDeleteProject = async (id: string) => {
    await deleteProject(id);
  };

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-primary rounded-full p-2">
              <BookOpen className="w-6 h-6 text-primary-foreground" />
            </div>
            <div>
            <h1 className="text-xl font-semibold text-foreground">Revisor.AI</h1>
            <p className="text-xs text-muted-foreground">Plataforma inteligente de revisão acadêmica</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right">
              <p className="text-sm font-medium text-foreground">{user?.name}</p>
              <p className="text-xs text-muted-foreground">{user?.email}</p>
            </div>
            <div className="bg-primary text-primary-foreground rounded-full w-10 h-10 flex items-center justify-center font-semibold">
              {user?.name.charAt(0).toUpperCase()}
            </div>
            <Button variant="ghost" size="icon" onClick={handleLogout}>
              <LogOut className="w-5 h-5" />
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 py-12">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-3xl font-semibold text-foreground mb-2">Meus Projetos</h2>
            <p className="text-muted-foreground">
              Gerencie seus artigos acadêmicos em desenvolvimento
            </p>
          </div>
          <Button 
            size="lg" 
            variant="premium"
            className="gap-2"
            onClick={() => navigate("/smart-article")}
          >
            <FileText className="w-5 h-5" />
            Revisar Artigo
          </Button>
        </div>

        {projects.length === 0 ? (
          <div className="text-center py-20">
            <div className="bg-muted/20 rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-4">
              <FileText className="w-10 h-10 text-muted" />
            </div>
            <h3 className="text-xl font-medium text-foreground mb-2">
              Nenhum projeto ainda
            </h3>
            <p className="text-muted-foreground mb-6">
              Comece revisando seu primeiro artigo acadêmico
            </p>
            <Button onClick={() => navigate("/smart-article")} size="lg" variant="premium" className="gap-2">
              <FileText className="w-5 h-5" />
              Revisar Artigo
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {projects.map((project) => (
              <ProjectCard
                key={project.id}
                project={project}
                onClick={() => {
                  setCurrentProject(project);
                  navigate("/project/editor");
                }}
                onDelete={handleDeleteProject}
              />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
