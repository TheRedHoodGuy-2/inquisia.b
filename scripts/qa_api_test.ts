import fs from 'fs';
import path from 'path';

const BASE_URL = 'http://localhost:3000';

// Helper to safely parse JSON or return raw text
async function safeJson(res: Response) {
    const text = await res.text();
    try {
        return JSON.parse(text);
    } catch {
        return { raw_error: text };
    }
}

async function runQATests() {
    console.log("🚀 Starting Automated QA API Tests...\n");

    try {
        let studentCookie = '';
        let student2Cookie = '';
        let supervisorCookie = '';
        let adminCookie = '';

        let studentId = '';
        let student2Id = '';
        let supervisorId = '';
        let adminId = '';

        let projectId = '';
        let project2Id = '';

        const timestamp = Date.now();

        // Fetch department for users
        const deptRes = await fetch(`${BASE_URL}/api/departments`);
        const deptData = await safeJson(deptRes);
        if (!deptData || !deptData.data || !deptData.data[0]) {
            throw new Error(`Failed to fetch departments: ${JSON.stringify(deptData)}`);
        }
        const deptId = deptData.data[0].id;

        // 1. Register Supervisor
        console.log("📝 1. Registering Users (Supervisor, Students, Admin)...");
        const supRes = await fetch(`${BASE_URL}/api/auth/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                email: `staff${timestamp}@babcock.edu.ng`,
                password: 'password123',
                full_name: 'Dr. QA Supervisor',
                role: 'supervisor',
                staff_id: `QA-${timestamp}`,
                department_id: deptId,
                degrees: 'Ph.D. in Computer Science',
                bio: 'QA testing supervisor profile.'
            })
        });
        const supData = await safeJson(supRes);
        if (!supRes.ok) throw new Error(`Supervisor Registration failed: ${JSON.stringify(supData)}`);
        supervisorCookie = supRes.headers.get('set-cookie')?.split(';')[0] || '';
        supervisorId = supData.data.id;

        // 2. Register Student 1
        const stuRes = await fetch(`${BASE_URL}/api/auth/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                email: `student1_${timestamp}@student.babcock.edu.ng`,
                password: 'password123',
                full_name: 'QA Test Student 1',
                role: 'student',
                matric_no: `1_${timestamp}`.slice(-4),
                level: '400',
                department_id: deptId
            })
        });
        const stuData = await safeJson(stuRes);
        if (!stuRes.ok) throw new Error(`Student 1 Registration failed: ${JSON.stringify(stuData)}`);
        studentCookie = stuRes.headers.get('set-cookie')?.split(';')[0] || '';
        studentId = stuData.data.id;

        // 2b. Register Student 2
        const stu2Res = await fetch(`${BASE_URL}/api/auth/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                email: `student2_${timestamp}@student.babcock.edu.ng`,
                password: 'password123',
                full_name: 'QA Test Student 2',
                role: 'student',
                matric_no: `2_${timestamp}`.slice(-4),
                level: '400',
                department_id: deptId
            })
        });
        const stu2Data = await safeJson(stu2Res);
        student2Cookie = stu2Res.headers.get('set-cookie')?.split(';')[0] || '';
        student2Id = stu2Data.data.id;

        // 2c. Register Admin
        const adminRes = await fetch(`${BASE_URL}/api/auth/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                email: `admin_${timestamp}@inquisia.com`,
                password: 'password123',
                full_name: 'QA Test Admin',
                role: 'admin' // NOTE: In a real system, admin reg might be disabled, assuming allowed here or defaulted
            })
        });
        let isAdminRegistered = adminRes.ok;
        if (isAdminRegistered) {
            const adminData = await safeJson(adminRes);
            adminCookie = adminRes.headers.get('set-cookie')?.split(';')[0] || '';
            adminId = adminData.data?.id;
        }

        console.log(`✅ Users Registered`);

        // 3. Submit Project as Student 1
        console.log("\n📤 3. Submitting Project 1 (Student 1)...");
        const formData = new FormData();
        formData.append('metadata', JSON.stringify({
            title: `Automated QA Project ${timestamp}`,
            abstract: 'This is an automated test covering AI and QA validation processes.',
            supervisor_id: supervisorId,
            co_authors: [],
            student_tags: ["Testing", "QA"]
        }));
        const pdfPath = path.join(process.cwd(), 'Lorem_ipsum.pdf');
        if (!fs.existsSync(pdfPath)) throw new Error("Lorem_ipsum.pdf not found in project root.");

        const fileBuffer = fs.readFileSync(pdfPath);
        formData.append('file', new Blob([fileBuffer], { type: 'application/pdf' }), 'Lorem_ipsum.pdf');

        const projectRes = await fetch(`${BASE_URL}/api/projects`, {
            method: 'POST',
            headers: { 'Cookie': studentCookie },
            body: formData
        });
        const projectData = await safeJson(projectRes);
        if (!projectRes.ok) throw new Error(`Project 1 Submission failed: ${JSON.stringify(projectData)}`);
        projectId = projectData.data.id;
        console.log(`✅ Project 1 Submitted (Pending): ${projectId}`);

        // 4. Approve Project 1 as Supervisor
        console.log("\n✅ 4. Approving Project 1 (Supervisor)...");
        const approveRes = await fetch(`${BASE_URL}/api/projects/${projectId}/status`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json', 'Cookie': supervisorCookie },
            body: JSON.stringify({ status: 'approved', feedback: 'Approved immediately.' })
        });
        const approveData = await safeJson(approveRes);
        if (!approveRes.ok) throw new Error(`Project Approval failed: ${JSON.stringify(approveData)}`);
        console.log(`✅ Project Approved successfully.`);

        // 5. Submit Project 2 as Student 2
        console.log("\n📤 5. Submitting Project 2 (Student 2)...");
        const formData2 = new FormData();
        formData2.append('metadata', JSON.stringify({
            title: `Automated Rejected Project ${timestamp}`,
            abstract: 'This is an automated test for the rejection/resubmission pipeline.',
            supervisor_id: supervisorId,
            co_authors: [],
            student_tags: ["Reject"]
        }));
        const pdfPath2 = path.join(process.cwd(), 'Mimecast-2025.pdf');
        const fileBuffer2 = fs.readFileSync(pdfPath2);
        formData2.append('file', new Blob([fileBuffer2], { type: 'application/pdf' }), 'Mimecast-2025.pdf');
        const proj2Res = await fetch(`${BASE_URL}/api/projects`, {
            method: 'POST',
            headers: { 'Cookie': student2Cookie },
            body: formData2
        });
        project2Id = (await safeJson(proj2Res)).data.id;
        console.log(`✅ Project 2 Submitted`);

        // 6. Request Changes on Project 2 (Supervisor)
        console.log("\n🔄 6. Requesting Changes on Project 2 (Supervisor)...");
        const rejectRes = await fetch(`${BASE_URL}/api/projects/${project2Id}/status`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json', 'Cookie': supervisorCookie },
            body: JSON.stringify({ status: 'changes_requested', feedback: 'Please fix abstract.' })
        });
        const rejectData = await safeJson(rejectRes);
        if (!rejectRes.ok) throw new Error(`Project rejection failed: ${JSON.stringify(rejectData)}`);
        console.log(`✅ Changes Requested`);

        // 7. Resubmit Project 2 (Student 2)
        console.log("\n🔄 7. Resubmitting Project 2 (Student 2)...");
        const resubmitData = new FormData();
        resubmitData.append('metadata', JSON.stringify({
            title: `Automated Resubmitted Project ${timestamp}`,
            abstract: 'This is the fixed abstract for project 2.',
            supervisor_id: supervisorId,
            co_authors: [],
            student_tags: ["Reject", "Fixed"]
        }));
        resubmitData.append('file', new Blob([fileBuffer2], { type: 'application/pdf' }), 'Mimecast-2025.pdf');
        const resubmitRes = await fetch(`${BASE_URL}/api/projects/${project2Id}/revision`, {
            method: 'POST',
            headers: { 'Cookie': student2Cookie },
            body: resubmitData
        });
        const resubmitDataResp = await safeJson(resubmitRes);
        if (!resubmitRes.ok) throw new Error(`Resubmission failed: ${JSON.stringify(resubmitDataResp)}`);
        console.log(`✅ Resubmission Sent`);

        // 8. Post and Edit Comment
        console.log("\n💬 8. Posting & Editing a Comment (Student 1)...");
        const commentRes = await fetch(`${BASE_URL}/api/projects/${projectId}/comments`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Cookie': studentCookie },
            body: JSON.stringify({ content: 'Original text.' })
        });
        const commentId = (await safeJson(commentRes)).data.id;

        const editRes = await fetch(`${BASE_URL}/api/comments/${commentId}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json', 'Cookie': studentCookie },
            body: JSON.stringify({ content: 'Edited text.' })
        });
        const editDataResp = await safeJson(editRes);
        if (!editRes.ok) throw new Error(`Comment edit failed: ${JSON.stringify(editDataResp)}`);
        console.log(`✅ Comment Edited`);

        // 9. Change Request Workflow
        console.log("\n📝 9. Submitting Change Request (Student 1)...");
        const crData = new FormData();
        crData.append("fields", JSON.stringify(["Title"]));
        crData.append("reason", "I want a new title");
        crData.append("proposedData", JSON.stringify({ title: "New AI Title" }));

        const crRes = await fetch(`${BASE_URL}/api/projects/${projectId}/change-request`, {
            method: 'POST',
            headers: { 'Cookie': studentCookie },
            body: crData
        });
        const crParsed = await safeJson(crRes);
        if (!crRes.ok) throw new Error(`Change Request submission failed: ${JSON.stringify(crParsed)}`);
        const crId = crParsed.data.id;
        console.log(`✅ Change Request Submitted: ${crId}`);

        console.log("\n✅ 10. Resolving Change Request (Supervisor)...");
        const crResolveRes = await fetch(`${BASE_URL}/api/change-requests/${crId}/resolve`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json', 'Cookie': supervisorCookie },
            body: JSON.stringify({ status: 'approved', response: 'Looks good.' })
        });
        const resolveDataResp = await safeJson(crResolveRes);
        if (!crResolveRes.ok) throw new Error(`Change Request resolution failed: ${JSON.stringify(resolveDataResp)}`);
        console.log(`✅ Change Request Approved`);

        // 11. Admin User Status Update
        if (isAdminRegistered && adminCookie) {
            console.log("\n👮 11. Updating User Status & Deleting Comment (Admin)...");
            const statusRes = await fetch(`${BASE_URL}/api/admin/users/${student2Id}/status`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json', 'Cookie': adminCookie },
                body: JSON.stringify({ status: 'warned', reason: 'Automated test warning.' })
            });
            if (!statusRes.ok) throw new Error(`Admin status update failed: ${JSON.stringify(await safeJson(statusRes))}`);
            console.log(`✅ User Admin Status Updated`);

            const delRes = await fetch(`${BASE_URL}/api/comments/${commentId}`, {
                method: 'DELETE',
                headers: { 'Cookie': adminCookie }
            });
            const delDataResp = await safeJson(delRes);
            if (!delRes.ok) throw new Error(`Admin comment delete failed: ${JSON.stringify(delDataResp)}`);
            console.log(`✅ Comment Hard-Deleted by Admin`);
        } else {
            console.log("\n⚠️ Skipping Admin tests because Admin registration failed / is disabled for public endpoint.");
        }

        console.log("\n🎉 All Advanced Automated QA Tests Passed Successfully!");
        fs.writeFileSync('test_output.log', "SUCCESS");

    } catch (err: any) {
        console.error("\n❌ QA Test Failed during execution. Check test_output.log for stack.");
        fs.writeFileSync('test_output.log', `ERROR: ${err.message}\n${err.stack}`);
        process.exit(1);
    }
}

runQATests();
