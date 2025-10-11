import Scene from './Scene.js';

/**
 * Represents the entire story as an object-oriented tree of scenes.
 * Controls all scenes and ensures proper parent-child relationships.
 * Each scene (except the root) must have exactly one parent.
 */
export default class Story {
    constructor()
    {
        this.scenes = new Map(); // key -> Scene
        this.root = null;        // start scene
    }

    /**
     * Adds an existing Scene instance to the story.
     * @param {Scene} scene - Scene object to add.
     * @returns {boolean} True if added, false if duplicate Key.
     */
    addScene(scene)
    {
        if (!(scene instanceof Scene)) return false;
        if (this.scenes.has(scene.key)) return false;

        this.scenes.set(scene.key, scene);
        if (!this.root) this.root = scene; // first scene becomes root

        // ensure parent linkage integrity
        if (scene.parent && this.scenes.has(scene.parent.key)) {
            const parent = this.scenes.get(scene.parent.key);
            parent.addChoice(scene.text || `to ${scene.key}`, scene.key);
        }

        return true;
    }

    /**
     * Retrieves a scene by key.
     * @param {string} key
     * @returns {Scene|null}
     */
    getScene(key) { return this.scenes.get(key) || null; }

    /**
     * Retrieves all scenes as array of scene objects. Array is in depth-first order.
     * Returns an array of objects containing the Scene instance and its depth in the story tree.
     * @returns {Array<{ scene: Scene, depth: number }>}
     */
    getAllScenesDFS() {
        if (!this.root) return [];
        const result = [];
        const stack = [];
        stack.push({ scene: this.root, depth: 0 });

        while (stack.length > 0) {
            const current = stack.pop();
            const scene = current.scene;
            const depth = current.depth;

            result.push({ scene: scene, depth: depth });
            const choices = scene.choices;
            for (let i = choices.length - 1; i >= 0; i--) {
                const choice = choices[i];
                const child = this.getScene(choice.next);
                if (child) {
                    stack.push({ scene: child, depth: depth + 1 });
                }
            }
        }
        return result;
    }

    /**
     * Builds the story tree from plain JSON data.
     * @param {Object} jsonData
     */
    loadFromJSON(jsonData)
    {
        // First pass: create Scene objects
        for (const [key, data] of Object.entries(jsonData)) {
            const scene = new Scene(key, data.text);
            this.addScene(scene);
        }

        // Second pass: link choices
        for (const [key, data] of Object.entries(jsonData)) {
            const parent = this.getScene(key);
            if (!Array.isArray(data.choices)) continue;

            for (const choice of data.choices) {
                const child = this.getScene(choice.next);
                if (child && !child.parent) {
                    child.parent = parent;
                    parent.addChoice(choice.text, choice.next);
                }
            }
        }
    }

    /**
     * Exports all scenes as plain JSON.
     */
    toJSON() {
        const out = {};
        for (const [key, scene] of this.scenes) out[key] = scene.toJSON();
        return out;
    }
}