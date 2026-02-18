import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { API_URL } from '../config/api';
import './HeroSection.css';

const TAGLINES = [
    'Turn ingredients into magic.',
    'Your AI-powered sous chef.',
    'Cook smarter, not harder.',
    'From fridge to feast in seconds.',
];

const HeroSection = ({ onGetStarted }) => {
    const [images, setImages] = useState([]);
    const [taglineIdx, setTaglineIdx] = useState(0);
    const [displayedText, setDisplayedText] = useState('');

    // Fetch hero images
    useEffect(() => {
        const fetchImages = async () => {
            try {
                const res = await axios.get(`${API_URL}/random-images?count=6`);
                if (res.data.success) setImages(res.data.images);
            } catch {
                // Use fallback gradients (no images)
            }
        };
        fetchImages();
    }, []);

    // Typewriter effect
    useEffect(() => {
        const target = TAGLINES[taglineIdx];
        let i = 0;
        setDisplayedText('');
        const interval = setInterval(() => {
            i++;
            setDisplayedText(target.slice(0, i));
            if (i >= target.length) {
                clearInterval(interval);
                setTimeout(() => {
                    setTaglineIdx((prev) => (prev + 1) % TAGLINES.length);
                }, 2500);
            }
        }, 60);
        return () => clearInterval(interval);
    }, [taglineIdx]);

    return (
        <section className="hero">
            {/* Floating food images */}
            <div className="hero__images" aria-hidden="true">
                {images.slice(0, 6).map((src, i) => (
                    <div
                        key={i}
                        className={`hero__img-wrapper hero__img-wrapper--${i}`}
                    >
                        <img src={src} alt="" loading="lazy" />
                    </div>
                ))}
            </div>

            <div className="hero__content">
                <p className="hero__label">Powered by Local AI</p>
                <h1 className="hero__title">
                    AI <span className="text-gradient">Recipe Maker</span>
                </h1>
                <p className="hero__tagline">
                    {displayedText}<span className="hero__cursor">|</span>
                </p>
                <p className="hero__desc">
                    Enter your ingredients, choose preferences, and let AI craft a delicious recipe —
                    100% free, 100% private, right on your machine.
                </p>

                <div className="hero__cta-row">
                    <button className="btn btn-primary hero__cta" onClick={onGetStarted}>
                        Start Cooking
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ marginLeft: 8 }}>
                            <line x1="5" y1="12" x2="19" y2="12" /><polyline points="12 5 19 12 12 19" />
                        </svg>
                    </button>
                </div>

                <div className="hero__stats">
                    <div className="hero__stat">
                        <span className="hero__stat-num">∞</span>
                        <span className="hero__stat-label">Recipes</span>
                    </div>
                    <div className="hero__stat-divider" />
                    <div className="hero__stat">
                        <span className="hero__stat-num">0</span>
                        <span className="hero__stat-label">API Cost</span>
                    </div>
                    <div className="hero__stat-divider" />
                    <div className="hero__stat">
                        <span className="hero__stat-num">100%</span>
                        <span className="hero__stat-label">Private</span>
                    </div>
                </div>
            </div>
        </section>
    );
};

export default HeroSection;
