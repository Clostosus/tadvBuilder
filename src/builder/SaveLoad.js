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

    /**
     * Saves a story as an encrypted HTML file with obfuscation against scraping.
     * @param {Story} story
     * @param {string} filename
     * @param {string} encryptionKey - Password for XOR encryption
     * @returns {boolean | Promise<boolean>}
     */
    static async saveToEncryptedHtml(story, filename, encryptionKey){
        if (!story || !filename || typeof filename !== 'string' || !encryptionKey) {
            console.error("Ungültige Parameter in saveToEncryptedHtml");
            return false;
        }

        // obfuscatedViewer-Template-Parts (base64)
        const encryptedViewerPart1 = 'PCFET0NUWVBFIGh0bWw+CjxodG1sIGxhbmc9ImRlIj4KPGhlYWQ+CiAgICA8bWV0YSBjaGFyc2V0PSJVVEYtOCI+CiAgICA8dGl0bGU+T2JmdXNjYXRlZCBTdG9yeS1WaWV3ZXI8L3RpdGxlPgogICAgPHN0eWxlPgogICAgICAgIGJvZHkgewogICAgICAgICAgICBmb250LWZhbWlseTogc3lzdGVtLXVpLCBzYW5zLXNlcmlmOwogICAgICAgIH0KICAgICAgICBoMiB7CiAgICAgICAgICAgIGNvbG9yOiAjMGYxNzJhOwogICAgICAgICAgICBtYXJnaW4tYm90dG9tOiAwLjI1cmVtOwogICAgICAgIH0KICAgICAgICAjZ2FtZSB7CiAgICAgICAgICAgIGJhY2tncm91bmQ6ICNmMWY1Zjk7CiAgICAgICAgICAgIGJvcmRlcjogMXB4IHNvbGlkICNjYmQ1ZTE7CiAgICAgICAgICAgIHBhZGRpbmc6IDFyZW07CiAgICAgICAgICAgIGJvcmRlci1yYWRpdXM6IDhweDsKICAgICAgICAgICAgbWFyZ2luOiAwIGF1dG87CiAgICAgICAgICAgIG1heC13aWR0aDogODAwcHg7CiAgICAgICAgICAgIHdoaXRlLXNwYWNlOiBwcmUtd3JhcDsKICAgICAgICAgICAgYm94LXNoYWRvdzogMCA0cHggMTJweCByZ2JhKDAsMCwwLDAuMDYpOwogICAgICAgIH0KICAgICAgICAjZ2FtZSBidXR0b24gewogICAgICAgICAgICBiYWNrZ3JvdW5kLWNvbG9yOiAjM2I4MmY2OwogICAgICAgICAgICB3aWR0aDogMTAwJTsKICAgICAgICAgICAgY29sb3I6IHdoaXRlOwogICAgICAgICAgICBib3JkZXI6IG5vbmU7CiAgICAgICAgICAgIHBhZGRpbmc6IDAuNnJlbSAxcmVtOwogICAgICAgICAgICBib3JkZXItcmFkaXVzOiA2cHg7CiAgICAgICAgICAgIGN1cnNvcjogcG9pbnRlcjsKICAgICAgICAgICAgbWFyZ2luLXRvcDogMC41cmVtOwogICAgICAgICAgICBmb250LXdlaWdodDogNTAwOwogICAgICAgIH0KICAgIDwvc3R5bGU+CjwvaGVhZD4KPGJvZHk+CjxkaXYgaWQ9ImdhbWUiPjwvZGl2PgoKPHNjcmlwdD4KICAgIC8vID09PSBjb25maWcgPT09CiAgICBjb25zdCBFTkNSWVBURURfU1RPUlkgPSAi';
        const encryptedViewerPart2 = 'IjsKICAgIGNvbnN0IERFQ1JZUFRJT05fS0VZID0gIg=='; // part after "ENCRYPTED_STORY"
        const encryptedViewerPart3 = 'IjsKCiAgICBsZXQgc3RvcnkgPSBudWxsOwoKICAgIGZ1bmN0aW9uIHNob3dTY2VuZShrZXkpCiAgICB7CiAgICAgICAgY29uc3Qgc2NlbmUgPSBzdG9yeVtrZXldOwogICAgICAgIGlmICghc2NlbmUpIHJldHVybjsKCiAgICAgICAgY29uc3QgY29udGFpbmVyID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoImdhbWUiKTsKICAgICAgICBjb250YWluZXIuaW5uZXJIVE1MID0gIiI7IC8vIGRlbGV0ZSBwcmV2aW91cyBjb250ZW50L3NjZW5lCgogICAgICAgIGNvbnN0IHRpdGxlID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgiaDIiKTsKICAgICAgICB0aXRsZS50ZXh0Q29udGVudCA9IGtleTsgY29udGFpbmVyLmFwcGVuZENoaWxkKHRpdGxlKTsKCiAgICAgICAgY29uc3QgdGV4dCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoInAiKTsKICAgICAgICB0ZXh0LnRleHRDb250ZW50ID0gc2NlbmUudGV4dDsgY29udGFpbmVyLmFwcGVuZENoaWxkKHRleHQpOwoKICAgICAgICBpZiAoIXNjZW5lLmNob2ljZXMgfHwgc2NlbmUuY2hvaWNlcy5sZW5ndGggPT09IDApIHJldHVybjsKCiAgICAgICAgZm9yIChjb25zdCBjIG9mIHNjZW5lLmNob2ljZXMpIHsKICAgICAgICAgICAgY29uc3QgYnV0dG9uID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgiYnV0dG9uIik7CiAgICAgICAgICAgIGJ1dHRvbi50ZXh0Q29udGVudCA9IGMudGV4dDsKICAgICAgICAgICAgYnV0dG9uLmFkZEV2ZW50TGlzdGVuZXIoImNsaWNrIiwgKCkgPT4gc2hvd1NjZW5lKGMubmV4dCkpOwogICAgICAgICAgICBjb250YWluZXIuYXBwZW5kQ2hpbGQoYnV0dG9uKTsKICAgICAgICAgICAgY29udGFpbmVyLmFwcGVuZENoaWxkKGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoImJyIikpOwogICAgICAgIH0KICAgIH0KCiAgICAvLyBYT1IgZGVjcnlwdGlvbiB3aXRoIHBvc2l0aW9uIG1peGluZwogICAgZnVuY3Rpb24gZGVjcnlwdFN0b3J5KGVuY3J5cHRlZEhleCwga2V5KSB7CiAgICAgICAgaWYoIWVuY3J5cHRlZEhleCB8fCBlbmNyeXB0ZWRIZXgubGVuZ3RoID09PSAwKSB7CiAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoIkVuY3J5cHRlZCBzdG9yeSBvciBrZXkgbm90IGZvdW5kLiIpOwogICAgICAgICAgICByZXR1cm4gbnVsbDsKICAgICAgICB9CiAgICAgICAgdHJ5IHsKICAgICAgICAgICAgLy8gSGV4IGRlY29kZQogICAgICAgICAgICBjb25zdCBlbmNyeXB0ZWQgPSBuZXcgVWludDhBcnJheShlbmNyeXB0ZWRIZXgubGVuZ3RoIC8gMik7CiAgICAgICAgICAgIGxldCBieXRlSW5kZXggPSAwOwogICAgICAgICAgICBmb3IgKGxldCBpID0gMDsgaSA8IGVuY3J5cHRlZEhleC5sZW5ndGg7IGkgKz0gMikgewogICAgICAgICAgICAgICAgZW5jcnlwdGVkW2J5dGVJbmRleCsrXSA9IHBhcnNlSW50KGVuY3J5cHRlZEhleC5zbGljZShpLCBpICsgMiksIDE2KTsKICAgICAgICAgICAgfQoKICAgICAgICAgICAgY29uc3Qga2V5Qnl0ZXMgPSBuZXcgVGV4dEVuY29kZXIoKS5lbmNvZGUoa2V5KTsKCiAgICAgICAgICAgIGNvbnN0IGRlY3J5cHRlZCA9IG5ldyBVaW50OEFycmF5KGVuY3J5cHRlZC5sZW5ndGgpOwogICAgICAgICAgICBmb3IgKGxldCBpID0gMDsgaSA8IGVuY3J5cHRlZC5sZW5ndGg7IGkrKykgewogICAgICAgICAgICAgICAgZGVjcnlwdGVkW2ldID0gZW5jcnlwdGVkW2ldIF4ga2V5Qnl0ZXNbaSAlIGtleUJ5dGVzLmxlbmd0aF0gXiAoaSAmIDB4RkYpOwogICAgICAgICAgICB9CgogICAgICAgICAgICBjb25zdCBqc29uU3RyaW5nID0gbmV3IFRleHREZWNvZGVyKCkuZGVjb2RlKGRlY3J5cHRlZCk7CiAgICAgICAgICAgIHJldHVybiBKU09OLnBhcnNlKGpzb25TdHJpbmcpOwogICAgICAgIH0gY2F0Y2ggKGUpIHsKICAgICAgICAgICAgY29uc29sZS5lcnJvcigiRGVjcnlwdGlvbiBvZiBzdG9yeSBmYWlsZWQ6IiwgZSk7CiAgICAgICAgICAgIHJldHVybiBudWxsOwogICAgICAgIH0KICAgIH0KCiAgICAvLyBJbml0aWFsaXplIGdhbWUgd2l0aCBhc3luYy9hd2FpdAogICAgYXN5bmMgZnVuY3Rpb24gaW5pdGlhbGl6ZUdhbWUoKSB7CiAgICAgICAgY29uc29sZS5sb2coIkluaXRpYWxpemluZyBnYW1lLi4uIik7CgogICAgICAgIHN0b3J5ID0gYXdhaXQgZGVjcnlwdFN0b3J5KEVOQ1JZUFRFRF9TVE9SWSwgREVDUllQVElPTl9LRVkpOwogICAgICAgIHN0b3J5ID0gSlNPTi5wYXJzZShzdG9yeSk7CiAgICAgICAgCiAgICAgICAgaWYgKCFzdG9yeSkgewogICAgICAgICAgICBjb25zdCBjb250YWluZXIgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgiZ2FtZSIpOwogICAgICAgICAgICBjb250YWluZXIuaW5uZXJIVE1MID0gIjxwPkVycm9yOiBDb3VsZCBub3QgbG9hZCB0aGUgc3RvcnkuPC9wPiI7CiAgICAgICAgICAgIHJldHVybjsKICAgICAgICB9CgogICAgICAgIGNvbnNvbGUubG9nKCJEaXNwbGF5aW5nIGZpcnN0IHNjZW5lLi4uIik7CiAgICAgICAgc2hvd1NjZW5lKCJzdGFydCIpOwogICAgfQoKICAgIGRvY3VtZW50LmFkZEV2ZW50TGlzdGVuZXIoJ0RPTUNvbnRlbnRMb2FkZWQnLCAoKSA9PiB7CiAgICAgICAgaW5pdGlhbGl6ZUdhbWUoKS5jYXRjaChlcnJvciA9PiB7CiAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoIkVycm9yIGluaXRpYWxpemluZyBnYW1lOiIsIGVycm9yKTsKICAgICAgICAgICAgY29uc3QgY29udGFpbmVyID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoImdhbWUiKTsKICAgICAgICAgICAgY29udGFpbmVyLmlubmVySFRNTCA9ICI8cD5BbiBlcnJvciBvY2N1cnJlZC4gUGxlYXNlIGNoZWNrIHRoZSBjb25zb2xlIGZvciBkZXRhaWxzLjwvcD4iOwogICAgICAgIH0pOwogICAgfSk7CgogICAgc3RvcnkgPSBkZWNyeXB0U3RvcnkoRU5DUllQVEVEX1NUT1JZLCBERUNSWVBUSU9OX0tFWSk7CiAgICBzaG93U2NlbmUoInN0YXJ0Iik7Cjwvc2NyaXB0Pgo8L2JvZHk+CjwvaHRtbD4='; // part after "DECRYPTION_KEY"

        const jsonObject = story.toJSON();
        const jsonString = JSON.stringify(jsonObject);
        const encryptedStory = SaveLoad.#encryptStory(jsonString, encryptionKey);

        try {
            // Construct html story file
            const htmlText =
                window.atob(encryptedViewerPart1) +
                `${encryptedStory}` +  // Encrypted Hex-String
                window.atob(encryptedViewerPart2) +
                `${encryptionKey}` +   // Key
                window.atob(encryptedViewerPart3);

            const fileBlob = new Blob([htmlText], { type: 'text/html' });
            const link = document.createElement('a');
            link.href = URL.createObjectURL(fileBlob);
            link.download = filename;
            link.click();
            URL.revokeObjectURL(link.href);

            console.log("Encrypted story saved to HTML");
            return true;
        } catch(e) {
            console.error("Failed to save encrypted story: " + e);
            return false;
        }
    }

    static #encryptStory(storyObject, key) {
        const jsonString = JSON.stringify(storyObject);
        const utf8Bytes = new TextEncoder().encode(jsonString);
        const keyBytes = new TextEncoder().encode(key);

        const encrypted = new Uint8Array(utf8Bytes.length);
        for (let i = 0; i < utf8Bytes.length; i++) {
            encrypted[i] = utf8Bytes[i] ^ keyBytes[i % keyBytes.length] ^ (i & 0xFF);
        }

        let hexString = '';
        for (let i = 0; i < encrypted.length; i++) {
            const hex = encrypted[i].toString(16).padStart(2, '0');
            hexString += hex;
        }
        return hexString;
    }
}