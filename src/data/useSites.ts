import { ref, computed } from 'vue'
import { seedProjects } from './seed-projects'
import type { Project, ProjectStatus } from './types'

export const ALL_SITES_ID = '__all-sites__'

// Module-level state (singleton — shared across all components)
const projects = ref<Project[]>(structuredClone(seedProjects))
const activeProjectId = ref<string | null>(null)

const activeProject = computed(() =>
  projects.value.find(p => p.id === activeProjectId.value) ?? null
)

export function useProjects() {
  function setStatus(projectId: string, status: ProjectStatus) {
    const p = projects.value.find(p => p.id === projectId)
    if (p) p.status = status
  }

  function createUntitledProject(): Project {
    const id = `project-${Date.now()}`
    const newProject: Project = {
      id,
      name: 'Untitled project',
      favicon: `https://api.dicebear.com/9.x/shapes/svg?seed=${encodeURIComponent(id)}`,
      status: 'stopped',
      url: '',
      createdAt: new Date().toISOString(),
    }
    projects.value.push(newProject)
    return newProject
  }

  function updateProject(id: string, updates: Partial<Pick<Project, 'name' | 'favicon' | 'description'>>) {
    const p = projects.value.find(p => p.id === id)
    if (p) Object.assign(p, updates)
  }

  return {
    projects,
    activeProjectId,
    activeProject,
    setStatus,
    createUntitledProject,
    updateProject,
  }
}
