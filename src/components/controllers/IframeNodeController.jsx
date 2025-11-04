import styles from '../../NodeController.module.css';

function IframeNodeController({ localNode, setLocalNode }) {
    const { data } = localNode;
    
    const handleLocalDataChange = (key, value) => {
        setLocalNode(prev => ({
          ...prev,
          data: { ...prev.data, [key]: value },
        }));
    };

    return (
      <>
        <div className={styles.formGroup}>
          <label>URL</label>
          <textarea
            value={data.url || ''}
            onChange={(e) => handleLocalDataChange('url', e.target.value)}
            rows={3}
          />
        </div>
        <div className={styles.gridControls}>
            <div className={styles.formGroup}>
                <label>Width (px)</label>
                <input
                    type="number"
                    value={data.width || ''}
                    onChange={(e) => handleLocalDataChange('width', e.target.value)}
                />
            </div>
            <div className={styles.formGroup}>
                <label>Height (px)</label>
                <input
                    type="number"
                    value={data.height || ''}
                    onChange={(e) => handleLocalDataChange('height', e.target.value)}
                />
            </div>
        </div>
        {/* --- 👇 [추가] chainNext 체크박스 --- */}
        <div className={styles.formGroup} style={{ paddingTop: '10px' }}>
          <label style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '8px', 
            cursor: 'pointer',
            fontWeight: '500',
            fontSize: '0.85rem'
          }}>
            <input
              type="checkbox"
              checked={data.chainNext || false}
              onChange={(e) => handleLocalDataChange('chainNext', e.target.checked)}
              style={{ width: '16px', height: '16px', margin: 0, flexShrink: 0 }}
            />
            Chain with next node (no new bubble)
          </label>
        </div>
        {/* --- 👆 [추가 끝] --- */}
      </>
    );
}

export default IframeNodeController;