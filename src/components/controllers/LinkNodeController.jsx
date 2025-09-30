import styles from '../../NodeController.module.css';

function LinkNodeController({ localNode, setLocalNode }) {
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
          <textarea value={data.content || ''} onChange={(e) => handleLocalDataChange('content', e.target.value)} rows={3} />
        </div>
        <div className={styles.formGroup}>
            <label>Display Text</label>
            <input type="text" value={data.display || ''} onChange={(e) => handleLocalDataChange('display', e.target.value)} />
        </div>
      </>
    );
}

export default LinkNodeController;