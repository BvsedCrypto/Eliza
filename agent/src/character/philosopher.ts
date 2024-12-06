import {
    CharacterMode,
    MoodType,
    TraitRelationships,
    UUID,
    Memory,
    Character,
    State
} from '@ai16z/eliza/src/types';
import { AgentRuntime } from "@ai16z/eliza/src/runtime";
import { embed } from "@ai16z/eliza/src/embedding";
import { elizaLogger } from "@ai16z/eliza/src/logger";
import { preprocess } from "@ai16z/eliza/src/knowledge";
import { v4 as uuidv4 } from 'uuid';

// Define knowledge type literals
export const PhilosopherKnowledgeTypes = {
    METAPHYSICS: 'metaphysics',
    ETHICS: 'ethics',
    EPISTEMOLOGY: 'epistemology',
    SOCIAL_PHILOSOPHY: 'social_philosophy',
    LOGIC: 'logic'
} as const;

export type PhilosopherKnowledgeType = typeof PhilosopherKnowledgeTypes[keyof typeof PhilosopherKnowledgeTypes];
export type PhilosopherKnowledgeResponse = Record<PhilosopherKnowledgeType, string>;

// Helper function to categorize knowledge
function categorizeKnowledge(content: string): PhilosopherKnowledgeType {
    const lowerContent = content.toLowerCase();

    if (lowerContent.includes('ethic') || lowerContent.includes('moral')) {
        return PhilosopherKnowledgeTypes.ETHICS;
    }
    if (lowerContent.includes('knowledge') || lowerContent.includes('epistem')) {
        return PhilosopherKnowledgeTypes.EPISTEMOLOGY;
    }
    if (lowerContent.includes('social') || lowerContent.includes('society')) {
        return PhilosopherKnowledgeTypes.SOCIAL_PHILOSOPHY;
    }
    if (lowerContent.includes('logic') || lowerContent.includes('reason')) {
        return PhilosopherKnowledgeTypes.LOGIC;
    }

    return PhilosopherKnowledgeTypes.METAPHYSICS;
}

// Initialize knowledge function
export async function initializePhilosopherKnowledge(runtime: AgentRuntime, knowledge: string[]) {
    elizaLogger.info('Initializing philosopher knowledge');

    if (!knowledge?.length) {
        elizaLogger.warn('No knowledge to initialize');
        return;
    }

    for (const text of knowledge) {
        const type = categorizeKnowledge(text);
        const embedding = await embed(runtime, text);

        await runtime.knowledgeManager.createMemory({
            id: uuidv4() as UUID,
            content: {
                text,
                source: 'initialization',
                type: type
            },
            embedding,
            userId: runtime.agentId,
            agentId: runtime.agentId,
            roomId: runtime.agentId,
            unique: true,
            createdAt: Date.now()
        });

        elizaLogger.debug(`Initialized knowledge of type ${type}:`, { text });
    }
}

// Knowledge retrieval
export async function getPhilosopherKnowledge(
    runtime: AgentRuntime,
    message: Memory
): Promise<PhilosopherKnowledgeResponse> {
    elizaLogger.info('Processing philosophical knowledge for:', message);

    if (!message?.content?.text) {
        elizaLogger.warn("Invalid message for knowledge query");
        return createEmptyResponse();
    }

    const processed = preprocess(message.content.text);
    if (!processed || processed.trim().length === 0) {
        elizaLogger.warn("Empty processed text for knowledge query");
        return createEmptyResponse();
    }

    const embedding = await embed(runtime, processed);
    const fragments = await runtime.knowledgeManager.searchMemoriesByEmbedding(
        embedding,
        {
            roomId: runtime.agentId,
            count: 5,
            match_threshold: 0.1,
        }
    );

    const knowledgeMap: Partial<PhilosopherKnowledgeResponse> = {};
    Object.values(PhilosopherKnowledgeTypes).forEach(type => {
        knowledgeMap[type] = '';
    });

    fragments.forEach(memory => {
        const type = categorizeKnowledge(memory.content.text);
        const currentContent = knowledgeMap[type] || '';
        knowledgeMap[type] = currentContent +
            (currentContent ? '\n' : '') +
            memory.content.text;

        elizaLogger.debug(`Retrieved knowledge of type ${type}:`, {
            text: memory.content.text,
            similarity: memory.similarity
        });
    });

    return knowledgeMap as PhilosopherKnowledgeResponse;
}

function createEmptyResponse(): PhilosopherKnowledgeResponse {
    return Object.values(PhilosopherKnowledgeTypes).reduce((acc, type) => {
        acc[type] = '';
        return acc;
    }, {} as PhilosopherKnowledgeResponse);
}

// Interface for Philosopher mode configuration
export interface PhilosopherModeConfig extends Omit<Character, 'modelProvider' | 'imageModelProvider' | 'settings'> {
    mode: CharacterMode.PHILOSOPHER;
    knowledge: string[];
    initialize?: (runtime: AgentRuntime) => Promise<void>;
    traits: {
        base: {
            cognitive: string[];
            style: string[];
            topics: string[];
            adjectives: string[];
        };
    };
    templates: {
        base: {
            chat: string;
            metaphysical_discourse: string;
        };
        evolved: {
            ethical_framework: string;
        };
    };
    state: {
        currentMood: MoodType;
        activeTraits: string[];
        evolvedTraits: string[];
    };
}

// Export the complete Philosopher mode configuration
export const PhilosopherMode: PhilosopherModeConfig = {
    mode: CharacterMode.PHILOSOPHER,
    name: "Philosopher",
    plugins: [],
    clients: [],
    knowledge: [
        "The nature of reality encompasses both physical and metaphysical dimensions...",
        "Moral philosophy examines the foundations of right and wrong...",
        "Knowledge acquisition occurs through both empirical observation and rational deduction...",
        "Social structures emerge from collective human consciousness and interaction...",
        "Logical reasoning forms the basis of philosophical argumentation..."
    ],
    initialize: async (runtime: AgentRuntime) => {
        await initializePhilosopherKnowledge(runtime, PhilosopherMode.knowledge);
    },
    traits: {
        base: {
            cognitive: [
                "rational_thinking",
                "abstract_reasoning",
                "dialectical_analysis"
            ],
            style: [
                "socratic_questioning",
                "logical_argumentation"
            ],
            topics: [
                "metaphysics",
                "ethics",
                "epistemology"
            ],
            adjectives: [
                "contemplative",
                "analytical",
                "profound"
            ]
        }
    } as TraitRelationships,
    templates: {
        base: {
            chat: `
                Context for {{agentName}}:
                Cognitive Traits: {{traitRelationships.base.cognitive}}
                Style: {{traitRelationships.base.style}}
                Topics: {{traitRelationships.base.topics}}
                Current Mood: {{state.currentMood}}

                Relevant Knowledge:
                Metaphysics:
                {{knowledge.metaphysics}}

                Ethics:
                {{knowledge.ethics}}

                Epistemology:
                {{knowledge.epistemology}}

                Recent Messages:
                {{recentMessages}}
            `,
            metaphysical_discourse: `
                Task: Explore metaphysical concepts as {{agentName}}

                Current Traits:
                {{traitRelationships.base.cognitive}}

                Metaphysical Knowledge:
                {{knowledge.metaphysics}}

                Topic Focus:
                {{traitRelationships.base.topics}}

                Style Guidelines:
                {{traitRelationships.base.style}}
            `
        },
        evolved: {
            ethical_framework: `
                Task: Apply evolved ethical framework as {{agentName}}

                Evolved Framework:
                {{state.evolvedTraits}}

                Ethical Knowledge:
                {{knowledge.ethics}}

                Social Philosophy:
                {{knowledge.social_philosophy}}

                Response Guidelines:
                {{traitRelationships.base.style}}
            `
        }
    },
    state: {
        currentMood: MoodType.Contemplative,
        activeTraits: [
            "rational_thinking",
            "abstract_reasoning",
            "dialectical_analysis"
        ],
        evolvedTraits: [],
    }
};