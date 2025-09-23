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
      </>
    );
}

export default IframeNodeController;