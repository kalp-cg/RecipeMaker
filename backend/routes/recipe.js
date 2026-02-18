const express = require('express');
const router = express.Router();
const ollamaService = require('../services/ollamaService');
const imageService = require('../services/imageService');

// ─── Constants ───
const MAX_INGREDIENTS = 20;
const MAX_INGREDIENT_LENGTH = 60;
const ALLOWED_CUISINES = ['any', 'italian', 'mexican', 'indian', 'chinese', 'japanese', 'thai', 'french', 'american'];
const ALLOWED_DIFFICULTIES = ['easy', 'medium', 'hard'];
const { LANGUAGES } = require('../utils/promptTemplates');
const ALLOWED_LANGUAGES = Object.keys(LANGUAGES);

/**
 * Sanitize a single ingredient string.
 * Strips anything that isn't a letter, number, space, or hyphen.
 */
function sanitizeIngredient(raw) {
    if (typeof raw !== 'string') return '';
    return raw
        .replace(/[^a-zA-Z0-9\s\-']/g, '')
        .trim()
        .toLowerCase()
        .slice(0, MAX_INGREDIENT_LENGTH);
}

/**
 * Validate and sanitize preferences object.
 */
function sanitizePreferences(raw = {}) {
    return {
        cuisine: ALLOWED_CUISINES.includes(raw.cuisine) ? raw.cuisine : 'any',
        difficulty: ALLOWED_DIFFICULTIES.includes(raw.difficulty) ? raw.difficulty : 'medium',
        cookingTime: typeof raw.cookingTime === 'string' ? raw.cookingTime.slice(0, 30) : 'any',
        dietary: Array.isArray(raw.dietary)
            ? raw.dietary.filter(d => typeof d === 'string').map(d => d.slice(0, 30)).slice(0, 5)
            : [],
        language: ALLOWED_LANGUAGES.includes(raw.language) ? raw.language : 'english',
    };
}

/**
 * POST /api/generate-recipe
 * Validate → sanitize → generate → attach image → respond
 */
router.post('/generate-recipe', async (req, res) => {
    try {
        const { ingredients, preferences } = req.body;

        // ── Validate ingredients ──
        if (!Array.isArray(ingredients) || ingredients.length === 0) {
            return res.status(400).json({
                success: false,
                error: 'Please provide at least one ingredient.',
            });
        }

        // Sanitize each ingredient
        const cleaned = ingredients
            .map(sanitizeIngredient) 
            .filter(i => i.length > 0);

        if (cleaned.length === 0) {
            return res.status(400).json({
                success: false,
                error: 'No valid ingredients found after cleaning. Use only letters and basic characters.',
            });
        }

        if (cleaned.length > MAX_INGREDIENTS) {
            return res.status(400).json({
                success: false,
                error: `Maximum ${MAX_INGREDIENTS} ingredients allowed.`,
            });
        }

        // Deduplicate
        const uniqueIngredients = [...new Set(cleaned)];

        // Sanitize preferences
        const safePreferences = sanitizePreferences(preferences);

        // ── Generate recipe ──
        const result = await ollamaService.generateRecipe(uniqueIngredients, safePreferences);

        // ── Fetch matching image (non-blocking, never fails the response) ──
        let imageUrl = null;
        try {
            imageUrl = await imageService.getRecipeImage(
                result.recipe.name,
                uniqueIngredients
            );
        } catch (imgErr) {
            console.warn('[recipe] Image fetch failed:', imgErr.message);
            imageUrl = imageService.getRandomFallback();
        }

        result.recipe.imageUrl = imageUrl;

        res.json(result);
    } catch (error) {
        console.error('[recipe] Generation error:', error.message);
        const statusCode = error.message.includes('Cannot connect') ? 503
            : error.message.includes('not found') ? 404
                : error.message.includes('timed out') ? 504
                    : 500;
        res.status(statusCode).json({
            success: false,
            error: error.message || 'Failed to generate recipe.',
        });
    }
});

/**
 * GET /api/health
 * Connection status + model info
 */
router.get('/health', async (req, res) => {
    try {
        const isConnected = await ollamaService.checkConnection();
        const models = isConnected ? await ollamaService.getAvailableModels() : [];
        res.json({
            success: true,
            ollamaConnected: isConnected,
            availableModels: models.map(m => m.name),
            currentModel: ollamaService.model,
        });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

/**
 * GET /api/random-images
 * Random food images for the hero section
 */
router.get('/random-images', async (req, res) => {
    try {
        const count = Math.min(Math.max(parseInt(req.query.count) || 6, 1), 12);
        const images = await imageService.getRandomImages(count);
        res.json({ success: true, images });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

module.exports = router;
