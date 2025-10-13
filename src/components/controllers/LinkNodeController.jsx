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
      </>
    );
}

export default LinkNodeController;