import { createContext, useContext, useState, ReactNode } from "react";

export interface Project {
  id: string;
  title: string;
  premise: string;
  area: string;
  objectives: string;
  literature: string;
  abstractPT: string;
  abstractEN: string;
  introduction: string;
  methodology: string;
  results: string;
  createdAt: Date;
  updatedAt: Date;
}

interface ProjectContextType {
  projects: Project[];
  currentProject: Project | null;
  createProject: (title: string, premise: string, area: string) => void;
  updateProject: (id: string, updates: Partial<Project>) => void;
  setCurrentProject: (project: Project | null) => void;
  getProjectProgress: (project: Project) => number;
}

const ProjectContext = createContext<ProjectContextType | undefined>(undefined);

const mockProjects: Project[] = [
  {
    id: "1",
    title: "Impactos da Inteligência Artificial na Educação Superior",
    premise: "Investigar como ferramentas de IA estão transformando metodologias de ensino e aprendizagem no contexto universitário brasileiro.",
    area: "Ciências Humanas",
    objectives: "Analisar a adoção de ferramentas de IA em universidades públicas e privadas do Brasil.",
    literature: "A literatura sobre IA na educação tem crescido exponencialmente...",
    abstractPT: "",
    abstractEN: "",
    introduction: "A inteligência artificial tem revolucionado diversos setores da sociedade...",
    methodology: "",
    results: "",
    createdAt: new Date("2025-01-15"),
    updatedAt: new Date("2025-01-20"),
  },
];

export function ProjectProvider({ children }: { children: ReactNode }) {
  const [projects, setProjects] = useState<Project[]>(mockProjects);
  const [currentProject, setCurrentProject] = useState<Project | null>(null);

  const createProject = (title: string, premise: string, area: string) => {
    const newProject: Project = {
      id: Date.now().toString(),
      title,
      premise,
      area,
      objectives: "",
      literature: "",
      abstractPT: "",
      abstractEN: "",
      introduction: "",
      methodology: "",
      results: "",
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    setProjects([...projects, newProject]);
    setCurrentProject(newProject);
  };

  const updateProject = (id: string, updates: Partial<Project>) => {
    setProjects(projects.map(p => 
      p.id === id ? { ...p, ...updates, updatedAt: new Date() } : p
    ));
    if (currentProject?.id === id) {
      setCurrentProject({ ...currentProject, ...updates, updatedAt: new Date() });
    }
  };

  const getProjectProgress = (project: Project): number => {
    let completed = 0;
    let total = 6; // Configuration, Objectives, Abstract, Introduction, Methodology, Results
    
    if (project.title && project.premise && project.area) completed++;
    if (project.objectives && project.literature) completed++;
    if (project.abstractPT || project.abstractEN) completed++;
    if (project.introduction) completed++;
    if (project.methodology) completed++;
    if (project.results) completed++;
    
    return Math.round((completed / total) * 100);
  };

  return (
    <ProjectContext.Provider
      value={{
        projects,
        currentProject,
        createProject,
        updateProject,
        setCurrentProject,
        getProjectProgress,
      }}
    >
      {children}
    </ProjectContext.Provider>
  );
}

export function useProject() {
  const context = useContext(ProjectContext);
  if (context === undefined) {
    throw new Error("useProject must be used within a ProjectProvider");
  }
  return context;
}
