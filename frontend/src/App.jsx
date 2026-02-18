import React, { useState, useEffect, useCallback, useRef } from 'react';
import axios from 'axios';
import { API_URL } from './config/api';
import ErrorBoundary from './components/ErrorBoundary';
import Navbar from './components/Navbar';
import HeroSection from './components/HeroSection';
import IngredientInput from './components/IngredientInput';
import PreferencesPanel from './components/PreferencesPanel';
import RecipeDisplay from './components/RecipeDisplay';
import LoadingAnimation from './components/LoadingAnimation';
import RecipeHistory from './components/RecipeHistory';
import Toast from './components/Toast';
import { recordUsage } from './utils/usageTracker';
import './App.css';

// ─── localStorage helpers ───
function loadHistory() {
    try { return JSON.parse(localStorage.getItem('recipeHistory') || '[]'); }
    catch { return []; }
}
function saveHistory(h) {
    try { localStorage.setItem('recipeHistory', JSON.stringify(h)); }
    catch (e) { console.warn('[App] localStorage write failed:', e.message); }
}

let toastId = 0;

function App() {
    // ── State ──
    const [page, setPage] = useState('hero'); // hero | create | result
    const [ingredients, setIngredients] = useState([]);
    const [preferences, setPreferences] = useState({
        cuisine: 'any', difficulty: 'medium', cookingTime: 'any', dietary: [], language: 'english',
    });
    const [recipe, setRecipe] = useState(null);
    const [loading, setLoading] = useState(false);
    const [ollamaStatus, setOllamaStatus] = useState(null);
    const [history, setHistory] = useState(loadHistory);
    const [showHistory, setShowHistory] = useState(false);
    const [toasts, setToasts] = useState([]);
    const mainRef = useRef(null);
    const abortRef = useRef(null); // AbortController for in-flight requests

    // ── Toast system ──
    const addToast = useCallback((message, type = 'info', duration = 4000) => {
        const id = ++toastId;
        setToasts(prev => [...prev, { id, message, type, duration }]);
    }, []);

    const removeToast = useCallback((id) => {
        setToasts(prev => prev.filter(t => t.id !== id));
    }, []);

    // ── Health check on mount ──
    useEffect(() => {
        const controller = new AbortController();
        axios.get(`${API_URL}/health`, { signal: controller.signal })
            .then(res => setOllamaStatus(res.data))
            .catch(err => {
                if (!axios.isCancel(err)) {
                    setOllamaStatus({ ollamaConnected: false });
                }
            });
        return () => controller.abort();
    }, []);

    // ── Generate recipe (with AbortController) ──
    const generateRecipe = async () => {
        if (ingredients.length === 0) {
            addToast('Please add at least one ingredient.', 'error');
            return;
        }

        // Cancel any in-flight request
        if (abortRef.current) abortRef.current.abort();
        abortRef.current = new AbortController();

        setLoading(true);
        setRecipe(null);
        setPage('create');

        try {
            const response = await axios.post(
                `${API_URL}/generate-recipe`,
                { ingredients, preferences },
                { signal: abortRef.current.signal }
            );

            if (response.data.success) {
                setRecipe(response.data.recipe);
                setPage('result');
                addToast('Recipe generated successfully!', 'success');
                recordUsage(ingredients);
            } else {
                addToast(response.data.error || 'Failed to generate recipe.', 'error');
                setPage('create');
            }
        } catch (err) {
            if (axios.isCancel(err)) {
                console.log('[App] Request cancelled.');
                return;
            }
            console.error('[App] Generation error:', err);

            // Show user-friendly message based on HTTP status
            const status = err.response?.status;
            let message = err.response?.data?.error || 'Failed to connect to the backend.';
            if (status === 429) message = 'Too many requests — please wait a minute.';
            else if (status === 503) message = 'Ollama is not running. Start it with `ollama serve`.';
            else if (status === 504) message = 'Request timed out. The model may be loading — try again.';
            else if (!err.response) message = 'Cannot reach the server. Is the backend running?';

            addToast(message, 'error', 6000);
            setPage('create');
        } finally {
            setLoading(false);
            abortRef.current = null;
        }
    };

    // ── Cancel generation (exposed to LoadingAnimation) ──
    const cancelGeneration = useCallback(() => {
        if (abortRef.current) {
            abortRef.current.abort();
            setLoading(false);
            setPage('create');
            addToast('Recipe generation cancelled.', 'info');
        }
    }, [addToast]);

    // ── History management ──
    const saveToHistory = () => {
        if (!recipe) return;
        // Prevent duplicate saves
        if (history.some(h => h.recipe.name === recipe.name && h.recipe.rawText === recipe.rawText)) {
            addToast('This recipe is already saved.', 'info');
            return;
        }

        const entry = {
            id: Date.now(),
            recipe: { ...recipe },
            ingredients: [...ingredients],
            createdAt: new Date().toISOString(),
        };
        const updated = [entry, ...history].slice(0, 50);
        setHistory(updated);
        saveHistory(updated);
        addToast('Recipe saved to history!', 'success');
    };

    const deleteHistory = (id) => {
        const updated = history.filter(h => h.id !== id);
        setHistory(updated);
        saveHistory(updated);
        addToast('Recipe removed.', 'info');
    };

    const viewHistoryRecipe = (item) => {
        setRecipe(item.recipe);
        setIngredients(item.ingredients || []);
        setPage('result');
        setShowHistory(false);
    };

    // ── Navigation ──
    const resetForm = () => {
        if (abortRef.current) abortRef.current.abort();
        setIngredients([]);
        setPreferences({ cuisine: 'any', difficulty: 'medium', cookingTime: 'any', dietary: [] });
        setRecipe(null);
        setLoading(false);
        setPage('create');
    };

    const goHome = () => {
        if (abortRef.current) abortRef.current.abort();
        setRecipe(null);
        setLoading(false);
        setPage('hero');
    };

    const scrollToMain = () => {
        setPage('create');
        setTimeout(() => mainRef.current?.scrollIntoView({ behavior: 'smooth' }), 50);
    };

    return (
        <ErrorBoundary>
            <div className="app">
                <Navbar
                    ollamaStatus={ollamaStatus}
                    historyCount={history.length}
                    onToggleHistory={() => setShowHistory(prev => !prev)}
                    showHistory={showHistory}
                />

                <Toast toasts={toasts} removeToast={removeToast} />

                {showHistory && (
                    <>
                        <div className="overlay" onClick={() => setShowHistory(false)} />
                        <RecipeHistory
                            history={history}
                            onSelect={viewHistoryRecipe}
                            onDelete={deleteHistory}
                            onClose={() => setShowHistory(false)}
                        />
                    </>
                )}

                {page === 'hero' && (
                    <HeroSection onGetStarted={scrollToMain} />
                )}

                {page === 'create' && (
                    <main className="app-main container" ref={mainRef}>
                        {loading ? (
                            <div className="fade-in">
                                <LoadingAnimation />
                                <div className="cancel-row">
                                    <button className="btn btn-secondary" onClick={cancelGeneration}>
                                        Cancel
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <div className="create-section fade-in">
                                <div className="create-section__header">
                                    <button className="back-btn" onClick={goHome} aria-label="Go back to home">
                                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                            <line x1="19" y1="12" x2="5" y2="12" /><polyline points="12 19 5 12 12 5" />
                                        </svg>
                                    </button>
                                    <h2 className="create-section__title">Create Your Recipe</h2>
                                </div>

                                <div className="glass-card create-card">
                                    <IngredientInput ingredients={ingredients} setIngredients={setIngredients} />
                                    <PreferencesPanel preferences={preferences} setPreferences={setPreferences} />

                                    <div className="create-card__actions">
                                        <button
                                            className="btn btn-primary generate-btn"
                                            onClick={generateRecipe}
                                            disabled={loading || ingredients.length === 0}
                                        >
                                            ✨ Generate Recipe
                                        </button>
                                        {ingredients.length > 0 && (
                                            <button className="btn btn-secondary" onClick={resetForm}>
                                                Clear All
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </div>
                        )}
                    </main>
                )}

                {page === 'result' && recipe && (
                    <main className="app-main container" ref={mainRef}>
                        <div className="result-section fade-in">
                            <RecipeDisplay recipe={recipe} onSave={saveToHistory} />
                            <div className="result-section__actions">
                                <button className="btn btn-primary" onClick={resetForm}>
                                    🔄 Create Another
                                </button>
                                <button className="btn btn-secondary" onClick={goHome}>
                                    🏠 Home
                                </button>
                            </div>
                        </div>
                    </main>
                )}

                <footer className="app-footer">
                    <div className="container">
                        <p>
                            Built with ❤️ using <strong>Ollama</strong> — All processing happens locally on your machine
                        </p>
                    </div>
                </footer>
            </div>
        </ErrorBoundary>
    );
}

export default App;
