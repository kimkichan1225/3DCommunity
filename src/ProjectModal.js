import React, { useEffect } from 'react';
import './ProjectModal.css';

export function ProjectModal({ project, onClose }) {
  useEffect(() => {
    // Prevent body scroll when modal is open
    document.body.style.overflow = 'hidden';

    // Handle escape key
    const handleEscape = (e) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleEscape);

    return () => {
      document.body.style.overflow = 'auto';
      window.removeEventListener('keydown', handleEscape);
    };
  }, [onClose]);

  if (!project) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose}>
          ×
        </button>

        {project.image && (
          <div className="modal-image-container">
            <img src={project.image} alt={project.title} className="modal-image" />
          </div>
        )}

        <div className="modal-body">
          <h2 className="modal-title">{project.title}</h2>

          {project.tech && project.tech.length > 0 && (
            <div className="modal-tech-stack">
              {project.tech.map((tech, index) => (
                <span key={index} className="tech-tag">
                  {tech}
                </span>
              ))}
            </div>
          )}

          <p className="modal-description">{project.description}</p>

          {project.details && (
            <div className="modal-details">
              <h3>주요 기능</h3>
              <ul>
                {project.details.map((detail, index) => (
                  <li key={index}>{detail}</li>
                ))}
              </ul>
            </div>
          )}

          {(project.github || project.demo) && (
            <div className="modal-links">
              {project.github && (
                <a
                  href={project.github}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="modal-link github-link"
                >
                  GitHub
                </a>
              )}
              {project.demo && (
                <a
                  href={project.demo}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="modal-link demo-link"
                >
                  Live Demo
                </a>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
