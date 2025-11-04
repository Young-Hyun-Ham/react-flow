import styles from '../../NodeController.module.css';

function SetSlotNodeController({ localNode, setLocalNode }) {
    const { data } = localNode;
    
    const handleLocalDataChange = (key, value) => {
        setLocalNode(prev => ({
          ...prev,
          data: { ...prev.data, [key]: value },
        }));
    };

    const handleAssignmentChange = (index, part, value) => {
        const newAssignments = [...(data.assignments || [])];
        newAssignments[index] = { ...newAssignments[index], [part]: value };
        handleLocalDataChange('assignments', newAssignments);
    };

    const addAssignment = () => {
        const newAssignment = { key: '', value: '' };
        const newAssignments = [...(data.assignments || []), newAssignment];
        handleLocalDataChange('assignments', newAssignments);
    };

    const deleteAssignment = (index) => {
        const newAssignments = (data.assignments || []).filter((_, i) => i !== index);
        handleLocalDataChange('assignments', newAssignments);
    };

    return (
        <>
            <div className={styles.formGroup}>
                <label>Slot Assignments</label>
                <p className={styles.instructionText} style={{marginTop: 0, fontSize: '0.8rem'}}>
                    Set or update slot values. You can use existing slot values in the 'Value' field with {`{slotName}`}.
                </p>
                <div className={styles.repliesContainer}>
                    {(data.assignments || []).map((assign, index) => (
                        <div key={index} className={styles.quickReply}>
                            <input
                                className={styles.quickReplyInput}
                                value={assign.key}
                                onChange={(e) => handleAssignmentChange(index, 'key', e.target.value)}
                                placeholder="Slot Key"
                            />
                            <input
                                className={styles.quickReplyInput}
                                value={assign.value}
                                onChange={(e) => handleAssignmentChange(index, 'value', e.target.value)}
                                placeholder="Value"
                            />
                            <button onClick={() => deleteAssignment(index)} className={styles.deleteReplyButton}>×</button>
                        </div>
                    ))}
                    <button onClick={addAssignment} className={styles.addReplyButton}>
                        + Add Assignment
                    </button>
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

export default SetSlotNodeController;