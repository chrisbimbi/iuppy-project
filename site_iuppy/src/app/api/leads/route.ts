import { NextResponse } from 'next/server';
import * as admin from 'firebase-admin';

// Initialize Firebase Admin SDK (Singleton)
if (!admin.apps.length) {
    admin.initializeApp({
        projectId: 'b2b-rico',
    });
}

const db = admin.firestore();

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { name, email, role, employees, painPoint, timeline, budget, score } = body;

        console.log("=== NOVO LEAD DE VENDAS ===");
        console.log("Lead:", name, email);
        console.log("Score:", score);

        // 1. Find Owner UID (Target Specific Account - Iuppy Sales)
        // Since B2B-Rico is multi-tenant, we must find the specific user account 
        // that represents the Iuppy Commercial Team.
        // Hardcoding the email for the "Source of Truth" account.
        const targetEmail = 'christiano@iuppy.com.br'; // Ajuste se o email da conta principal for outro

        const usersSnap = await db.collection('users')
            .where('email', '==', targetEmail)
            .limit(1)
            .get();

        if (usersSnap.empty) {
            console.error(`Critical: Target user ${targetEmail} not found in CRM.`);
            // Fallback: Log error but return success to frontend to avoid UX breakage
            // In a real scenario, we might want to email the admin as a fallback.
            return NextResponse.json({ success: false, message: "Target CRM user not found" }, { status: 500 });
        }
        const ownerUid = usersSnap.docs[0].id;

        // 2. Infer Company Name from domain (since modal doesn't ask)
        const domain = email.includes('@') ? email.split('@')[1] : 'Unknown';
        const companyName = domain !== 'gmail.com' && domain !== 'hotmail.com'
            ? domain.split('.')[0].charAt(0).toUpperCase() + domain.split('.')[0].slice(1)
            : `${name}'s Company`;

        // 3. Create Company/Lead in CRM
        await db.collection('companies').add({
            userId: ownerUid,
            name: companyName, // Mandatory
            contactName: name,
            email: email,
            phone: '', // Modal doesn't ask
            description: `Lead Score: ${score}\nCargo: ${role}\nFuncionários: ${employees}\nDor: ${painPoint}\nPrazo: ${timeline}\nOrçamento: ${budget}`,
            source: 'site_iuppy_demo_modal',
            stage: 'new_lead',
            customData: {
                role, employees, painPoint, timeline, budget, score,
                origin: 'iuppy.com.br/demo'
            },
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
            updatedAt: admin.firestore.FieldValue.serverTimestamp()
        });
        console.log("✅ Lead de vendas salvo no CRM!");

        return NextResponse.json({ success: true, message: "Lead processado!" });
    } catch (error: any) {
        console.error("Erro ao salvar Lead:", error);
        return NextResponse.json(
            { success: false, message: "Erro interno (CRM Integration)." },
            { status: 500 }
        );
    }
}
