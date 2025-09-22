import React, { useState } from 'react';
import useStore from './store';
import styles from './SlotDisplay.module.css';

function SlotDisplay() {
  const slots = useStore((state) => state.slots);
  const [isCollapsed, setIsCollapsed] = useState(false);

  const hasSlots = Object.keys(slots).length > 0;

  const toggleCollapse = () => {
    setIsCollapsed(!isCollapsed);
  };

  return (
    <div className={`${styles.slotDisplayContainer} ${isCollapsed ? styles.collapsed : ''}`}>
      <h4 className={styles.title} onClick={toggleCollapse}>
        Current Slot Values
        <span className={styles.toggleIcon}>{isCollapsed ? '▶' : '▼'}</span>
      </h4>
      {!isCollapsed && (
        hasSlots ? (
          <div className={styles.slotList}>
            {Object.entries(slots).map(([key, value]) => (
              <div key={key} className={styles.slotItem}>
                <span className={styles.slotKey}>{key}:</span>
                <span className={styles.slotValue}>{JSON.stringify(value)}</span>
              </div>
            ))}
          </div>
        ) : (
          <p className={styles.placeholder}>No slots set yet.</p>
        )
      )}
    </div>
  );
}

export default SlotDisplay;