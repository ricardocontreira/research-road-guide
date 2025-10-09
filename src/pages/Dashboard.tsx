import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useProject } from "@/contexts/ProjectContext";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, BookOpen, LogOut, FileText } from "lucide-react";
import ProjectCard from "@/components/ProjectCard";

const areas = [
  "Ciências Exatas e da Terra",
  "Ciências Biológicas",
  "Engenharias",
  "Ciências da Saúde",
  "Ciências Sociais Aplicadas",
  "Ciências Humanas",
  "Linguística, Letras e Artes",
  "Multidisciplinar",
];

export default function Dashboard() {
  const { user, logout } = useAuth();
  const { projects, createProject, deleteProject, setCurrentProject } = useProject();
  const navigate = useNavigate();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [newProject, setNewProject] = useState({
    title: "",
    premise: "",
    area: "",
  });

  const handleCreateProject = () => {
    if (newProject.title && newProject.premise && newProject.area) {
      createProject(newProject.title, newProject.premise, newProject.area);
      setIsDialogOpen(false);
      setNewProject({ title: "", premise: "", area: "" });
      navigate("/project/editor");
    }
  };

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
              <h1 className="text-xl font-semibold text-foreground">Escritor.AI</h1>
              <p className="text-xs text-muted-foreground">Plataforma de escrita acadêmica</p>
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
          <div className="flex gap-3">
            <Button 
              size="lg" 
              variant="premium"
              className="gap-2"
              onClick={() => navigate("/smart-article")}
            >
              <FileText className="w-5 h-5" />
              Criar Artigo Inteligente
            </Button>
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button size="lg" className="gap-2">
                  <Plus className="w-5 h-5" />
                  Novo Projeto
                </Button>
              </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle className="text-2xl">Criar Novo Projeto</DialogTitle>
              </DialogHeader>
              <div className="space-y-6 pt-4">
                <div className="space-y-2">
                  <Label htmlFor="title">Título do Projeto</Label>
                  <Input
                    id="title"
                    placeholder="Ex: Impactos da Inteligência Artificial na Educação Superior"
                    value={newProject.title}
                    onChange={(e) => setNewProject({ ...newProject, title: e.target.value })}
                    maxLength={150}
                  />
                  <p className="text-xs text-muted-foreground text-right">
                    {newProject.title.length}/150 caracteres
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="premise">Premissa</Label>
                  <Textarea
                    id="premise"
                    placeholder="Descreva brevemente a questão central ou hipótese da sua pesquisa..."
                    value={newProject.premise}
                    onChange={(e) => setNewProject({ ...newProject, premise: e.target.value })}
                    rows={4}
                  />
                  <p className="text-xs text-muted-foreground text-right">
                    {newProject.premise.split(/\s+/).filter(Boolean).length} palavras
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="area">Área do Projeto</Label>
                  <Select
                    value={newProject.area}
                    onValueChange={(value) => setNewProject({ ...newProject, area: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione uma área" />
                    </SelectTrigger>
                    <SelectContent>
                      {areas.map((area) => (
                        <SelectItem key={area} value={area}>
                          {area}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <Button
                  onClick={handleCreateProject}
                  className="w-full"
                  size="lg"
                  disabled={!newProject.title || !newProject.premise || !newProject.area}
                >
                  Criar Projeto
                </Button>
              </div>
            </DialogContent>
            </Dialog>
          </div>
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
              Comece criando seu primeiro artigo acadêmico
            </p>
            <Button onClick={() => setIsDialogOpen(true)} size="lg" className="gap-2">
              <Plus className="w-5 h-5" />
              Criar Primeiro Projeto
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
