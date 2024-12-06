[@ai16z/eliza v0.1.5-alpha.3](../index.md) / Character

# Type Alias: Character

> **Character**: `object`

Configuration for an agent character

## Type declaration

### id?

> `optional` **id**: [`UUID`](UUID.md)

Optional unique identifier

### name

> **name**: `string`

Character name

### username?

> `optional` **username**: `string`

Optional username

### system?

> `optional` **system**: `string`

Optional system prompt

### modelProvider

> **modelProvider**: [`ModelProviderName`](../enumerations/ModelProviderName.md)

Model provider to use

### imageModelProvider?

> `optional` **imageModelProvider**: [`ModelProviderName`](../enumerations/ModelProviderName.md)

Image model provider to use, if different from modelProvider

### modelEndpointOverride?

> `optional` **modelEndpointOverride**: `string`

Optional model endpoint override

### templates?

> `optional` **templates**: `object`

Optional prompt templates

### templates.goalsTemplate?

> `optional` **goalsTemplate**: `string`

### templates.factsTemplate?

> `optional` **factsTemplate**: `string`

### templates.messageHandlerTemplate?

> `optional` **messageHandlerTemplate**: `string`

### templates.shouldRespondTemplate?

> `optional` **shouldRespondTemplate**: `string`

### templates.continueMessageHandlerTemplate?

> `optional` **continueMessageHandlerTemplate**: `string`

### templates.evaluationTemplate?

> `optional` **evaluationTemplate**: `string`

### templates.twitterSearchTemplate?

> `optional` **twitterSearchTemplate**: `string`

### templates.twitterPostTemplate?

> `optional` **twitterPostTemplate**: `string`

### templates.twitterMessageHandlerTemplate?

> `optional` **twitterMessageHandlerTemplate**: `string`

### templates.twitterShouldRespondTemplate?

> `optional` **twitterShouldRespondTemplate**: `string`

### templates.farcasterPostTemplate?

> `optional` **farcasterPostTemplate**: `string`

### templates.farcasterMessageHandlerTemplate?

> `optional` **farcasterMessageHandlerTemplate**: `string`

### templates.farcasterShouldRespondTemplate?

> `optional` **farcasterShouldRespondTemplate**: `string`

### templates.telegramMessageHandlerTemplate?

> `optional` **telegramMessageHandlerTemplate**: `string`

### templates.telegramShouldRespondTemplate?

> `optional` **telegramShouldRespondTemplate**: `string`

### templates.discordVoiceHandlerTemplate?

> `optional` **discordVoiceHandlerTemplate**: `string`

### templates.discordShouldRespondTemplate?

> `optional` **discordShouldRespondTemplate**: `string`

### templates.discordMessageHandlerTemplate?

> `optional` **discordMessageHandlerTemplate**: `string`

### templates.base?

> `optional` **base**: `object`

New template format

#### Index Signature

 \[`key`: `string`\]: `string`

### templates.evolved?

> `optional` **evolved**: `object`

#### Index Signature

 \[`key`: `string`\]: `string`

### bio?

> `optional` **bio**: `string` \| `string`[]

Character biography

### lore?

> `optional` **lore**: `string`[]

Character background lore

### messageExamples?

> `optional` **messageExamples**: [`MessageExample`](../interfaces/MessageExample.md)[][]

Example messages

### postExamples?

> `optional` **postExamples**: `string`[]

Example posts

### topics?

> `optional` **topics**: `string`[]

Known topics

### adjectives?

> `optional` **adjectives**: `string`[]

Character traits

### knowledge?

> `optional` **knowledge**: `string`[]

Optional knowledge base

### clients

> **clients**: [`Clients`](../enumerations/Clients.md)[]

Supported client platforms

### plugins

> **plugins**: [`Plugin`](Plugin.md)[]

Available plugins

### settings?

> `optional` **settings**: `object`

Optional configuration

### settings.secrets?

> `optional` **secrets**: `object`

#### Index Signature

 \[`key`: `string`\]: `string`

### settings.buttplug?

> `optional` **buttplug**: `boolean`

### settings.voice?

> `optional` **voice**: `object`

### settings.voice.model?

> `optional` **model**: `string`

### settings.voice.url?

> `optional` **url**: `string`

### settings.voice.elevenlabs?

> `optional` **elevenlabs**: `object`

### settings.voice.elevenlabs.voiceId

> **voiceId**: `string`

New structured ElevenLabs config

### settings.voice.elevenlabs.model?

> `optional` **model**: `string`

### settings.voice.elevenlabs.stability?

> `optional` **stability**: `string`

### settings.voice.elevenlabs.similarityBoost?

> `optional` **similarityBoost**: `string`

### settings.voice.elevenlabs.style?

> `optional` **style**: `string`

### settings.voice.elevenlabs.useSpeakerBoost?

> `optional` **useSpeakerBoost**: `string`

### settings.model?

> `optional` **model**: `string`

### settings.embeddingModel?

> `optional` **embeddingModel**: `string`

### settings.chains?

> `optional` **chains**: `object`

#### Index Signature

 \[`key`: `string`\]: `any`[]

### settings.chains.evm?

> `optional` **evm**: `any`[]

### settings.chains.solana?

> `optional` **solana**: `any`[]

### clientConfig?

> `optional` **clientConfig**: `object`

Optional client-specific config

### clientConfig.discord?

> `optional` **discord**: `object`

### clientConfig.discord.shouldIgnoreBotMessages?

> `optional` **shouldIgnoreBotMessages**: `boolean`

### clientConfig.discord.shouldIgnoreDirectMessages?

> `optional` **shouldIgnoreDirectMessages**: `boolean`

### clientConfig.telegram?

> `optional` **telegram**: `object`

### clientConfig.telegram.shouldIgnoreBotMessages?

> `optional` **shouldIgnoreBotMessages**: `boolean`

### clientConfig.telegram.shouldIgnoreDirectMessages?

> `optional` **shouldIgnoreDirectMessages**: `boolean`

### style?

> `optional` **style**: `object`

Writing style guides

### style.all

> **all**: `string`[]

### style.chat

> **chat**: `string`[]

### style.post

> **post**: `string`[]

### twitterProfile?

> `optional` **twitterProfile**: `object`

Optional Twitter profile

### twitterProfile.id

> **id**: `string`

### twitterProfile.username

> **username**: `string`

### twitterProfile.screenName

> **screenName**: `string`

### twitterProfile.bio

> **bio**: `string`

### twitterProfile.nicknames?

> `optional` **nicknames**: `string`[]

## Defined in

[packages/core/src/types.ts:669](https://github.com/f58637547/agentf/blob/main/packages/core/src/types.ts#L669)
