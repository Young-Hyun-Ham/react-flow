import styles from '../../NodeController.module.css';

function ToastNodeController({ localNode, setLocalNode }) {
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
                <label>Toast Message</label>
                <textarea
                    value={data.message || ''}
                    onChange={(e) => handleLocalDataChange('message', e.target.value)}
                    rows={4}
                />
            </div>
            <div className={styles.formGroup}>
                <label>Toast Type</label>
                <select
                    value={data.toastType || 'info'}
                    onChange={(e) => handleLocalDataChange('toastType', e.target.value)}
                >
                    <option value="info">Info</option>
                    <option value="success">Success</option>
                    <option value="error">Error</option>
                </select>
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

export default ToastNodeController;