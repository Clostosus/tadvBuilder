import Scene from './Scene.js';
import Story from "./Story.js";
import SaveLoad from "./SaveLoad.js";
import StoryTreeRenderer from './StoryTreeRenderer.js';

let story = new Story(Scene);
window.currentStory = null;

/**
 * Displays a temporary feedback message in the UI.
 * @param {string} message - The message to display.
 * @param {HTMLElement} targetElement - The HTML element where the message will be added.
 * @param {boolean} isSuccess - Determines if the message is a success or error.
 * @param {string} mode - Determines how the message is handled ('create' or 'set').
 */
function showFeedback(message, targetElement, isSuccess, mode = 'create') {
    if (!targetElement) return;

    const color = isSuccess ? '#166534' : '#9b2c2c';
    if (mode === 'create') {
        const notice = document.createElement('div');
        notice.textContent = message;
        notice.style.color = color;
        targetElement.appendChild(notice);
        setTimeout(() => notice.remove(), 3000);
    } else if (mode === 'set') {
        targetElement.textContent = message;
        targetElement.style.color = color;
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
    renderPreview(sceneKey);
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

function renderPreview(key)
{
    const scene = story.getScene(key);
    if (!scene) return;
    let html = `<p><strong>${scene.key}</strong>: ${scene.text}</p>`;
    for (const [next, text] of scene.choices.entries()) {
        html += `<button disabled>${text} -> ${next}</button><br>`
    }
    document.getElementById('preview').innerHTML = html;
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
    if (!scene) {
        area.innerHTML = `<p><em>Szene '${key}' nicht gefunden.</em></p>`;
        return;
    }
    let html = `<p><strong>${scene.key}</strong>: ${scene.text}</p>`;
    for (const [next, text] of scene.choices.entries()) {
        html += `<button onclick="renderScene('${next}')">${text}</button><br>`
    }
    area.innerHTML = html;
}

function editScene() {
    const keyInput = document.getElementById("scene-key");
    const status = document.getElementById("scene-status");
    const textInput = document.getElementById("scene-text");
    const key = keyInput.value.trim();
    const text = textInput.value.trim();

    if(!key){
        showFeedback("Bitte gib den Schlüssel der zu bearbeitenden Szene ein.", status, false);
        return;
    }
    if(!text){
        showFeedback("Bitte gib den Schlüssel der zu bearbeitenden Szene ein.", status, false);
        return;
    }
    let success = story.editSceneContent(key, text);
    if(success){
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
        window.currentStory = story;
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
    if (!window.currentStory) {
        showFeedback("No story available to export.", document.getElementById("import-status"), false);
        return;
    }
    let success = SaveLoad.saveToJson(window.currentStory, "story.json");
    if(success) showFeedback("Story successfully exported to JSON.", document.getElementById("import-status"), true);
}

/**
 * Exports the current story to an HTML file.
 * @returns void
 */
function exportToHtml() {
    if (!window.currentStory) {
        showFeedback("No story available to export.", document.getElementById("import-status"), false);
        return;
    }
    let success = SaveLoad.saveToHtml(window.currentStory, "story.html");
    if(success) showFeedback("Story successfully exported to HTML.", document.getElementById("import-status"), true);
}

// make helper functions available for onclick to HTML file
window.renderPreview = renderPreview;
window.renderScene = renderScene;
window.removeScene = removeScene;

// Register functions
window.addEventListener("DOMContentLoaded", (event) => {
    console.log("page is fully loaded");
    document.getElementById('add-choice-field').addEventListener('click', addChoiceField);
    document.getElementById('add-scene').addEventListener('click', addScene);
    document.getElementById('remove-scene').addEventListener('click', removeScene);
    document.getElementById('edit-scene').addEventListener('click', editScene);

    document.getElementById('start-story').addEventListener('click', startStory);
    document.getElementById("btn-ascii-tree-refresh").addEventListener("click", () => {
        StoryTreeRenderer.generateTreeAscii(window.currentStory);
    });

    // --- JSON Import/Export Button Events ---
    document.getElementById("import-json").addEventListener("click", importStory);
    document.getElementById("export-json").addEventListener("click", exportToJson);
    document.getElementById("export-html").addEventListener("click", exportToHtml);
});