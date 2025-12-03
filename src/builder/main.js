import Scene from './core/Scene.js';
import Story from "./core/Story.js";
import SaveLoad from "./SaveLoad.js";
import AsciiTreeRenderer from './AsciiTreeRenderer.js';
import SceneEditor from './SceneEditor.js';
import SceneRenderer from './SceneRenderer.js';
import Feedback from './Feedback.js';
import TreeEditor from './TreeEditor.js';

let story = new Story(Scene);
let formEditor = new SceneEditor(story);

function startStory()
{
    if (!story.root) {
        alert("Keine 'start'-Szene gefunden.");
        return;
    }
    SceneRenderer.render(story, "start");
}

/**
 * Imports a story from a JSON file.
 * @returns void
 */
async function importStory() {
    const fileInput = document.getElementById("json-file");
    const importStatus = document.getElementById("import-status");
    if (!fileInput.files.length) {
        Feedback.show("Bitte zuerst eine JSON-Datei auswählen.", importStatus, false);
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
        // update editor story reference
        formEditor.story = story;
        Feedback.show(`"${file.name}" erfolgreich geladen (${story.scenes.size} Szenen).`, importStatus, true);

        AsciiTreeRenderer.generateTreeAscii(story);
        // Nach externen Aktionen (z. B. Import) auch den Tree‑Editor aktualisieren
        TreeEditor.render(story);
        startStory();
    } catch (err) {
        Feedback.show("Fehler beim Laden: " + err.message, importStatus, false);
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
        Feedback.show("No story available to export.", document.getElementById("import-status"), false);
        return;
    }
    let success = SaveLoad.saveToJson(story, "story.json");
    if(success) Feedback.show("Story successfully exported to JSON.", document.getElementById("import-status"), true);
}

/**
 * Exports the current story to an HTML file.
 * @returns void
 * @param asEncrypted
 */
function exportToHtml(asEncrypted) {
    if (!story) {
        Feedback.show("No story available to export.", document.getElementById("import-status"), false);
        return;
    }
    let success = false;
    if(asEncrypted) {
        success = SaveLoad.saveToEncryptedHtml(story, "story.html","9oj7k&7C@b@W");
    }else{
        success = SaveLoad.saveToHtml(story, "story.html");
    }
    if(success) Feedback.show("Story successfully exported to HTML.", document.getElementById("import-status"), true);
}

function applyTheme(theme) {
    if (theme === "default") {
        document.documentElement.removeAttribute("data-theme");
    } else {
        document.documentElement.setAttribute("data-theme", theme);
    }
}

function initializePopup() {
    const popup = document.getElementById("popup");
    const showModalBtn = document.getElementById("showModalBtn");
    const closeBtn = document.getElementById("closeBtn");
    const submitBtn = document.getElementById("submitBtn");

    // Show the popup
    showModalBtn.addEventListener("click", function() {
        popup.style.display = "block";
    });

    // Close the popup
    closeBtn.addEventListener("click", function() {
        popup.style.display = "none";
    });

    // Close the popup if clicked outside
    window.addEventListener("click", function(event) {
        if (event.target === popup) {
            popup.style.display = "none";
        }
    });

    // Handle the submit button
    submitBtn.addEventListener("click", function() {
        const input = document.getElementById("inputField").value;
        alert("Input: " + input);
        popup.style.display = "none";
    });
}

// make helper functions available for onclick to HTML file
window.renderScene = (key) => SceneRenderer.render(story, key);
window.removeScene = () => formEditor.removeScene();

// Register functions
window.addEventListener("DOMContentLoaded", () => {
    console.log("page is fully loaded");
    document.getElementById('add-choice-field').addEventListener('click', SceneEditor.addChoiceField);
    document.getElementById('add-scene').addEventListener('click', () => formEditor.addScene());
    document.getElementById('edit-scene').addEventListener('click', () => formEditor.editScene());

    document.getElementById('start-story').addEventListener('click', startStory);
    document.getElementById("btn-ascii-tree-refresh").addEventListener("click", () => {
        AsciiTreeRenderer.generateTreeAscii(story);
    });
    const btnHtmlTree = document.getElementById('btn-html-tree-refresh');
    if (btnHtmlTree) {
        btnHtmlTree.addEventListener('click', () => TreeEditor.render(story));
    }

    // --- JSON Import/Export Button Events ---
    document.getElementById("import-json").addEventListener("click", importStory);
    document.getElementById("export-json").addEventListener("click", exportToJson);
    document.getElementById("export-html").addEventListener("click", () => {
        const protectStory = document.getElementById("export-antiscraping-check").checked;
        exportToHtml(protectStory);
    });

    // --- Design
    document.getElementById("theme-select").addEventListener("change", function() {
        applyTheme(this.value);
    });
    initializePopup();
});