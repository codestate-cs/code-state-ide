import { useState } from 'preact/hooks';
import type { JSX } from 'preact';
import './Tabs.css';

interface TabItem {
  id: string;
  label: string;
  content: JSX.Element | string;
  disabled?: boolean;
}

interface TabsProps {
  items: TabItem[];
  defaultActiveId?: string;
  activeTab?: string;
  variant?: 'pills' | 'underline';
  className?: string;
  onTabChange?: (tabId: string) => void;
}

export function Tabs({ 
  items, 
  defaultActiveId, 
  activeTab: controlledActiveTab,
  variant = 'underline',
  className = '',
  onTabChange 
}: TabsProps) {
  const [internalActiveTab, setInternalActiveTab] = useState<string>(
    defaultActiveId || items.find(item => !item.disabled)?.id || items[0]?.id
  );
  
  // Use controlled activeTab if provided, otherwise use internal state
  const activeTab = controlledActiveTab ?? internalActiveTab;

  const handleTabClick = (tabId: string) => {
    const tab = items.find(item => item.id === tabId);
    if (tab && !tab.disabled) {
      // Update internal state only if not controlled
      if (controlledActiveTab === undefined) {
        setInternalActiveTab(tabId);
      }
      onTabChange?.(tabId);
    }
  };

  const activeTabContent = items.find(item => item.id === activeTab)?.content;

  return (
    <div className={`tabs tabs-${variant} ${className}`}>
      <div className="tabs-list" role="tablist">
        {items.map((item) => {
          const isActive = activeTab === item.id;
          
          return (
            <button
              key={item.id}
              className={`tab-trigger ${isActive ? 'active' : ''} ${item.disabled ? 'disabled' : ''}`}
              onClick={() => handleTabClick(item.id)}
              role="tab"
              aria-selected={isActive}
              aria-controls={`tab-content-${item.id}`}
              disabled={item.disabled}
            >
              {item.label}
            </button>
          );
        })}
      </div>
      
      <div className="tabs-content">
        {items.map((item) => {
          const isActive = activeTab === item.id;
          
          return (
            <div
              key={item.id}
              id={`tab-content-${item.id}`}
              className={`tab-content ${isActive ? 'active' : ''}`}
              role="tabpanel"
              aria-labelledby={`tab-${item.id}`}
              aria-hidden={!isActive}
            >
              {typeof item.content === 'string' ? (
                <p>{item.content}</p>
              ) : (
                item.content
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}