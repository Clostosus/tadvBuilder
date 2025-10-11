const story = {};


function renderTree()
{
    if (Object.keys(story).length === 0) {
        document.getElementById('tree-output').textContent = '(noch kein Baum erstellt)';
        return;
    }
    let output = '';
    for (const [key, node] of Object.entries(story)) {
        output += `[34m(${key})[0m`;
        if (node.choices && node.choices.length > 0) {
            node.choices.forEach(choice => {
                output += `  └─ [32m${choice.text}[0m → [35m${choice.next}[0m`;
            });
        } else {
            output += `  └─ [keine Entscheidungen]`;
        }
    }
    document.getElementById('tree-output').textContent = output;
}

function addChoiceField()
{
    const container = document.createElement('div');
    container.className = 'choice-inputs';
    container.innerHTML = `
        <input type="text" class="choice-text" placeholder="Entscheidungstext">
        <input type="text" class="choice-next" placeholder="Nächste Szene (Schlüssel)">
      `;
    document.getElementById('choices-container').appendChild(container);
}

function saveScene()
{
    const key = document.getElementById('scene-key').value.trim();
    const text = document.getElementById('scene-text').value.trim();
    if (!key || !text) return alert("Bitte Schlüssel und Text ausfüllen.");

    const choicesEls = document.querySelectorAll('.choice-inputs');
    const choices = [];
    choicesEls.forEach(el => {
        const text = el.querySelector('.choice-text').value.trim();
        const next = el.querySelector('.choice-next').value.trim();
        if (text && next) choices.push({ text, next });
    });

    story[key] = { text, choices };
    updateOutput();
    renderPreview(key);
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
    notice.textContent = `✅ Szene '${key}' wurde gespeichert.`;
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
    document.getElementById('output').textContent = Object.keys(story).length > 0
        ? JSON.stringify(story, null, 2)
        : "(noch keine Szenen erstellt)";
}

function renderPreview(key)
{
    const scene = story[key];
    if (!scene) return;
    let html = `<p><strong>${key}</strong>: ${scene.text}</p>`;
    scene.choices.forEach(choice => {
        html += `<button disabled>${choice.text} → ${choice.next}</button><br>`;
    });
    document.getElementById('preview').innerHTML = html;
}

function startStory()
{
    if (!story.start) {
        alert("Keine 'start'-Szene gefunden.");
        return;
    }
    renderScene("start");
}

function renderScene(key)
{
    const area = document.getElementById('play-area');
    const scene = story[key];
    if (!scene) {
        area.innerHTML = `<p><em>Szene '${key}' nicht gefunden.</em></p>`;
        return;
    }
    let html = `<p><strong>${key}</strong>: ${scene.text}</p>`;
    scene.choices.forEach(choice => {
        html += `<button onclick="renderScene('${choice.next}')">${choice.text}</button><br>`;
    });
    area.innerHTML = html;
}