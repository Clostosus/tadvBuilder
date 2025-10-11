/**
 * Represents a single scene (node) in the story tree.
 * Each scene has narrative text, a list of choices (edges to other scenes),
 * and a reference to its parent scene. The root scene has a null parent.
 */
export default class Scene {
    /**
     * Root scene constructor.
     * @param {string} key - Unique scene identifier.
     * @param {string} text - Narrative text.
     * @param {Scene|null} parent - Parent scene, or null for root.
     * @param {Array<{text: string, next: string}>|Map<string, string>|null} choices - List of choices or null for leaf.
     */
    constructor(key, text = '', parent = null, choices = null)
    {
        this.key = key;
        this.text = text;
        this.parent = parent;
        this.choices = new Map();

        if (choices instanceof Map) {
            for (const [next, choiceText] of choices) {
                this.choices.set(next, choiceText);
            }
        } else if (Array.isArray(choices)) {
            for (const c of choices) {
                if (c.next && c.text) this.choices.set(c.next, c.text);
            }
        }
    }


    /**
     * Adds a new choice (link) to another scene.
     * @param {string} text - Description of the choice.
     * @param {string} next - ID of the next scene.
     * @returns {boolean} True if added successfully, false if duplicate key exists.
     */
    addChoice(text, next)
    {
        if (this.choices.has(next)) return false;
        this.choices.set(next, text);
        return true;
    }

    /**
     * Updates the text of an existing choice.
     * @param {string} next - Target scene ID.
     * @param {string} newText - New description text.
     * @returns {boolean} True if updated, false if not found.
     */
    updateChoice(next, newText) {
        if (!this.choices.has(next)) return false;
        this.choices.set(next, newText);
        return true;
    }

    /**
     * Removes a choice by its next key.
     * @param {string} next - Target scene ID.
     * @returns {boolean} True if removed, false if not found.
     */
    removeChoice(next) { return this.choices.delete(next); }

    /**
     * Returns all choices as an array of plain objects.
     * @returns {Array<{text: string, next: string}>} List of choices.
     */
    getAllChoices()
    {
        return Array.from(this.choices, ([next, text]) => ({ text, next }));
    }

    /**
     * Converts the scene into a JSON-compatible object.
     * @returns {{text: string, choices: Array<{text: string, next: string}>}}
     */
    toJSON() { return { text: this.text, choices: this.getAllChoices() }; }
}