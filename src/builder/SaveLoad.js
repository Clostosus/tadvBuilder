export default class SaveLoad {
    constructor() {
        throw new Error('Static class');
    }

    /**
     * Builds the story tree from plain JSON text.
     * @param {string} filename
     * @param {Class} SceneClass
     * @param {Class} StoryClass
     * @returns {Story | null | Promise<string>} Returns new story,null deserialization fails, or Promise<string> if loading fails.
     */
    static async loadFromJson(filename,SceneClass, StoryClass)
    {
        if (!filename || typeof filename !== 'string') {
            return null;
        }
        let data = null;
        try {
            const response = await fetch(filename);
            if (!response.ok) {
                return null;
            }
            data = await response.json();
        } catch (e) {
            return null;
        }

        if (typeof StoryClass.fromJson !== 'function') {
            console.warn('StoryClass has no method called: fromJson');
            return null;
        }
        return StoryClass.fromJson(data,SceneClass);
    }

    /**
     * Saves the story tree as JSON text.
     * @param {Story} story
     * @param {string} filename
     * @returns {boolean | Promise<boolean>}
     */
    static async saveToJson(story, filename)
    {
        if (!story || !filename || typeof filename !== 'string') {
            console.error("Ungültige Eingabeparameter in saveToJson: story = ", story, ", filename = ", filename);
            return false;
        }

        const data = story.toJSON();
        try {
            let jsonStory = JSON.stringify(data)
            const fileBlob = new Blob([jsonStory], { type: 'text/json' });

            // Create a temporary link element
            const link = document.createElement('a');
            link.href = URL.createObjectURL(fileBlob);
            link.download = filename;
            // Programmatically click the link to trigger the download
            link.click();
            // Clean up the URL object
            URL.revokeObjectURL(link.href);

            console.log("Story saved to Json");
        }catch(e){
            console.error("Failed to save story to Json:" + e);
            return false;
        }
        return true;
    }

    /**
     * Saves a story as an executable HTML/CSS/JS file with which the story can be played in a browser.
     * @param {string} filename
     * @param {Story} story
     * @returns {boolean | Promise<boolean>}
     */
    static async saveToHtml(story, filename)
    {
        if (!story || !filename || typeof filename !== 'string') {
            console.error("Ungültige Eingabeparameter in saveToHtml: story = ", story, ", filename = ", filename);
            return false;
        }

        // base64 encoded viewer code parts, without encoding storing them as string without unintended escaping is hard
        // ------------------------------------------- VIEWER TEMPLATE PART 1
        const viewerPart1 = 'PCFET0NUWVBFIGh0bWw+CjxodG1sIGxhbmc9ImRlIj4KPGhlYWQ+CiAgICA8bWV0YSBjaGFyc2V0PSJVVEYtOCI+CiAgICA8dGl0bGU+U3RvcnktVmlld2VyPC90aXRsZT4KICAgIDxzdHlsZT4KICAgICAgICBib2R5IHsKICAgICAgICAgICAgZm9udC1mYW1pbHk6IHN5c3RlbS11aSwgc2Fucy1zZXJpZjsKICAgICAgICB9CiAgICAgICAgaDIgewogICAgICAgICAgICBjb2xvcjogIzBmMTcyYTsKICAgICAgICAgICAgbWFyZ2luLWJvdHRvbTogMC4yNXJlbTsKICAgICAgICB9CiAgICAgICAgI2dhbWUgewogICAgICAgICAgICBiYWNrZ3JvdW5kOiAjZjFmNWY5OwogICAgICAgICAgICBib3JkZXI6IDFweCBzb2xpZCAjY2JkNWUxOwogICAgICAgICAgICBwYWRkaW5nOiAxcmVtOwogICAgICAgICAgICBib3JkZXItcmFkaXVzOiA4cHg7CiAgICAgICAgICAgIG1hcmdpbjogMCBhdXRvOwogICAgICAgICAgICBtYXgtd2lkdGg6IDgwMHB4OwogICAgICAgICAgICB3aGl0ZS1zcGFjZTogcHJlLXdyYXA7CiAgICAgICAgICAgIGJveC1zaGFkb3c6IDAgNHB4IDEycHggcmdiYSgwLDAsMCwwLjA2KTsKICAgICAgICB9CiAgICAgICAgI2dhbWUgYnV0dG9uIHsKICAgICAgICAgICAgYmFja2dyb3VuZC1jb2xvcjogIzNiODJmNjsKICAgICAgICAgICAgd2lkdGg6IDEwMCU7CiAgICAgICAgICAgIGNvbG9yOiB3aGl0ZTsKICAgICAgICAgICAgYm9yZGVyOiBub25lOwogICAgICAgICAgICBwYWRkaW5nOiAwLjZyZW0gMXJlbTsKICAgICAgICAgICAgYm9yZGVyLXJhZGl1czogNnB4OwogICAgICAgICAgICBjdXJzb3I6IHBvaW50ZXI7CiAgICAgICAgICAgIG1hcmdpbi10b3A6IDAuNXJlbTsKICAgICAgICAgICAgZm9udC13ZWlnaHQ6IDUwMDsKICAgICAgICB9CiAgICA8L3N0eWxlPgo8L2hlYWQ+Cjxib2R5Pgo8ZGl2IGlkPSJnYW1lIj48L2Rpdj4KCjxzY3JpcHQ+CiAgICBjb25zdCBzdG9yeSA9IHsKICAgICAgICAvLyBJTlNFUlQgSlNPTiBTVE9SWSBIRVJFCg==';
        // ------------------------------------------- VIEWER TEMPLATE PART 2
        const viewerPart2 = 'ICAgIH07CgogICAgZnVuY3Rpb24gc2hvd1NjZW5lKGtleSkKICAgIHsKICAgICAgICBjb25zdCBzY2VuZSA9IHN0b3J5W2tleV07CiAgICAgICAgaWYgKCFzY2VuZSkgcmV0dXJuOwoKICAgICAgICBjb25zdCBjb250YWluZXIgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgiZ2FtZSIpOwogICAgICAgIGNvbnRhaW5lci5pbm5lckhUTUwgPSAiIjsgLy8gZGVsZXRlIHByZXZpb3VzIGNvbnRlbnQvc2NlbmUKCiAgICAgICAgY29uc3QgdGl0bGUgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCJoMiIpOwogICAgICAgIHRpdGxlLnRleHRDb250ZW50ID0ga2V5OyBjb250YWluZXIuYXBwZW5kQ2hpbGQodGl0bGUpOwoKICAgICAgICBjb25zdCB0ZXh0ID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgicCIpOwogICAgICAgIHRleHQudGV4dENvbnRlbnQgPSBzY2VuZS50ZXh0OyBjb250YWluZXIuYXBwZW5kQ2hpbGQodGV4dCk7CgogICAgICAgIGlmICghc2NlbmUuY2hvaWNlcyB8fCBzY2VuZS5jaG9pY2VzLmxlbmd0aCA9PT0gMCkgcmV0dXJuOwoKICAgICAgICBmb3IgKGNvbnN0IGMgb2Ygc2NlbmUuY2hvaWNlcykgewogICAgICAgICAgICBjb25zdCBidXR0b24gPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCJidXR0b24iKTsKICAgICAgICAgICAgYnV0dG9uLnRleHRDb250ZW50ID0gYy50ZXh0OwogICAgICAgICAgICBidXR0b24uYWRkRXZlbnRMaXN0ZW5lcigiY2xpY2siLCAoKSA9PiBzaG93U2NlbmUoYy5uZXh0KSk7CiAgICAgICAgICAgIGNvbnRhaW5lci5hcHBlbmRDaGlsZChidXR0b24pOwogICAgICAgICAgICBjb250YWluZXIuYXBwZW5kQ2hpbGQoZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgiYnIiKSk7CiAgICAgICAgfQogICAgfQoKICAgIHNob3dTY2VuZSgic3RhcnQiKTsKPC9zY3JpcHQ+CjwvYm9keT4KPC9odG1sPg==';

        const jsonObject = story.toJSON();
        let jsonText = JSON.stringify(jsonObject);
        jsonText = jsonText.slice(1,-1)

        try {
            const htmlText = window.atob(viewerPart1) + jsonText + window.atob(viewerPart2);
            const fileBlob = new Blob([htmlText], { type: 'text/html' });

            // Create a temporary link element
            const link = document.createElement('a');
            link.href = URL.createObjectURL(fileBlob);
            link.download = filename;
            // Programmatically click the link to trigger the download
            link.click();
            // Clean up the URL object
            URL.revokeObjectURL(link.href);

            console.log("Story saved to Html");
        }catch(e){
            console.error("Failed to save story to Json:" + e);
            return false;
        }
        return true;
    }
}