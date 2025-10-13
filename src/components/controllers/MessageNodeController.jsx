import styles from '../../NodeController.module.css';
import { useNodeController } from '../../hooks/useNodeController'; // 💡[추가된 부분]

function MessageNodeController({ localNode, setLocalNode }) {
    const { data } = localNode;
    // 💡[수정된 부분] Custom Hook 사용
    const { handleLocalDataChange, addReply, updateReply, deleteReply } = useNodeController(setLocalNode);

    return (
        <>
            <div className={styles.formGroup}>
                <label>Content</label>
                <textarea value={data.content || ''} onChange={(e) => handleLocalDataChange('content', e.target.value)} rows={4} />
            </div>
            <div className={styles.formGroup}>
                <label>Quick Replies</label>
                <div className={styles.repliesContainer}>
                    {data.replies?.map((reply, index) => (
                        <div key={reply.value || index} className={styles.quickReply}>
                            <input
                                className={styles.quickReplyInput}
                                value={reply.display}
                                onChange={(e) => updateReply(index, 'display', e.target.value)}
                                placeholder="Display text"
                            />
                            <input
                                className={styles.quickReplyInput}
                                value={reply.value}
                                onChange={(e) => updateReply(index, 'value', e.target.value)}
                                placeholder="Actual value"
                            />
                            <button onClick={() => deleteReply(index)} className={styles.deleteReplyButton}>×</button>
                        </div>
                    ))}
                    <button onClick={addReply} className={styles.addReplyButton}>
                        + Add Reply
                    </button>
                </div>
            </div>
        </>
    );
}

export default MessageNodeController;