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
        </>
    );
}

export default ToastNodeController;