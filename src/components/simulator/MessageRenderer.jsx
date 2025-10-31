// src/components/simulator/MessageRenderer.jsx

import React, { useRef, useEffect } from 'react';
import useStore from '../../store';
import styles from '../../ChatbotSimulator.module.css';
// --- 👇 [수정] interpolateMessageForApi 제거 ---
import { interpolateMessage, validateInput, getNestedValue } from '../../simulatorUtils';

const BotMessage = ({ node, slots, onOptionClick, onFormSubmit, onFormDefault, isCompleted, formData, handleFormInputChange, handleFormMultiInputChange, handleGridRowClick }) => {
    const setSelectedRow = useStore((state) => state.setSelectedRow);

    if (!node) return null;

    if (node.type === 'iframe') {
        return (
            <div className={`${styles.message} ${styles.botMessage} ${styles.iframeContainer}`}>
                <iframe
                    // --- 👇 [수정] interpolateMessage 사용 ---
                    src={interpolateMessage(node.data.url, slots)}
                    // --- 👆 [수정 끝] ---
                    width={node.data.width || '100%'}
                    height={node.data.height || '250'}
                    style={{ border: 'none', borderRadius: '18px' }}
                    title="chatbot-iframe"
                ></iframe>
            </div>
        );
    }

    if (node.type === 'link') {
        // Link 노드는 addBotMessage에서 linkData로 처리하므로 여기서는 렌더링 불필요
        // (만약 linkData가 없다면 여기서 렌더링)
        // const url = interpolateMessage(node.data.content, slots);
        // const display = interpolateMessage(node.data.display, slots);
        // return ( ... )
        return null; // 通常は useChatFlow で処理
    }

    if (node.type === 'form') {
        const hasSlotBoundGrid = node.data.elements?.some(el =>
            el.type === 'grid' &&
            el.optionsSlot &&
            Array.isArray(slots[el.optionsSlot]) &&
            slots[el.optionsSlot].length > 0 &&
            typeof slots[el.optionsSlot][0] === 'object' &&
            slots[el.optionsSlot][0] !== null
        );

        return (
            <div className={`${styles.message} ${styles.botMessage} ${styles.formContainer}`}>
                {/* --- 👇 [수정] interpolateMessage 사용 --- */}
                <h3>{interpolateMessage(node.data.title, slots)}</h3>
                 {/* --- 👆 [수정 끝] --- */}
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

                    if (el.type === 'grid') {
                        const gridDataFromSlot = el.optionsSlot ? slots[el.optionsSlot] : null;
                        const hasSlotData = Array.isArray(gridDataFromSlot) && gridDataFromSlot.length > 0;

                        if (hasSlotData) {
                            const isDynamicObjectArray = typeof gridDataFromSlot[0] === 'object' && gridDataFromSlot[0] !== null && !Array.isArray(gridDataFromSlot[0]);
                            if (isDynamicObjectArray) {
                                // --- 💡 [수정] displayKeys 파싱 로직 변경 ---
                                // 1. displayKeys가 정의되었는지 확인
                                const hasDisplayKeys = el.displayKeys && el.displayKeys.length > 0;
                                
                                // 2. keyObject 배열 생성 (데이터 호환성 보장)
                                const keyObjects = (hasDisplayKeys ? el.displayKeys : Object.keys(gridDataFromSlot[0] || {}))
                                    .map(k => {
                                        if (typeof k === 'string') return { key: k, label: k }; // 이전 포맷(string 배열) 호환
                                        if (k && typeof k === 'object' && k.key) return k; // 새 포맷({key, label} 객체)
                                        return null;
                                    }).filter(Boolean); // null 값 제거

                                // 3. 'hideNullColumns' 적용
                                const filteredKeyObjects = el.hideNullColumns
                                    ? keyObjects.filter(kObj => gridDataFromSlot.some(obj => obj[kObj.key] !== null && obj[kObj.key] !== undefined && obj[kObj.key] !== ""))
                                    : keyObjects;
                                // --- 💡 [수정 끝] ---

                                return (
                                    <div key={el.id} style={{ overflowX: 'auto' }}>
                                        <table className={styles.formGridTable}>
                                            <thead>
                                                <tr>
                                                    {/* --- 💡 [수정] kObj.label 사용 --- */}
                                                    {filteredKeyObjects.map(kObj => <th key={kObj.key}>{interpolateMessage(kObj.label, slots)}</th>)}
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {gridDataFromSlot.map((dataObject, index) => (
                                                    <tr key={`${el.id}-${index}`} onClick={() => !isCompleted && handleGridRowClick(dataObject)}>
                                                        {/* --- 💡 [수정] kObj.key 사용 --- */}
                                                        {filteredKeyObjects.map(kObj => (
                                                            <td key={kObj.key}>{interpolateMessage(dataObject[kObj.key] || '', slots)}</td>
                                                        ))}
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                );
                            } else {
                                const rows = gridDataFromSlot.length;
                                const columns = gridDataFromSlot[0]?.length || 0;
                                 return (
                                    <table key={el.id} className={styles.formGridTable}>
                                        <tbody>
                                            {[...Array(rows)].map((_, r) => (
                                                <tr key={r}>
                                                    {[...Array(columns)].map((_, c) => {
                                                        const cellValue = gridDataFromSlot[r] ? gridDataFromSlot[r][c] : '';
                                                        {/* --- 👇 [수정] interpolateMessage 사용 --- */}
                                                        return <td key={c}>{interpolateMessage(cellValue || '', slots)}</td>;
                                                        {/* --- 👆 [수정 끝] --- */}
                                                    })}
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                );
                            }
                        } else {
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
                                                    {/* --- 👇 [수정] interpolateMessage 사용 --- */}
                                                    return <td key={c}>{interpolateMessage(cellValue, slots)}</td>;
                                                    {/* --- 👆 [수정 끝] --- */}
                                                })}
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            );
                        }
                    }

                    let initialValue = '';
                    if (el.type === 'input') {
                        const defaultValueConfig = el.defaultValue || '';
                        // --- 👇 [수정] interpolateMessage 사용 ---
                        initialValue = interpolateMessage(defaultValueConfig, slots);
                        // --- 👆 [수정 끝] ---
                        initialValue = formData[el.name] ?? initialValue;
                    } else {
                         initialValue = formData[el.name] ?? el.defaultValue ?? '';
                    }

                    return (
                        <div key={el.id} className={styles.formElement}>
                            {/* --- 👇 [수정] interpolateMessage 사용 --- */}
                            <label className={styles.formLabel}>{interpolateMessage(el.label, slots)}</label>
                             {/* --- 👆 [수정 끝] --- */}
                            {el.type === 'input' && <input type={el.validation?.type === 'email' ? 'email' : 'text'} className={styles.formInput} placeholder={interpolateMessage(el.placeholder, slots)} defaultValue={initialValue} onChange={(e) => handleFormInputChange(el.name, e.target.value)} disabled={isCompleted} />}
                            {el.type === 'date' && <input type="date" className={styles.formInput} value={formData[el.name] || ''} onChange={(e) => handleFormInputChange(el.name, e.target.value)} disabled={isCompleted} {...dateProps} />}
                            {el.type === 'checkbox' && el.options?.map(opt => <div key={opt} className={styles.checkboxOption}><input type="checkbox" id={`${el.id}-${opt}`} value={opt} checked={(formData[el.name] || []).includes(opt)} onChange={(e) => handleFormMultiInputChange(el.name, opt, e.target.checked)} disabled={isCompleted} /><label htmlFor={`${el.id}-${opt}`}>{interpolateMessage(opt, slots)}</label></div>)}
                            {el.type === 'dropbox' && (() => { const options = Array.isArray(slots[el.optionsSlot]) ? slots[el.optionsSlot] : el.options; return (<select className={styles.formInput} value={formData[el.name] || ''} onChange={(e) => handleFormInputChange(el.name, e.target.value)} disabled={isCompleted}><option value="" disabled>Select...</option>{(options || []).map(opt => { const v = typeof opt === 'object' ? opt.value : opt; const l = typeof opt === 'object' ? opt.label : opt; return <option key={v} value={v}>{interpolateMessage(l, slots)}</option>; })}</select>); })()}
                        </div>
                    );
                })}
                {!hasSlotBoundGrid && (
                    <div className={styles.formButtonContainer}>
                        <button className={styles.formDefaultButton} onClick={onFormDefault} disabled={isCompleted}>Default</button>
                        <button className={styles.formSubmitButton} onClick={onFormSubmit} disabled={isCompleted}>Submit</button>
                    </div>
                )}
            </div>
        );
    }

    // --- 👇 [수정] interpolateMessage 사용 ---
    const message = interpolateMessage(node.data.content || node.data.label, slots);
    // --- 👆 [수정 끝] ---
    return (
        <div className={`${styles.message} ${styles.botMessage}`}>
            <div>{message}</div>
            {node.type === 'branch' && node.data.evaluationType === 'BUTTON' && (
                <div className={styles.branchButtonsContainer}>
                    {/* --- 👇 [수정] interpolateMessage 사용 --- */}
                    {node.data.replies?.map(reply => <button key={reply.value} className={styles.branchButton} onClick={() => onOptionClick(reply)} disabled={isCompleted}>{interpolateMessage(reply.display, slots)}</button>)}
                    {/* --- 👆 [수정 끝] --- */}
                </div>
            )}
        </div>
    );
};


const MessageRenderer = ({ item, nodes, onOptionClick, handleFormSubmit, handleFormDefault, formData, handleFormInputChange, handleFormMultiInputChange, handleGridRowClick }) => {
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
                    {/* Streaming content doesn't need interpolation here as it comes directly */}
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
            // Link data handling from useChatFlow (already interpolated)
            if (item.linkData) {
                return (
                     <div className={styles.messageRow}>
                        <img src="/images/avatar.png" alt="Avatar" className={styles.avatar} />
                        <div className={`${styles.message} ${styles.botMessage}`}>
                           <span>Opening link: </span>
                           <a href={item.linkData.url} target="_blank" rel="noopener noreferrer">{item.linkData.display || item.linkData.url}</a>
                        </div>
                    </div>
                );
            }
            return (
                <div className={styles.messageRow}>
                    <img src="/images/avatar.png" alt="Avatar" className={styles.avatar} />
                     {/* --- 👇 [수정] interpolateMessage 사용 (일반 메시지) --- */}
                    {item.message ? <div className={`${styles.message} ${styles.botMessage}`}>{interpolateMessage(item.message, slots)}</div> : <BotMessage node={node} slots={slots} onOptionClick={onOptionClick} onFormSubmit={handleFormSubmit} onFormDefault={handleFormDefault} isCompleted={item.isCompleted} formData={formData} handleFormInputChange={handleFormInputChange} handleFormMultiInputChange={handleFormMultiInputChange} handleGridRowClick={handleGridRowClick} />}
                    {/* --- 👆 [수정 끝] --- */}
                </div>
            );
        case 'user':
            return (
                <div className={`${styles.messageRow} ${styles.userRow}`}>
                    {/* User messages don't need interpolation */}
                    <div className={`${styles.message} ${styles.userMessage}`}>{item.message}</div>
                </div>
            );
        default:
            return null;
    }
};

export default MessageRenderer;