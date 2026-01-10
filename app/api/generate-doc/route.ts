import { NextResponse } from 'next/server'
import OpenAI from 'openai'
import { generateLegalPDF } from '@/lib/pdf-service'
import { createClient } from '@/lib/supabase/server'

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
})

export async function POST(req: Request) {
    try {
        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()

        if (!user) {
            console.warn("Unauthorized access to generate-doc")
        }

        const body = await req.json()
        const { projectId, type, title, address, jurisdiction, ownerName, ownerPhone, ownerAddress, contractorName, contractorLicense, contractorAddress, startDate, completionDate, estimatedCost, scope, includeDisclaimers } = body

        if (!projectId) {
            return NextResponse.json({ message: 'Missing projectId' }, { status: 400 })
        }

        // --- 1. AI Content Generation (Hybrid) ---
        const systemPrompt = `You are a construction permit expert. Generate a JSON list of 3-5 standard special conditions based on the project scope and type.
        Return ONLY valid JSON: { "conditions": ["string", "string"] }`

        const userPrompt = `Type: ${type}, Scope: ${scope}. Jurisdiction: ${jurisdiction}.`

        let conditions: string[] = []
        try {
            const completion = await openai.chat.completions.create({
                model: "gpt-4o",
                messages: [
                    { role: "system", content: systemPrompt },
                    { role: "user", content: userPrompt }
                ],
                response_format: { type: "json_object" }
            })
            const aiData = JSON.parse(completion.choices[0].message.content || '{}')
            conditions = aiData.conditions || []
        } catch (e) {
            console.error("AI Generation failed, using defaults", e)
            conditions = ["Work must conform to all local building codes.", "Inspection required before covering any work.", "Site must be kept clean and safe."]
        }

        // --- 2. Prepare Data for PDF ---
        const today = new Date().toISOString().split('T')[0]

        // Fee Calculation Logic
        const costVal = parseFloat((estimatedCost || "0").toString().replace(/[^0-9.]/g, '')) || 0
        const permitFee = (costVal * 0.015).toFixed(2) // 1.5% fee
        const processingFee = costVal.toFixed(2) // Match user input per request

        const documentData = {
            type,
            title: title.toUpperCase(),
            permit_number: `BP-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`,
            issue_date: today,
            expiration_date: completionDate,
            status: 'ISSUED',
            project_info: {
                name: title,
                address: address, // Full address passed from wizard
                city: jurisdiction ? jurisdiction.split(',')[0].trim() : 'Metropolis',
                state: jurisdiction && jurisdiction.includes(',') ? jurisdiction.split(',')[1].trim() : 'TX',
                zip: ''
            },
            owner_info: {
                name: ownerName,
                address: ownerAddress || address,
                phone: ownerPhone
            },
            contractor_info: {
                name: contractorName,
                license: contractorLicense || 'PENDING',
                address: contractorAddress
            },
            scope_of_work: scope,
            conditions: conditions,
            fees: [
                { description: "Permit Fee (1.5% of Valuation)", amount: `$${permitFee}` },
                { description: "Processing & Admin Fee", amount: `$${processingFee}` }
            ]
        }

        // --- 3. Generate PDF ---
        const pdfBytes = await generateLegalPDF(documentData, true) // isDraft=true means Watermark
        const base64Pdf = Buffer.from(pdfBytes).toString('base64')

        // --- 4. Save to Database ---
        let documentId = 'mock-doc-id'

        if (user) {
            const { data: insertedDoc, error: insertError } = await supabase
                .from('documents')
                .insert({
                    project_id: projectId,
                    user_id: user.id,
                    type: type || 'document',
                    title: title,
                    status: 'draft',
                    version: 1,
                    content_json: {
                        ...documentData,
                        pdf_base64: base64Pdf // Crucial for preview/download
                    }
                })
                .select()
                .single()

            if (insertError) {
                console.error("DB Insert Error:", insertError)
            } else {
                documentId = insertedDoc.id
            }
        }

        return NextResponse.json({
            success: true,
            pdfBase64: base64Pdf,
            documentId: documentId
        })

    } catch (error) {
        console.error("Doc Gen Error:", error)
        return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 })
    }
}
