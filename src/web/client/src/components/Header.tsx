import React from 'react';
import { ProjectSelector } from './ProjectSelector.js';
import type { ProjectContext } from '../types.js';
import './Header.css';

interface HeaderProps {
  projectContext: ProjectContext | null;
  onProjectSwitch: (project: string) => void;
}

export function Header({ projectContext, onProjectSwitch }: HeaderProps) {
  return (
    <header className="header">
      <div className="container">
        <div className="header-content">
          <div className="header-left">
            <h1 className="header-title">Claude Grep</h1>
            <span className="header-subtitle">Search your conversation history</span>
          </div>
          
          <div className="header-right">
            {projectContext && (
              <ProjectSelector
                projects={projectContext.availableProjects}
                currentProject={projectContext.currentProject}
                onSwitch={onProjectSwitch}
              />
            )}
          </div>
        </div>
      </div>
    </header>
  );
}