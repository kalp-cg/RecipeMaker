import React, { useState, useEffect } from 'react';
import './LoadingAnimation.css';

const TIPS = [
    '🧈 Room temperature butter blends more smoothly into batters.',
    '🧂 Season as you go, not just at the end.',
    '🔪 A sharp knife is safer than a dull one.',
    '🍳 Let your pan fully preheat before adding oil.',
    '🌿 Add fresh herbs at the end for maximum flavor.',
    '🍋 A squeeze of lemon brightens almost any dish.',
    '🥩 Let meat rest after cooking to retain juices.',
    '🧄 Smash garlic before mincing for more flavor.',
    '🫕 Deglaze your pan with wine or stock for instant sauce.',
    '🥚 Use the shell to fish out eggshell fragments.'
];

const LoadingAnimation = () => {
    const [tipIndex, setTipIndex] = useState(0);
    const [elapsed, setElapsed] = useState(0);

    useEffect(() => {
        const tipTimer = setInterval(() => {
            setTipIndex(prev => (prev + 1) % TIPS.length);
        }, 4000);
        return () => clearInterval(tipTimer);
    }, []);

    useEffect(() => {
        const timer = setInterval(() => setElapsed(prev => prev + 1), 1000);
        return () => clearInterval(timer);
    }, []);

    return (
        <div className="loading">
            <div className="loading__pot">
                <div className="loading__pot-body">🍲</div>
                <div className="loading__steam">
                    <span /><span /><span />
                </div>
            </div>

            <h3 className="loading__title">Cooking up your recipe...</h3>

            <div className="loading__progress-wrap">
                <div className="loading__progress">
                    <div className="loading__progress-bar" />
                </div>
                <span className="loading__time">{elapsed}s</span>
            </div>

            <div className="loading__tip">
                <p className="loading__tip-text" key={tipIndex}>{TIPS[tipIndex]}</p>
            </div>

            <p className="loading__disclaimer">This may take 15–60 seconds depending on your hardware.</p>
        </div>
    );
};

export default LoadingAnimation;
