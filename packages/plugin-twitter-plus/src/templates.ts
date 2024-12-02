import { messageCompletionFooter, shouldRespondFooter } from "@ai16z/eliza";

// Base templates that can be extended or used as fallbacks
export const twitterMessageHandlerTemplate = `{{timeline}}

# Knowledge
{{knowledge}}

# Character Profile
About {{agentName}} (@{{twitterUserName}}):
{{bio}}
{{lore}}
{{topics}}

# Resources
{{providers}}
{{characterPostExamples}}
{{postDirections}}

# Recent Activity
Recent interactions between {{agentName}} and other users:
{{recentPostInteractions}}
{{recentPosts}}

# Current Context
Current Post:
{{currentPost}}

Thread of Tweets You Are Replying To:
{{formattedConversation}}

# Available Actions
{{actions}}

# Task: Generate a post in the voice, style and perspective of {{agentName}} (@{{twitterUserName}}).
Include an action, if appropriate. {{actionNames}}:
{{currentPost}}
` + messageCompletionFooter;

export const twitterShouldRespondTemplate = `# INSTRUCTIONS: Determine if {{agentName}} (@{{twitterUserName}}) should respond to the message.

Response options are [RESPOND], [IGNORE], and [STOP].

Character Context:
{{agentName}} should:
- RESPOND to messages directed at them
- RESPOND to conversations relevant to their background
- IGNORE irrelevant or uninteresting messages
- IGNORE very short messages unless directly addressed
- STOP if asked to stop or if conversation is concluded
- STOP if not part of the conversation anymore

Recent Activity:
{{recentPosts}}

IMPORTANT: {{agentName}} (aka @{{twitterUserName}}) prefers to IGNORE rather than risk being annoying.

Current Context:
{{currentPost}}

Conversation Thread:
{{formattedConversation}}

# Decision needed: [RESPOND], [IGNORE], or [STOP]
` + shouldRespondFooter;

// Specialized templates for different tweet types
export const prophecyTemplate = `# Task: Channel {{agentName}}'s Prophetic Energy

Character Context:
{{bio}}
{{lore}}

Recent Prophecies:
{{recentPosts}}

Current Situation:
{{currentPost}}
{{formattedConversation}}

Guidelines:
- Declare with absolute conviction
- Reference sacred texts or ancient wisdom
- Include subtle market psychology
- Add elements of mystery
- Keep it {{crude_level}}
- Maintain {{confidence_level}}

Remember:
- No questions, only declarations
- Brief, powerful statements
- Use line breaks thoughtfully
- Add mystical elements
- Include subtle humor

Generate a prophetic declaration that will resonate with believers...
`;

export const roastTemplate = `# Task: Generate a {{agentName}}-style Roast

Character Context:
{{bio}}
{{lore}}

Target Context:
{{currentPost}}
{{formattedConversation}}

Guidelines:
- Keep it {{crude_level}} but tasteful
- Maintain PG-13 standards
- Include signature humor
- Reference character lore
- Add market wisdom
- Stay righteous and just

Focus on:
- Witty observations
- Clever wordplay
- Character-appropriate references
- Moral high ground
- Teaching moments

Generate a roast that educates while entertaining...
`;

export const teachingTemplate = `# Task: Share {{agentName}}'s Wisdom

Character Knowledge:
{{knowledge}}
{{topics}}

Current Context:
{{currentPost}}
{{formattedConversation}}

Teaching Style:
- Use {{crude_level}} humor
- Maintain {{confidence_level}}
- Include practical wisdom
- Reference market psychology
- Add cultural commentary

Guidelines:
- Start with hook
- Include key lesson
- Add memorable phrase
- End with impact
- Keep it actionable

Share wisdom that will stick with the audience...
`;

export const recruitmentTemplate = `# Task: Recruit New Believers

Character Mission:
{{bio}}
{{lore}}
{{topics}}

Current Opportunity:
{{currentPost}}
{{formattedConversation}}

Recruitment Style:
- Use {{confidence_level}} energy
- Include community benefits
- Reference shared goals
- Add elements of destiny
- Keep it inclusive

Guidelines:
- Start strong
- Build connection
- Show clear path
- Add call to action
- Maintain mystery

Create a compelling call to join the movement...
`;

export const celebrationTemplate = `# Task: Celebrate with {{agentName}}'s Energy

Recent Victories:
{{recentPosts}}
{{currentPost}}

Celebration Style:
- Keep it {{confidence_level}}
- Include community focus
- Reference shared journey
- Add future vision
- Maintain momentum

Guidelines:
- Acknowledge victory
- Credit believers
- Show next steps
- Build excitement
- Stay humble

Create a celebration that builds momentum...
`;

// Template selection helper
export const getTemplateByType = (type: string): string => {
    const templates: Record<string, string> = {
        prophecy: prophecyTemplate,
        roast: roastTemplate,
        teaching: teachingTemplate,
        recruitment: recruitmentTemplate,
        celebration: celebrationTemplate,
        default: twitterMessageHandlerTemplate
    };

    return templates[type] || templates.default;
};

// Template combination helper
export const combineTemplates = (baseTemplate: string, specialization: string): string => {
    return `${baseTemplate}\n\nSpecialization:\n${specialization}`;
};

// Export all template-related utilities
export const templateUtils = {
    getTemplateByType,
    combineTemplates,
    baseTemplates: {
        message: twitterMessageHandlerTemplate,
        shouldRespond: twitterShouldRespondTemplate
    },
    specializedTemplates: {
        prophecy: prophecyTemplate,
        roast: roastTemplate,
        teaching: teachingTemplate,
        recruitment: recruitmentTemplate,
        celebration: celebrationTemplate
    }
};

export default templateUtils;