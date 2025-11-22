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
     * Depth of a scene relative to the root scene.
     * @param {Map<string, Scene>} scenes - The map of scenes in the story (Key -> Scene).
     * @param {Scene} scene - The scene whose depth needs to be calculated.
     * @returns {number} The depth of the scene, -1 if the scene is not found.
     */
    static getSceneDepth(scenes, scene) {
        if(! scenes.has(scene.key)){ return -1; }

        let depth = 0;
        let current = scene;
        while (current && current.parent) {
            depth++;
            current = current.parent;
        }
        return depth;
    }

    /**
     * Retrieves all scene references below start scene as array in depth-first order.
     * starting from the given scene (defaults to root).
     * @param {Story} story - The story instance containing the scenes.
     * @param {Scene} [startScene=this.root]
     * @returns {Array<SceneRef>} Array of { key, scene, depth }
     */
    static getScenesDFS(story, startScene = story.root)
    {
        if (!story || !startScene) return [];
        /** @type {Array<SceneRef>} */
        const result = [];
        const stack = [];
        const visited = new Set();

        let baseDepth = 0;
        if (startScene !== story.root) {
            baseDepth = Story.getSceneDepth(story.scenes,startScene);
        }
        stack.push({ scene: startScene, depth: baseDepth });

        // Use stack-based DFS traversal
        while (stack.length > 0) {
            const { scene, depth } = stack.pop();

            // Skip already visited scenes to avoid revisiting and infloop
            if(visited.has(scene.key)){ continue; }
            visited.add(scene.key);
            result.push({ key: scene.key, scene: scene,depth: depth });

            // Add children to the stack in reverse order to maintain DFS order
            const children = Array.from(scene.choices.keys())
                .map(key => story.getScene(key))
                .filter(child => child && !visited.has(child.key));
            // Push in reverse order
            for (let i = children.length - 1; i >= 0; i--) {
                stack.push({ scene: children[i], depth: depth + 1 });
            }
        }
        return result;
    }

    /**
     * Checks if the story has a circle in the scene graph.
     * @param {Story} story - The story instance containing the scenes.
     * @returns {boolean} True if a cycle is found, false otherwise.
     */
    static hasCircle(story){
        const visited = new Set();  // Set to track fully visited nodes
        const scenes = Story.getScenesDFS(story);

        // Iterate over the DFS results
        for (const { scene } of scenes) {
            if (!scene) continue;

            // Check each scene's choices to see if we revisit a scene in the same DFS path
            for (const nextKey of scene.choices.keys()) {
                const nextScene = story.getScene(nextKey);
                if (nextScene && visited.has(nextScene.key)) {
                    // Cycle detected: revisited a scene already fully visited
                    return true;
                }
            }

            // Mark the current scene as fully visited
            visited.add(scene.key);
        }

        // No cycles found
        return false;
    }

    /* Content means the story text of the scene itself, and the description texts of the choices in this scene.
     * @param {string} key
     * @param {string} storyText
     * @param {Map<string,string>} choiceTexts(<key,text>)
     * @return {boolean} true if content was edited, false if not found
     */
    editSceneContent(key, storyText, choiceTexts = null)
    {
        let scene = this.scenes.get(key);
        if(!scene){
            console.warn(`Scene ${key} not found`);
            return false;
        }
        if(storyText){
            scene.text = storyText;
        }
        if(choiceTexts){
            for (const [next, text] of choiceTexts.entries()) {
                if(! scene.updateChoice(next, text)) { console.warn(`Failed to edit choice ${next} in scene ${key}`); }
            }
        }
        return true;
    }

    /**
     * Updates the choices of a scene. Does no check for circles.
     * @param key
     * @param newChoices
     * @returns {boolean}
     */
    editSceneChoices(key, newChoices)
    {
        let scene = this.scenes.get(key);
        if(!scene){
            console.warn(`Scene ${key} not found`);
            return false;
        }
        scene.choices = new Map(newChoices);
        return true;
    }

    /**
     * Changes the parent of a scene.
     * @param {string} key - Scene key to change.
     * @param {string} newParentKey - New parent key.
     * @returns {boolean} True if parent changed successfully, false if not found or invalid parent.
     */
    changeSceneParent(key, newParentKey)
     {
         let scene = this.scenes.get(key);
         if(!scene){
             console.warn(`Scene ${key} not found`);
         }

         let oldParentChoiceText = scene.parent.choices.get(scene.key).text;
         scene.parent.removeChoice(scene.key);

         const newParent = this.scenes.get(newParentKey);
         if(! newParent){
             scene.parent = null;
             return false;
         }
         scene.parent = newParent;
         newParent.addChoice(oldParentChoiceText || `to ${scene.key}`, scene.key);
         return true;
     }

    /**
     * Deletes a scene by key. Also deletes parent scene choices referencing this scene
     * and recursively removes child scenes of this scene.
     * @param {string} key
     * @returns {boolean} True if found and deleted, else False
     */
    removeScene(key){
        const scene = this.scenes.get(key);
        if(!scene){
            console.warn(`Scene ${key} not found`);
            return false;
        }

        if(scene.parent){ scene.parent.removeChoice(scene.key); }

        // Get all scenes below this scene (inclusive this one)
        const allScenesBelow = Story.getScenesDFS(this, scene);

        // in dfs order, parents come before children
        // To be sure that child scenes are removed before parent, we use a reverse loop:
        for (let i = allScenesBelow.length - 1; i >= 0; i--) {
            const { key } = allScenesBelow[i];
            this.scenes.delete(key);
        }
        return true;
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