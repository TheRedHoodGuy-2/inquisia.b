import fs from 'fs';
import FormData from 'form-data';
import fetch from 'node-fetch'; // if node 18+, native fetch is available but let's just use native fetch if available

const BASE_URL = 'http://localhost:3000/api';
let cookie = '';

async function request(path, options = {}) {
    const headers = new Headers(options.headers || {});
    if (cookie) headers.set('cookie', cookie);
    if (!(options.body instanceof FormData)) {
        headers.set('Content-Type', 'application/json');
    }

    const res = await fetch(`${BASE_URL}${path}`, {
        ...options,
        headers,
    });

    const setCookie = res.headers.get('set-cookie');
    if (setCookie) {
        cookie = setCookie; // simplistic cookie handling for test
    }

    if (!res.ok) {
        console.error(`Status: ${res.status}`);
        const text = await res.text();
        console.error(`Body: ${text}`);
        throw new Error(`Request failed: ${path}`);
    }

    return res.json();
}

async function run() {
    console.log("1. Registering student...");
    const email = `test_upload_${Date.now()}@student.babcock.edu.ng`;
    res = await request('/auth/register', {
        method: 'POST',
        body: JSON.stringify({
            email,
            password: 'password123',
            displayName: 'Test Uploader',
            fullName: 'Test Uploader',
            metadata: { matricNumber: '123456', degrees: 'BSc' }
        })
    });
    console.log("Register response:", res);

    console.log("2. Uploading PDF...");
    const form = new FormData();
    form.append('file', fs.createReadStream('c:/Users/2026/Documents/Project Thesis/dev/inquisia.v2/Lorem_ipsum.pdf'));

    // Use node-fetch style if not using native fetch FormData.
    // We'll use native fetch which handles FormData if node 18+. Let's assume Native Fetch isn't 100% compatible with form-data package in Node 18, so we'll set headers.
    const uploadRes = await fetch(`${BASE_URL}/projects/upload`, {
        method: 'POST',
        body: form,
        headers: {
            'cookie': cookie
        } // using raw form-data stream is tricky with native fetch, let's hope it works.
    });
    const upData = await uploadRes.json();
    console.log("Upload response:", upData);

    if (!upData.success) throw new Error("Upload failed");
    const path = upData.data.path;

    console.log("3. AI Parsing...");
    res = await request('/ai/parse-pdf', {
        method: 'POST',
        body: JSON.stringify({ filePath: path })
    });
    console.log("Parse response:", res);

    console.log("4. Fetch supervisors...");
    res = await request('/public/supervisors'); // wait, public api might not need auth
    const supervisorId = res.data[0]?.id;
    console.log("Supervisor ID:", supervisorId);

    console.log("5. Submit Project...");
    res = await request('/projects', {
        method: 'POST',
        body: JSON.stringify({
            title: "Test AI Submission",
            abstract: "This is a test abstract that is hopefully long enough to pass any validation that might exist in the backend schema although typically it needs 50 chars so this should definitely be fine by now.",
            fileUrl: path, // using the stored file path
            departmentId: "some-uuid", // wait, I don't know a valid department. I'll omit if it's optional
            teammates: [],
            studentTags: ["test", "ai"],
            supervisorId: supervisorId
        })
    });
    console.log("Submit response:", res);
}

run().catch(console.error);
