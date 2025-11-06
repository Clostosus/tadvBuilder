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
}