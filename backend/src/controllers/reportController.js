import { reportService } from '../services/reportService.js'

export const reportController = {
  exportPDF: async (req, res, next) => {
    try {
      res.setHeader('Content-Type', 'application/pdf')
      res.setHeader('Content-Disposition', 'attachment; filename=emissions_report.pdf')

      await reportService.generatePDF(req.user.id, res)
    } catch (error) {
      next(error)
    }
  },

  exportCSV: async (req, res, next) => {
    try {
      const csvData = await reportService.generateCSV(req.user.id)

      res.setHeader('Content-Type', 'text/csv')
      res.setHeader('Content-Disposition', 'attachment; filename=emissions_history.csv')

      res.status(200).send(csvData)
    } catch (error) {
      next(error)
    }
  },
}
export default reportController
