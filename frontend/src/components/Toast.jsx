import React, { useEffect, useState } from 'react';
import './Toast.css';

const Toast = ({ toasts, removeToast }) => {
    return (
        <div className="toast-container">
            {toasts.map((t) => (
                <ToastItem key={t.id} toast={t} onClose={() => removeToast(t.id)} />
            ))}
        </div>
    );
};

const ToastItem = ({ toast, onClose }) => {
    const [exiting, setExiting] = useState(false);

    useEffect(() => {
        const timer = setTimeout(() => {
            setExiting(true);
            setTimeout(onClose, 350);
        }, toast.duration || 4000);
        return () => clearTimeout(timer);
    }, []);

    const icons = { success: '✅', error: '❌', info: 'ℹ️' };

    return (
        <div className={`toast toast--${toast.type} ${exiting ? 'toast--exit' : ''}`}>
            <span className="toast__icon">{icons[toast.type] || icons.info}</span>
            <span className="toast__msg">{toast.message}</span>
            <button className="toast__close" onClick={() => { setExiting(true); setTimeout(onClose, 350); }}>×</button>
        </div>
    );
};

export default Toast;
