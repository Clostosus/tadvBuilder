/**
 * Renders an HTML tree of the story structure with expandable/collapsible nodes.
 * Does not modify the story; maintains only UI state (expanded nodes).
 */
export default class TreeEditor {
    // Keep one instance per target container id to preserve expand/collapse state across renders
    static #instances = new Map();

    static #getInstance(targetElementId) {
        if (!this.#instances.has(targetElementId)) {
            this.#instances.set(targetElementId, new TreeEditor(targetElementId));
        }
        return this.#instances.get(targetElementId);
    }

    /**
     * Convenience static: delegate to instance to keep state.
     * @param {import('./core/Story.js').default} story
     * @param {string} targetElementId
     */
    static render(story, targetElementId = 'tree-html-area') {
        const inst = TreeEditor.#getInstance(targetElementId);
        inst.render(story);
    }

    constructor(targetElementId) {
        this.targetElementId = targetElementId;
        // Track expanded scene keys. Root will be expanded on first render.
        this.expanded = new Set();
    }

    /**
     * Render the story as a nested HTML list inside target container.
     * Previous content will be removed before rendering.
     * @param {import('./core/Story.js').default} story
     */
    render(story) {
        const container = this.#getContainer();
        if (!container) return;

        this.#clear(container);

        if (!this.#hasValidRoot(story)) {
            this.#appendNoRootMessage(container);
            return;
        }

        this.#ensureRootExpanded(story);

        const ul = this.#createRootList();
        this.#renderNode(story.root.key, ul, story, new Set());
        container.appendChild(ul);
    }

    // ===== Helper methods (private) =====

    #getContainer() {
        const container = document.getElementById(this.targetElementId);
        if (!container) {
            console.warn(`TreeEditor: container with id "${this.targetElementId}" not found.`);
        }
        return container;
    }

    #clear(container) {
        container.innerHTML = '';
    }

    #hasValidRoot(story) {
        return !!(story && story.root);
    }

    #appendNoRootMessage(container) {
        const p = document.createElement('p');
        p.textContent = 'Keine Startszene gefunden. Lege zuerst eine Szene mit dem Schlüssel "start" an.';
        container.appendChild(p);
    }

    #ensureRootExpanded(story) {
        if (!this.expanded.has(story.root.key)) {
            this.expanded.add(story.root.key);
        }
    }

    #createRootList() {
        const ul = document.createElement('ul');
        ul.classList.add('story-tree');
        return ul;
    }

    #renderNode(sceneKey, parentUl, story, path) {
        const li = document.createElement('li');
        const scene = story.getScene(sceneKey);

        if (!scene) {
            li.textContent = `${sceneKey} (Szene nicht gefunden)`;
            const addButton = this.#createAddButton(sceneKey, story);
            addButton.classList.add('tree-addscene-btn');
            li.appendChild(addButton);
            parentUl.appendChild(li);
            return;
        }

        const header = this.#createNodeHeader(sceneKey, scene, story);
        li.appendChild(header);
        parentUl.appendChild(li);

        // Cycle detection
        if (path.has(sceneKey)) {
            const cycleNote = document.createElement('em');
            cycleNote.textContent = ' (Zyklus)';
            li.appendChild(cycleNote);
            return;
        }

        if (!this.#hasChildren(scene)) return;

        const isExpanded = this.#isExpanded(sceneKey);
        if (!isExpanded) return; // collapsed

        const childUl = document.createElement('ul');
        li.appendChild(childUl);

        const nextPath = new Set(path);
        nextPath.add(sceneKey);

        for (const [nextKey, choiceText] of scene.choices.entries()) {
            const edgeLi = document.createElement('li');
            const edgeLabel = document.createElement('span');
            edgeLabel.classList.add('tree-edge');
            edgeLabel.textContent = `→ ${choiceText}`;
            edgeLi.appendChild(edgeLabel);

            const nestedUl = document.createElement('ul');
            edgeLi.appendChild(nestedUl);
            childUl.appendChild(edgeLi);

            this.#renderNode(nextKey, nestedUl, story, nextPath);
        }
    }

    #createNodeHeader(sceneKey, scene, story) {
        const header = document.createElement('div');
        header.classList.add('tree-node-header');
        const isRoot = story && story.root && story.root.key === sceneKey;

        // Toggle only for non-root nodes that have children
        if (!isRoot && this.#hasChildren(scene)) {
            const btn = this.#createToggleButton(sceneKey, story);
            header.appendChild(btn);
        } else {
            header.appendChild(this.#createToggleSpacer());
        }

        const label = this.#createLabel(sceneKey, scene);
        header.appendChild(label);

        // Delete button (non-root only)
        if (!isRoot) {
            const delBtn = this.#createDeleteButton(sceneKey, story);
            // Platzierung: direkt in/bei der Node (neben dem Label), nicht ganz rechts
            label.appendChild(delBtn);
        }
        return header;
    }

    #createToggleButton(sceneKey, story) {
        const isExpanded = this.#isExpanded(sceneKey);
        const btn = document.createElement('button');
        btn.classList.add('tree-toggle');
        btn.setAttribute('aria-label', isExpanded ? 'Einklappen' : 'Ausklappen');
        btn.setAttribute('aria-expanded', String(isExpanded));
        btn.textContent = isExpanded ? '−' : '+';
        btn.addEventListener('click', (e) => this.#onToggleClick(e, sceneKey, story));
        return btn;
    }

    #createToggleSpacer() {
        const spacer = document.createElement('span');
        spacer.classList.add('tree-toggle-spacer');
        return spacer;
    }

    #createLabel(sceneKey, scene) {
        const label = document.createElement('span');
        label.classList.add('tree-node');
        const strong = document.createElement('strong');
        strong.textContent = sceneKey;
        label.appendChild(strong);
        return label;
    }

    #createDeleteButton(sceneKey, story) {
        const btn = document.createElement('button');
        btn.classList.add('tree-delete');
        btn.setAttribute('aria-label', `Szene "${sceneKey}" löschen`);
        btn.textContent = '🗑';
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            const ok = confirm(`Soll die Szene "${sceneKey}" wirklich gelöscht werden?`);
            if (!ok) return;
            const success = story.removeScene(sceneKey);
            if (!success) {
                console.warn(`TreeEditor: Szene "${sceneKey}" konnte nicht gelöscht werden.`);
                return;
            }
            // Cleanup expansion state of the removed node
            this.expanded.delete(sceneKey);
            // Re-render tree after deletion
            this.render(story);
        });
        return btn;
    }

    #createAddButton(sceneKey) {
        const btn = document.createElement('button');
        btn.classList.add('tree-add');
        btn.setAttribute('aria-label', `Szene "${sceneKey}" hinzufügen`);
        btn.textContent = '+';
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            const sceneKeyTextfield = document.getElementById("creator-scene-key");
            sceneKeyTextfield.value = sceneKey;
            const popup = document.getElementById("create-scene-popup");
            popup.style.display = "block";
        });
        return btn;
    }

    #onToggleClick(e, sceneKey, story) {
        e.preventDefault();
        e.stopPropagation();
        this.#toggleExpanded(sceneKey);
        this.render(story); // re-render full tree
    }

    #hasChildren(scene) {
        return !!(scene.choices && scene.choices.size);
    }

    #isExpanded(sceneKey) {
        return this.expanded.has(sceneKey);
    }

    #toggleExpanded(sceneKey) {
        if (this.expanded.has(sceneKey)) this.expanded.delete(sceneKey);
        else this.expanded.add(sceneKey);
    }
}
