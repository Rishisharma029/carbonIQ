import express from 'express'
import { reportController } from '../controllers/reportController.js'
import { protect } from '../middlewares/authMiddleware.js'
import { pdfReportLimiter, csvReportLimiter } from '../middlewares/rateLimit.js'

const router = express.Router()

router.use(protect)

/**
 * @openapi
 * /api/v1/reports/pdf:
 *   get:
 *     summary: Download carbon footprint summary report in PDF format
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: Streamed PDF document
 */
router.get('/pdf', pdfReportLimiter, reportController.exportPDF)

/**
 * @openapi
 * /api/v1/reports/csv:
 *   get:
 *     summary: Download raw calculation history entries in CSV format
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: CSV tabular text spreadsheet
 */
router.get('/csv', csvReportLimiter, reportController.exportCSV)

export default router
export { router }
