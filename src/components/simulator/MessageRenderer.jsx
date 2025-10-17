import React, { useRef, useEffect } from 'react';
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
                    
                    // --- 💡 수정된 부분 시작 ---
                    if (el.type === 'grid') {
                        const gridDataFromSlot = el.optionsSlot ? slots[el.optionsSlot] : null;
                        const hasSlotData = Array.isArray(gridDataFromSlot) && gridDataFromSlot.length > 0;
                    
                        if (hasSlotData) {
                            const isDynamicObjectArray = typeof gridDataFromSlot[0] === 'object' && gridDataFromSlot[0] !== null && !Array.isArray(gridDataFromSlot[0]);
                            if (isDynamicObjectArray) {
                                // 데이터 슬롯이 객체 배열일 때의 렌더링 로직
                                const displayKeys = el.displayKeys && el.displayKeys.length > 0 ? el.displayKeys : null;
                                return (
                                    <div key={el.id}>
                                        {gridDataFromSlot.map((dataObject, index) => {
                                            let keys = displayKeys || Object.keys(dataObject);
                                            if (!displayKeys && el.hideNullColumns) {
                                                keys = keys.filter(key => dataObject[key] !== null && dataObject[key] !== undefined && dataObject[key] !== "");
                                            }
                                            return (
                                                <table key={`${el.id}-${index}`} className={styles.formGridTable} style={{ marginTop: index > 0 ? '15px' : '0' }}>
                                                    <thead>
                                                        <tr>
                                                            <th>Label</th>
                                                            <th>Property</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody>
                                                        {keys.map(key => (
                                                            <tr key={key}>
                                                                <td>{key}</td>
                                                                <td>{interpolateMessage(dataObject[key] || '', slots)}</td>
                                                            </tr>
                                                        ))}
                                                    </tbody>
                                                </table>
                                            );
                                        })}
                                    </div>
                                );
                            } else {
                                // 데이터 슬롯이 2차원 배열일 때의 렌더링 로직
                                const rows = gridDataFromSlot.length;
                                const columns = gridDataFromSlot[0]?.length || 0;
                                 return (
                                    <table key={el.id} className={styles.formGridTable}>
                                        <tbody>
                                            {[...Array(rows)].map((_, r) => (
                                                <tr key={r}>
                                                    {[...Array(columns)].map((_, c) => {
                                                        const cellValue = gridDataFromSlot[r] ? gridDataFromSlot[r][c] : '';
                                                        return <td key={c}>{interpolateMessage(cellValue || '', slots)}</td>;
                                                    })}
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                );
                            }
                        } else {
                            // 데이터 슬롯이 없거나 유효하지 않을 때, 수동 입력 데이터를 렌더링
                            const rows = el.rows || 2;
                            const columns = el.columns || 2;
                            return (
                                <table key={el.id} className={styles.formGridTable}>
                                    <tbody>
                                        {[...Array(rows)].map((_, r) => (
                                            <tr key={r}>
                                                {[...Array(columns)].map((_, c) => {
                                                    const cellIndex = r * columns + c;
                                                    const cellValue = el.data && el.data[cellIndex] ? el.data[cellIndex] : '';
                                                    return <td key={c}>{interpolateMessage(cellValue, slots)}</td>;
                                                })}
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            );
                        }
                    }
                    // --- 💡 수정된 부분 끝 ---

                    return (
                        <div key={el.id} className={styles.formElement}>
                            <label className={styles.formLabel}>{el.label}</label>
                            {el.type === 'input' && <input type={el.validation?.type === 'email' ? 'email' : 'text'} className={styles.formInput} placeholder={el.placeholder} value={formData[el.name] || ''} onChange={(e) => handleFormInputChange(el.name, e.target.value)} disabled={isCompleted} />}
                            {el.type === 'date' && <input type="date" className={styles.formInput} value={formData[el.name] || ''} onChange={(e) => handleFormInputChange(el.name, e.target.value)} disabled={isCompleted} {...dateProps} />}
                            {el.type === 'checkbox' && el.options?.map(opt => <div key={opt} className={styles.checkboxOption}><input type="checkbox" id={`${el.id}-${opt}`} value={opt} checked={(formData[el.name] || []).includes(opt)} onChange={(e) => handleFormMultiInputChange(el.name, opt, e.target.checked)} disabled={isCompleted} /><label htmlFor={`${el.id}-${opt}`}>{opt}</label></div>)}
                            {el.type === 'dropbox' && (() => { const options = Array.isArray(slots[el.optionsSlot]) ? slots[el.optionsSlot] : el.options; return (<select className={styles.formInput} value={formData[el.name] || ''} onChange={(e) => handleFormInputChange(el.name, e.target.value)} disabled={isCompleted}><option value="" disabled>Select...</option>{(options || []).map(opt => { const v = typeof opt === 'object' ? opt.value : opt; const l = typeof opt === 'object' ? opt.label : opt; return <option key={v} value={v}>{l}</option>; })}</select>); })()}
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