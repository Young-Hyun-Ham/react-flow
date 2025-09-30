import React from 'react';
import useStore from '../../store';
import styles from '../../ChatbotSimulator.module.css';
import { interpolateMessage, validateInput } from '../../simulatorUtils';

const BotMessage = ({ node, slots, onOptionClick, onFormSubmit, onFormDefault, isCompleted, formData, handleFormInputChange, handleFormMultiInputChange }) => {
    if (!node) return null;

    if (node.type === 'iframe') {
        return (
            <div className={`${styles.message} ${styles.botMessage} ${styles.iframeContainer}`}>
                <iframe
                    src={interpolateMessage(node.data.url, slots)}
                    width={node.data.width || '100%'}
                    height={node.data.height || '250'}
                    style={{ border: 'none', borderRadius: '18px' }}
                    title="chatbot-iframe"
                ></iframe>
            </div>
        );
    }

    if (node.type === 'link') {
        return (
            <div className={`${styles.message} ${styles.botMessage}`}>
                <span>Opening link in a new tab: </span>
                <a href={node.data.content} target="_blank" rel="noopener noreferrer">{node.data.display || node.data.content}</a>
            </div>
        );
    }

    if (node.type === 'form') {
        return (
            <div className={`${styles.message} ${styles.botMessage} ${styles.formContainer}`}>
                <h3>{node.data.title}</h3>
                {node.data.elements?.map(el => {
                    const dateProps = {};
                    if (el.type === 'date') {
                        if (el.validation?.type === 'today after') dateProps.min = new Date().toISOString().split('T')[0];
                        else if (el.validation?.type === 'today before') dateProps.max = new Date().toISOString().split('T')[0];
                        else if (el.validation?.type === 'custom') {
                            if(el.validation.startDate) dateProps.min = el.validation.startDate;
                            if(el.validation.endDate) dateProps.max = el.validation.endDate;
                        }
                    }
                    return (
                        <div key={el.id} className={styles.formElement}>
                            <label className={styles.formLabel}>{el.label}</label>
                            {el.type === 'input' && <input type={el.validation?.type === 'email' ? 'email' : 'text'} className={styles.formInput} placeholder={el.placeholder} value={formData[el.name] || ''} onChange={(e) => handleFormInputChange(el.name, e.target.value)} disabled={isCompleted} />}
                            {el.type === 'date' && <input type="date" className={styles.formInput} value={formData[el.name] || ''} onChange={(e) => handleFormInputChange(el.name, e.target.value)} disabled={isCompleted} {...dateProps} />}
                            {el.type === 'checkbox' && el.options?.map(opt => <div key={opt} className={styles.checkboxOption}><input type="checkbox" id={`${el.id}-${opt}`} value={opt} checked={(formData[el.name] || []).includes(opt)} onChange={(e) => handleFormMultiInputChange(el.name, opt, e.target.checked)} disabled={isCompleted} /><label htmlFor={`${el.id}-${opt}`}>{opt}</label></div>)}
                            {el.type === 'dropbox' && (() => { const options = Array.isArray(slots[el.optionsSlot]) ? slots[el.optionsSlot] : el.options; return (<select className={styles.formInput} value={formData[el.name] || ''} onChange={(e) => handleFormInputChange(el.name, e.target.value)} disabled={isCompleted}><option value="" disabled>Select...</option>{(options || []).map(opt => { const v = typeof opt === 'object' ? opt.value : opt; const l = typeof opt === 'object' ? opt.label : opt; return <option key={v} value={v}>{l}</option>; })}</select>); })()}
                            {el.type === 'grid' && <table className={styles.formGridTable}><tbody>{[...Array(el.rows || 2)].map((_, r) => <tr key={r}>{[...Array(el.columns || 2)].map((_, c) => <td key={c}>{interpolateMessage(el.data[r * (el.columns || 2) + c] || '', slots)}</td>)}</tr>)}</tbody></table>}
                        </div>
                    );
                })}
                <div className={styles.formButtonContainer}>
                    <button className={styles.formDefaultButton} onClick={onFormDefault} disabled={isCompleted}>Default</button>
                    <button className={styles.formSubmitButton} onClick={onFormSubmit} disabled={isCompleted}>Submit</button>
                </div>
            </div>
        );
    }
    
    const message = interpolateMessage(node.data.content || node.data.label, slots);
    return (
        <div className={`${styles.message} ${styles.botMessage}`}>
            <div>{message}</div>
            {node.type === 'branch' && node.data.evaluationType === 'BUTTON' && (
                <div className={styles.branchButtonsContainer}>
                    {node.data.replies?.map(reply => <button key={reply.value} className={styles.branchButton} onClick={() => onOptionClick(reply)} disabled={isCompleted}>{reply.display}</button>)}
                </div>
            )}
        </div>
    );
};


const MessageRenderer = ({ item, nodes, onOptionClick, handleFormSubmit, handleFormDefault, formData, handleFormInputChange, handleFormMultiInputChange }) => {
    const slots = useStore((state) => state.slots);
    const historyRef = useRef(null);
  
    useEffect(() => {
      if (historyRef.current) {
        historyRef.current.scrollTop = historyRef.current.scrollHeight;
      }
    }, [item]);

    switch (item.type) {
        case 'bot_streaming':
            return (
                <div className={styles.messageRow}>
                    <img src={item.isStreaming ? "/images/avatar-loading.png" : "/images/avatar.png"} alt="Avatar" className={styles.avatar} />
                    <div className={`${styles.message} ${styles.botMessage}`}>{item.content}</div>
                </div>
            );
        case 'loading':
            return (
                <div className={styles.messageRow}>
                    <img src="/images/avatar-loading.png" alt="Avatar" className={styles.avatar} />
                    <div className={`${styles.message} ${styles.botMessage}`}><img src="/images/Loading.gif" alt="Loading..." style={{ width: '80px', height: '60px' }} /></div>
                </div>
            );
        case 'bot':
            const node = nodes.find(n => n.id === item.nodeId);
            return (
                <div className={styles.messageRow}>
                    <img src="/images/avatar.png" alt="Avatar" className={styles.avatar} />
                    {item.message ? <div className={`${styles.message} ${styles.botMessage}`}>{item.message}</div> : <BotMessage node={node} slots={slots} onOptionClick={onOptionClick} onFormSubmit={handleFormSubmit} onFormDefault={handleFormDefault} isCompleted={item.isCompleted} formData={formData} handleFormInputChange={handleFormInputChange} handleFormMultiInputChange={handleFormMultiInputChange} />}
                </div>
            );
        case 'user':
            return (
                <div className={`${styles.messageRow} ${styles.userRow}`}>
                    <div className={`${styles.message} ${styles.userMessage}`}>{item.message}</div>
                </div>
            );
        default:
            return null;
    }
};

export default MessageRenderer;