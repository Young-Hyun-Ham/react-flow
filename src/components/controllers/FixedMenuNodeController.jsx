import styles from '../../NodeController.module.css';

function FixedMenuNodeController({ localNode, setLocalNode }) {
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
                display: 'New Menu',
                value: `menu_${Date.now()}-${Math.random().toString(36).substring(2, 9)}`
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

    return (
        <>
            <div className={styles.formGroup}>
                <label>Menu Title</label>
                <textarea value={data.content || ''} onChange={(e) => handleLocalDataChange('content', e.target.value)} rows={4} />
            </div>
            <div className={styles.formGroup}>
                <label>Menus</label>
                <div className={styles.repliesContainer}>
                    {data.replies?.map((reply, index) => (
                        <div key={reply.value || index} className={styles.quickReply}>
                            <input
                                className={styles.quickReplyInput}
                                value={reply.display}
                                onChange={(e) => localUpdateReply(index, 'display', e.target.value)}
                                placeholder="Display text"
                            />
                            <button onClick={() => localDeleteReply(index)} className={styles.deleteReplyButton}>×</button>
                        </div>
                    ))}
                    <button onClick={localAddReply} className={styles.addReplyButton}>
                        + Add Menu
                    </button>
                </div>
            </div>
        </>
    );
}

export default FixedMenuNodeController;