/**
 * Represents a single scene (node) in the story tree.
 * Each scene has narrative text, a list of choices (edges to other scenes),
 * and a reference to its parent scene. The root scene has a null parent.
 * @property {string} key - Unique identifier for the scene.
 * @property {string} text - Narrative text for the scene.
 * @property {Scene|null} parent - Reference to the parent scene, or null for root.
 * @property {Map<string, string>} choices - Map of next scene keys to their descriptions.
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
     * Creates a new Scene instance from a JSON text.
     * @returns {Scene | null} New Scene instance or null if parsing fails.
     * @param {string} key
     * @param {object|string} json
     */
    static fromJson(key,json)
    {
        if (!key || !json) return null;

        let parsedObject = null;
        // accept both raw string or parsed object
        if (typeof json === 'string') {
            try {
                parsedObject = JSON.parse(json);
            } catch (e) {
                console.error(`Failed to parse JSON for scene ${key}: ${e}`);
                return null;
            }
        } else if (typeof json === 'object') {
            parsedObject = json;
        } else {
            console.error(`Failed to parse JSON for scene ${key}: Invalid JSON type`);
            return null;
        }
        
        if(!parsedObject.text || typeof parsedObject.text !== 'string'){
            console.error(`Scene ${key} missing text property.`);
            return null;
        }

        const scene = new Scene(key, parsedObject.text, null,[]);

        // handle optional choices (leaf scenes may have none)
        if (Array.isArray(parsedObject.choices)) {
            for (const c of parsedObject.choices) {
                if (!c || typeof c.text !== 'string' || typeof c.next !== 'string') continue;
                scene.addChoice(c.text, c.next);
            }
        }

        return scene;
    }

    /**
     * Converts the scene into a plain JSON-compatible object.
     * @returns {{text: string, choices: Array<{text: string, next: string}>}}
     */
    toJSON()
    {
        const choicesArray = [];
        for (const [next, text] of this.choices.entries()) {
            choicesArray.push({ text, next });
        }
        if(choicesArray.length === 0){
            return { text: this.text };
        }
        return { text: this.text, choices: choicesArray };
    }
}

/**
 * @typedef {Object} SceneRef
 * @property {Scene|null} scene - The referenced Scene instance, or null if missing.
 * @property {string} key - The scene key (ID)
 * @property {number} depth - Depth in the DFS traversal of the story tree, starting at 0 for the root scene.
 */