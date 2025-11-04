// src/components/controllers/DelayNodeController.jsx

import styles from '../../NodeController.module.css';

function DelayNodeController({ localNode, setLocalNode }) {
    const { data } = localNode;

    const handleLocalDataChange = (key, value) => {
        if (key === 'duration') {
            const numericValue = parseInt(value, 10);
            const validValue = numericValue >= 0 ? numericValue : 0;
            setLocalNode(prev => ({
              ...prev,
              data: { ...prev.data, [key]: validValue },
            }));
        } else {
             setLocalNode(prev => ({
              ...prev,
              data: { ...prev.data, [key]: value },
            }));
        }
    };

    return (
        <>
            <div className={styles.formGroup}>
                <label>Delay Duration (milliseconds)</label>
                <input
                    type="number"
                    value={data.duration || 0}
                    onChange={(e) => handleLocalDataChange('duration', e.target.value)}
                    min="0" // 음수 입력 방지
                />
                 <p className={styles.instructionText} style={{marginTop: '4px', fontSize: '0.75rem'}}>
                    Enter the time in milliseconds (e.g., 1000 for 1 second).
                </p>
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

export default DelayNodeController;