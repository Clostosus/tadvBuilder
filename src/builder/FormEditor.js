import AsciiTreeRenderer from "./AsciiTreeRenderer.js";
import Feedback from "./Feedback.js";
import SceneRenderer from "./SceneRenderer.js";
import Scene from "./core/Scene.js";
import Story from "./core/Story.js";

/**
 * Editor used by the form-based story builder.
 * Holds a reference to the Story instance and the Scene class.
 */
export default class FormEditor {
    /**
     * @param {Story} storyInstance - The story instance to be edited.
     */
    constructor(storyInstance) {
        this.story = storyInstance;
    }

    /**
     * Adds a new choice field to the choices container.
     * @returns void
     */
    static addChoiceField() {
        const parentElement = document.getElementById('choices-container');
        if (!parentElement) {
            console.error('parentElement is not found.');
            return;
        }

        const container = document.createElement('div');
        container.className = 'choice-inputs';
        container.innerHTML = `
        <input type="text" class="choice-text" placeholder="Entscheidungstext">
        <input type="text" class="choice-next" placeholder="Nächste Szene (Schlüssel)">
      `;
        parentElement.appendChild(container);
    }

    /**
     * Adds a new scene to the story.
     * @returns void
     */
    addScene() {
        const sceneKey = document.getElementById('scene-key').value.trim();
        const text = document.getElementById('scene-text').value.trim();
        const editorSection = document.getElementById('sceneEditor');

        if (!sceneKey || !text) {
            Feedback.show("Bitte Schlüssel und Text ausfüllen.", editorSection, false);
            return;
        }

        const choiceElements = document.querySelectorAll('.choice-inputs');
        const choices = new Map();
        choiceElements.forEach(el => {
            const text = el.querySelector('.choice-text').value.trim();
            const next = el.querySelector('.choice-next').value.trim();
            if (text && next) choices.set(next, text);
        });

        if (!this.story.addScene(new Scene(sceneKey, text, null, choices))) {
            Feedback.show("Scene could not be added to story, key already exists.", editorSection, false);
            return;
        }
        SceneRenderer.render(this.story, sceneKey);
        AsciiTreeRenderer.generateTreeAscii(this.story);

        // Eingabefelder leeren
        document.getElementById('scene-key').value = "";
        document.getElementById('scene-text').value = "";
        const choicesContainer = document.getElementById('choices-container');
        choicesContainer.innerHTML = `<div class="choice-inputs">
    <input type="text" class="choice-text" placeholder="Entscheidungstext">
    <input type="text" class="choice-next" placeholder="Nächste Szene (Schlüssel)">
    </div>`;

        Feedback.show(`Szene wurde gespeichert.`, editorSection, true)
    }

    editScene() {
        const keyInput = document.getElementById("scene-key");
        const status = document.getElementById("scene-status");
        const textInput = document.getElementById("scene-text");
        const choicesContainer = document.getElementById("choices-container");
        const key = keyInput.value.trim();
        const text = textInput.value.trim();

        if (!key) {
            Feedback.show("Bitte gib den Schlüssel der zu bearbeitenden Szene ein.", status, false);
            return;
        }

        let choices = new Map();
        for (const el of choicesContainer.children) {
            if (!el.classList.contains('choice-inputs')) continue;

            let choiceTextInput = el.querySelector(".choice-text");
            let choiceKeyInput = el.querySelector(".choice-next");

            if (!choiceTextInput || !choiceKeyInput
                || !(choiceTextInput instanceof HTMLInputElement) || !(choiceKeyInput instanceof HTMLInputElement)) {
                console.log("Error in editScene: Invalid choice input elements. Skipping choice.");
            }
            choices.set(choiceKeyInput.value.trim(), choiceTextInput.value.trim());
        }

        let success = this.story.editSceneContent(key, text, choices);
        if (success) {
            SceneRenderer.render(this.story, key);
            Feedback.show(`Szene wurde erfolgreich bearbeitet.`, status, true);
        }
    }


    removeScene() {
        const keyInput = document.getElementById("scene-key");
        const key = keyInput.value.trim();
        const status = document.getElementById("scene-status");

        if (!key) {
            Feedback.show("Bitte gib den Schlüssel der zu löschenden Szene ein.", status, false);
            return;
        }
        if (!confirm(`Soll die Szene "${key}" wirklich gelöscht werden?`)) return;

        const success = this.story.removeScene(key);
        if (!success) {
            Feedback.show(`Keine Szene mit dem Schlüssel "${key}" gefunden.`, status, false);
            return;
        }

        SceneRenderer.render(this.story, this.story.root.key);
        Feedback.show(`Szene "${key}" wurde erfolgreich gelöscht.`, status, true);
        keyInput.value = "";
        document.getElementById("scene-text").value = "";
        AsciiTreeRenderer.generateTreeAscii(this.story);
    }
}
