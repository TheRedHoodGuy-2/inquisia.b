import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
const embeddingModel = genAI.getGenerativeModel({ model: "gemini-embedding-001" });

async function runTest() {
    try {
        console.log("1. Testing explicit 768 dimension compression...");
        // Wait, outputDimensionality might not be exposed in this version of the SDK natively.
        // Let's see if we can just slice the array math-wise (this is a valid subset for some models, but let's test if outputDimensionality works first).

        const result = await embeddingModel.embedContent({
            content: { parts: [{ text: "Testing dimension reduction." }], role: "user" },
            // @ts-ignore
            outputDimensionality: 768
        });
        const vector = result.embedding.values;
        console.log(`- Generated vector with ${vector.length} dimensions natively.`);

        fs.writeFileSync('gemini_debug.txt', `Success! Dimensions: ${vector.length}`);
    } catch (e: any) {
        fs.writeFileSync('gemini_debug.txt', "CATCH ERROR:\n" + e.toString() + "\n\n" + JSON.stringify(e, Object.getOwnPropertyNames(e), 2));
    }
}

runTest();
