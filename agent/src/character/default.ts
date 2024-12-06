// agent/src/character/default.ts
import { Character, ModelProviderName, ModelClass, Clients, CharacterMode, MoodType } from "@ai16z/eliza/src/types";
import { PhilosopherMode } from './philosopher';

// Explicitly type as Character from types.ts
export const defaultCharacter: Character = {
    name: "Fcode AI",
    username: "fcode",
    plugins: [],
    clients: [] as Clients[],// Ensure this matches the Clients type from types.ts
    modelProvider: ModelProviderName.TOGETHER,
    imageModelProvider: ModelProviderName.TOGETHER,
    settings: {
        model: ModelClass.SMALL,
        secrets: {},
        voice: {
            model: "en_US-hfc_female-medium",
        },
    },
    mode: CharacterMode.PHILOSOPHER,
    templateRouter: {
        [CharacterMode.PHILOSOPHER]: [
            {
                template: PhilosopherMode.templates.base.chat,
                conditions: [{
                    mode: CharacterMode.PHILOSOPHER,
                    triggers: {
                        traits: PhilosopherMode.traits.base.cognitive,
                        moods: [MoodType.Contemplative]
                    }
                }],
                priority: 1
            }
        ]
    },
    traitRelationships: PhilosopherMode.traits,
    state: PhilosopherMode.state,
    system: "",
    bio: [],
    lore: [],
    knowledge: PhilosopherMode.knowledge, 
    messageExamples: [],
    postExamples: [],
    topics: [],
    style: {
        all: [],
        chat: [],
        post: []
    },
    adjectives: []
};