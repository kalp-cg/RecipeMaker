import React from 'react';
import './RecipeHistory.css';

const RecipeHistory = ({ history, onSelect, onDelete, onClose }) => {
    return (
        <div className="history-panel">
            <div className="history-panel__header">
                <h3>Recipe History</h3>
                <button className="history-panel__close" onClick={onClose}>×</button>
            </div>

            {history.length === 0 ? (
                <div className="history-panel__empty">
                    <span className="history-panel__empty-icon">📜</span>
                    <p>No recipes yet.</p>
                    <p className="text-muted">Generated recipes will appear here.</p>
                </div>
            ) : (
                <div className="history-panel__list">
                    {history.map((item, index) => (
                        <div
                            key={item.id || index}
                            className="history-card"
                            onClick={() => onSelect(item)}
                        >
                            <div className="history-card__img">
                                {item.recipe.imageUrl ? (
                                    <img src={item.recipe.imageUrl} alt={item.recipe.name} loading="lazy" />
                                ) : (
                                    <div className="history-card__placeholder">🍽️</div>
                                )}
                            </div>
                            <div className="history-card__info">
                                <h4 className="history-card__name">{item.recipe.name || 'Untitled Recipe'}</h4>
                                <p className="history-card__meta">
                                    {item.recipe.cookingTime && <span>⏱ {item.recipe.cookingTime}</span>}
                                    {item.recipe.servings && <span>🍽 {item.recipe.servings}</span>}
                                </p>
                                <p className="history-card__date">{new Date(item.createdAt).toLocaleDateString()}</p>
                            </div>
                            <button
                                className="history-card__delete"
                                onClick={(e) => { e.stopPropagation(); onDelete(item.id || index); }}
                                title="Delete"
                            >
                                🗑
                            </button>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default RecipeHistory;
