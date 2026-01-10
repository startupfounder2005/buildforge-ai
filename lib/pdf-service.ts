import { PDFDocument, StandardFonts, rgb, degrees, PDFPage, PDFFont, Color } from 'pdf-lib'

interface DocumentData {
    type: string
    title: string
    permit_number?: string
    issue_date?: string
    expiration_date?: string
    status?: string
    project_info: {
        name: string
        address: string
        city?: string
        state?: string
        zip?: string
    }
    owner_info?: {
        name: string
        address?: string
        phone?: string
    }
    contractor_info?: {
        name: string
        license?: string
        address?: string
    }
    scope_of_work?: string
    conditions?: string[]
    fees?: { description: string; amount: string }[]
    disclaimers?: string[]
}

export async function generateLegalPDF(data: DocumentData, isDraft: boolean = true): Promise<Uint8Array> {
    const pdfDoc = await PDFDocument.create()
    let page = pdfDoc.addPage([612, 792]) // Letter size
    const { width, height } = page.getSize()

    // Fonts
    const fontRegular = await pdfDoc.embedFont(StandardFonts.Helvetica)
    const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold)
    const fontSerif = await pdfDoc.embedFont(StandardFonts.TimesRoman)

    const margin = 72 // 1 inch
    let yCursor = height - margin

    // Requested Sizes
    const fontSizeBody = 11
    const fontSizeHeader = 14
    const fontSizeTitle = 24
    const fontSizeSmall = 8

    // --- MEASUREMENT PHASE (For Vertically Centering Page 1) ---
    // We need to calculate total height of the "Content Block" to center it.

    // 1. Header Area (Logo to Divider)
    // Logo: 60, City/Dept: 40, Title: 18, Subtitle: 12, Divider: 25
    const headerHeight = 60 + 40 + 18 + 12 + 25

    // 2. Project Location Row (Dynamic)
    const addressWidth = (width - 2 * margin) - 310 - 5
    const addressLines = wrapText(
        `${data.project_info.address}, ${data.project_info.city || ''} ${data.project_info.zip || ''}`,
        fontBold,
        fontSizeBody,
        addressWidth
    )
    const row1H = Math.max(45, 45 + (addressLines.length - 1) * 14)

    // 3. Permittee Row (Fixed)
    const row2H = 65

    // 4. Issuance Bar (Fixed + Spacing)
    const barH = 30

    // 5. Scope (Fixed Box + Spacing)
    const scopeH = 45

    // 6. Fees (Dynamic)
    let feesHeight = 0
    if (data.fees && data.fees.length > 0) {
        const feeRowH = 22
        // Header (10px title + 10px gap + feeRowH) + Body (feeRowH * N) + Total (feeRowH) + Spacing (25px bottom)
        feesHeight = 10 + 10 + feeRowH + (feeRowH * data.fees.length) + feeRowH + 25
    }

    // Spacing Gaps (Reverted to standard ~25px)
    const gap = 25
    const totalContentHeight = headerHeight + row1H + row2H + gap + barH + gap + scopeH + gap + feesHeight

    // Calculate Centered Start Y
    // Available vertical space is height - 2*margin. 
    // If content is smaller than available, push down.
    // We stick to 'margin' as the absolute ceiling.
    const availableH = height - (2 * margin)
    let startY = height - margin

    if (totalContentHeight < availableH) {
        const extraSpace = availableH - totalContentHeight
        startY = height - margin - (extraSpace / 2)
    }

    // --- DRAWING PHASE ---
    yCursor = startY

    // --- HEADER SECTION ---
    // Hexagon Logo
    page.drawSvgPath('M 30 0 L 55 15 L 55 45 L 30 60 L 5 45 L 5 15 Z', {
        x: margin,
        y: yCursor,
        color: rgb(0, 0, 0),
        scale: 0.8,
    })

    // Permit Box (Top Right)
    if (data.permit_number) {
        const boxW = 160
        const boxH = 50
        const boxX = width - margin - boxW
        const boxY = yCursor + 5

        page.drawRectangle({
            x: boxX, y: boxY - boxH, width: boxW, height: boxH,
            color: rgb(1, 0.9, 0.9), // Light Red
            borderColor: rgb(0.8, 0, 0), borderWidth: 2
        })
        page.drawText("OFFICIAL PERMIT #", {
            x: boxX + 10, y: boxY - 15, size: 8, font: fontBold, color: rgb(0.8, 0, 0)
        })
        page.drawText(data.permit_number, {
            x: boxX + 10, y: boxY - 38, size: 16, font: fontBold, color: rgb(0, 0, 0)
        })
    }

    yCursor -= 60

    // City Name
    const cityTitle = (data.project_info.city || "CITY OF METROPOLIS").toUpperCase() + ", TX"
    const deptTitle = "DEPARTMENT OF BUILDING SAFETY & INSPECTION"

    drawCenteredText(page, cityTitle, yCursor, fontBold, 16)
    drawCenteredText(page, deptTitle, yCursor - 18, fontRegular, 9)
    yCursor -= 40

    // Title
    drawCenteredText(page, "BUILDING PERMIT", yCursor, fontBold, fontSizeTitle)
    yCursor -= 18
    drawCenteredText(page, "Issued pursuant to the Building Code of Metropolis", yCursor, fontSerif, 10, rgb(0.3, 0.3, 0.3))
    yCursor -= 12

    // Divider
    page.drawLine({ start: { x: margin, y: yCursor }, end: { x: width - margin, y: yCursor }, thickness: 2, color: rgb(0, 0, 0) })
    yCursor -= 25

    // --- MASTER GRID ---
    const gridTopY = yCursor
    const gridCol1W = (width - 2 * margin) * 0.5
    const gridCol2W = (width - 2 * margin) * 0.5

    // Row 1: Project Location (Dynamic Height for Address)
    drawGridBox(page, margin, gridTopY - row1H, width - 2 * margin, row1H, "PROJECT LOCATION", [
        { label: "Project Name:", value: data.project_info.name, xOffset: 5 },
        { label: "Full Address:", value: addressLines.join('\n'), xOffset: 240, valueXOffset: 310 }
    ], fontBold, fontRegular, fontSizeBody)

    // Row 2: Permittee & Contractor
    const row2Y = gridTopY - row1H
    drawGridBox(page, margin, row2Y - row2H, gridCol1W, row2H, "PERMITTEE / OWNER", [
        { label: "Name:", value: data.owner_info?.name || "N/A", xOffset: 5, yOffset: 0 },
        { label: "Address:", value: data.owner_info?.address || "N/A", xOffset: 5, yOffset: 22 },
    ], fontBold, fontRegular, fontSizeBody)

    drawGridBox(page, margin + gridCol1W, row2Y - row2H, gridCol2W, row2H, "LICENSED CONTRACTOR", [
        { label: "Company:", value: data.contractor_info?.name || "N/A", xOffset: 5, yOffset: 0 },
        { label: "License #:", value: data.contractor_info?.license || "N/A", xOffset: 5, yOffset: 22 },
    ], fontBold, fontRegular, fontSizeBody)

    yCursor = row2Y - row2H - gap

    // --- ISSUANCE DETAILS (Bar) ---
    page.drawRectangle({ x: margin, y: yCursor - barH, width: width - 2 * margin, height: barH, color: rgb(0.9, 0.9, 0.9), borderColor: rgb(0, 0, 0), borderWidth: 1 })

    const barColW = (width - 2 * margin) / 3
    drawLabelValueSimple(page, "DATE ISSUED", data.issue_date || "Pending", margin + 10, yCursor - 18, fontBold, fontRegular)
    drawLabelValueSimple(page, "EXPIRATION DATE", data.expiration_date || "N/A", margin + barColW + 10, yCursor - 18, fontBold, fontRegular)
    drawLabelValueSimple(page, "STATUS", (data.status || "DRAFT").toUpperCase(), margin + 2 * barColW + 10, yCursor - 18, fontBold, fontRegular)

    // Vertical Lines
    page.drawLine({ start: { x: margin + barColW, y: yCursor }, end: { x: margin + barColW, y: yCursor - barH }, thickness: 1 })
    page.drawLine({ start: { x: margin + 2 * barColW, y: yCursor }, end: { x: margin + 2 * barColW, y: yCursor - barH }, thickness: 1 })

    yCursor -= (barH + gap)

    // --- SCOPE OF WORK (Paragraph Box) ---
    page.drawText("SCOPE OF WORK", { x: margin, y: yCursor, size: fontSizeHeader, font: fontBold })
    yCursor -= 12
    // Box without cell grid, just a border
    page.drawRectangle({
        x: margin, y: yCursor - scopeH, width: width - 2 * margin, height: scopeH + 5,
        borderColor: rgb(0, 0, 0), borderWidth: 1
    })
    page.drawText(data.scope_of_work || "N/A", {
        x: margin + 8, y: yCursor - 12, size: fontSizeBody, font: fontRegular, maxWidth: width - 2 * margin - 16, lineHeight: 16
    })
    yCursor -= (scopeH + gap)

    // --- FEE SCHEDULE (70/30 Grid, Bold Total, Thin Gray Borders) ---
    if (data.fees && data.fees.length > 0) {
        page.drawText("FEE SCHEDULE", { x: margin, y: yCursor, size: fontSizeHeader, font: fontBold })
        yCursor -= 10

        const tableW = width - 2 * margin
        const amountColW = tableW * 0.30
        const descColW = tableW * 0.70
        const feeRowH = 22

        // Header
        page.drawRectangle({ x: margin, y: yCursor - feeRowH, width: tableW, height: feeRowH, color: rgb(0.85, 0.85, 0.85), borderColor: rgb(0.5, 0.5, 0.5), borderWidth: 1 })
        // Divider
        page.drawLine({ start: { x: margin + descColW, y: yCursor }, end: { x: margin + descColW, y: yCursor - feeRowH }, thickness: 1, color: rgb(0.5, 0.5, 0.5) })

        page.drawText("DESCRIPTION", { x: margin + 10, y: yCursor - 15, size: 10, font: fontBold })
        page.drawText("AMOUNT", { x: margin + descColW + 10, y: yCursor - 15, size: 10, font: fontBold })
        yCursor -= feeRowH

        let total = 0
        data.fees.forEach(fee => {
            page.drawRectangle({ x: margin, y: yCursor - feeRowH, width: tableW, height: feeRowH, borderColor: rgb(0.7, 0.7, 0.7), borderWidth: 0.5 })
            page.drawLine({ start: { x: margin + descColW, y: yCursor }, end: { x: margin + descColW, y: yCursor - feeRowH }, thickness: 0.5, color: rgb(0.7, 0.7, 0.7) })
            // Left/Right Borders explicit (handled by rect but ensuring)
            page.drawLine({ start: { x: margin, y: yCursor }, end: { x: margin, y: yCursor - feeRowH }, thickness: 0.5, color: rgb(0.7, 0.7, 0.7) })
            page.drawLine({ start: { x: margin + tableW, y: yCursor }, end: { x: margin + tableW, y: yCursor - feeRowH }, thickness: 0.5, color: rgb(0.7, 0.7, 0.7) })

            page.drawText(fee.description, { x: margin + 10, y: yCursor - 15, size: fontSizeBody, font: fontRegular })

            const amtText = fee.amount
            const amtWidth = fontRegular.widthOfTextAtSize(amtText, fontSizeBody)
            page.drawText(amtText, { x: margin + tableW - amtWidth - 10, y: yCursor - 15, size: fontSizeBody, font: fontRegular })

            const val = parseFloat(fee.amount.replace(/[^0-9.]/g, '')) || 0
            total += val
            yCursor -= feeRowH
        })

        // Total Row (Bold)
        page.drawRectangle({ x: margin, y: yCursor - feeRowH, width: tableW, height: feeRowH, color: rgb(0.95, 0.95, 0.95), borderColor: rgb(0.5, 0.5, 0.5), borderWidth: 1 })
        page.drawLine({ start: { x: margin + descColW, y: yCursor }, end: { x: margin + descColW, y: yCursor - feeRowH }, thickness: 1, color: rgb(0.5, 0.5, 0.5) })

        page.drawText("TOTAL ASSESSED FEES", { x: margin + 10, y: yCursor - 15, size: 10, font: fontBold })

        const totalText = `$${total.toFixed(2)}`
        const totalW = fontBold.widthOfTextAtSize(totalText, 10)
        page.drawText(totalText, { x: margin + tableW - totalW - 10, y: yCursor - 15, size: 10, font: fontBold }) // Right aligned

        yCursor -= (feeRowH + gap)
    }

    // --- SPECIAL CONDITIONS (ALWAYS PAGE 2) ---
    if (data.conditions && data.conditions.length > 0) {

        // Always Break to New Page
        page = pdfDoc.addPage([612, 792])
        yCursor = height - margin
        if (isDraft) {
            page.drawText("MOCK ONLY - DRAFT - GENERATED BY BUILDFORGE AI", {
                x: margin - 70, y: 150, size: 72, font: fontBold, color: rgb(1, 0, 0), opacity: 0.12, rotate: degrees(45)
            })
        }

        // Config
        const numberColWidth = 25
        const contentWidth = width - 2 * margin - numberColWidth - 20
        const condLineHeight = 16
        const bottomThreshold = margin + 40

        page.drawText("SPECIAL CONDITIONS", { x: margin, y: yCursor, size: fontSizeHeader, font: fontBold })
        yCursor -= 10

        let startY = yCursor

        for (let i = 0; i < data.conditions.length; i++) {
            const cond = data.conditions[i]
            const lines = wrapText(cond, fontRegular, fontSizeBody, contentWidth)
            const requiredH = lines.length * condLineHeight + 15

            // Check individual item overflow (in case list is HUGE and spans 2+ pages itself)
            if (yCursor - requiredH < bottomThreshold) {
                // Box Close
                if (startY > yCursor) {
                    page.drawRectangle({
                        x: margin, y: yCursor - 5, width: width - 2 * margin, height: startY - yCursor + 5,
                        borderColor: rgb(0, 0, 0), borderWidth: 1
                    })
                }

                // New Page
                page = pdfDoc.addPage([612, 792])
                if (isDraft) {
                    page.drawText("MOCK ONLY - DRAFT - GENERATED BY BUILDFORGE AI", {
                        x: margin - 70, y: 150, size: 72, font: fontBold, color: rgb(1, 0, 0), opacity: 0.12, rotate: degrees(45)
                    })
                }

                yCursor = height - margin
                startY = yCursor

                drawCenteredText(page, "SPECIAL CONDITIONS (Continued)", yCursor + 10, fontRegular, 10)
                yCursor -= 10
            }

            // --- Vertical Centering Logic for Row ---
            const textBlockH = lines.length * condLineHeight
            const topPadding = (requiredH - textBlockH) / 2
            const textStartY = yCursor - topPadding

            // Draw Number ("1.") - Fixed Left
            page.drawText(`${i + 1}.`, { x: margin + 10, y: textStartY - 10, size: fontSizeBody, font: fontRegular })

            // Draw Content Lines - Fixed Left Indent
            lines.forEach((line, lineIdx) => {
                const lineY = textStartY - (lineIdx * condLineHeight) - 10
                page.drawText(line, { x: margin + 10 + numberColWidth, y: lineY, size: fontSizeBody, font: fontRegular })
            })

            yCursor -= requiredH

            // Separator
            if (i < data.conditions.length - 1) {
                if (yCursor > bottomThreshold) {
                    page.drawLine({ start: { x: margin, y: yCursor + 2 }, end: { x: width - margin, y: yCursor + 2 }, thickness: 0.5, color: rgb(0.8, 0.8, 0.8) })
                }
            }
        }

        // Final Box Close
        const boxHeight = startY - yCursor + 5
        if (boxHeight > 0) {
            page.drawRectangle({
                x: margin, y: yCursor - 5, width: width - 2 * margin, height: boxHeight,
                borderColor: rgb(0, 0, 0), borderWidth: 1
            })
        }
        yCursor -= 40
    }

    // --- SIGNATURE BLOCK (Always on Last Page) ---
    // Ensure we have space
    let sigH = 100
    if (yCursor - sigH < margin) {
        page = pdfDoc.addPage([612, 792])
        yCursor = height - margin
        if (isDraft) {
            page.drawText("MOCK ONLY - DRAFT - GENERATED BY BUILDFORGE AI", {
                x: margin - 70, y: 150, size: 72, font: fontBold, color: rgb(1, 0, 0), opacity: 0.12, rotate: degrees(45)
            })
        }
    }

    let sigY = Math.max(yCursor - 80, margin + 50)

    const sigLineW = 220

    // Left
    page.drawText("AUTHORIZED BY:", { x: margin, y: sigY + 15, size: 12, font: fontBold })
    page.drawLine({ start: { x: margin, y: sigY }, end: { x: margin + sigLineW, y: sigY }, thickness: 2 })

    // Right
    const rightSigX = width - margin - sigLineW
    page.drawText("DATE:", { x: rightSigX, y: sigY + 15, size: 12, font: fontBold })
    page.drawLine({ start: { x: rightSigX, y: sigY }, end: { x: rightSigX + sigLineW, y: sigY }, thickness: 2 })

    // Disclaimer Text below signature
    page.drawText("This permit is granted on the express condition that the said work shall, in all respects, conform to the Ordinances of this jurisdiction.", {
        x: margin, y: sigY - 20, size: 8, font: fontSerif, color: rgb(0.3, 0.3, 0.3)
    })

    // --- FOOTER ---
    drawCenteredText(page, "Generated by BuildForge AI for review purposes only. Not an official legal document. User assumes all liability.", 30, fontRegular, 8, rgb(0.5, 0.5, 0.5))

    return pdfDoc.save()
}

// --- HELPERS ---

function drawCenteredText(page: PDFPage, text: string, y: number, font: PDFFont, size: number, color = rgb(0, 0, 0)) {
    const textWidth = font.widthOfTextAtSize(text, size)
    const { width } = page.getSize()
    page.drawText(text, { x: (width - textWidth) / 2, y, size, font, color })
}

function drawGridBox(page: PDFPage, x: number, y: number, w: number, h: number, title: string, items: { label: string, value: string, xOffset: number, valueXOffset?: number, yOffset?: number }[], fontBold: PDFFont, fontReg: PDFFont, fontSize: number) {
    // Outer Border
    page.drawRectangle({ x, y, width: w, height: h, borderColor: rgb(0, 0, 0), borderWidth: 1 })

    // Title Bar
    const titleH = 16
    page.drawRectangle({ x, y: y + h - titleH, width: w, height: titleH, color: rgb(0.9, 0.9, 0.9), borderColor: rgb(0, 0, 0), borderWidth: 1 })
    page.drawText(title, { x: x + 5, y: y + h - 12, size: 8, font: fontBold })

    // Items
    items.forEach(item => {
        const itemY = y + h - titleH - 16 - (item.yOffset || 0)
        page.drawText(item.label, { x: x + item.xOffset, y: itemY, size: 9, font: fontReg, color: rgb(0.4, 0.4, 0.4) })
        const labelW = fontReg.widthOfTextAtSize(item.label, 9)
        const valX = item.valueXOffset ? x + item.valueXOffset : x + item.xOffset + labelW + 5

        // Handle multi-line support
        const lines = item.value.split('\n')
        lines.forEach((line, i) => {
            page.drawText(line, { x: valX, y: itemY - (i * 14), size: fontSize, font: fontBold, color: rgb(0, 0, 0) })
        })
    })
}

function drawLabelValueSimple(page: PDFPage, label: string, value: string, x: number, y: number, fontBold: PDFFont, fontReg: PDFFont) {
    page.drawText(label, { x: x, y: y + 9, size: 7, font: fontReg, color: rgb(0.4, 0.4, 0.4) })
    page.drawText(value, { x: x, y: y - 2, size: 9, font: fontBold })
}

function wrapText(text: string, font: PDFFont, size: number, maxWidth: number): string[] {
    const words = text.split(' ')
    let lines: string[] = []
    let currentLine = words[0]

    for (let i = 1; i < words.length; i++) {
        const word = words[i]
        const width = font.widthOfTextAtSize(currentLine + " " + word, size)
        if (width < maxWidth) {
            currentLine += " " + word
        } else {
            lines.push(currentLine)
            currentLine = word
        }
    }
    lines.push(currentLine)
    return lines
}
