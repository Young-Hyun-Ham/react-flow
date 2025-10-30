// src/components/controllers/DelayNodeController.jsx

import styles from '../../NodeController.module.css';

function DelayNodeController({ localNode, setLocalNode }) {
    const { data } = localNode;

    const handleLocalDataChange = (key, value) => {
        // 입력값을 숫자로 변환하고, 음수나 숫자가 아니면 0으로 처리
        const numericValue = parseInt(value, 10);
        const validValue = numericValue >= 0 ? numericValue : 0;

        setLocalNode(prev => ({
          ...prev,
          data: { ...prev.data, [key]: validValue },
        }));
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
        </>
    );
}

export default DelayNodeController;