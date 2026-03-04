import { calculatePlagiarismScore } from '../src/lib/plagiarism';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

async function runTest() {
    console.log("Testing simple string embedding against database...");

    const sampleText = `In today’s digital age, Information Technology (IT) forms the backbone of global operations, facilitating data management, communication, and complex problem-solving. However, the increasing reliance on IT systems inherently escalates the risk of cybersecurity threats.`;

    try {
        const score = await calculatePlagiarismScore(sampleText);
        console.log(`FINAL SIMILARITY SCORE: ${score}%`);
    } catch (e: any) {
        console.error("Test failed:", e.message);
    }
}

runTest();
