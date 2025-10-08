import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/components/ui/use-toast";

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
  createProject: (title: string, premise: string, area: string) => Promise<void>;
  updateProject: (id: string, updates: Partial<Project>) => Promise<void>;
  setCurrentProject: (project: Project | null) => void;
  getProjectProgress: (project: Project) => number;
  loadProjects: (userId: string) => Promise<void>;
  isLoading: boolean;
}

const ProjectContext = createContext<ProjectContextType | undefined>(undefined);

export function ProjectProvider({ children }: { children: ReactNode }) {
  const [projects, setProjects] = useState<Project[]>([]);
  const [currentProject, setCurrentProject] = useState<Project | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const loadProjects = async (userId: string) => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('projects')
        .select('*')
        .eq('user_id', userId)
        .order('updated_at', { ascending: false });
      
      if (error) throw error;
      
      const mappedProjects: Project[] = (data || []).map(p => ({
        id: p.id,
        title: p.title,
        premise: p.premise,
        area: p.area,
        objectives: p.objectives || '',
        literature: p.literature || '',
        abstractPT: p.abstract_pt || '',
        abstractEN: p.abstract_en || '',
        introduction: p.introduction || '',
        methodology: p.methodology || '',
        results: p.results || '',
        createdAt: new Date(p.created_at),
        updatedAt: new Date(p.updated_at),
      }));
      
      setProjects(mappedProjects);
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Erro ao carregar projetos",
        description: error.message,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const createProject = async (title: string, premise: string, area: string) => {
    try {
      setIsLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) throw new Error('Usuário não autenticado');

      const { data, error } = await supabase
        .from('projects')
        .insert({
          user_id: user.id,
          title,
          premise,
          area,
          objectives: '',
          literature: '',
          abstract_pt: '',
          abstract_en: '',
          introduction: '',
          methodology: '',
          results: '',
        })
        .select()
        .single();
      
      if (error) throw error;
      
      const newProject: Project = {
        id: data.id,
        title: data.title,
        premise: data.premise,
        area: data.area,
        objectives: data.objectives || '',
        literature: data.literature || '',
        abstractPT: data.abstract_pt || '',
        abstractEN: data.abstract_en || '',
        introduction: data.introduction || '',
        methodology: data.methodology || '',
        results: data.results || '',
        createdAt: new Date(data.created_at),
        updatedAt: new Date(data.updated_at),
      };
      
      setProjects([newProject, ...projects]);
      setCurrentProject(newProject);
      
      toast({
        title: "Projeto criado!",
        description: "Seu projeto foi criado com sucesso.",
      });
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Erro ao criar projeto",
        description: error.message,
      });
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const updateProject = async (id: string, updates: Partial<Project>) => {
    try {
      const dbUpdates: any = {};
      
      if (updates.title !== undefined) dbUpdates.title = updates.title;
      if (updates.premise !== undefined) dbUpdates.premise = updates.premise;
      if (updates.area !== undefined) dbUpdates.area = updates.area;
      if (updates.objectives !== undefined) dbUpdates.objectives = updates.objectives;
      if (updates.literature !== undefined) dbUpdates.literature = updates.literature;
      if (updates.abstractPT !== undefined) dbUpdates.abstract_pt = updates.abstractPT;
      if (updates.abstractEN !== undefined) dbUpdates.abstract_en = updates.abstractEN;
      if (updates.introduction !== undefined) dbUpdates.introduction = updates.introduction;
      if (updates.methodology !== undefined) dbUpdates.methodology = updates.methodology;
      if (updates.results !== undefined) dbUpdates.results = updates.results;
      
      const { error } = await supabase
        .from('projects')
        .update(dbUpdates)
        .eq('id', id);
      
      if (error) throw error;
      
      setProjects(projects.map(p => 
        p.id === id ? { ...p, ...updates, updatedAt: new Date() } : p
      ));
      
      if (currentProject?.id === id) {
        setCurrentProject({ ...currentProject, ...updates, updatedAt: new Date() });
      }
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Erro ao atualizar projeto",
        description: error.message,
      });
      throw error;
    }
  };

  const getProjectProgress = (project: Project): number => {
    let completed = 0;
    let total = 6;
    
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
        loadProjects,
        isLoading,
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
