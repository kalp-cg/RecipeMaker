/**
 * Prompt Templates for AI Recipe Generation
 *
 * Supports multi-language output — instructs the AI to write the entire
 * recipe (name, ingredients, instructions, tips) in the chosen language.
 */

/**
 * Supported languages with their native names and prompt instructions.
 */
const LANGUAGES = {
  english: { label: 'English', native: 'English', instruction: '' },
  gujarati: { label: 'Gujarati', native: 'ગુજરાતી', instruction: 'Write the ENTIRE recipe in Gujarati (ગુજરાતી). Use Gujarati script for everything — recipe name, ingredients, instructions, and tips. Do NOT use English.' },
  hindi: { label: 'Hindi', native: 'हिन्दी', instruction: 'Write the ENTIRE recipe in Hindi (हिन्दी). Use Devanagari script for everything — recipe name, ingredients, instructions, and tips. Do NOT use English.' },
  spanish: { label: 'Spanish', native: 'Español', instruction: 'Write the ENTIRE recipe in Spanish (Español). All text must be in Spanish.' },
  french: { label: 'French', native: 'Français', instruction: 'Write the ENTIRE recipe in French (Français). All text must be in French.' },
  tamil: { label: 'Tamil', native: 'தமிழ்', instruction: 'Write the ENTIRE recipe in Tamil (தமிழ்). Use Tamil script for everything.' },
  telugu: { label: 'Telugu', native: 'తెలుగు', instruction: 'Write the ENTIRE recipe in Telugu (తెలుగు). Use Telugu script for everything.' },
  marathi: { label: 'Marathi', native: 'मराठी', instruction: 'Write the ENTIRE recipe in Marathi (मराठी). Use Devanagari script for everything.' },
  bengali: { label: 'Bengali', native: 'বাংলা', instruction: 'Write the ENTIRE recipe in Bengali (বাংলা). Use Bengali script for everything.' },
  punjabi: { label: 'Punjabi', native: 'ਪੰਜਾਬੀ', instruction: 'Write the ENTIRE recipe in Punjabi (ਪੰਜਾਬੀ). Use Gurmukhi script for everything.' },
};

/**
 * Build a comprehensive recipe generation prompt.
 *
 * @param {string[]} ingredients - List of ingredients
 * @param {Object}   preferences - User preferences
 * @returns {string} Formatted prompt for Ollama
 */
function buildRecipePrompt(ingredients, preferences = {}) {
  const {
    cuisine = 'any',
    difficulty = 'medium',
    dietary = [],
    cookingTime = 'any',
    language = 'english',
  } = preferences;

  // Build optional sections
  const dietaryText = dietary.length > 0
    ? `\nDietary Requirements: ${dietary.join(', ')}`
    : '';
  const cuisineText = cuisine !== 'any'
    ? `\nCuisine Style: ${cuisine}`
    : '';
  const timeText = cookingTime !== 'any'
    ? `\nPreferred Cooking Time: ${cookingTime}`
    : '';

  // Language instruction
  const langConfig = LANGUAGES[language] || LANGUAGES.english;
  const languageBlock = langConfig.instruction
    ? `\n\nLANGUAGE REQUIREMENT (VERY IMPORTANT):\n${langConfig.instruction}\n`
    : '';

  const prompt = `You are a professional chef with expertise in creating delicious recipes. Your task is to create ONE complete recipe using the provided ingredients.

INGREDIENTS AVAILABLE:
${ingredients.map(ing => `- ${ing}`).join('\n')}
${cuisineText}${dietaryText}${timeText}
Difficulty Level: ${difficulty}
${languageBlock}
INSTRUCTIONS:
1. Create a single, complete recipe that uses MOST or ALL of the provided ingredients
2. You may suggest common pantry items (salt, pepper, oil, water) if needed
3. Provide clear, step-by-step cooking instructions
4. Include cooking time and number of servings

FORMAT YOUR RESPONSE EXACTLY AS FOLLOWS (keep the section headers in English with ** markers, but write the CONTENT in the requested language):

**Recipe Name:** [Creative, appetizing name]

**Servings:** [Number of servings]

**Cooking Time:** [Total time]

**Difficulty:** [Easy/Medium/Hard]

**Ingredients:**
- [Ingredient 1 with measurement]
- [Ingredient 2 with measurement]
- [Continue for all ingredients]

**Instructions:**
1. [First step - be specific and clear]
2. [Second step]
3. [Continue with all steps]

**Chef's Tips:**
- [Helpful tip 1]
- [Helpful tip 2]

Now create the recipe:`;

  return prompt;
}

/**
 * Build a simple prompt for quick recipe generation.
 * @param {string[]} ingredients
 * @returns {string}
 */
function buildSimplePrompt(ingredients) {
  return `Create a simple recipe using these ingredients: ${ingredients.join(', ')}. 
Include the recipe name, ingredients with measurements, and step-by-step instructions.`;
}

module.exports = {
  buildRecipePrompt,
  buildSimplePrompt,
  LANGUAGES,
};
