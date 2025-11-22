/**
 * Responsible for rendering a scene to the play area.
 */
export default class SceneRenderer {
    /**
     * Render a scene by key.
     * @param {import('./Story.js').default} story
     * @param {string} key
     * @param {string} targetElementId
     */
    static render(story, key, targetElementId = 'play-area') {
        const area = document.getElementById(targetElementId);
        if (!area) return;

        const scene = story.getScene(key);
        area.innerHTML = '';

        if (!scene) {
            const errorMessage = document.createElement('p');
            const em = document.createElement('em');
            em.textContent = "Szene '" + key + "' nicht gefunden.";
            errorMessage.appendChild(em);
            area.textContent = '';
            area.appendChild(errorMessage);
            return;
        }

        const sceneTitle = document.createElement('p');
        const sceneKeyStrong = document.createElement('strong');
        sceneKeyStrong.textContent = key;
        sceneTitle.append(sceneKeyStrong, ": " + scene.text);

        area.appendChild(sceneTitle);

        for (const [next, text] of scene.choices.entries()) {
            const button = document.createElement('button');
            button.textContent = text;
            button.onclick = () => SceneRenderer.render(story, next, targetElementId);
            area.appendChild(button);
            area.appendChild(document.createElement('br'));
        }
    }
}
