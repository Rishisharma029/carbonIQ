import PDFDocument from 'pdfkit'
import { createObjectCsvStringifier } from 'csv-writer'
import { calculationRepository } from '../repositories/calculationRepository.js'
import { Report } from '../models/Report.js'

const csvStringifier = createObjectCsvStringifier({
  header: [
    { id: 'date', title: 'DATE' },
    { id: 'transport', title: 'TRANSPORT (Tons)' },
    { id: 'electricity', title: 'ELECTRICITY (Tons)' },
    { id: 'food', title: 'FOOD (Tons)' },
    { id: 'waste', title: 'WASTE (Tons)' },
    { id: 'totalEmission', title: 'TOTAL EMISSION (Tons)' },
    { id: 'score', title: 'SCORE' },
  ],
})

export const reportService = {
  generatePDFBuffer: async (userId) => {
    const calcs = await calculationRepository.findByUserId(userId, { limit: 10 })

    return new Promise((resolve, reject) => {
      const doc = new PDFDocument({ margin: 50 })
      const chunks = []
      doc.on('data', (chunk) => chunks.push(chunk))
      doc.on('end', () => resolve(Buffer.concat(chunks)))
      doc.on('error', reject)

      doc.fontSize(24).text('CarbonIQ Emissions Report', { align: 'center' })
      doc.moveDown()
      doc.fontSize(12).text(`Generated on: ${new Date().toLocaleDateString()}`)
      doc.moveDown()
      doc.text('----------------------------------------------------')
      doc.moveDown()
      doc.fontSize(16).text('Recent Calculation Entries:')
      doc.moveDown()

      calcs.forEach((c, idx) => {
        doc.fontSize(12).text(`Entry #${idx + 1} — Date: ${new Date(c.createdAt).toLocaleDateString()}`)
        doc.text(`  Transport:    ${c.results.transportEmission} Tons CO2e`)
        doc.text(`  Electricity:  ${c.results.electricityEmission} Tons CO2e`)
        doc.text(`  Food:         ${c.results.foodEmission} Tons CO2e`)
        doc.text(`  Waste:        ${c.results.wasteEmission} Tons CO2e`)
        doc.text(`  Total:        ${c.results.totalEmission} Tons CO2e`)
        doc.text(`  Score:        ${c.score ?? 'N/A'} / 100`)
        doc.moveDown()
      })

      doc.end()
    })
  },

  generatePDF: async (userId, res) => {
    // Record report metadata
    await Report.create({
      userId,
      type: 'pdf',
      period: new Date().toISOString().slice(0, 7),
      generatedAt: new Date(),
    })

    const buffer = await reportService.generatePDFBuffer(userId)
    res.send(buffer)
  },

  generateCSV: async (userId) => {
    const calcs = await calculationRepository.findByUserId(userId, { limit: 100 })

    // Record report metadata
    await Report.create({
      userId,
      type: 'csv',
      period: new Date().toISOString().slice(0, 7),
      generatedAt: new Date(),
    })

    const records = calcs.map((c) => ({
      date: new Date(c.createdAt).toLocaleDateString(),
      transport: c.results.transportEmission,
      electricity: c.results.electricityEmission,
      food: c.results.foodEmission,
      waste: c.results.wasteEmission,
      totalEmission: c.results.totalEmission,
      score: c.score ?? '',
    }))

    const headerString = csvStringifier.getHeaderString()
    const bodyString = csvStringifier.stringifyRecords(records)
    return headerString + bodyString
  },
}
export default reportService
