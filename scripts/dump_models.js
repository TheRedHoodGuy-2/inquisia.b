const fs = require("fs");
require("dotenv").config({ path: ".env.local" });

const apiKey = process.env.GEMINI_API_KEY;

async function dumpModels() {
    try {
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`);
        const data = await response.json();
        fs.writeFileSync("models_dump.json", JSON.stringify(data, null, 2));
        console.log("Dumped models to models_dump.json");
    } catch (e) {
        console.error(e);
    }
}

dumpModels();
