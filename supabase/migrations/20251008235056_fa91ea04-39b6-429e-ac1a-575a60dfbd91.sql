-- Criar tabela de perfis de usuário
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  name text not null,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Habilitar RLS na tabela profiles
alter table public.profiles enable row level security;

-- Policy: Usuários podem ler apenas seu próprio perfil
create policy "Users can read own profile"
  on public.profiles for select
  using (auth.uid() = id);

-- Policy: Usuários podem atualizar apenas seu próprio perfil
create policy "Users can update own profile"
  on public.profiles for update
  using (auth.uid() = id);

-- Função para criar perfil automaticamente quando usuário se registra
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, name)
  values (new.id, coalesce(new.raw_user_meta_data->>'name', 'Usuário'));
  return new;
end;
$$;

-- Trigger para executar a função quando usuário se registra
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Criar tabela de projetos acadêmicos
create table public.projects (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete cascade not null,
  title text not null,
  premise text not null,
  area text not null,
  objectives text default '',
  literature text default '',
  abstract_pt text default '',
  abstract_en text default '',
  introduction text default '',
  methodology text default '',
  results text default '',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Habilitar RLS na tabela projects
alter table public.projects enable row level security;

-- Policy: Usuários podem ler apenas seus próprios projetos
create policy "Users can read own projects"
  on public.projects for select
  using (auth.uid() = user_id);

-- Policy: Usuários podem criar seus próprios projetos
create policy "Users can insert own projects"
  on public.projects for insert
  with check (auth.uid() = user_id);

-- Policy: Usuários podem atualizar apenas seus próprios projetos
create policy "Users can update own projects"
  on public.projects for update
  using (auth.uid() = user_id);

-- Policy: Usuários podem deletar apenas seus próprios projetos
create policy "Users can delete own projects"
  on public.projects for delete
  using (auth.uid() = user_id);

-- Índice para melhorar performance em queries por user_id
create index projects_user_id_idx on public.projects(user_id);

-- Trigger para atualizar updated_at automaticamente
create or replace function public.update_updated_at_column()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger update_projects_updated_at
  before update on public.projects
  for each row
  execute function public.update_updated_at_column();