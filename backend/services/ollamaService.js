const axios = require('axios');
const { buildRecipePrompt } = require('../utils/promptTemplates');

/**
 * Ollama Service — Handles all AI interactions.
 *
 * Senior-level improvements:
 * - Multi-strategy parser: tries section-based → numbered-list → line-split fallback
 * - Never returns empty arrays — always has a meaningful fallback
 * - Input-length guard to prevent enormous prompts
 * - Proper model-not-found detection with actionable error
 * - Consistent structured error types
 */
class OllamaService {
  constructor() {
    this.baseURL = process.env.OLLAMA_API_URL || 'http://localhost:11434';
    this.model = process.env.OLLAMA_MODEL || 'llama2:latest';
    this.timeout = parseInt(process.env.OLLAMA_TIMEOUT) || 120000;
  }

  /**
   * Check if Ollama is reachable.
   * @returns {Promise<boolean>}
   */
  async checkConnection() {
    try {
      const res = await axios.get(`${this.baseURL}/api/tags`, { timeout: 5000 });
      return res.status === 200;
    } catch (err) {
      console.error('[OllamaService] connection check failed:', err.message);
      return false;
    }
  }

  /**
   * Get list of locally-available models.
   * @returns {Promise<Array>}
   */
  async getAvailableModels() {
    try {
      const res = await axios.get(`${this.baseURL}/api/tags`, { timeout: 5000 });
      return res.data.models || [];
    } catch (err) {
      console.error('[OllamaService] model list failed:', err.message);
      return [];
    }
  }

  /**
   * Generate a recipe using Ollama.
   *
   * @param {string[]} ingredients - Cleaned ingredient list
   * @param {Object}   preferences - Cuisine, difficulty, dietary, cookingTime
   * @returns {Promise<{ success: boolean, recipe: Object, rawText: string, model: string }>}
   */
  async generateRecipe(ingredients, preferences = {}) {
    // Guard: no more than 20 ingredients to keep the prompt sane
    const safeIngredients = ingredients.slice(0, 20);
    const prompt = buildRecipePrompt(safeIngredients, preferences);

    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('🍳 Generating recipe...');
    console.log('   Model:', this.model);
    console.log('   Ingredients:', safeIngredients.join(', '));
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

    let response;
    try {
      response = await axios.post(
        `${this.baseURL}/api/generate`,
        {
          model: this.model,
          prompt,
          stream: false,
          options: {
            temperature: 0.7,
            top_p: 0.9,
            num_predict: 2000,
          },
        },
        { timeout: this.timeout }
      );
    } catch (error) {
      throw this._classifyError(error);
    }

    if (!response.data?.response) {
      throw new Error('Ollama returned an empty response. The model may have failed to generate output.');
    }

    const rawText = response.data.response;
    const recipe = this.parseRecipe(rawText, safeIngredients);

    console.log('✅ Recipe generated:', recipe.name);
    console.log('   Ingredients parsed:', recipe.ingredients.length);
    console.log('   Steps parsed:', recipe.instructions.length);

    return {
      success: true,
      recipe,
      rawText,
      model: this.model,
    };
  }

  /**
   * Parse AI text into structured recipe.
   * Uses a multi-strategy approach:
   *   1. Section-based extraction (looks for **Ingredients:** etc.)
   *   2. Line-pattern fallback (looks for bullet / numbered lines)
   *   3. Raw-text fallback (never returns empty)
   *
   * @param {string} text - Raw AI output
   * @param {string[]} originalIngredients - What the user typed (for fallback)
   * @returns {Object}
   */
  parseRecipe(text, originalIngredients = []) {
    const recipe = {
      name: '',
      servings: '',
      cookingTime: '',
      difficulty: '',
      ingredients: [],
      instructions: [],
      tips: [],
      rawText: text,
    };

    try {
      // ── Name ──
      recipe.name = this._extractField(text, [
        /\*\*Recipe Name:\*\*\s*(.+)/i,
        /Recipe Name:\s*(.+)/i,
        /^#+\s*(.+)/m,
        /^\*\*(.+?)\*\*/m,
      ]) || 'Chef\'s Special';

      // ── Servings ──
      recipe.servings = this._extractField(text, [
        /\*\*Servings:\*\*\s*(.+)/i,
        /Servings:\s*(.+)/i,
        /Serves?\s*:?\s*(\d[\d\s\w-]*)/i,
      ]) || '';

      // ── Cooking Time ──
      recipe.cookingTime = this._extractField(text, [
        /\*\*(?:Cooking\s*)?Time:\*\*\s*(.+)/i,
        /(?:Cooking\s*)?Time:\s*(.+)/i,
        /(\d+\s*(?:min|hour|hr)[\w\s]*)/i,
      ]) || '';

      // ── Difficulty ──
      recipe.difficulty = this._extractField(text, [
        /\*\*Difficulty:\*\*\s*(.+)/i,
        /Difficulty:\s*(.+)/i,
      ]) || '';

      // ── Ingredients ──
      recipe.ingredients = this._extractListSection(text, [
        /\*\*Ingredients:\*\*\s*([\s\S]*?)(?=\*\*(?:Instructions|Steps|Directions|Method):\*\*)/i,
        /Ingredients:\s*([\s\S]*?)(?=(?:Instructions|Steps|Directions|Method):)/i,
        /\*\*Ingredients:\*\*\s*([\s\S]*?)(?=\n\n\*\*)/i,
      ]);

      // Fallback: if we got 0 ingredients from sections, try grabbing all bullet lines before any numbered list
      if (recipe.ingredients.length === 0) {
        recipe.ingredients = this._extractBulletLines(text);
      }

      // Last resort: use the user's original ingredients
      if (recipe.ingredients.length === 0) {
        recipe.ingredients = originalIngredients.map(i => i.charAt(0).toUpperCase() + i.slice(1));
      }

      // ── Instructions ──
      recipe.instructions = this._extractNumberedSection(text, [
        /\*\*(?:Instructions|Steps|Directions|Method):\*\*\s*([\s\S]*?)(?=\*\*(?:Chef'?s?\s*)?Tips?:\*\*|\*\*Notes?:\*\*|$)/i,
        /(?:Instructions|Steps|Directions|Method):\s*([\s\S]*?)(?=(?:Chef'?s?\s*)?Tips?:|Notes?:|$)/i,
      ]);

      // Fallback: grab all numbered lines from the whole text
      if (recipe.instructions.length === 0) {
        recipe.instructions = this._extractNumberedLines(text);
      }

      // Last resort: split full text into sentences
      if (recipe.instructions.length === 0) {
        recipe.instructions = text
          .split(/[.!]\s+/)
          .filter(s => s.length > 15)
          .slice(0, 8)
          .map(s => s.trim() + '.');
      }

      // ── Tips ──
      recipe.tips = this._extractListSection(text, [
        /\*\*(?:Chef'?s?\s*)?Tips?:\*\*\s*([\s\S]*?)$/i,
        /(?:Chef'?s?\s*)?Tips?:\s*([\s\S]*?)$/i,
        /\*\*Notes?:\*\*\s*([\s\S]*?)$/i,
      ]);

    } catch (err) {
      console.error('[OllamaService] parse error:', err.message);
      // Ensure we never return completely empty
      if (!recipe.name) recipe.name = 'Generated Recipe';
      if (recipe.instructions.length === 0) {
        recipe.instructions = ['See raw recipe text below for full instructions.'];
      }
    }

    return recipe;
  }

  // ─────────────────────────────────────────────
  //  Private helpers
  // ─────────────────────────────────────────────

  /**
   * Try multiple regex patterns, return first match group 1 (cleaned).
   */
  _extractField(text, patterns) {
    for (const re of patterns) {
      const m = text.match(re);
      if (m && m[1]) return m[1].trim().replace(/\*+/g, '');
    }
    return null;
  }

  /**
   * Extract a section of bullet-point lines from text using multiple section patterns.
   */
  _extractListSection(text, patterns) {
    for (const re of patterns) {
      const m = text.match(re);
      if (m && m[1]) {
        const items = this._parseBullets(m[1]);
        if (items.length > 0) return items;
      }
    }
    return [];
  }

  /**
   * Extract a section of numbered lines from text using multiple section patterns.
   */
  _extractNumberedSection(text, patterns) {
    for (const re of patterns) {
      const m = text.match(re);
      if (m && m[1]) {
        const items = this._parseNumbered(m[1]);
        if (items.length > 0) return items;
      }
    }
    return [];
  }

  /**
   * Parse bullet-point lines (-, •, *) from a block of text.
   */
  _parseBullets(block) {
    return block
      .split('\n')
      .map(l => l.trim())
      .filter(l => /^[-•*]\s/.test(l))
      .map(l => l.replace(/^[-•*]\s*/, '').replace(/\*+/g, '').trim())
      .filter(l => l.length > 1);
  }

  /**
   * Parse numbered lines (1. / 1) ) from a block of text.
   */
  _parseNumbered(block) {
    return block
      .split('\n')
      .map(l => l.trim())
      .filter(l => /^\d+[.)]\s/.test(l))
      .map(l => l.replace(/^\d+[.)]\s*/, '').replace(/\*+/g, '').trim())
      .filter(l => l.length > 3);
  }

  /**
   * Fallback: grab ALL bullet lines from the entire text.
   */
  _extractBulletLines(text) {
    return text
      .split('\n')
      .map(l => l.trim())
      .filter(l => /^[-•*]\s/.test(l) && l.length > 3)
      .map(l => l.replace(/^[-•*]\s*/, '').replace(/\*+/g, '').trim())
      .slice(0, 30);
  }

  /**
   * Fallback: grab ALL numbered lines from the entire text.
   */
  _extractNumberedLines(text) {
    return text
      .split('\n')
      .map(l => l.trim())
      .filter(l => /^\d+[.)]\s/.test(l) && l.length > 5)
      .map(l => l.replace(/^\d+[.)]\s*/, '').replace(/\*+/g, '').trim())
      .slice(0, 20);
  }

  /**
   * Classify Axios/network errors into user-friendly messages.
   */
  _classifyError(error) {
    if (error.code === 'ECONNREFUSED') {
      return new Error('Cannot connect to Ollama. Make sure Ollama is running (ollama serve).');
    }
    if (error.code === 'ECONNABORTED' || error.message?.includes('timeout')) {
      return new Error('Recipe generation timed out. The model may still be loading — try again in a moment.');
    }
    if (error.response?.status === 404) {
      return new Error(`Model "${this.model}" not found. Run: ollama pull ${this.model}`);
    }
    if (error.response?.status === 500) {
      return new Error('Ollama internal error. Try restarting Ollama or using a different model.');
    }
    return new Error(`Recipe generation failed: ${error.message}`);
  }
}

module.exports = new OllamaService();
