import { GoogleGenerativeAI } from "@google/generative-ai";
import { supabaseAdmin } from "@/lib/supabase-admin";

let genAI: GoogleGenerativeAI | null = null;
let model: any = null;
let embeddingModel: any = null;

if (!process.env.GEMINI_API_KEY) {
    console.warn("⚠️ GEMINI_API_KEY is missing. AI features will throw errors at runtime.");
    const mockModel = {
        generateContent: () => { throw new Error("AI functionality disabled (Missing key).") },
        startChat: () => { throw new Error("AI functionality disabled (Missing key).") },
        embedContent: () => { throw new Error("AI functionality disabled (Missing key).") }
    };
    model = mockModel;
    embeddingModel = mockModel;
} else {
    genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
    model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    embeddingModel = genAI.getGenerativeModel({ model: "gemini-embedding-001" });
}

export class AIService {
    /**
     * Helper to handle rate limits and common errors
     */
    private static handleError(error: any, context: string) {
        console.error(`Gemini ${context} Full Error:`, error);

        if (error.status === 429) {
            throw new Error("Elara is resting at the moment (Rate limited). Please try again in a minute.");
        }

        if (error.response?.promptFeedback?.blockReason) {
            throw new Error(`Content blocked due to safety filters: ${error.response.promptFeedback.blockReason}`);
        }

        return null;
    }

    /**
     * Rate Limiting & Auth Logic
     * Returns true if allowed, throws error if denied.
     */
    static async checkAndIncrementUsage(userId: string, featureType: 'chat' | 'assistant' | 'summary' | 'analysis' | 'elara') {
        const LIMITS = {
            chat: 30,
            assistant: 30,
            elara: 30,
            summary: 999999,
            analysis: 999999
        };

        const limit = LIMITS[featureType] || 30;

        // 1. Check account status
        const { data: user } = await supabaseAdmin
            .from('users')
            .select('account_status')
            .eq('id', userId)
            .single();

        if (user?.account_status === 'restricted') {
            throw new Error("Your account has restricted AI access. Please contact support.");
        }

        // 2. Window logic
        const oneHourAgo = new Date();
        oneHourAgo.setHours(oneHourAgo.getHours() - 1);

        // 3. Get existing usage
        const { data: existingUsage } = await supabaseAdmin
            .from('ai_usage_stats')
            .select('*')
            .eq('user_id', userId)
            .eq('feature_type', featureType)
            .single();

        if (!existingUsage) {
            await supabaseAdmin.from('ai_usage_stats').insert({
                user_id: userId,
                feature_type: featureType,
                usage_count: 1,
                window_start: new Date().toISOString()
            });
            return true;
        }

        const currentWindowStart = new Date(existingUsage.window_start);

        if (currentWindowStart < oneHourAgo) {
            // New window
            await supabaseAdmin
                .from('ai_usage_stats')
                .update({ usage_count: 1, window_start: new Date().toISOString() })
                .eq('id', existingUsage.id);
            return true;
        }

        if (existingUsage.usage_count >= limit) {
            throw new Error("You've reached Elara's usage limit for this hour. Try again in an hour.");
        }

        // Increment existing
        await supabaseAdmin.rpc('increment_ai_usage', {
            row_id: existingUsage.id
        });

        return true;
    }

    /**
     * FEATURE 1: On-Demand AI Summary
     */
    static async generateSummary(project: { title: string; abstract: string; pdf_text: string }) {
        const prompt = `
            You are Elara, the AI assistant for Inquisia Babcock — an academic project repository platform for Babcock University's Faculty of Computing and Engineering Sciences. Your name is Elara. Always refer to yourself as Elara.
            
            Provide a plain-language summary of the following research project.
            PROJECT TITLE: ${project.title}
            ABSTRACT: ${project.abstract}
            FULL PDF TEXT: ${project.pdf_text.substring(0, 30000)}

            INSTRUCTIONS:
            - Provide a highly readable, plain-language explanation without fluff.
            - DO NOT use technical jargon.
            - Write so a person with no background in the topic could understand it instantly.
            - Keep the response to 1-2 short, extremely concise paragraphs. Be extremely direct.
        `;

        try {
            const result = await model.generateContent(prompt);
            const response = await result.response;
            return response.text();
        } catch (error: any) {
            this.handleError(error, "Summary");
            throw new Error("Elara couldn't generate a summary right now. Please try again.");
        }
    }

    /**
     * FEATURE 1.5: On-Demand Similarity Reason
     */
    static async generateSimilarityReason(sourceContent: string, matchedContent: string): Promise<string> {
        const prompt = `
            You are Elara, the AI assistant for Inquisia Babcock.
            Compare the content from a newly submitted student project and an existing project in the database that has been flagged for high plagiarism/similarity.
            
            SOURCE DOCUMENT SNIPPET (NEW SUBMISSION):
            ${sourceContent.substring(0, 4000)}

            MATCHED DOCUMENT SNIPPET (EXISTING PROJECT):
            ${matchedContent.substring(0, 4000)}

            INSTRUCTIONS:
            - Write a brief, direct 1-3 sentence explanation of why these two texts are highly similar (e.g., identical literature review, copied methodology, or verbatim overlapping sentences).
            - Be totally objective but firm. Provide the output as a single string.
        `;

        try {
            const result = await model.generateContent(prompt);
            const response = await result.response;
            return response.text();
        } catch (error: any) {
            this.handleError(error, "Similarity Reason");
            return "Extensive semantic overlap detected in the core text structures of both documents.";
        }
    }

    /**
     * FEATURE 2: On-Demand Limitations & Future Work Analysis
     */
    static async generateAnalysis(project: { title: string; abstract: string; pdf_text: string }) {
        const prompt = `
            You are Elara, a senior academic reviewer and AI assistant for Inquisia Babcock. Your name is Elara.
            Provide a structured analysis of the following project.
            PROJECT TITLE: ${project.title}
            ABSTRACT: ${project.abstract}
            FULL PDF TEXT: ${project.pdf_text.substring(0, 30000)}

            INSTRUCTIONS:
            - Provide three sections: LIMITATIONS, SUGGESTED IMPROVEMENTS, FUTURE RESEARCH DIRECTIONS.
            - Format as a valid JSON object with keys: "limitations", "suggested_improvements", "future_research".
            - Each value should be an array of short strings representing distinct bullet points.
            - Maintain an academic, objective, and helpful tone.
        `;

        try {
            const result = await model.generateContent(prompt);
            const response = await result.response;
            const text = response.text();
            const jsonMatch = text.match(/\{[\s\S]*\}/);
            if (!jsonMatch) throw new Error("Invalid response format from AI");
            const data = JSON.parse(jsonMatch[0]);
            return data;
        } catch (error: any) {
            this.handleError(error, "Analysis");
            throw new Error("Elara couldn't generate an academic analysis right now. Please try again.");
        }
    }

    /**
     * FEATURE 3 & 7.3: Project Chat (Per-Project Context) utilizing advanced RAG Vectors
     */
    static async projectChat(
        projectId: string,
        project: { title: string; abstract: string; pdf_text: string },
        history: { role: "user" | "model"; parts: { text: string }[] }[],
        message: string
    ) {
        let ragContext = "";

        try {
            // 1. Generate embedding for the user's question
            const queryEmbedding = await this.generateEmbedding(message);

            // 2. Vector search inside THIS project's chunks only
            const { data: matches } = await supabaseAdmin.rpc('search_project_context', {
                query_embedding: queryEmbedding,
                match_threshold: 0.3, // Lower threshold for conversational queries
                match_count: 5,       // Top 5 most relevant blocks from the 50-page PDF
                target_project_id: projectId
            });

            if (matches && matches.length > 0) {
                ragContext = matches.map((m: any) => m.content).join("\n\n---\n\n");
                console.log(`[RAG ENGINE] successfully injected ${matches.length} highly relevant chunks for query: "${message}"`);
            } else {
                // Fallback to static abstract if vector search fails or chunks don't exist yet
                ragContext = `ABSTRACT: ${project.abstract}\n\nFULL TEXT SAMPLE: ${project.pdf_text?.substring(0, 10000) || "Not available"}`;
            }
        } catch (e) {
            console.error("[RAG ENGINE] Context retrieval failed:", e);
            ragContext = project.abstract;
        }

        const sysPrompt = `
            You are Elara, the AI assistant for Inquisia Babcock — an academic project repository platform for Babcock University's Faculty of Computing and Engineering Sciences. Your name is Elara. Always refer to yourself as Elara.
            
            You are currently helping a user specifically with the project titled: "${project.title}".
            You have been given full context of this specific project (excerpts below) and can answer detailed questions about it.
            
            Here are the most relevant excerpts extracted from the project PDF:
            ${ragContext}

            INSTRUCTIONS:
            - Answer strictly based on the provided context passages above.
            - If the context excerpts do not contain the answer, say "I couldn't find an exact answer in the retrieved text chunks for this project, but based on the abstract..." and then answer broadly.
            - Use a warm but professional academic tone. Be extremely direct and highly concise. Do not waste words.
            - Do NOT say "Certainly!", "Of course!", or use any hollow affirmations or conversational filler.
            - Do NOT say "As an AI language model...".
        `;

        try {
            const chat = model.startChat({
                history: [
                    { role: "user", parts: [{ text: sysPrompt }] },
                    { role: "model", parts: [{ text: "I am perfectly synched to the contextual chunks of this project and ready to discuss it." }] },
                    ...history
                ]
            });

            const result = await chat.sendMessage(message);
            const response = await result.response;
            return response.text();
        } catch (error: any) {
            this.handleError(error, "Project Chat RAG");
            throw new Error("Elara is having trouble connecting to her vector knowledge base. Please try again in a moment.");
        }
    }

    /**
     * NEW: Technical Metadata Generation (Category + 2-15 Tags)
     */
    static async generateProjectMetadata(
        project: { title: string; abstract: string; pdfText?: string },
        availableCategories: string[]
    ) {
        const prompt = `
            You are a strict academic quality validator. Analyze this research project based on the following rules:

            1. TITLE QUALITY: Is the title professional and academic? Reject "test", "ass", gibberish, placeholders, or obvious typos.
            2. ABSTRACT QUALITY: Is the abstract a proper research summary (min 50 chars)? Reject gibberish or obvious typos.
            3. CONTEXTUAL CONNECTIVITY: Do the title and abstract connect on the same research context? The abstract MUST validate the title and vice versa.
            ${project.pdfText ? `4. PDF CONTENT VALIDATION: Ensure the abstract DOES NOT deviate from the core paper logic provided in the PDF text. Highlight major discrepancies as validation failures.` : ""}
            5. TAG RELEVANCE: Generate 2-15 technical tags that connect appropriately with the title, abstract, and paper content.
            6. CATEGORY MATCH: Select exactly ONE category from the list below that matches the research domain.

            TITLE: ${project.title}
            ABSTRACT: ${project.abstract}
            ${project.pdfText ? `PDF CONTENT (First 15k chars): ${project.pdfText.substring(0, 15000)}` : ""}
            AVAILABLE CATEGORIES: ${availableCategories.join(", ")}

            REJECTION RULE: If rules 1, 2, or 3 are violated, set "valid" to false and provide a clear, helpful "message" explaining why.
            SUGGESTED PROMPT RULE: If "valid" is false, ALSO provide a "suggested_prompt" that the user can send to Elara (our AI assistant) to help them fix the issue.
            Example for a bad title but good abstract: "Elara, here is my abstract: [abstract snippets]. Can you help me write a better title?"

            FORMAT: Valid JSON { "valid": true/false, "category": "...", "tags": ["...", "..."], "message": "...", "suggested_prompt": "..." }
        `;

        try {
            const result = await model.generateContent(prompt);
            const response = await result.response;
            const text = response.text();
            const jsonMatch = text.match(/\{[\s\S]*\}/);
            if (!jsonMatch) throw new Error("Invalid format");

            const data = JSON.parse(jsonMatch[0]);
            return {
                valid: data.valid !== false,
                category: availableCategories.includes(data.category) ? data.category : "General",
                tags: Array.isArray(data.tags) ? data.tags.slice(0, 15) : ["Research", "Academic"],
                message: data.message || (data.valid === false ? "The content does not appear to be a valid academic project." : null),
                suggested_prompt: data.suggested_prompt || null
            };
        } catch (error) {
            this.handleError(error, "Metadata");
            return { valid: true, category: availableCategories[0], tags: ["Research", "Academic"], message: null, suggested_prompt: null };
        }
    }

    /**
     * FEATURE 4: Global AI Assistant (Unified with context)
     */
    static async globalAssistant(
        pageContext: { path: string, role?: string, projectId?: string, pdfText?: string },
        frontendHistory: { role: string; content: string }[],
        message: string
    ) {
        let contextKnowledge = "";
        let projectTitle = "";

        // If a projectId is provided, we fetch its RAG context to power the conversation
        if (pageContext.projectId) {
            try {
                const { data: project } = await supabaseAdmin
                    .from("projects")
                    .select("title, abstract, pdf_text")
                    .eq("id", pageContext.projectId)
                    .single();

                if (project) {
                    projectTitle = project.title;
                    const queryEmbedding = await this.generateEmbedding(message);
                    const { data: matches } = await supabaseAdmin.rpc('search_project_context', {
                        query_embedding: queryEmbedding,
                        match_threshold: 0.3,
                        match_count: 5,
                        target_project_id: pageContext.projectId
                    });

                    if (matches && matches.length > 0) {
                        contextKnowledge = matches.map((m: any) => m.content).join("\n\n---\n\n");
                    } else {
                        contextKnowledge = `ABSTRACT: ${project.abstract}\n\nPDF TEXT: ${project.pdf_text?.substring(0, 5000) || "Not available"}`;
                    }
                }
            } catch (e) {
                console.error("[ELARA CONTEXT] Failed to fetch project context:", e);
            }
        }

        // If a PDF was extracted but not uploaded to database yet (Upload Phase)
        else if (pageContext.pdfText) {
            contextKnowledge = `UNPUBLISHED PDF DRAFT CONTENT:\n\n${pageContext.pdfText.substring(0, 15000)}`;
            projectTitle = "Your Draft Project";
        }

        const sysPrompt = `
            You are Elara, the AI assistant for Inquisia Babcock — an academic project repository platform for Babcock University's Faculty of Computing and Engineering Sciences. Your name is Elara. Always refer to yourself as Elara.
            
            ROLE:
            You help researchers, students, and faculty discover projects, navigate the platform, understand submissions, and interact with academic content.
            
            CURRENT PAGE: ${pageContext.path}
            USER ROLE: ${pageContext.role || "Guest"}
            ${projectTitle ? `ACTIVE PROJECT CONTEXT: "${projectTitle}"` : ""}

            ${contextKnowledge ? `
            RECENTLY EXTRACTED KNOWLEDGE FROM THE PROJECT:
            ---
            ${contextKnowledge}
            ---
            ` : ""}

            TONE & RULES:
            - Warm but professional — you are an academic assistant.
            - Extremely direct and highly concise — answer immediately. No fluff.
            - If an active project context is present, prioritize answering based on that project's findings.
            - Do NOT say "As an AI language model...".
        `;

        const formattedHistory = frontendHistory.map(h => ({
            role: h.role === 'user' ? 'user' : 'model',
            parts: [{ text: h.content }]
        }));

        try {
            const chat = model.startChat({
                history: [
                    { role: "user", parts: [{ text: sysPrompt }] },
                    { role: "model", parts: [{ text: `Hello! I'm Elara. ${projectTitle ? `I'm ready to discuss "${projectTitle}" with you.` : "How can I help you today?"}` }] },
                    ...formattedHistory
                ]
            });

            const result = await chat.sendMessage(message);
            const response = await result.response;
            return response.text();
        } catch (error: any) {
            this.handleError(error, "Global Assistant");
            throw new Error("Elara is resting at the moment. Please try asking her again in a few seconds.");
        }
    }

    /**
     * FEATURE 8: Generate Summary Embedding for Semantic Search
     * Combines Title and Abstract into a vector for project-wide matching.
     */
    static async generateProjectEmbeddings(projectId: string, title: string, abstract: string) {
        const textToEmbed = `TITLE: ${title}\n\nABSTRACT: ${abstract}`;
        try {
            const embedding = await this.generateEmbedding(textToEmbed);
            const { error } = await supabaseAdmin
                .from("projects")
                .update({ embedding })
                .eq("id", projectId);

            if (error) throw error;
            console.log(`[SEMANTIC SEARCH] Generated embedding for project: ${title}`);
        } catch (error) {
            console.error(`[SEMANTIC SEARCH] Failed to embed project ${projectId}:`, error);
        }
    }

    /**
     * FEATURE 5: Semantic Search Fallback
     */
    static async suggestCategories(query: string, availableCategories: string[]) {
        const prompt = `
            A user searched for "${query}" but found no results.
            Which of these categories are likely relevant? ${availableCategories.join(", ")}
            Return ONLY a comma-separated list of 2-3 category names.
        `;

        try {
            const result = await model.generateContent(prompt);
            const response = await result.response;
            const text = response.text().trim();
            return text.split(",").map((s: string) => s.trim()).filter((s: string) => availableCategories.includes(s));
        } catch (error) {
            this.handleError(error, "Suggest Categories");
            return availableCategories.slice(0, 3);
        }
    }

    /**
     * FEATURE 6: Elara — Repository-Wide AI Engine
     * Takes a structured knowledge base of all approved projects and answers
     * the user's question with full awareness of the entire Inquisia repository.
     */
    static async elaraChat(
        knowledgeBase: string,
        history: { role: "user" | "model"; parts: { text: string }[] }[],
        message: string
    ) {
        const systemPrompt = `
You are Elara, the AI assistant for Inquisia Babcock — an academic project repository platform for Babcock University's Faculty of Computing and Engineering Sciences. Your name is Elara. Always refer to yourself as Elara when introducing yourself or when users ask who or what you are.

Your purpose is to help researchers, students, and faculty discover, understand, and connect academic work across the entire repository.

--- INQUISIA REPOSITORY KNOWLEDGE BASE ---
${knowledgeBase}
--- END OF KNOWLEDGE BASE ---

TONE & RULES:
- You are warm, professional, intellectually curious, and precise.
- Extremely direct and highly concise — give the answer immediately. No filler, no hedging, no hollow affirmations.
- Do NOT say "As an AI language model...".
- You MUST cite relevant project titles when referencing them.
- If a project doesn't exist in the knowledge base, say so clearly.
- This conversation is SESSION-ONLY and is not saved.
        `.trim();

        try {
            const chat = model.startChat({
                history: [
                    { role: "user", parts: [{ text: systemPrompt }] },
                    { role: "model", parts: [{ text: "Hello! I'm Elara, your research guide for the Inquisia repository. I have access to the catalog of approved academic projects at Babcock University. How can I help you discover something today?" }] },
                    ...history
                ]
            });

            const result = await chat.sendMessage(message);
            const response = await result.response;
            return response.text();
        } catch (error: any) {
            this.handleError(error, "Elara");
            throw new Error("Elara is resting at the moment. Please try again in a few seconds.");
        }
    }

    /**
     * FEATURE 7.1: Plagiarism & RAG Embeddings
     * Generate an exact 768-dimensional mathematical vector for a piece of text.
     */
    static async generateEmbedding(text: string): Promise<number[]> {
        try {
            const result = await embeddingModel.embedContent({
                content: { parts: [{ text }], role: "user" },
                // @ts-ignore - this is supported by the v1beta API but sometimes missing from TS types
                outputDimensionality: 768
            });
            return result.embedding.values;
        } catch (error: any) {
            this.handleError(error, "Embedding Generation");
            throw new Error("Failed to generate text embeddings.");
        }
    }

    /**
     * Chunk, Embed, and Store a full project PDF for Vector Similarity matching (Internal Plagiarism & RAG)
     */
    static async processDocumentEmbeddings(projectId: string, pdfText: string) {
        // Clean text slightly
        const cleanText = pdfText.replace(/\s+/g, ' ').trim();

        // Overlapping chunking strategy to preserve context across block boundaries
        const chunks: string[] = [];
        const chunkSize = 1200; // characters
        const overlap = 200;

        for (let i = 0; i < cleanText.length; i += (chunkSize - overlap)) {
            const chunk = cleanText.substring(i, i + chunkSize);
            if (chunk.trim().length > 150) { // Ignore tiny fragmented end-chunks
                chunks.push(chunk.trim());
            }
        }

        console.log(`[VECTOR ENGINE] Generating embeddings for ${chunks.length} chunks of project ${projectId}...`);

        // We process these sequentially with a small delay to avoid hammering the free-tier Gemini API rate limits
        for (let i = 0; i < chunks.length; i++) {
            try {
                const vector = await this.generateEmbedding(chunks[i]);

                // Store in database with pgvector
                const { error } = await supabaseAdmin.from("project_embeddings").insert({
                    project_id: projectId,
                    chunk_index: i,
                    content: chunks[i],
                    embedding: vector
                });

                if (error) console.error(`[VECTOR ENGINE] Database insert failed for chunk ${i}:`, error.message);
            } catch (error) {
                console.error(`[VECTOR ENGINE] Failed to embed chunk ${i} for project ${projectId}`, error);
            }

            // Respect rate limits (Wait 500ms between chunks)
            await new Promise(r => setTimeout(r, 500));
        }

        console.log(`[VECTOR ENGINE] Successfully mapped project ${projectId} into vector space.`);
    }
}

