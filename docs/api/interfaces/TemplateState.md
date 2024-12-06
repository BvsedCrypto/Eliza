[@ai16z/eliza v0.1.5-alpha.3](../index.md) / TemplateState

# Interface: TemplateState

Represents the current state/context of a conversation

## Extends

- [`State`](State.md)

## Properties

### userId?

> `optional` **userId**: \`$\{string\}-$\{string\}-$\{string\}-$\{string\}-$\{string\}\`

ID of user who sent current message

#### Inherited from

[`State`](State.md).[`userId`](State.md#userId)

#### Defined in

[packages/core/src/types.ts:240](https://github.com/f58637547/agentf/blob/main/packages/core/src/types.ts#L240)

***

### agentId?

> `optional` **agentId**: \`$\{string\}-$\{string\}-$\{string\}-$\{string\}-$\{string\}\`

ID of agent in conversation

#### Inherited from

[`State`](State.md).[`agentId`](State.md#agentId)

#### Defined in

[packages/core/src/types.ts:243](https://github.com/f58637547/agentf/blob/main/packages/core/src/types.ts#L243)

***

### bio

> **bio**: `string`

Agent's biography

#### Inherited from

[`State`](State.md).[`bio`](State.md#bio)

#### Defined in

[packages/core/src/types.ts:246](https://github.com/f58637547/agentf/blob/main/packages/core/src/types.ts#L246)

***

### lore

> **lore**: `string`

Agent's background lore

#### Inherited from

[`State`](State.md).[`lore`](State.md#lore)

#### Defined in

[packages/core/src/types.ts:249](https://github.com/f58637547/agentf/blob/main/packages/core/src/types.ts#L249)

***

### messageDirections

> **messageDirections**: `string`

Message handling directions

#### Inherited from

[`State`](State.md).[`messageDirections`](State.md#messageDirections)

#### Defined in

[packages/core/src/types.ts:252](https://github.com/f58637547/agentf/blob/main/packages/core/src/types.ts#L252)

***

### postDirections

> **postDirections**: `string`

Post handling directions

#### Inherited from

[`State`](State.md).[`postDirections`](State.md#postDirections)

#### Defined in

[packages/core/src/types.ts:255](https://github.com/f58637547/agentf/blob/main/packages/core/src/types.ts#L255)

***

### roomId

> **roomId**: \`$\{string\}-$\{string\}-$\{string\}-$\{string\}-$\{string\}\`

Current room/conversation ID

#### Inherited from

[`State`](State.md).[`roomId`](State.md#roomId)

#### Defined in

[packages/core/src/types.ts:258](https://github.com/f58637547/agentf/blob/main/packages/core/src/types.ts#L258)

***

### agentName?

> `optional` **agentName**: `string`

Optional agent name

#### Inherited from

[`State`](State.md).[`agentName`](State.md#agentName)

#### Defined in

[packages/core/src/types.ts:261](https://github.com/f58637547/agentf/blob/main/packages/core/src/types.ts#L261)

***

### senderName?

> `optional` **senderName**: `string`

Optional message sender name

#### Inherited from

[`State`](State.md).[`senderName`](State.md#senderName)

#### Defined in

[packages/core/src/types.ts:264](https://github.com/f58637547/agentf/blob/main/packages/core/src/types.ts#L264)

***

### actors

> **actors**: `string`

String representation of conversation actors

#### Inherited from

[`State`](State.md).[`actors`](State.md#actors)

#### Defined in

[packages/core/src/types.ts:267](https://github.com/f58637547/agentf/blob/main/packages/core/src/types.ts#L267)

***

### actorsData?

> `optional` **actorsData**: [`Actor`](Actor.md)[]

Optional array of actor objects

#### Inherited from

[`State`](State.md).[`actorsData`](State.md#actorsData)

#### Defined in

[packages/core/src/types.ts:270](https://github.com/f58637547/agentf/blob/main/packages/core/src/types.ts#L270)

***

### goals?

> `optional` **goals**: `string`

Optional string representation of goals

#### Inherited from

[`State`](State.md).[`goals`](State.md#goals)

#### Defined in

[packages/core/src/types.ts:273](https://github.com/f58637547/agentf/blob/main/packages/core/src/types.ts#L273)

***

### goalsData?

> `optional` **goalsData**: [`Goal`](Goal.md)[]

Optional array of goal objects

#### Inherited from

[`State`](State.md).[`goalsData`](State.md#goalsData)

#### Defined in

[packages/core/src/types.ts:276](https://github.com/f58637547/agentf/blob/main/packages/core/src/types.ts#L276)

***

### recentMessages

> **recentMessages**: `string`

Recent message history as string

#### Inherited from

[`State`](State.md).[`recentMessages`](State.md#recentMessages)

#### Defined in

[packages/core/src/types.ts:279](https://github.com/f58637547/agentf/blob/main/packages/core/src/types.ts#L279)

***

### recentMessagesData

> **recentMessagesData**: [`Memory`](Memory.md)[]

Recent message objects

#### Inherited from

[`State`](State.md).[`recentMessagesData`](State.md#recentMessagesData)

#### Defined in

[packages/core/src/types.ts:282](https://github.com/f58637547/agentf/blob/main/packages/core/src/types.ts#L282)

***

### actionNames?

> `optional` **actionNames**: `string`

Optional valid action names

#### Inherited from

[`State`](State.md).[`actionNames`](State.md#actionNames)

#### Defined in

[packages/core/src/types.ts:285](https://github.com/f58637547/agentf/blob/main/packages/core/src/types.ts#L285)

***

### actions?

> `optional` **actions**: `string`

Optional action descriptions

#### Inherited from

[`State`](State.md).[`actions`](State.md#actions)

#### Defined in

[packages/core/src/types.ts:288](https://github.com/f58637547/agentf/blob/main/packages/core/src/types.ts#L288)

***

### actionsData?

> `optional` **actionsData**: [`Action`](Action.md)[]

Optional action objects

#### Inherited from

[`State`](State.md).[`actionsData`](State.md#actionsData)

#### Defined in

[packages/core/src/types.ts:291](https://github.com/f58637547/agentf/blob/main/packages/core/src/types.ts#L291)

***

### actionExamples?

> `optional` **actionExamples**: `string`

Optional action examples

#### Inherited from

[`State`](State.md).[`actionExamples`](State.md#actionExamples)

#### Defined in

[packages/core/src/types.ts:294](https://github.com/f58637547/agentf/blob/main/packages/core/src/types.ts#L294)

***

### providers?

> `optional` **providers**: `string`

Optional provider descriptions

#### Inherited from

[`State`](State.md).[`providers`](State.md#providers)

#### Defined in

[packages/core/src/types.ts:297](https://github.com/f58637547/agentf/blob/main/packages/core/src/types.ts#L297)

***

### responseData?

> `optional` **responseData**: [`Content`](Content.md)

Optional response content

#### Inherited from

[`State`](State.md).[`responseData`](State.md#responseData)

#### Defined in

[packages/core/src/types.ts:300](https://github.com/f58637547/agentf/blob/main/packages/core/src/types.ts#L300)

***

### recentInteractionsData?

> `optional` **recentInteractionsData**: [`Memory`](Memory.md)[]

Optional recent interaction objects

#### Inherited from

[`State`](State.md).[`recentInteractionsData`](State.md#recentInteractionsData)

#### Defined in

[packages/core/src/types.ts:303](https://github.com/f58637547/agentf/blob/main/packages/core/src/types.ts#L303)

***

### recentInteractions?

> `optional` **recentInteractions**: `string`

Optional recent interactions string

#### Inherited from

[`State`](State.md).[`recentInteractions`](State.md#recentInteractions)

#### Defined in

[packages/core/src/types.ts:306](https://github.com/f58637547/agentf/blob/main/packages/core/src/types.ts#L306)

***

### formattedConversation?

> `optional` **formattedConversation**: `string`

Optional formatted conversation

#### Inherited from

[`State`](State.md).[`formattedConversation`](State.md#formattedConversation)

#### Defined in

[packages/core/src/types.ts:309](https://github.com/f58637547/agentf/blob/main/packages/core/src/types.ts#L309)

***

### knowledge?

> `optional` **knowledge**: `string`

Optional formatted knowledge

#### Inherited from

[`State`](State.md).[`knowledge`](State.md#knowledge)

#### Defined in

[packages/core/src/types.ts:312](https://github.com/f58637547/agentf/blob/main/packages/core/src/types.ts#L312)

***

### knowledgeData?

> `optional` **knowledgeData**: [`KnowledgeItem`](../type-aliases/KnowledgeItem.md)[]

Optional knowledge data

#### Inherited from

[`State`](State.md).[`knowledgeData`](State.md#knowledgeData)

#### Defined in

[packages/core/src/types.ts:314](https://github.com/f58637547/agentf/blob/main/packages/core/src/types.ts#L314)

***

### traits

> **traits**: `object`

#### active

> **active**: `string`[]

#### enhanced

> **enhanced**: `string`[]

#### evolved

> **evolved**: `string`[]

#### Defined in

[packages/core/src/types.ts:656](https://github.com/f58637547/agentf/blob/main/packages/core/src/types.ts#L656)

***

### mood

> **mood**: `object`

#### type

> **type**: [`MoodType`](../enumerations/MoodType.md)

#### Defined in

[packages/core/src/types.ts:661](https://github.com/f58637547/agentf/blob/main/packages/core/src/types.ts#L661)
