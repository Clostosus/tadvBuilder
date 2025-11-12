import Story from "./Story.js";

export default class StoryTreeRenderer {
    /**
     * Generates the story tree as an ASCII-style string.
     * Marks missing (unresolved) scenes explicitly.
     * @param {Story} story - The story object containing the scenes.
     * @param {HTMLElement} parentElement Element inside which the output will be inserted.
     */
    static generateTreeAscii(story,parentElement = document.getElementById('tree-output')) {
        if (!parentElement) return;
        if (!story || !story.root) {
            parentElement.textContent = '(noch kein Baum erstellt)';
            return;
        }

        const scenesWithDepth = Story.getScenesDFS(story,story.root);
        const outputLines = [];
        for (let i = 0; i < scenesWithDepth.length; i++) {
            let { key, scene, depth } = scenesWithDepth[i];

            // Tree-prefix (Indentation with ASCII)
            let prefix = '';
            for (let d = 0; d < depth; d++) {
                prefix += (d === depth - 1) ? '|_ ' : '   ';
            }
            key = String(key); // ensure its string

            if (scene === null) {
                outputLines.push(prefix + '[' + key + ']' + "(MISSING)");
            } else {
                outputLines.push(prefix + key);
            }
        }
        const output = outputLines.join('\n');
        parentElement.textContent = output;
    }
}