import Scene from './Scene.js';
import Story from "./Story.js";
import SaveLoad from "./SaveLoad.js";

// const story = new Story();
let story = new Story(Scene);

/**
 * Renders the story tree as a string.
 * @returns void
 */
function renderTree(parentElement = document.getElementById('tree-output'))
{
    if (!parentElement) return;
    if (!story || !story.root) {
        parentElement.textContent = '(noch kein Baum erstellt)';
        return;
    }

    const scenesWithDepth = story.getAllScenesDFS();
    const outputLines = [];

    for (let i = 0; i < scenesWithDepth.length; i++) {
        const { scene, depth } = scenesWithDepth[i];

        let prefix = '';
        for (let d = 0; d < depth; d++) {
            prefix += (d === depth - 1) ? '|_ ' : '   ';
        }

        outputLines.push(prefix + scene.key);
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

    story.addScene(new Scene(sceneKey, text, null, choices));
    updateOutput();
    renderPreview(sceneKey);
    renderTree();

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


function updateOutput()
{
    if (!story || story.scenes.size === 0) {
        document.getElementById('output').textContent = "(noch keine Szenen erstellt)";
        return;
    }

    document.getElementById('output').textContent = JSON.stringify(story.toJSON(), null, 2);
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

// make functions available to HTML file
window.addChoiceField = addChoiceField;
window.addScene = addScene;
window.startStory = startStory;
window.renderTree = renderTree;
// make helper functions available
window.updateOutput = updateOutput;
window.renderPreview = renderPreview;
window.renderScene = renderScene;

// === JSON Import/Export GUI ===

const fileInput = document.getElementById("json-file");
const importBtn = document.getElementById("import-json");
const exportBtn = document.getElementById("export-json");
const importStatus = document.getElementById("import-status");

// Reference to the current story object
window.currentStory = null;

// --- IMPORT ---
importBtn.addEventListener("click", async () => {
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
        document.getElementById("output").textContent = JSON.stringify(story.toJSON(), null, 2);
        importStatus.textContent = `"${file.name}" erfolgreich geladen (${story.scenes.size} Szenen).`;

        if (typeof renderTree === "function") renderTree();
        if (typeof startStory === "function") startStory();
    } catch (err) {
        importStatus.textContent = "Fehler beim Laden: " + err.message;
    } finally {
        URL.revokeObjectURL(fileUrl);
    }
});

// --- EXPORT ---
exportBtn.addEventListener("click", () => {
    if (!window.currentStory) {
        alert("Keine Story zum Exportieren vorhanden.");
        return;
    }
    SaveLoad.saveToJson(window.currentStory, "story_export.json");
});