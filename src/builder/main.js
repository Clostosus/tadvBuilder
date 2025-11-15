import Scene from './Scene.js';
import Story from "./Story.js";
import SaveLoad from "./SaveLoad.js";
import StoryTreeRenderer from './StoryTreeRenderer.js';

let story = new Story(Scene);

/**
 * Displays a temporary feedback message in the UI.
 * @param {string} message - The message to display.
 * @param {HTMLElement} targetElement - The HTML element where the message will be added.
 * @param {boolean} isSuccess - Determines if the message is a success or error.
 * @param {string} mode - Determines how the message is handled ('create' or 'set').
 */
function showFeedback(message, targetElement, isSuccess, mode = 'create') {
    if (!targetElement) return;

    const feedbackClass = isSuccess ? 'feedback-success' : 'feedback-error';

    if (mode === 'create') {
        const notice = document.createElement('div');
        notice.textContent = message;
        notice.classList.add('feedback', feedbackClass); // CSS-Klasse hinzufügen
        targetElement.appendChild(notice);
        setTimeout(() => notice.remove(), 3000);
    } else if (mode === 'set') {
        targetElement.textContent = message;
        targetElement.classList.add('feedback', feedbackClass); // CSS-Klasse hinzufügen
    }
}

/**
 * Adds a new choice field to the choices container.
 * @returns void
 */
function addChoiceField()
{
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
function addScene()
{
    const sceneKey = document.getElementById('scene-key').value.trim();
    const text = document.getElementById('scene-text').value.trim();
    const editorSection = document.getElementById('sceneEditor');

    if (!sceneKey || !text) {
        showFeedback("Bitte Schlüssel und Text ausfüllen.", editorSection, false);
        return;
    }

    const choiceElements = document.querySelectorAll('.choice-inputs');
    const choices = new Map();
    choiceElements.forEach(el => {
        const text = el.querySelector('.choice-text').value.trim();
        const next = el.querySelector('.choice-next').value.trim();
        if (text && next) choices.set(next, text);
    });

    if(! story.addScene(new Scene(sceneKey, text, null, choices))){
        showFeedback("Scene could not be added to story, key already exists.", editorSection, false);
        return;
    }
    renderScene(sceneKey);
    StoryTreeRenderer.generateTreeAscii(story);

    // Eingabefelder leeren
    document.getElementById('scene-key').value = "";
    document.getElementById('scene-text').value = "";
    const choicesContainer = document.getElementById('choices-container');
    choicesContainer.innerHTML = `<div class="choice-inputs">
    <input type="text" class="choice-text" placeholder="Entscheidungstext">
    <input type="text" class="choice-next" placeholder="Nächste Szene (Schlüssel)">
    </div>`;

    showFeedback(`Szene wurde gespeichert.`, editorSection, true)
}

function startStory()
{
    if (!story.root) {
        alert("Keine 'start'-Szene gefunden.");
        return;
    }
    renderScene("start");
}

function renderScene(key)
{
    const area = document.getElementById('play-area');
    const scene = story.getScene(key);
    area.innerHTML = ''; // clear previous content

    if (!scene) {
        const errorMessage = document.createElement('p');
        const em = document.createElement('em');
        em.textContent = "Szene \'" + key + "' nicht gefunden.";
        errorMessage.appendChild(em);
        area.textContent = '';  // Clear previous content
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
        button.onclick = () => renderScene(next);
        area.appendChild(button);
        area.appendChild(document.createElement('br'));
    }
}

function editScene() {
    const keyInput = document.getElementById("scene-key");
    const status = document.getElementById("scene-status");
    const textInput = document.getElementById("scene-text");
    const choicesContainer = document.getElementById("choices-container");
    const key = keyInput.value.trim();
    const text = textInput.value.trim();

    if(!key){
        showFeedback("Bitte gib den Schlüssel der zu bearbeitenden Szene ein.", status, false);
        return;
    }

    let choices = new Map();
    for (const el of choicesContainer.children) {
        if(! el.classList.contains('choice-inputs')) continue;

        let choiceTextInput = el.querySelector(".choice-text");
        let choiceKeyInput  = el.querySelector(".choice-next");

        if(! choiceTextInput || ! choiceKeyInput
            || ! (choiceTextInput instanceof HTMLInputElement) || ! (choiceKeyInput instanceof HTMLInputElement)) {
            console.log("Error in editScene: Invalid choice input elements. Skipping choice.");
        }
        choices.set(choiceKeyInput.value.trim(),choiceTextInput.value.trim());
    }

    let success = story.editSceneContent(key, text, choices);
    if(success){
        renderScene(key);
        showFeedback(`Szene wurde erfolgreich bearbeitet.`, status, true);
    }
}

function removeScene(){
    const keyInput = document.getElementById("scene-key");
    const key = keyInput.value.trim();
    const status = document.getElementById("scene-status");

    if (!key) {
        showFeedback("Bitte gib den Schlüssel der zu löschenden Szene ein.", status, false);
        return;
    }
    if(! confirm(`Soll die Szene "${key}" wirklich gelöscht werden?`)) return;

    const success = story.removeScene(key);
    if(! success){
        showFeedback(`Keine Szene mit dem Schlüssel "${key}" gefunden.`, status, false);
        return;
    }

    renderScene(story.root.key);
    showFeedback(`Szene "${key}" wurde erfolgreich gelöscht.`, status, true);
    keyInput.value = "";
    document.getElementById("scene-text").value = "";
    StoryTreeRenderer.generateTreeAscii(story);
}

/**
 * Imports a story from a JSON file.
 * @returns void
 */
async function importStory() {
    const fileInput = document.getElementById("json-file");
    const importStatus = document.getElementById("import-status");
    if (!fileInput.files.length) {
        showFeedback("Bitte zuerst eine JSON-Datei auswählen.", importStatus, false);
        return;
    }

    const file = fileInput.files[0];
    const fileUrl = URL.createObjectURL(file);

    try {
        story = await SaveLoad.loadFromJson(fileUrl, Scene, Story);
        if(!story){
            importStatus.textContent = "Fehler beim Laden: Story konnte nicht geladen werden.";
            return;
        }
        showFeedback(`"${file.name}" erfolgreich geladen (${story.scenes.size} Szenen).`, importStatus, true);

        StoryTreeRenderer.generateTreeAscii(story);
        startStory();
    } catch (err) {
        showFeedback("Fehler beim Laden: " + err.message, importStatus, false);
    } finally {
        URL.revokeObjectURL(fileUrl);
    }
}

/**
 * Exports the current story to a JSON file.
 * @returns void
 */
function exportToJson() {
    if (!story) {
        showFeedback("No story available to export.", document.getElementById("import-status"), false);
        return;
    }
    let success = SaveLoad.saveToJson(story, "story.json");
    if(success) showFeedback("Story successfully exported to JSON.", document.getElementById("import-status"), true);
}

/**
 * Exports the current story to an HTML file.
 * @returns void
 */
function exportToHtml() {
    if (!story) {
        showFeedback("No story available to export.", document.getElementById("import-status"), false);
        return;
    }
    let success = SaveLoad.saveToHtml(story, "story.html");
    if(success) showFeedback("Story successfully exported to HTML.", document.getElementById("import-status"), true);
}

// make helper functions available for onclick to HTML file
window.renderScene = renderScene;
window.removeScene = removeScene;

// Register functions
window.addEventListener("DOMContentLoaded", () => {
    console.log("page is fully loaded");
    document.getElementById('add-choice-field').addEventListener('click', addChoiceField);
    document.getElementById('add-scene').addEventListener('click', addScene);
    document.getElementById('remove-scene').addEventListener('click', removeScene);
    document.getElementById('edit-scene').addEventListener('click', editScene);

    document.getElementById('start-story').addEventListener('click', startStory);
    document.getElementById("btn-ascii-tree-refresh").addEventListener("click", () => {
        StoryTreeRenderer.generateTreeAscii(story);
    });

    // --- JSON Import/Export Button Events ---
    document.getElementById("import-json").addEventListener("click", importStory);
    document.getElementById("export-json").addEventListener("click", exportToJson);
    document.getElementById("export-html").addEventListener("click", exportToHtml);
});