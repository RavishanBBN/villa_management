import React from 'react';
import './LoadingSkeleton.css';

export const LoadingSkeleton = ({ type = 'card', count = 1 }) => {
  const skeletons = Array(count).fill(null);

  if (type === 'table') {
    return (
      <div className="skeleton-table">
        <div className="skeleton-table-header">
          <div className="skeleton-line"></div>
          <div className="skeleton-line"></div>
          <div className="skeleton-line"></div>
          <div className="skeleton-line"></div>
        </div>
        {skeletons.map((_, i) => (
          <div key={i} className="skeleton-table-row">
            <div className="skeleton-line"></div>
            <div className="skeleton-line"></div>
            <div className="skeleton-line"></div>
            <div className="skeleton-line"></div>
          </div>
        ))}
      </div>
    );
  }

  if (type === 'card') {
    return (
      <div className="skeleton-cards">
        {skeletons.map((_, i) => (
          <div key={i} className="skeleton-card">
            <div className="skeleton-header"></div>
            <div className="skeleton-line"></div>
            <div className="skeleton-line short"></div>
            <div className="skeleton-line medium"></div>
          </div>
        ))}
      </div>
    );
  }

  if (type === 'stats') {
    return (
      <div className="skeleton-stats">
        {skeletons.map((_, i) => (
          <div key={i} className="skeleton-stat-card">
            <div className="skeleton-icon"></div>
            <div className="skeleton-line"></div>
            <div className="skeleton-line short"></div>
          </div>
        ))}
      </div>
    );
  }

  if (type === 'list') {
    return (
      <div className="skeleton-list">
        {skeletons.map((_, i) => (
          <div key={i} className="skeleton-list-item">
            <div className="skeleton-avatar"></div>
            <div className="skeleton-content">
              <div className="skeleton-line"></div>
              <div className="skeleton-line short"></div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="skeleton-default">
      <div className="skeleton-line"></div>
      <div className="skeleton-line"></div>
      <div className="skeleton-line short"></div>
    </div>
  );
};

export default LoadingSkeleton;
