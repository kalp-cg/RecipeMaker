import React, { useState } from 'react';
import './RecipeDisplay.css';

const TABS = ['ingredients', 'instructions', 'tips'];

// Load ratings from localStorage
function loadRatings() {
    try { return JSON.parse(localStorage.getItem('recipeRatings') || '{}'); }
    catch { return {}; }
}
function saveRatingToStorage(key, val) {
    const data = loadRatings();
    data[key] = val;
    localStorage.setItem('recipeRatings', JSON.stringify(data));
}

const RecipeDisplay = ({ recipe, onSave }) => {
    const [activeTab, setActiveTab] = useState('instructions');
    const [copyFeedback, setCopyFeedback] = useState(false);
    const ratingKey = (recipe.name || 'recipe').replace(/\s+/g, '_').toLowerCase();
    const [rating, setRating] = useState(() => loadRatings()[ratingKey] || null);

    const buildRecipeText = () => {
        let text = `${recipe.name || 'Recipe'}\n`;
        if (recipe.cookingTime) text += `Time: ${recipe.cookingTime}\n`;
        if (recipe.servings) text += `Servings: ${recipe.servings}\n`;
        if (recipe.difficulty) text += `Difficulty: ${recipe.difficulty}\n`;
        text += `\nIngredients:\n`;
        recipe.ingredients.forEach(ing => { text += `- ${ing}\n`; });
        text += `\nInstructions:\n`;
        recipe.instructions.forEach((step, i) => { text += `${i + 1}. ${step}\n`; });
        if (recipe.tips && recipe.tips.length > 0) {
            text += `\nChef's Tips:\n`;
            recipe.tips.forEach(tip => { text += `- ${tip}\n`; });
        }
        return text;
    };

    const handleCopy = () => {
        navigator.clipboard.writeText(buildRecipeText());
        setCopyFeedback(true);
        setTimeout(() => setCopyFeedback(false), 2000);
    };

    const handlePrint = () => window.print();

    const handleShare = async () => {
        if (navigator.share) {
            try {
                await navigator.share({ title: recipe.name, text: buildRecipeText() });
            } catch { /* cancelled */ }
        } else {
            handleCopy();
        }
    };

    const handleExport = () => {
        const text = buildRecipeText();
        const blob = new Blob([text], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${(recipe.name || 'recipe').replace(/\s+/g, '_')}.txt`;
        a.click();
        URL.revokeObjectURL(url);
    };

    const handleRate = (val) => {
        setRating(val);
        saveRatingToStorage(ratingKey, val);
    };

    return (
        <div className="recipe-display fade-in">
            {/* Hero Image */}
            {recipe.imageUrl && (
                <div className="recipe-display__hero">
                    <img src={recipe.imageUrl} alt={recipe.name} />
                    <div className="recipe-display__hero-overlay" />
                </div>
            )}

            {/* Header */}
            <div className="recipe-display__header">
                <h2 className="recipe-display__name">{recipe.name || 'Your Recipe'}</h2>

                <div className="recipe-display__meta">
                    {recipe.cookingTime && (
                        <span className="recipe-display__badge">
                            <span>⏱</span> {recipe.cookingTime}
                        </span>
                    )}
                    {recipe.servings && (
                        <span className="recipe-display__badge">
                            <span>🍽</span> {recipe.servings}
                        </span>
                    )}
                    {recipe.difficulty && (
                        <span className="recipe-display__badge">
                            <span>📊</span> {recipe.difficulty}
                        </span>
                    )}
                </div>

                {/* Rating */}
                <div className="recipe-display__rating">
                    <span className="recipe-display__rating-label">Rate this recipe:</span>
                    <div className="recipe-display__rating-btns">
                        <button
                            className={`recipe-display__rate-btn ${rating === 'up' ? 'active-up' : ''}`}
                            onClick={() => handleRate('up')}
                            title="Thumbs up"
                        >
                            👍
                        </button>
                        <button
                            className={`recipe-display__rate-btn ${rating === 'down' ? 'active-down' : ''}`}
                            onClick={() => handleRate('down')}
                            title="Thumbs down"
                        >
                            👎
                        </button>
                    </div>
                    {rating && (
                        <span className="recipe-display__rating-feedback">
                            {rating === 'up' ? 'Glad you liked it!' : 'We\'ll do better next time!'}
                        </span>
                    )}
                </div>
            </div>

            {/* Tab Bar */}
            <div className="recipe-display__tabs">
                {TABS.map(tab => (
                    <button
                        key={tab}
                        className={`recipe-display__tab ${activeTab === tab ? 'active' : ''}`}
                        onClick={() => setActiveTab(tab)}
                    >
                        {tab === 'ingredients' && '🥘'}
                        {tab === 'instructions' && '📝'}
                        {tab === 'tips' && '💡'}
                        <span>{tab.charAt(0).toUpperCase() + tab.slice(1)}</span>
                        {tab === 'ingredients' && recipe.ingredients.length > 0 && (
                            <span className="recipe-display__tab-count">{recipe.ingredients.length}</span>
                        )}
                        {tab === 'instructions' && recipe.instructions.length > 0 && (
                            <span className="recipe-display__tab-count">{recipe.instructions.length}</span>
                        )}
                    </button>
                ))}
            </div>

            {/* Tab Content */}
            <div className="recipe-display__content">
                {activeTab === 'ingredients' && (
                    <ul className="recipe-display__ingredients">
                        {recipe.ingredients.length > 0 ? recipe.ingredients.map((ing, i) => (
                            <li key={i} className="recipe-display__ingredient" style={{ animationDelay: `${i * 0.06}s` }}>
                                <span className="recipe-display__ingredient-dot" />
                                {ing}
                            </li>
                        )) : <p className="text-muted">No ingredients parsed. Check the raw recipe text.</p>}
                    </ul>
                )}

                {activeTab === 'instructions' && (
                    <ol className="recipe-display__instructions">
                        {recipe.instructions.length > 0 ? recipe.instructions.map((step, i) => (
                            <li key={i} className="recipe-display__step" style={{ animationDelay: `${i * 0.08}s` }}>
                                <span className="recipe-display__step-num">{i + 1}</span>
                                <span className="recipe-display__step-text">{step}</span>
                            </li>
                        )) : <p className="text-muted">No instructions parsed. Check the raw recipe text.</p>}
                    </ol>
                )}

                {activeTab === 'tips' && (
                    <div className="recipe-display__tips">
                        {recipe.tips && recipe.tips.length > 0 ? recipe.tips.map((tip, i) => (
                            <div key={i} className="recipe-display__tip" style={{ animationDelay: `${i * 0.08}s` }}>
                                <span>💡</span>
                                <span>{tip}</span>
                            </div>
                        )) : <p className="text-muted">No chef tips for this recipe.</p>}
                    </div>
                )}
            </div>

            {/* Action Bar */}
            <div className="recipe-display__actions">
                <button className="recipe-display__action-btn" onClick={handleCopy} title="Copy">
                    {copyFeedback ? '✅ Copied!' : '📋 Copy'}
                </button>
                <button className="recipe-display__action-btn" onClick={handleExport} title="Export as text file">
                    📄 Export
                </button>
                <button className="recipe-display__action-btn" onClick={handlePrint} title="Print">
                    🖨 Print
                </button>
                <button className="recipe-display__action-btn" onClick={handleShare} title="Share">
                    🔗 Share
                </button>
                {onSave && (
                    <button className="recipe-display__action-btn recipe-display__action-btn--primary" onClick={onSave} title="Save to history">
                        💾 Save
                    </button>
                )}
            </div>
        </div>
    );
};

export default RecipeDisplay;
