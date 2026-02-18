/**
 * Ingredient Usage Tracker — localStorage-based frequency tracking.
 * Tracks how often each ingredient is used and when it was last used.
 */

const STORAGE_KEY = 'ingredientUsage';

function getUsageData() {
    try {
        return JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
    } catch {
        return {};
    }
}

function saveUsageData(data) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

/**
 * Record usage of ingredients (call after recipe generation)
 * @param {string[]} ingredients
 */
export function recordUsage(ingredients) {
    const data = getUsageData();
    const now = Date.now();
    for (const ing of ingredients) {
        const key = ing.toLowerCase().trim();
        if (!data[key]) {
            data[key] = { count: 0, lastUsed: 0 };
        }
        data[key].count += 1;
        data[key].lastUsed = now;
    }
    saveUsageData(data);
}

/**
 * Get frequently used ingredients (sorted by count desc)
 * @param {number} limit
 * @returns {{ name: string, count: number, lastUsed: number }[]}
 */
export function getFrequentlyUsed(limit = 12) {
    const data = getUsageData();
    return Object.entries(data)
        .map(([name, info]) => ({ name, count: info.count, lastUsed: info.lastUsed }))
        .sort((a, b) => b.count - a.count)
        .slice(0, limit);
}

/**
 * Get recently used ingredients (sorted by lastUsed desc)
 * @param {number} limit
 * @returns {{ name: string, count: number, lastUsed: number }[]}
 */
export function getRecentlyUsed(limit = 8) {
    const data = getUsageData();
    return Object.entries(data)
        .map(([name, info]) => ({ name, count: info.count, lastUsed: info.lastUsed }))
        .filter(item => item.lastUsed > 0)
        .sort((a, b) => b.lastUsed - a.lastUsed)
        .slice(0, limit);
}

/**
 * Get usage count for a specific ingredient
 * @param {string} name
 * @returns {number}
 */
export function getUsageCount(name) {
    const data = getUsageData();
    return data[name.toLowerCase().trim()]?.count || 0;
}
