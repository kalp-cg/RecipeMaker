import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { INGREDIENT_DB, CATEGORIES } from '../data/ingredients';
import { getFrequentlyUsed, getRecentlyUsed, getUsageCount } from '../utils/usageTracker';
import './IngredientInput.css';

const IngredientInput = ({ ingredients, setIngredients }) => {
    const [input, setInput] = useState('');
    const [showDropdown, setShowDropdown] = useState(false);
    const [highlightIdx, setHighlightIdx] = useState(-1);
    const inputRef = useRef(null);
    const dropdownRef = useRef(null);

    // Frequently & recently used
    const frequentlyUsed = useMemo(() => getFrequentlyUsed(10), [ingredients.length]);
    const recentlyUsed = useMemo(() => getRecentlyUsed(6), [ingredients.length]);

    // Filter suggestions based on input
    const suggestions = useMemo(() => {
        const q = input.trim().toLowerCase();
        if (!q) return [];

        const added = new Set(ingredients.map(i => i.toLowerCase()));

        // Score each ingredient
        const scored = INGREDIENT_DB
            .filter(item => !added.has(item.name))
            .map(item => {
                let score = 0;
                const name = item.name.toLowerCase();

                // Exact start match → highest
                if (name.startsWith(q)) score += 100;
                // Word starts with query
                else if (name.split(' ').some(w => w.startsWith(q))) score += 60;
                // Contains query
                else if (name.includes(q)) score += 30;
                else return null; // no match

                // Boost by usage frequency
                const usage = getUsageCount(item.name);
                score += Math.min(usage * 5, 40);

                return { ...item, score, usage };
            })
            .filter(Boolean)
            .sort((a, b) => b.score - a.score)
            .slice(0, 12);

        return scored;
    }, [input, ingredients]);

    // Close dropdown on outside click
    useEffect(() => {
        const handler = (e) => {
            if (
                dropdownRef.current && !dropdownRef.current.contains(e.target) &&
                inputRef.current && !inputRef.current.contains(e.target)
            ) {
                setShowDropdown(false);
            }
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, []);

    // Reset highlight when suggestions change
    useEffect(() => { setHighlightIdx(-1); }, [suggestions]);

    const addIngredient = useCallback((value) => {
        const v = (value || input).trim().toLowerCase();
        if (v && !ingredients.includes(v)) {
            setIngredients(prev => [...prev, v]);
        }
        setInput('');
        setShowDropdown(false);
        inputRef.current?.focus();
    }, [input, ingredients, setIngredients]);

    const removeIngredient = (idx) => {
        setIngredients(ingredients.filter((_, i) => i !== idx));
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Escape') {
            setShowDropdown(false);
            return;
        }

        if (showDropdown && suggestions.length > 0) {
            if (e.key === 'ArrowDown') {
                e.preventDefault();
                setHighlightIdx(prev => (prev + 1) % suggestions.length);
                return;
            }
            if (e.key === 'ArrowUp') {
                e.preventDefault();
                setHighlightIdx(prev => (prev <= 0 ? suggestions.length - 1 : prev - 1));
                return;
            }
            if (e.key === 'Enter') {
                e.preventDefault();
                if (highlightIdx >= 0) {
                    addIngredient(suggestions[highlightIdx].name);
                } else if (input.trim()) {
                    addIngredient();
                }
                return;
            }
        } else if (e.key === 'Enter' && input.trim()) {
            e.preventDefault();
            addIngredient();
        }
    };

    const handleInputChange = (e) => {
        setInput(e.target.value);
        setShowDropdown(e.target.value.trim().length > 0);
    };

    // Scroll highlighted item into view
    useEffect(() => {
        if (highlightIdx >= 0 && dropdownRef.current) {
            const el = dropdownRef.current.children[highlightIdx];
            if (el) el.scrollIntoView({ block: 'nearest' });
        }
    }, [highlightIdx]);

    // Quick add chips: show frequent first, then popular defaults
    const quickAddItems = useMemo(() => {
        const added = new Set(ingredients.map(i => i.toLowerCase()));
        const items = [];

        // Frequently used first
        for (const f of frequentlyUsed) {
            if (!added.has(f.name) && items.length < 14) {
                items.push({ name: f.name, count: f.count, isFrequent: true });
            }
        }

        // Fill with popular defaults
        const defaults = ['chicken breast', 'rice', 'pasta', 'tomato', 'onion', 'garlic', 'eggs', 'cheese', 'potato', 'bell pepper', 'butter', 'lemon', 'spinach', 'mushroom'];
        for (const d of defaults) {
            if (!added.has(d) && !items.find(i => i.name === d) && items.length < 14) {
                items.push({ name: d, count: 0, isFrequent: false });
            }
        }

        return items;
    }, [ingredients, frequentlyUsed]);

    return (
        <div className="ingredient-input">
            {/* Header */}
            <div className="ingredient-input__header">
                <h3>
                    <span className="ingredient-input__icon">🥘</span>
                    What's in your kitchen?
                </h3>
                {ingredients.length > 0 && (
                    <span className="ingredient-input__count">{ingredients.length}</span>
                )}
            </div>

            {/* Input with autocomplete */}
            <div className="ingredient-input__field">
                <div className="ingredient-input__input-wrap">
                    <input
                        ref={inputRef}
                        type="text"
                        className="input"
                        placeholder="Type an ingredient... (try 'ch', 'to', 'ri')"
                        value={input}
                        onChange={handleInputChange}
                        onKeyDown={handleKeyDown}
                        onFocus={() => input.trim() && setShowDropdown(true)}
                        autoComplete="off"
                    />

                    {/* Autocomplete dropdown */}
                    {showDropdown && suggestions.length > 0 && (
                        <div className="autocomplete" ref={dropdownRef}>
                            {suggestions.map((item, i) => (
                                <button
                                    key={item.name}
                                    className={`autocomplete__item ${i === highlightIdx ? 'autocomplete__item--active' : ''}`}
                                    onClick={() => addIngredient(item.name)}
                                    onMouseEnter={() => setHighlightIdx(i)}
                                >
                                    <span className="autocomplete__cat-icon">{CATEGORIES[item.category]?.icon || '📦'}</span>
                                    <span className="autocomplete__name">
                                        {highlightMatch(item.name, input)}
                                    </span>
                                    <span className="autocomplete__cat">{CATEGORIES[item.category]?.label}</span>
                                    {item.usage > 0 && (
                                        <span className="autocomplete__freq" title="Times used">
                                            ×{item.usage}
                                        </span>
                                    )}
                                </button>
                            ))}
                        </div>
                    )}
                </div>

                <button
                    className="ingredient-input__add-btn"
                    onClick={() => addIngredient()}
                    disabled={!input.trim()}
                >
                    Add
                </button>
            </div>

            {/* Quick add section */}
            <div className="ingredient-input__quick">
                {frequentlyUsed.length > 0 && (
                    <span className="ingredient-input__quick-label">⭐ Your favorites & suggestions:</span>
                )}
                {frequentlyUsed.length === 0 && (
                    <span className="ingredient-input__quick-label">Quick add:</span>
                )}
                <div className="ingredient-input__chips">
                    {quickAddItems.map(item => (
                        <button
                            key={item.name}
                            className={`chip ${item.isFrequent ? 'chip--frequent' : ''}`}
                            onClick={() => addIngredient(item.name)}
                            title={item.count > 0 ? `Used ${item.count} time${item.count > 1 ? 's' : ''}` : ''}
                        >
                            + {item.name}
                            {item.count > 0 && <span className="chip__count">{item.count}</span>}
                        </button>
                    ))}
                </div>
            </div>

            {/* Recently used */}
            {recentlyUsed.length > 0 && (
                <div className="ingredient-input__recent">
                    <span className="ingredient-input__quick-label">🕐 Recently used:</span>
                    <div className="ingredient-input__chips">
                        {recentlyUsed
                            .filter(r => !ingredients.includes(r.name) && !quickAddItems.find(q => q.name === r.name))
                            .slice(0, 6)
                            .map(item => (
                                <button
                                    key={item.name}
                                    className="chip chip--recent"
                                    onClick={() => addIngredient(item.name)}
                                >
                                    + {item.name}
                                </button>
                            ))}
                    </div>
                </div>
            )}

            {/* Added tags */}
            {ingredients.length > 0 && (
                <div className="ingredient-input__tags">
                    {ingredients.map((ing, i) => (
                        <span key={i} className="tag" style={{ animationDelay: `${i * 0.04}s` }}>
                            {ing}
                            <button className="tag__remove" onClick={() => removeIngredient(i)}>×</button>
                        </span>
                    ))}
                </div>
            )}

            {/* Keyboard hint */}
            <div className="ingredient-input__hint">
                <kbd>↑</kbd><kbd>↓</kbd> navigate &nbsp; <kbd>Enter</kbd> select &nbsp; <kbd>Esc</kbd> close
            </div>
        </div>
    );
};

/** Bold the matching portion of text */
function highlightMatch(text, query) {
    const q = query.toLowerCase();
    const idx = text.toLowerCase().indexOf(q);
    if (idx === -1) return text;
    return (
        <>
            {text.slice(0, idx)}
            <strong>{text.slice(idx, idx + q.length)}</strong>
            {text.slice(idx + q.length)}
        </>
    );
}

export default IngredientInput;
