import Scene from "../src/builder/Scene.js";
import Story from "../src/builder/Story.js";
import SaveLoad from "../src/builder/SaveLoad.js";


const ERIK_STORY_DATA = [
    { key: "start", text: "Erik hat endlich sein wohlverdientes Weihnachtsgeld erhalten und beschließt, es für ein paar lang gehegte Träume zu nutzen: ein neues Auto, ein gemütliches Eigenheim und ein gepflegter Garten.", choices: [
            { text: "Haus kaufen", next: "trautesheim" },
            { text: "Auto kaufen", next: "autofahrt" }
        ]},
    { key: "trautesheim", text: "Er steht vor den Schlüsseln zu seinem brandneuen, noch leeren Haus. Die Wände sind kahl, das Licht fällt durch große Fenster - alles wartet darauf, von ihm mit Leben gefüllt zu werden.", parentKey: "start", choices: [
            { text: "Sessel bauen", next: "sesselsitzen" },
            { text: "Kamin bauen", next: "kaminwärme" },
            { text: "Küche renovieren", next: "küchenrenovierung" }
        ]},
    { key: "autofahrt", text: "Mit dem frisch erworbenen Wagen schnürt Erik den Sicherheitsgurt, dreht den Schlüssel und lässt den Motor mit einem satten Brummen erwachen. Jetzt will er das Fahrzeug testen und eine kleine Spritztour starten.", parentKey: "start", choices: [
            { text: "In die Berge fahren", next: "bergfahrt" },
            { text: "In Stadt fahren", next: "stadtfahrt" }
        ]},
    { key: "sesselsitzen", text: "Erik lehnt sich zufrieden in den neuen Sessel zurück. Der Geruch von frischem Holz umhüllt ihn. Es ist der perfekte Ort für entspannte Abende und unvergessliche Gespräche.", parentKey: "trautesheim" },
    { key: "kaminwärme", text: "Das Feuer knistert sanft im neu gebauten Kamin. Erik fühlt sich geborgen und weiß, dass dies der Mittelpunkt seines zukünftigen Lebens wird, wohin Familie und Freunde gerne kommen werden.", parentKey: "trautesheim" },
    { key: "küchenrenovierung", text: "Die moderne Küche erstrahlt nun in hellem Glanz. Erik kann es kaum erwarten, die ersten gemeinsamen Mahlzeiten mit Freunden und Familie zu kochen und zu genießen.", parentKey: "trautesheim" },
    { key: "bergfahrt", text: "Die Frischluft erfüllt Eriks Lungen, während er die kurvenreiche Straße in die Berge hinauffährt. Der Ausblick ist atemberaubend und bringt ein Lächeln auf sein Gesicht: Freiheit leicht gemacht.", parentKey: "autofahrt" },
    { key: "stadtfahrt", text: "Erik cruist durch die pulsierenden Straßen der Stadt. Die Lichter blitzen und es gibt so viel zu entdecken. Freude und Aufregung erfüllen ihn, als er in seine neue Freiheit eintaucht.", parentKey: "autofahrt" }
];

describe("Test import", () => {
    it("load a story from json file", async () => {
        let story = await SaveLoad.loadFromJson("../examples/EriksEigenheim.json", Scene, Story);

        expect(story).toBeDefined();
        expect(story).not.toBeNull();
        expect(story).toBeInstanceOf(Story);
        expect(story.root).toBeInstanceOf(Scene);
        expect(story.root.key).toBe("start");
        expect(story.scenes.size).toBe(8);
        expect(story.scenes.get("stadtfahrt")).toBeDefined();
        expect(story.scenes.get("stadtfahrt").text).toBe("Erik cruist durch die pulsierenden Straßen der Stadt. " +
                "Die Lichter blitzen und es gibt so viel zu entdecken. " +
                "Freude und Aufregung erfüllen ihn, als er in seine neue Freiheit eintaucht.");
    })
})

describe("Test export", () => {
    it("export a story to json", async () => {
        let story = new Story(Scene);

        ERIK_STORY_DATA.forEach(sceneData => {
            const parentScene = sceneData.parentKey ? story.getScene(sceneData.parentKey) : null;
            const scene = new Scene(sceneData.key, sceneData.text, parentScene);
            if (sceneData.choices) {
                sceneData.choices.forEach(choice => {
                    scene.addChoice(choice.text, choice.next);
                });
            }
            story.addScene(scene);
        });

        let saved = await SaveLoad.saveToJson(story, "CopyEriksEigenheim.json");
        expect(saved).toBeDefined();
        expect(saved).toBe(true);
    })

    it("should return false when exporting null story to json", async () => {
        let saved = await SaveLoad.saveToJson(null, "null-story.json");
        expect(saved).toBe(false);
    });

    it("should return false when exporting null story to html", async () => {
        let saved = await SaveLoad.saveToJson(null, "undefined-story.html");
        expect(saved).toBe(false);
    });
})