import styles from '../../NodeController.module.css';
import { useNodeController } from '../../hooks/useNodeController'; // 💡[추가된 부분]

function LinkNodeController({ localNode, setLocalNode }) {
    const { data } = localNode;
    // 💡[수정된 부분] Custom Hook 사용
    const { handleLocalDataChange } = useNodeController(setLocalNode);

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

export default LinkNodeController;