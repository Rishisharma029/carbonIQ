import express from 'express'
import { emissionFactorController } from '../controllers/emissionFactorController.js'
import { protect } from '../middlewares/authMiddleware.js'
import { authorize } from '../middlewares/authorize.js'
import { adminLimiter } from '../middlewares/rateLimit.js'

const router = express.Router()

// All emission factor routes require active authentication
router.use(protect)

router.get('/', emissionFactorController.getFactors)
router.get('/search', emissionFactorController.searchFactors)
router.get('/versions', emissionFactorController.getVersions)
router.get('/compare', emissionFactorController.compareVersions)
router.get('/sources', emissionFactorController.getSourcesMapping)

// Dataset imports are restricted to administrative accounts and are rate-limited
router.post('/import', adminLimiter, authorize('factor:import'), emissionFactorController.importDataset)

export default router
export { router }
