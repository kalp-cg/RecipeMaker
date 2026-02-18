import React, { useState, useEffect } from 'react';
import './Navbar.css';

const Navbar = ({ ollamaStatus, historyCount, onToggleHistory, showHistory }) => {
    const [scrolled, setScrolled] = useState(false);

    useEffect(() => {
        const handleScroll = () => setScrolled(window.scrollY > 40);
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    return (
        <nav className={`navbar ${scrolled ? 'navbar--scrolled' : ''}`}>
            <div className="navbar__inner">
                <div className="navbar__brand">
                    <span className="navbar__logo">🍳</span>
                    <span className="navbar__title">RecipeMaker</span>
                    <span className="navbar__badge">AI</span>
                </div>

                <div className="navbar__actions">
                    {ollamaStatus && (
                        <div className={`navbar__status ${ollamaStatus.ollamaConnected ? 'online' : 'offline'}`}>
                            <span className="navbar__status-dot" />
                            <span className="navbar__status-text">
                                {ollamaStatus.ollamaConnected
                                    ? ollamaStatus.currentModel
                                    : 'Disconnected'}
                            </span>
                        </div>
                    )}

                    <button
                        className={`navbar__history-btn ${showHistory ? 'active' : ''}`}
                        onClick={onToggleHistory}
                        title="Recipe History"
                    >
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <circle cx="12" cy="12" r="10" />
                            <polyline points="12 6 12 12 16 14" />
                        </svg>
                        {historyCount > 0 && (
                            <span className="navbar__history-count">{historyCount}</span>
                        )}
                    </button>
                </div>
            </div>
        </nav>
    );
};

export default Navbar;
