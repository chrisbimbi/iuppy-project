import { NextResponse } from 'next/server';
import * as admin from 'firebase-admin';

// Initialize Firebase Admin SDK
// This runs on the server (Cloud Run), so it uses Google Application Default Credentials
// which we authorized via IAM (roles/datastore.user on b2b-rico)
if (!admin.apps.length) {
    admin.initializeApp({
        projectId: 'b2b-rico', // Explicitly target the CRM project
    });
}

const db = admin.firestore();

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { name, email, linkedin, reason, jobRole } = body;

        console.log("=== NOVA APLICAÇÃO RECEBIDA ===");
        console.log("Candidato:", name);
        console.log("Enviando para CRM b2b-rico...");

        // 1. Find Owner UID (Target User in CRM)
        // We grab the first user found. In production, hardcode the specific UID if needed.
        const usersSnap = await db.collection('users').limit(1).get();
        if (usersSnap.empty) {
            console.error("Critical: No CRM user found.");
            // Don't fail the request for the user, just log error
        } else {
            const ownerUid = usersSnap.docs[0].id;

            // 2. Create Company/Lead in CRM
            await db.collection('companies').add({
                userId: ownerUid,
                name: `${name} (Candidato)`, // Company Name is mandatory
                contactName: name,
                email: email,
                linkedin: linkedin || '',
                description: `Vaga: ${jobRole}\nMotivo: ${reason}`,
                source: 'site_iuppy_careers',
                stage: 'prospecting', // Default CRM stage
                customData: {
                    jobRole,
                    reason,
                    origin: 'iuppy.com.br'
                },
                createdAt: admin.firestore.FieldValue.serverTimestamp(),
                updatedAt: admin.firestore.FieldValue.serverTimestamp()
            });
            console.log("✅ Lead salvo no CRM com sucesso!");
        }

        return NextResponse.json({ success: true, message: "Aplicação recebida e salva no CRM!" });
    } catch (error: any) {
        console.error("Erro ao processar aplicação:", error);
        return NextResponse.json(
            { success: false, message: "Erro interno (CRM Integration)." },
            { status: 500 }
        );
    }
}
