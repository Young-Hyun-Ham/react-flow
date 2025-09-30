import React, { useRef, useEffect } from 'react';
import MessageRenderer from './MessageRenderer';
import styles from '../../ChatbotSimulator.module.css';

const MessageHistory = ({ history, nodes, onOptionClick, handleFormSubmit, handleFormDefault, formData, handleFormInputChange, handleFormMultiInputChange }) => {
    const historyRef = useRef(null);

    useEffect(() => {
        if (historyRef.current) {
            historyRef.current.scrollTop = historyRef.current.scrollHeight;
        }
    }, [history]);

    return (
        <div className={styles.history} ref={historyRef}>
            {history.map((item, index) => (
                <MessageRenderer
                    key={item.id || index}
                    item={item}
                    nodes={nodes}
                    onOptionClick={onOptionClick}
                    handleFormSubmit={handleFormSubmit}
                    handleFormDefault={handleFormDefault}
                    formData={formData}
                    handleFormInputChange={handleFormInputChange}
                    handleFormMultiInputChange={handleFormMultiInputChange}
                />
            ))}
        </div>
    );
};

export default MessageHistory;