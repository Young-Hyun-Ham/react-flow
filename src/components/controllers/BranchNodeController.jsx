import styles from '../../NodeController.module.css';

function BranchNodeController({ localNode, setLocalNode }) {
    const { data } = localNode;
    
    const handleLocalDataChange = (key, value) => {
        setLocalNode(prev => ({
          ...prev,
          data: { ...prev.data, [key]: value },
        }));
    };

    const localAddReply = () => {
        setLocalNode(prev => {
            const newReply = {
                display: 'New Branch',
                value: `cond_${Date.now()}-${Math.random().toString(36).substring(2, 9)}`
            };
            const newReplies = [...(prev.data.replies || []), newReply];
            return { ...prev, data: { ...prev.data, replies: newReplies } };
        });
    };
    
    const localUpdateReply = (index, part, value) => {
        setLocalNode(prev => {
            const newReplies = [...prev.data.replies];
            newReplies[index] = { ...newReplies[index], [part]: value };
            return { ...prev, data: { ...prev.data, replies: newReplies } };
        });
    };

    const localDeleteReply = (index) => {
        setLocalNode(prev => {
            const newReplies = prev.data.replies.filter((_, i) => i !== index);
            return { ...prev, data: { ...prev.data, replies: newReplies } };
        });
    };

    const handleConditionChange = (index, part, value) => {
        setLocalNode(prev => {
          const newConditions = [...(prev.data.conditions || [])];
          newConditions[index] = { ...newConditions[index], [part]: value };
          return { ...prev, data: { ...prev.data, conditions: newConditions } };
        });
    };
    
    const addCondition = () => {
        setLocalNode(prev => {
            const newConditions = [...(prev.data.conditions || []), {
                id: `cond-${Date.now()}`, slot: '', operator: '==', value: ''
            }];
            const newReplies = [...(prev.data.replies || []), {
                display: `Condition ${newConditions.length}`,
                value: `cond_${Date.now()}-${Math.random().toString(36).substring(2, 9)}`
            }];
            return { ...prev, data: { ...prev.data, conditions: newConditions, replies: newReplies } };
        });
    };
    
    const deleteCondition = (index) => {
        setLocalNode(prev => {
            const newConditions = prev.data.conditions.filter((_, i) => i !== index);
            const newReplies = prev.data.replies.filter((_, i) => i !== index);
            return { ...prev, data: { ...prev.data, conditions: newConditions, replies: newReplies } };
        });
    };

    return (
        <>
            <div className={styles.formGroup}>
                <label>Branch Text</label>
                <textarea value={data.content || ''} onChange={(e) => handleLocalDataChange('content', e.target.value)} rows={4} />
            </div>
            <div className={styles.formGroup}>
                <label>Evaluation Type</label>
                <select value={data.evaluationType || 'BUTTON'} onChange={(e) => handleLocalDataChange('evaluationType', e.target.value)}>
                    <option value="BUTTON">Button Click</option>
                    <option value="CONDITION">Slot Condition</option>
                </select>
            </div>
            {data.evaluationType === 'CONDITION' ? (
                <div className={styles.formGroup}>
                    <label>Conditions</label>
                    <div className={styles.repliesContainer}>
                        {(data.conditions || []).map((cond, index) => (
                            <div key={cond.id} className={styles.quickReply}>
                                <input className={styles.quickReplyInput} value={cond.slot} onChange={(e) => handleConditionChange(index, 'slot', e.target.value)} placeholder="Slot Name" />
                                <select value={cond.operator} onChange={(e) => handleConditionChange(index, 'operator', e.target.value)}>
                                    <option value="==">==</option> <option value="!=">!=</option> <option value=">">&gt;</option> <option value="<">&lt;</option> <option value=">=">&gt;=</option> <option value="<=">&lt;=</option> <option value="contains">contains</option> <option value="!contains">!contains</option>
                                </select>
                                <input className={styles.quickReplyInput} value={cond.value} onChange={(e) => handleConditionChange(index, 'value', e.target.value)} placeholder="Value" />
                                <button onClick={() => deleteCondition(index)} className={styles.deleteReplyButton}>×</button>
                            </div>
                        ))}
                        <button onClick={addCondition} className={styles.addReplyButton}>+ Add Condition</button>
                    </div>
                </div>
            ) : (
                <div className={styles.formGroup}>
                    <label>Branches</label>
                    <div className={styles.repliesContainer}>
                        {data.replies?.map((reply, index) => (
                            <div key={reply.value || index} className={styles.quickReply}>
                                <input className={styles.quickReplyInput} value={reply.display} onChange={(e) => localUpdateReply(index, 'display', e.target.value)} placeholder="Display text" />
                                <button onClick={() => localDeleteReply(index)} className={styles.deleteReplyButton}>×</button>
                            </div>
                        ))}
                        <button onClick={localAddReply} className={styles.addReplyButton}>+ Add Branch</button>
                    </div>
                </div>
            )}
        </>
    );
}

export default BranchNodeController;