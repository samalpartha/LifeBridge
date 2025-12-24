export type KnowledgeTopic = {
    id: string;
    title: string;
    description: string;
    source_url: string;
};

export type KnowledgeContent = {
    topic_id: string;
    title: string;
    content: string;
    last_updated?: string;
    commit_sha?: string;
};

export const knowledgeApi = {
    getTopics: async (): Promise<KnowledgeTopic[]> => {
        const res = await fetch('/api/knowledge/topics');
        if (!res.ok) throw new Error('Failed to fetch topics');
        return res.json();
    },

    getTopicContent: async (topicId: string): Promise<KnowledgeContent> => {
        const res = await fetch(`/api/knowledge/topics/${topicId}`);
        if (!res.ok) throw new Error('Failed to fetch topic content');
        return res.json();
    }
};
