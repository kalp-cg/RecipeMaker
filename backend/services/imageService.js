const axios = require('axios');

/**
 * Image Service - Fetches food images from free APIs
 * Uses Foodish API and TheMealDB (both free, no API key needed)
 */
class ImageService {
    constructor() {
        this.foodishURL = 'https://foodish-api.com/api';
        this.mealDBURL = 'https://www.themealdb.com/api/json/v1/1';

        // Curated fallback images (Unsplash direct links — free to use)
        this.fallbackImages = [
            'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=800&q=80',
            'https://images.unsplash.com/photo-1493770348161-369560ae357d?w=800&q=80',
            'https://images.unsplash.com/photo-1476224203421-9ac39bcb3327?w=800&q=80',
            'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=800&q=80',
            'https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445?w=800&q=80',
            'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=800&q=80',
            'https://images.unsplash.com/photo-1540189549336-e6e99c3679fe?w=800&q=80',
            'https://images.unsplash.com/photo-1482049016688-2d3e1b311543?w=800&q=80',
            'https://images.unsplash.com/photo-1432139555190-58524dae6a55?w=800&q=80',
            'https://images.unsplash.com/photo-1455619452474-d2be8b1e70cd?w=800&q=80',
            'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=800&q=80',
            'https://images.unsplash.com/photo-1498837167922-ddd27525d352?w=800&q=80',
        ];
    }

    /**
     * Search TheMealDB for a recipe image by name
     * @param {string} recipeName - Name of the recipe
     * @returns {Promise<string|null>} Image URL or null
     */
    async searchMealImage(recipeName) {
        try {
            // Clean the recipe name for search
            const searchTerm = recipeName
                .replace(/[^a-zA-Z\s]/g, '')
                .split(' ')
                .slice(0, 3)
                .join(' ')
                .trim();

            if (!searchTerm) return null;

            const response = await axios.get(
                `${this.mealDBURL}/search.php?s=${encodeURIComponent(searchTerm)}`,
                { timeout: 5000 }
            );

            if (response.data?.meals && response.data.meals.length > 0) {
                return response.data.meals[0].strMealThumb;
            }

            // Try with just the first word
            const firstWord = searchTerm.split(' ')[0];
            const fallbackResponse = await axios.get(
                `${this.mealDBURL}/search.php?s=${encodeURIComponent(firstWord)}`,
                { timeout: 5000 }
            );

            if (fallbackResponse.data?.meals && fallbackResponse.data.meals.length > 0) {
                return fallbackResponse.data.meals[0].strMealThumb;
            }

            return null;
        } catch (error) {
            console.error('MealDB search failed:', error.message);
            return null;
        }
    }

    /**
     * Get a random food image from Foodish API
     * @returns {Promise<string>} Image URL
     */
    async getRandomFoodImage() {
        try {
            const response = await axios.get(`${this.foodishURL}`, { timeout: 5000 });
            if (response.data?.image) {
                return response.data.image;
            }
            return this.getRandomFallback();
        } catch (error) {
            console.error('Foodish API failed:', error.message);
            return this.getRandomFallback();
        }
    }

    /**
     * Get multiple random food images for the hero section
     * @param {number} count - Number of images
     * @returns {Promise<string[]>} Array of image URLs
     */
    async getRandomImages(count = 6) {
        const images = [];
        const promises = [];

        for (let i = 0; i < count; i++) {
            promises.push(this.getRandomFoodImage());
        }

        try {
            const results = await Promise.allSettled(promises);
            for (const result of results) {
                if (result.status === 'fulfilled' && result.value) {
                    images.push(result.value);
                } else {
                    images.push(this.getRandomFallback());
                }
            }
        } catch {
            // Fill with fallbacks
            for (let i = 0; i < count; i++) {
                images.push(this.fallbackImages[i % this.fallbackImages.length]);
            }
        }

        return images;
    }

    /**
     * Get the best image for a recipe
     * Tries MealDB first, then Foodish, then fallback
     * @param {string} recipeName - Name of the recipe
     * @param {string[]} ingredients - List of ingredients
     * @returns {Promise<string>} Image URL
     */
    async getRecipeImage(recipeName, ingredients = []) {
        // 1. Try TheMealDB with recipe name
        if (recipeName) {
            const mealImage = await this.searchMealImage(recipeName);
            if (mealImage) return mealImage;
        }

        // 2. Try TheMealDB with main ingredient
        if (ingredients.length > 0) {
            try {
                const response = await axios.get(
                    `${this.mealDBURL}/filter.php?i=${encodeURIComponent(ingredients[0])}`,
                    { timeout: 5000 }
                );
                if (response.data?.meals && response.data.meals.length > 0) {
                    const randomMeal = response.data.meals[Math.floor(Math.random() * response.data.meals.length)];
                    return randomMeal.strMealThumb;
                }
            } catch {
                // Continue to fallback
            }
        }

        // 3. Random food image
        return await this.getRandomFoodImage();
    }

    /**
     * Get a random fallback image
     * @returns {string} Image URL
     */
    getRandomFallback() {
        return this.fallbackImages[Math.floor(Math.random() * this.fallbackImages.length)];
    }
}

module.exports = new ImageService();
