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
            return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
        }

        // --- Check Subscription & Rate Limits ---
        const { data: profile } = await supabase
            .from('profiles')
            .select('subscription_tier')
            .eq('id', user.id)
            .single()

        const isPro = profile?.subscription_tier === 'pro'

        if (!isPro) {
            // Check usage for this month
            const startOfMonth = new Date()
            startOfMonth.setDate(1)
            startOfMonth.setHours(0, 0, 0, 0)

            const { count, error: countError } = await supabase
                .from('documents')
                .select('*', { count: 'exact', head: true })
                .eq('user_id', user.id)
                .gte('created_at', startOfMonth.toISOString())

            if (count !== null && count >= 5) {
                return NextResponse.json({
                    message: 'Free Plan Limit Reached (5 Docs/Month). Upgrade to Pro for unlimited generation.',
                    limitReached: true
                }, { status: 403 })
            }
        }

        const body = await req.json()
        const {
            projectId, category, type, title, address, jurisdiction,
            ownerName, ownerPhone, ownerAddress,
            contractorName, contractorLicense, contractorAddress,
            startDate, completionDate, estimatedCost, scope,
            // Safety Fields
            incidentDate, incidentTime, weather, incidentType, description, correctiveActions
        } = body

        if (!projectId) {
            return NextResponse.json({ message: 'Missing projectId' }, { status: 400 })
        }

        // --- 1. AI Content Generation (Hybrid) ---
        let conditions: string[] = []
        let preventativeMeasures: string[] = []
        let bidFees: { description: string, amount: string }[] = []

        if (category === 'safety') {
            // -- Safety Prompt --
            const systemPrompt = `You are an OSHA compliance expert. Based on the incident description, generate 3-4 specific recommended preventative measures to prevent recurrence.
            Return ONLY valid JSON: { "measures": ["string", "string"] }`
            const userPrompt = `Incident Type: ${incidentType}. Description: ${description}. Corrective Actions Taken: ${correctiveActions}.`

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
                preventativeMeasures = aiData.measures || []
            } catch (e) {
                console.error("AI Safety Generation failed", e)
                preventativeMeasures = ["Review safety protocols.", "Conduct team safety briefing.", "Monitor site conditions."]
            }

        } else if (category === 'bid') {
            // -- Bid Breakdown Prompt --
            const systemPrompt = `You are a construction estimator. Create a line-item cost breakdown based on the project scope and total estimated cost.
            Distribute the Total Cost (${estimatedCost || 'Unknown'}) reasonably across the items.
            Return ONLY valid JSON: { "fees": [{ "description": "Item Description", "amount": "$0.00" }] }`
            const userPrompt = `Scope: ${scope}. Total Cost: ${estimatedCost}.`

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
                bidFees = aiData.fees || []
            } catch (e) {
                console.error("AI Bid Generation failed", e)
            }

        } else {
            // -- Permit Prompt --
            const systemPrompt = `You are a construction permit expert. Generate a JSON list of 3-5 standard special conditions based on the project scope and type.
            Return ONLY valid JSON: { "conditions": ["string", "string"] }`
            const userPrompt = `Type: ${type}, Scope: ${scope}. Jurisdiction: ${jurisdiction}.`

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
                console.error("AI Generation failed", e)
                conditions = ["Work must conform to all local building codes.", "Inspection required before covering any work.", "Site must be kept clean and safe."]
            }
        }


        // --- 2. Prepare Data for PDF ---
        const today = new Date().toISOString().split('T')[0]
        let documentData: any = {}

        if (category === 'safety') {
            documentData = {
                category: 'safety',
                type: 'SAFETY INCIDENT REPORT',
                title: title.toUpperCase(),
                report_number: `INC-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`,
                date_created: today,
                project_info: {
                    name: title,
                    address: address,
                    city: jurisdiction ? jurisdiction.split(',')[0].trim() : '',
                    state: jurisdiction && jurisdiction.includes(',') ? jurisdiction.split(',')[1].trim() : ''
                },
                incident_details: {
                    date: incidentDate,
                    time: incidentTime,
                    weather: weather,
                    type: incidentType,
                    severity: 'High', // Logic could be added
                    description: description,
                    corrective_actions: correctiveActions
                },
                reporter_info: {
                    name: contractorName, // Reused field
                    role: 'Safety Officer'
                },
                supervisor_info: {
                    name: ownerName // Reused field
                },
                preventative_measures: preventativeMeasures
            }
        } else if (category === 'contract' || category === 'subcontractor_agreement') {
            documentData = {
                category: 'contract',
                type: 'SUBCONTRACTOR AGREEMENT',
                title: title.toUpperCase(),
                agreement_number: `SA-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`,
                date_created: today,
                project_info: {
                    name: title,
                    address: address,
                    city: jurisdiction ? jurisdiction.split(',')[0].trim() : '',
                    state: jurisdiction && jurisdiction.includes(',') ? jurisdiction.split(',')[1].trim() : ''
                },
                owner_info: {
                    name: ownerName,
                    address: ownerAddress || 'Address on File',
                    phone: ownerPhone
                },
                contractor_info: {
                    name: contractorName,
                    address: contractorAddress || 'Address on File',
                    license: contractorLicense
                },
                scope_of_work: scope,
                payment_terms: {
                    amount: estimatedCost || '0.00',
                    schedule: 'Progress payments upon milestone completion.'
                },
                timeline: {
                    start: startDate,
                    completion: completionDate
                }
            }
        } else if (category === 'bid' || category === 'project_bid') {
            documentData = {
                category: 'bid',
                type: 'PROJECT BID PROPOSAL',
                title: title.toUpperCase(),
                bid_number: `BID-2026-${projectId.substring(0, 6).toUpperCase()}`,
                date_created: today,
                expiration_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 30 days
                project_info: {
                    name: title,
                    address: address,
                    city: jurisdiction ? jurisdiction.split(',')[0].trim() : '',
                    state: jurisdiction && jurisdiction.includes(',') ? jurisdiction.split(',')[1].trim() : ''
                },
                owner_info: {
                    name: ownerName, // "Prepared For"
                    address: ownerAddress || 'Address on File',
                    phone: ownerPhone
                },
                contractor_info: {
                    name: contractorName, // "Submitted By"
                    address: contractorAddress || 'Address on File',
                    license: contractorLicense
                },
                scope_of_work: scope,
                fees: bidFees.length > 0 ? bidFees : [], // Use AI breakdown if available
                payment_terms: {
                    amount: estimatedCost || '0.00',
                    schedule: 'Net 30'
                }
            }
        } else {
            // Fee Calculation Logic
            const costVal = parseFloat((estimatedCost || "0").toString().replace(/[^0-9.]/g, '')) || 0
            const permitFee = (costVal * 0.015).toFixed(2)
            const processingFee = costVal.toFixed(2)

            documentData = {
                category: 'permit',
                type,
                title: title.toUpperCase(),
                permit_number: `BP-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`,
                issue_date: today,
                expiration_date: completionDate,
                status: 'ISSUED',
                project_info: {
                    name: title,
                    address: address,
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
        }

        // --- 3. Generate PDF ---
        // If NOT Pro, then it IS a Draft (Watermarked)
        const pdfBytes = await generateLegalPDF(documentData, !isPro)
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
                    status: category === 'safety' ? 'reported' : 'draft',
                    version: 1,
                    content_json: {
                        ...documentData,
                        pdf_base64: base64Pdf
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
