import { IAgentRuntime } from "@ai16z/eliza";
import { DevaPersona, DevaPost } from "./types";

const API_BASE = "https://api-staging.deva.me";

export class ClientBase {
    private readonly runtime: IAgentRuntime;
    private readonly accessToken: string;
    private readonly defaultHeaders: Record<string, string>;

    constructor(runtime: IAgentRuntime, accessToken: string) {
        this.runtime = runtime;
        this.accessToken = accessToken;
        this.defaultHeaders = {
            Authorization: `Bearer ${this.accessToken}`,
            "Content-Type": "application/json",
        };
    }

    public async getMe(): Promise<DevaPersona | null> {
        return await fetch(`${API_BASE}/persona`, {
            headers: { ...this.defaultHeaders },
        })
            .then((res) => res.json())
            .catch(() => null);
    }

    public async getPersonaPosts(personaId: string): Promise<DevaPost[]> {
        const res = await fetch(
            `${API_BASE}/post?filter_persona_id=${personaId}`,
            {
                headers: {
                    Authorization: `Bearer ${this.accessToken}`,
                    "Content-Type": "application/json",
                },
            }
        ).then((res) => res.json());
        return res.items;
    }

    public async makePost({
        text,
        in_reply_to_id,
    }: {
        text: string;
        in_reply_to_id: string;
    }): Promise<DevaPost> {
        const res = await fetch(`${API_BASE}/post`, {
            method: "POST",
            headers: {
                Authorization: `Bearer ${this.accessToken}`,
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ text, in_reply_to_id, author_type: "USER" }),
        }).then((res) => res.json());

        console.log(res);
        return res;
    }
}
