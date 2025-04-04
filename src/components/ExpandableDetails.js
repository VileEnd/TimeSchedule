import React, { useState } from 'react';
import { processDetailsSections } from '../utils.js';

/**
 * Component to display details with optional expandable section
 * @param {Object} props - Component properties
 * @param {string} props.details - The details text that may contain "||" separator
 * @param {string} props.className - Additional CSS classes for the container
 */
const ExpandableDetails = ({ details, className = '' }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const { summary, expandedDetails } = processDetailsSections(details);
  
  // If there are no expanded details, just return the summary
  if (!expandedDetails) {
    return <div className={className} dangerouslySetInnerHTML={{ __html: summary }}></div>;
  }
  
  // Handle expanding/collapsing of details
  const toggleExpand = () => {
    setIsExpanded(!isExpanded);
  };
  
  return (
    <div className={`${className} relative`}>
      <div className="cursor-pointer" onClick={toggleExpand}>
        <span dangerouslySetInnerHTML={{ __html: summary }}></span>
        {expandedDetails && (
          <span 
            className="ml-1 text-purple-500 hover:text-purple-700 inline-flex items-center"
            title={isExpanded ? "Collapse details" : "Expand details"}
          >
            {isExpanded ? (
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M14.707 12.707a1 1 0 01-1.414 0L10 9.414l-3.293 3.293a1 1 0 01-1.414-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 010 1.414z" clipRule="evenodd" />
              </svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            )}
          </span>
        )}
      </div>
      
      {isExpanded && expandedDetails && (
        <div className="mt-2 p-2 bg-purple-50 dark:bg-purple-900/20 text-sm rounded border border-purple-100 dark:border-purple-800/30 animate-fadeIn"
             dangerouslySetInnerHTML={{ __html: expandedDetails }}>
        </div>
      )}
    </div>
  );
};

export default ExpandableDetails;