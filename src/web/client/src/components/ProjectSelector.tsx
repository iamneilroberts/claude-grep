import React from 'react';
import './ProjectSelector.css';

interface ProjectSelectorProps {
  projects: string[];
  currentProject?: string;
  onSwitch: (project: string) => void;
}

export function ProjectSelector({ projects, currentProject, onSwitch }: ProjectSelectorProps) {
  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    if (value && value !== currentProject) {
      onSwitch(value);
    }
  };

  return (
    <div className="project-selector">
      <label htmlFor="project-select" className="project-label">
        Project:
      </label>
      <select
        id="project-select"
        className="project-select"
        value={currentProject || ''}
        onChange={handleChange}
      >
        {!currentProject && (
          <option value="" disabled>
            Select a project
          </option>
        )}
        {projects.map((project) => (
          <option key={project} value={project}>
            {project}
          </option>
        ))}
      </select>
    </div>
  );
}