import Scene from "../src/builder/Scene.js";
import Story from "../src/builder/Story.js";

describe("Test getSceneDepth method", () => {
    let story;

    beforeEach(() => {
        // Reset the story before each test
        story = new Story(Scene);
    });

    it("should return 0 for the root scene", () => {
        const sceneA = new Scene("A", "Root Scene");
        story.addScene(sceneA);
        story.root = sceneA;

        const depth = Story.getSceneDepth(story.scenes, sceneA);
        expect(depth).toBe(0);
    });

    it("should return the correct depth for a direct child scene", () => {
        const sceneA = new Scene("A", "Root Scene");
        const sceneB = new Scene("B", "Child Scene");
        sceneB.parent = sceneA;  // Set parent-child relationship
        story.addScene(sceneA);
        story.addScene(sceneB);
        story.root = sceneA;

        const depth = Story.getSceneDepth(story.scenes, sceneB);
        expect(depth).toBe(1);  // Depth of B should be 1 because it is a direct child of A
    });

    it("should return -1 for a scene not found in the story", () => {
        const sceneA = new Scene("A", "Root Scene");
        story.addScene(sceneA);
        story.root = sceneA;

        const sceneNotInStory = new Scene("Z", "Scene Not In Story");

        const depth = Story.getSceneDepth(story.scenes, sceneNotInStory);
        expect(depth).toBe(-1);  // Scene Z does not exist in the story
    });

    it("should return the correct depth for nested scenes", () => {
        const sceneA = new Scene("A", "Root Scene");
        const sceneB = new Scene("B", "Child Scene");
        const sceneC = new Scene("C", "Grandchild Scene");

        sceneB.parent = sceneA;
        sceneC.parent = sceneB;  // Nested child

        story.addScene(sceneA);
        story.addScene(sceneB);
        story.addScene(sceneC);
        story.root = sceneA;

        const depthB = Story.getSceneDepth(story.scenes, sceneB);
        const depthC = Story.getSceneDepth(story.scenes, sceneC);

        expect(depthB).toBe(1);  // Depth of B should be 1 (direct child of A)
        expect(depthC).toBe(2);  // Depth of C should be 2 (grandchild of A via B)
    });
});


describe("Test getScenesDFS method", () => {
    let story;

    beforeEach(() => {
        // Reset the story before each test
        story = new Story(Scene);
    });

    it("should return scenes in depth-first order starting from root", () => {
        const sceneA = new Scene("A", "Root Scene");
        const sceneB = new Scene("B", "Child Scene");
        const sceneC = new Scene("C", "Grandchild Scene");

        sceneB.parent = sceneA;
        sceneC.parent = sceneB;  // A -> B -> C

        sceneA.addChoice("Go to B", "B");
        sceneB.addChoice("Go to C", "C");

        story.addScene(sceneA);
        story.addScene(sceneB);
        story.addScene(sceneC);
        story.root = sceneA;

        const result = Story.getScenesDFS(story);

        // Verify the DFS order
        expect(result.length).toBe(3);
        expect(result[0].key).toBe("A");
        expect(result[1].key).toBe("B");
        expect(result[2].key).toBe("C");
    });

    it("should handle an empty story", () => {
        const result = Story.getScenesDFS(story);
        expect(result).toEqual([]);  // No scenes in the story
    });

    it("should handle a scene with no choices", () => {
        const sceneA = new Scene("A", "Root Scene");

        story.addScene(sceneA);
        story.root = sceneA;

        const result = Story.getScenesDFS(story);

        expect(result.length).toBe(1);  // Only the root scene should be present
        expect(result[0].key).toBe("A");
    });

    it("should handle multiple scenes with no cycles", () => {
        const sceneA = new Scene("A", "Root Scene");
        const sceneB = new Scene("B", "Child Scene");
        const sceneC = new Scene("C", "Child Scene");

        sceneA.addChoice("Go to B", "B");
        sceneA.addChoice("Go to C", "C");

        story.addScene(sceneA);
        story.addScene(sceneB);
        story.addScene(sceneC);
        story.root = sceneA;

        const result = Story.getScenesDFS(story);

        // Verify the DFS order should be A -> B -> C
        expect(result.length).toBe(3);
        expect(result[0].key).toBe("A");
        expect(result[1].key).toBe("B");
        expect(result[2].key).toBe("C");
    });

    it("should handle scenes with cycles", () => {
        const sceneA = new Scene("A", "Root Scene");
        const sceneB = new Scene("B", "Child Scene");
        const sceneC = new Scene("C", "Child Scene");

        sceneA.addChoice("Go to B", "B");
        sceneB.addChoice("Go to C", "C");
        sceneC.addChoice("Go to A", "A");  // Cycle: A -> B -> C -> A

        story.addScene(sceneA);
        story.addScene(sceneB);
        story.addScene(sceneC);
        story.root = sceneA;

        const result = Story.getScenesDFS(story);

        // DFS should visit all scenes, even with the cycle, in order A -> B -> C
        expect(result.length).toBe(3);
        expect(result[0].key).toBe("A");
        expect(result[1].key).toBe("B");
        expect(result[2].key).toBe("C");
    });

});

describe("Test cycle detection", () => {
    let story;

    beforeEach(() => {
        // Reset the story before each test
        story = new Story(Scene);
    });

    it("should detect a cycle in the story (A -> B -> C -> A)", () => {
        // Create scenes with a cycle: A -> B -> C -> A
        const sceneA = new Scene("A", "Scene A");
        const sceneB = new Scene("B", "Scene B");
        const sceneC = new Scene("C", "Scene C");

        sceneA.addChoice("Go to B", "B");
        sceneB.addChoice("Go to C", "C");
        sceneC.addChoice("Go to A", "A");  // Cycle: A -> B -> C -> A

        story.addScene(sceneA);
        story.addScene(sceneB);
        story.addScene(sceneC);
        story.root = sceneA;
        expect(Story.hasCircle(story)).toBe(true);
    });

    it("should detect no cycle in the story (A -> B -> C)", () => {
        const sceneA = new Scene("A", "Scene A");
        const sceneB = new Scene("B", "Scene B");
        const sceneC = new Scene("C", "Scene C");

        sceneA.addChoice("Go to B", "B");
        sceneB.addChoice("Go to C", "C");

        story.addScene(sceneA);
        story.addScene(sceneB);
        story.addScene(sceneC);
        story.root = sceneA;
        expect(Story.hasCircle(story)).toBe(false);
    });

    it("should detect no cycle in an empty story", () => {
        expect(Story.hasCircle(story)).toBe(false);
    });

    it("should detect no cycle when only one scene is present", () => {
        const sceneA = new Scene("A", "Scene A");
        story.addScene(sceneA);
        story.root = sceneA;
        expect(Story.hasCircle(story)).toBe(false);
    });

    it("should detect a cycle with multiple scenes but only one circular path (A -> B -> A)", () => {
        const sceneA = new Scene("A", "Scene A");
        const sceneB = new Scene("B", "Scene B");

        sceneA.addChoice("Go to B", "B");
        sceneB.addChoice("Go to A", "A");  // Cycle: A -> B -> A
        story.addScene(sceneA);
        story.addScene(sceneB);
        story.root = sceneA;
        expect(Story.hasCircle(story)).toBe(true);
    });
});

describe("Test editSceneChoices method", () => {
    let story;

    beforeEach(() => {
        // Reset the story before each test
        story = new Story(Scene);
    });

    it("should update choices for an existing scene", () => {
        const sceneA = new Scene("A", "Root Scene");
        story.addScene(sceneA);
        story.root = sceneA;

        const newChoices = new Map([["choice1", "option1"], ["choice2", "option2"]]);
        const result = story.editSceneChoices("A", newChoices);

        expect(result).toBe(true);
        expect(sceneA.choices).toEqual(newChoices);
    });

    it("should return false for a non-existent scene", () => {
        const newChoices = new Map([["choice1", "option1"]]);
        const result = story.editSceneChoices("Z", newChoices);

        expect(result).toBe(false);
    });

    it("should update choices to an empty map if provided", () => {
        const sceneA = new Scene("A", "Root Scene");
        story.addScene(sceneA);
        story.root = sceneA;

        const newChoices = new Map();
        const result = story.editSceneChoices("A", newChoices);

        expect(result).toBe(true);
        expect(sceneA.choices).toEqual(newChoices);
    });
});

describe("Test changeSceneParent method", () => {
    let story;

    beforeEach(() => {
        // Reset the story before each test
        story = new Story(Scene);
    });

    it("should change the parent of an existing scene to another existing scene", () => {
        const sceneA = new Scene("A", "Root Scene");
        const sceneB = new Scene("B", "Child Scene");
        sceneA.addChoice("to B", "B");
        story.addScene(sceneA);
        story.addScene(sceneB);
        story.root = sceneA;

        story.changeSceneParent("B", "A");

        expect(sceneB.parent).toBe(sceneA);
        expect(sceneA.choices.get("B")).toBe("to B");
    });

    it("should set parent to null if new parent does not exist", () => {
        const sceneA = new Scene("A", "Root Scene");
        const sceneB = new Scene("B", "Child Scene");
        story.addScene(sceneA);
        story.addScene(sceneB);
        story.root = sceneA;
        sceneB.parent = sceneA;  // Initial parent

        story.changeSceneParent("B", "Z");

        expect(sceneB.parent).toBe(null);
    });

    it("should update parent-child relationships correctly", () => {
        const sceneA = new Scene("A", "Root Scene");
        const sceneB = new Scene("B", "Child Scene");
        const sceneC = new Scene("C", "Grandchild Scene");
        sceneA.addChoice("to B", "B");
        sceneB.addChoice("to C", "C");
        story.addScene(sceneA);
        story.addScene(sceneB);
        story.addScene(sceneC);

        story.changeSceneParent("C", "A");

        expect(sceneC.parent).toBe(sceneA);
        expect(sceneA.choices.get("C")).toBe("to C");
        expect(sceneB.choices).not.toContain("C");
    });
});