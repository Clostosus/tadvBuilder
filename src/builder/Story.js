/**
 * Represents the entire story as an object-oriented tree of scenes.
 * Controls all scenes and ensures proper parent-child relationships.
 * Each scene (except the root) must have exactly one parent.
 */
export default class Story {
    /**
     * @constructor
     * @param {Class} sceneClass - Class representing a Scene.
     */
    constructor(sceneClass)
    {
        this.sceneClass = sceneClass;
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
        if (!(scene instanceof this.sceneClass)) return false;
        if (this.scenes.has(scene.key)) return false;

        this.scenes.set(scene.key, scene);
        if (!this.root) {
            this.root = scene;
            return true;
        } // first scene becomes root

        if (!scene.parent && this.root && this.scenes.size > 0) {
            const parent = this.findParent(scene.key);
            if (parent) {
                scene.parent = parent;
                parent.addChoice(scene.text || `to ${scene.key}`, scene.key);
            } else {
                this.root.addChoice(scene.text || `to ${scene.key}`, scene.key);
                scene.parent = this.root;
            }
        }

        // ensure parent linkage integrity
        if (scene.parent && this.scenes.has(scene.parent.key)) {
            const parent = this.scenes.get(scene.parent.key);
            parent.addChoice(scene.text || `to ${scene.key}`, scene.key);
        }

        return true;
    }

    /**
     * Finds the parent Scene whose choices reference the given scene key.
     * @param {string} sceneKey - Key of the scene to find a parent for.
     * @returns {Scene|null} The parent Scene, or null if not found.
     */
    findParent(sceneKey) {
        for (const scene of this.scenes.values()) {
            if (scene.choices instanceof Map && scene.choices.has(sceneKey)) {
                return scene;
            }
        }
        return null;
    }


    /**
     * Retrieves a scene by key.
     * @param {string} key
     * @returns {Scene|null}
     */
    getScene(key) { return this.scenes.get(key) || null; }

    /**
     * Retrieves all scene references as array in depth-first order.
     * Returns objects containing scene key, optional Scene instance, and depth.
     * @returns {Array<SceneRef>}
     */
    getAllScenesDFS()
    {
        if (!this.root) return [];
        /** @type {Array<SceneRef>} */
        const result = [];
        const stack = [];
        stack.push({ scene: this.root, depth: 0 });

        const visited = new Set();

        while (stack.length > 0) {
            const { scene, depth } = stack.pop();

            if(visited.has(scene.key)){ continue; }
            visited.add(scene.key);
            result.push({ key: scene.key, scene: scene,depth: depth });

            const children = [];
            for (const [next] of scene.choices.entries()) {
                const child = this.getScene(next);
                if (child) {
                    children.push(child);
                }else {
                    // Add missing referenced scene explicitly
                    result.push({
                        key: next,
                        scene: null,
                        depth: depth + 1
                    });
                }
            }
            // reverse order to get initial order
            for (let i = children.length - 1; i >= 0; i--) {
                stack.push({ scene: children[i], depth: depth + 1 });
            }
        }
        return result;
    }


    /**
     * Converts the entire story into a JSON-compatible structure.
     * Each scene key maps to an object with `text` and `choices` array.
     * @returns {Object<string, {text: string, choices: Array<{text: string, next: string}>}>}
     */
    toJSON()
    {
        const result = {};
        for (const [key, scene] of this.scenes.entries()) {
            result[key] = scene.toJSON();
        }
        return result;
    }

    /**
     * Creates a new Story instance from a JSON Object.
     * @param {Object} parsedJson
     * @param {Class} SceneClass
     * @returns {Story | null} New Scene instance or null if parsing fails.
     */
    static fromJson(parsedJson, SceneClass) {
        if (!parsedJson || typeof parsedJson !== 'object') { return null; }
        if (typeof SceneClass.fromJson !== 'function') {
            console.warn('SceneClass has no method called: fromJson');
            return null;
        }

        let story = new Story(SceneClass);
        for (const [key, value] of Object.entries(parsedJson)) {
            const scene = SceneClass.fromJson(key, value);
            if (scene) {
                story.addScene(scene);
            }else{
                console.warn(`Failed to load scene ${key}`);
                return null;
            }
        }
        if (story.scenes.size === 0) {
            console.warn('No scenes found in JSON');
            return null;
        }
        return story;
    }
}