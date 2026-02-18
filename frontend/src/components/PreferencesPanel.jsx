import React from 'react';
import './PreferencesPanel.css';

const CUISINES = [
    { value: 'any', label: 'Any', icon: '🌍' },
    { value: 'italian', label: 'Italian', icon: '🇮🇹' },
    { value: 'mexican', label: 'Mexican', icon: '🇲🇽' },
    { value: 'indian', label: 'Indian', icon: '🇮🇳' },
    { value: 'chinese', label: 'Chinese', icon: '🇨🇳' },
    { value: 'japanese', label: 'Japanese', icon: '🇯🇵' },
    { value: 'thai', label: 'Thai', icon: '🇹🇭' },
    { value: 'french', label: 'French', icon: '🇫🇷' },
    { value: 'american', label: 'American', icon: '🇺🇸' },
];

const DIFFICULTIES = [
    { value: 'easy', label: 'Easy', icon: '⭐' },
    { value: 'medium', label: 'Medium', icon: '⭐⭐' },
    { value: 'hard', label: 'Hard', icon: '⭐⭐⭐' },
];

const TIMES = [
    { value: 'any', label: 'Any', icon: '⏱' },
    { value: '15 minutes', label: '15 min', icon: '⚡' },
    { value: '30 minutes', label: '30 min', icon: '🕐' },
    { value: '1 hour', label: '1 hour', icon: '🕑' },
    { value: '2+ hours', label: '2+ hrs', icon: '🍲' },
];

const DIETARY = [
    { value: 'vegetarian', label: 'Vegetarian', icon: '🥬' },
    { value: 'vegan', label: 'Vegan', icon: '🌱' },
    { value: 'gluten-free', label: 'Gluten-Free', icon: '🌾' },
    { value: 'keto', label: 'Keto', icon: '🥓' },
    { value: 'dairy-free', label: 'Dairy-Free', icon: '🥛' },
    { value: 'low-carb', label: 'Low-Carb', icon: '🥗' },
];

const LANGUAGES = [
    { value: 'english', label: 'English', native: 'English', icon: '🇬🇧' },
    { value: 'gujarati', label: 'Gujarati', native: 'ગુજરાતી', icon: '🇮🇳' },
    { value: 'hindi', label: 'Hindi', native: 'हिन्दी', icon: '🇮🇳' },
    { value: 'marathi', label: 'Marathi', native: 'मराठी', icon: '🇮🇳' },
    { value: 'tamil', label: 'Tamil', native: 'தமிழ்', icon: '🇮🇳' },
    { value: 'telugu', label: 'Telugu', native: 'తెలుగు', icon: '🇮🇳' },
    { value: 'bengali', label: 'Bengali', native: 'বাংলা', icon: '🇮🇳' },
    { value: 'punjabi', label: 'Punjabi', native: 'ਪੰਜਾਬੀ', icon: '🇮🇳' },
    { value: 'spanish', label: 'Spanish', native: 'Español', icon: '🇪🇸' },
    { value: 'french', label: 'French', native: 'Français', icon: '🇫🇷' },
];

const PreferencesPanel = ({ preferences, setPreferences }) => {
    const update = (key, val) => setPreferences({ ...preferences, [key]: val });

    const toggleDietary = (val) => {
        const current = preferences.dietary || [];
        if (current.includes(val)) {
            update('dietary', current.filter(d => d !== val));
        } else {
            update('dietary', [...current, val]);
        }
    };

    return (
        <div className="prefs">
            {/* Language — top priority for the user's mom! */}
            <div className="prefs__section">
                <h4 className="prefs__label">🌐 Recipe Language</h4>
                <div className="prefs__options">
                    {LANGUAGES.map(l => (
                        <button
                            key={l.value}
                            className={`prefs__card ${preferences.language === l.value ? 'prefs__card--active' : ''}`}
                            onClick={() => update('language', l.value)}
                        >
                            <span className="prefs__card-icon">{l.icon}</span>
                            <span className="prefs__card-label">{l.native}</span>
                        </button>
                    ))}
                </div>
            </div>

            {/* Cuisine */}
            <div className="prefs__section">
                <h4 className="prefs__label">🍽️ Cuisine</h4>
                <div className="prefs__options">
                    {CUISINES.map(c => (
                        <button
                            key={c.value}
                            className={`prefs__card ${preferences.cuisine === c.value ? 'prefs__card--active' : ''}`}
                            onClick={() => update('cuisine', c.value)}
                        >
                            <span className="prefs__card-icon">{c.icon}</span>
                            <span className="prefs__card-label">{c.label}</span>
                        </button>
                    ))}
                </div>
            </div>

            {/* Difficulty */}
            <div className="prefs__section">
                <h4 className="prefs__label">📊 Difficulty</h4>
                <div className="prefs__options">
                    {DIFFICULTIES.map(d => (
                        <button
                            key={d.value}
                            className={`prefs__card ${preferences.difficulty === d.value ? 'prefs__card--active' : ''}`}
                            onClick={() => update('difficulty', d.value)}
                        >
                            <span className="prefs__card-icon">{d.icon}</span>
                            <span className="prefs__card-label">{d.label}</span>
                        </button>
                    ))}
                </div>
            </div>

            {/* Cooking Time */}
            <div className="prefs__section">
                <h4 className="prefs__label">⏰ Cooking Time</h4>
                <div className="prefs__options">
                    {TIMES.map(t => (
                        <button
                            key={t.value}
                            className={`prefs__card ${preferences.cookingTime === t.value ? 'prefs__card--active' : ''}`}
                            onClick={() => update('cookingTime', t.value)}
                        >
                            <span className="prefs__card-icon">{t.icon}</span>
                            <span className="prefs__card-label">{t.label}</span>
                        </button>
                    ))}
                </div>
            </div>

            {/* Dietary */}
            <div className="prefs__section">
                <h4 className="prefs__label">🥗 Dietary (optional)</h4>
                <div className="prefs__options">
                    {DIETARY.map(d => (
                        <button
                            key={d.value}
                            className={`prefs__card ${(preferences.dietary || []).includes(d.value) ? 'prefs__card--active' : ''}`}
                            onClick={() => toggleDietary(d.value)}
                        >
                            <span className="prefs__card-icon">{d.icon}</span>
                            <span className="prefs__card-label">{d.label}</span>
                        </button>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default PreferencesPanel;
