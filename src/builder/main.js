import Scene from './Scene.js';
import Story from "./Story.js";
import SaveLoad from "./SaveLoad.js";

let story = new Story(Scene);
window.currentStory = null;

/**
 * Generates the story tree as an ASCII-style string.
 * Marks missing (unresolved) scenes explicitly.
 * @param {HTMLElement} parentElement Element inside which the output will be inserted.
 */
function generateTreeAscii(parentElement = document.getElementById('tree-output'))
{
    if (!parentElement) return;
    if (!story || !story.root) {
        parentElement.textContent = '(noch kein Baum erstellt)';
        return;
    }

    const scenesWithDepth = story.getScenesDFS(story.root);
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
    const output =  outputLines.join('\n');
    parentElement.textContent = output;
}

/**
 * Adds a new choice field to the choices container.
 * @returns void
 */
function addChoiceField(parentElement = document.getElementById('choices-container'))
{
    if (!parentElement) {
        console.error('parentElement is not found.');
        return;
    }
    console.log('parentElement:', parentElement);
    console.log('parentElement type:', typeof parentElement);
    console.log('parentElement instanceof HTMLElement:', parentElement instanceof HTMLElement);

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
    if (!sceneKey || !text) return alert("Bitte Schlüssel und Text ausfüllen.");

    const choiceElements = document.querySelectorAll('.choice-inputs');
    const choices = new Map();
    choiceElements.forEach(el => {
        const text = el.querySelector('.choice-text').value.trim();
        const next = el.querySelector('.choice-next').value.trim();
        if (text && next) choices.set(next, text);
    });

    if(! story.addScene(new Scene(sceneKey, text, null, choices))){
        console.log("Scene could not be added to story, key already exists.");
        return;
    }
    renderPreview(sceneKey);
    generateTreeAscii();

    // Eingabefelder leeren
    document.getElementById('scene-key').value = "";
    document.getElementById('scene-text').value = "";
    const choicesContainer = document.getElementById('choices-container');
    choicesContainer.innerHTML = `<div class="choice-inputs">
    <input type="text" class="choice-text" placeholder="Entscheidungstext">
    <input type="text" class="choice-next" placeholder="Nächste Szene (Schlüssel)">
  </div>`;

    // Rückmeldung anzeigen
    const notice = document.createElement('div');
    notice.textContent = `✅ Szene '${sceneKey}' wurde gespeichert.`;
    notice.style.backgroundColor = '#dcfce7';
    notice.style.border = '1px solid #22c55e';
    notice.style.color = '#166534';
    notice.style.padding = '0.5rem 1rem';
    notice.style.borderRadius = '6px';
    notice.style.marginTop = '1rem';
    notice.style.fontSize = '0.95rem';
    const section = document.querySelectorAll('.section')[0];
    section.appendChild(notice);
    setTimeout(() => notice.remove(), 3000);
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
        status.textContent = "Bitte gib den Schlüssel der zu bearbeitenden Szene ein.";
        status.style.color = "red";
        return;
    }
    if(!text){
        status.textContent = "Bitte gib den Text der zu bearbeitenden Szene ein.";
        status.style.color = "red";
    }
    story.editSceneContent(key, text);
}

function removeScene(){
    const keyInput = document.getElementById("scene-key");
    const key = keyInput.value.trim();
    const status = document.getElementById("scene-status");

    if (!key) {
        status.textContent = "Bitte gib den Schlüssel der zu löschenden Szene ein.";
        status.style.color = "red";
        return;
    }
    if(! confirm(`Soll die Szene "${key}" wirklich gelöscht werden?`)){
        return;
    }
    const success = story.removeScene(key);
    if(! success){
        status.textContent = `Keine Szene mit dem Schlüssel "${key}" gefunden.`;
        status.style.color = "orange";
        return;
    }
    status.textContent = `Szene "${key}" wurde erfolgreich gelöscht.`;
    status.style.color = "green";
    keyInput.value = "";
    document.getElementById("scene-text").value = "";
    generateTreeAscii();
}

/**
 * Imports a story from a JSON file.
 * @returns void
 */
async function importStory() {
    const fileInput = document.getElementById("json-file");
    const importStatus = document.getElementById("import-status");
    if (!fileInput.files.length) {
        importStatus.textContent = "Bitte zuerst eine JSON-Datei auswählen.";
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
        importStatus.textContent = `"${file.name}" erfolgreich geladen (${story.scenes.size} Szenen).`;

        if (typeof generateTreeAscii === "function") generateTreeAscii();
        if (typeof startStory === "function") startStory();
    } catch (err) {
        importStatus.textContent = "Fehler beim Laden: " + err.message;
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
        alert("No story available to export.");
        return;
    }
    SaveLoad.saveToJson(window.currentStory, "story.json");
}

/**
 * Exports the current story to an HTML file.
 * @returns void
 */
function exportToHtml() {
    if (!window.currentStory) {
        alert("No story available to export.");
        return;
    }
    SaveLoad.saveToHtml(window.currentStory, "story.html");
}

// Register functions
window.addEventListener("DOMContentLoaded", (event) => {
    console.log("page is fully loaded");
    document.getElementById('add-choice-field').addEventListener('click', addChoiceField);
    document.getElementById('add-scene').addEventListener('click', addScene);
    document.getElementById('remove-scene').addEventListener('click', removeScene);
    document.getElementById('start-story').addEventListener('click', startStory);
    document.getElementById("btn-ascii-tree-refresh").addEventListener("click", generateTreeAscii);

    // --- JSON Import/Export Button Events ---
    document.getElementById("import-json").addEventListener("click", importStory);
    document.getElementById("export-json").addEventListener("click", exportToJson);
    document.getElementById("export-html").addEventListener("click", exportToHtml);
});