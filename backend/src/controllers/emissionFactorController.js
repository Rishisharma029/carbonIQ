import { EmissionFactor } from '../models/EmissionFactor.js'
import { AuditLog } from '../models/AuditLog.js'
import { ValidationError } from '../errors/customErrors.js'
import {
  factorQuerySchema,
  factorSearchSchema,
  datasetImportSchema,
} from '../validators/emissionFactorValidator.js'

export const emissionFactorController = {
  getFactors: async (req, res, next) => {
    try {
      const validate = factorQuerySchema.safeParse(req.query)
      if (!validate.success) {
        const error = new ValidationError('Invalid query parameters')
        error.errors = validate.error.format()
        throw error
      }

      const query = { isActive: true }
      if (validate.data.category) query.category = validate.data.category
      if (validate.data.subCategory) query.subCategory = validate.data.subCategory
      if (validate.data.state) query.state = validate.data.state
      if (validate.data.version) query.version = validate.data.version

      const factors = await EmissionFactor.find(query)

      res.status(200).json({
        status: 'success',
        data: { factors },
      })
    } catch (error) {
      next(error)
    }
  },

  searchFactors: async (req, res, next) => {
    try {
      const validate = factorSearchSchema.safeParse(req.query)
      if (!validate.success) {
        const error = new ValidationError('Invalid search query')
        error.errors = validate.error.format()
        throw error
      }

      const { q } = validate.data
      const searchRegex = new RegExp(q, 'i')

      const factors = await EmissionFactor.find({
        isActive: true,
        $or: [
          { key: searchRegex },
          { category: searchRegex },
          { subCategory: searchRegex },
          { activity: searchRegex },
          { source: searchRegex },
          { state: searchRegex },
        ],
      })

      res.status(200).json({
        status: 'success',
        data: { factors },
      })
    } catch (error) {
      next(error)
    }
  },

  importDataset: async (req, res, next) => {
    try {
      const validate = datasetImportSchema.safeParse(req.body)
      if (!validate.success) {
        const error = new ValidationError('Invalid dataset structure')
        error.errors = validate.error.format()
        throw error
      }

      const { version, source, publicationYear, factors } = validate.data

      // Check duplicates within the payload itself
      const lookupSet = new Set()
      for (const f of factors) {
        const hash = `${f.key}-${f.state || 'generic'}`
        if (lookupSet.has(hash)) {
          throw new ValidationError(`Duplicate factor key "${f.key}" for state "${f.state || 'generic'}" inside import payload.`)
        }
        lookupSet.add(hash)
      }

      const outlierWarnings = []
      const inserts = []

      for (const f of factors) {
        // Look up the most recent previous version of this same factor key/state for outlier checking
        const prev = await EmissionFactor.findOne({
          key: f.key,
          state: f.state || null,
          isActive: true,
        }).sort({ publicationYear: -1 })

        if (prev) {
          const diffPercent = Math.abs((f.factor - prev.factor) / prev.factor) * 100
          if (diffPercent > 50) {
            outlierWarnings.push({
              key: f.key,
              state: f.state || 'generic',
              previousValue: prev.factor,
              newValue: f.factor,
              deviationPercent: Math.round(diffPercent * 100) / 100,
              message: `New factor deviates by ${Math.round(diffPercent)}% from the previous active version (${prev.version}).`,
            })
          }
        }

        inserts.push({
          ...f,
          value: f.factor, // backwards-compatibility field sync
          source,
          publicationYear,
          version,
          isActive: true,
        })
      }

      // Mark older versions as deprecated
      await EmissionFactor.updateMany(
        { version: { $ne: version }, key: { $in: factors.map((f) => f.key) } },
        { $set: { isActive: false } }
      )

      const result = await EmissionFactor.insertMany(inserts)

      // Create admin audit log entry
      await AuditLog.create({
        userId: req.user?.id || req.user?._id || 'system',
        action: 'factor_import',
        metadata: {
          version,
          count: result.length,
          outliersDetected: outlierWarnings.length,
        },
      })

      res.status(201).json({
        status: 'success',
        message: 'Dataset version imported and processed successfully',
        data: {
          version,
          importedCount: result.length,
          outliers: outlierWarnings,
        },
      })
    } catch (error) {
      next(error)
    }
  },

  getVersions: async (req, res, next) => {
    try {
      const versions = await EmissionFactor.distinct('version')
      res.status(200).json({
        status: 'success',
        data: { versions },
      })
    } catch (error) {
      next(error)
    }
  },

  getSourcesMapping: async (req, res, next) => {
    try {
      const mappings = [
        {
          rank: 1,
          source: 'Central Electricity Authority (CEA)',
          sponsoringAgency: 'Ministry of Power, GoI',
          category: 'Grid Electricity (National/Regional)',
          description: 'CEA CO2 Database v19: CO2 baseline factor of 0.71 kg CO2/kWh (weighted average including renewables) or 0.79 kg CO2/kWh (excluding renewables).',
        },
        {
          rank: 2,
          source: 'Bureau of Energy Efficiency (BEE)',
          sponsoringAgency: 'Ministry of Power, GoI',
          category: 'Appliance Energy Efficiency, Clean Power',
          description: 'Fuel efficiency standards, industrial perform-achieve-trade (PAT) baselines.',
        },
        {
          rank: 3,
          source: 'Ministry of Road Transport & Highways (MoRTH) / ARAI',
          sponsoringAgency: 'Ministry of Road Transport, GoI',
          category: 'Vehicle Emissions, Fuel Economy',
          description: 'ARAI mileage benchmarks; standard gasoline car emission factor: 0.12 - 0.16 kg CO2e/km (class dependent).',
        },
        {
          rank: 4,
          source: 'Ministry of Petroleum & Natural Gas (PPAC)',
          sponsoringAgency: 'Ministry of Petroleum, GoI',
          category: 'Fuel Densities, Calorific Values',
          description: 'Liquid/gaseous fuels (LPG, PNG, Kerosene, Petrol, Diesel) net calorific values and density standards.',
        },
        {
          rank: 5,
          source: 'Central Pollution Control Board (CPCB)',
          sponsoringAgency: 'Ministry of Environment (MoEFCC)',
          category: 'Municipal Solid Waste, Treatment',
          description: 'Waste characterization data, municipal landfill methane generation potential values (typical values: 0.5 - 0.9 kg CO2e/kg of mixed organic waste).',
        },
        {
          rank: 6,
          source: 'Indian Railways',
          sponsoringAgency: 'Ministry of Railways, GoI',
          category: 'Rail Transit (Metro, Electric Rail)',
          description: 'Average passenger rail emissions: 0.008 - 0.015 kg CO2e/passenger-km (electric traction).',
        },
        {
          rank: 7,
          source: 'IPCC Guidelines',
          sponsoringAgency: 'IPCC (UN)',
          category: 'Calculation Methodology, Defaults',
          description: 'Default global warming potentials (GWP): CO2 = 1, CH4 = 28, N2O = 265 (IPCC AR5 values). Used for core stoichiometric equations.',
        },
        {
          rank: 8,
          source: 'IEA / DEFRA / Others',
          sponsoringAgency: 'International Energy Agency',
          category: 'Secondary references & lifestyle factors',
          description: 'Secondary references for lifestyle behaviors (package delivery, online shopping) not explicitly documented by Indian ministries.',
        },
      ]

      res.status(200).json({
        status: 'success',
        data: { mappings },
      })
    } catch (error) {
      next(error)
    }
  },

  compareVersions: async (req, res, next) => {
    try {
      const { v1, v2 } = req.query
      if (!v1 || !v2) {
        throw new ValidationError('Both v1 and v2 query parameters are required for comparison')
      }

      const factorsV1 = await EmissionFactor.find({ version: v1 })
      const factorsV2 = await EmissionFactor.find({ version: v2 })

      const mapV1 = new Map(factorsV1.map((f) => [`${f.key}-${f.state || 'generic'}`, f]))
      const mapV2 = new Map(factorsV2.map((f) => [`${f.key}-${f.state || 'generic'}`, f]))

      const differences = []

      for (const [hash, f2] of mapV2.entries()) {
        const f1 = mapV1.get(hash)
        if (f1) {
          if (f1.factor !== f2.factor) {
            differences.push({
              key: f2.key,
              state: f2.state || 'generic',
              unit: f2.unit,
              [`factor_${v1}`]: f1.factor,
              [`factor_${v2}`]: f2.factor,
              absoluteDifference: Math.round((f2.factor - f1.factor) * 100000) / 100000,
              percentageDifference: Math.round(((f2.factor - f1.factor) / f1.factor) * 10000) / 100,
            })
          }
        } else {
          differences.push({
            key: f2.key,
            state: f2.state || 'generic',
            unit: f2.unit,
            status: 'added_in_newer_version',
            factor: f2.factor,
          })
        }
      }

      // Check for removed factors
      for (const [hash, f1] of mapV1.entries()) {
        if (!mapV2.has(hash)) {
          differences.push({
            key: f1.key,
            state: f1.state || 'generic',
            unit: f1.unit,
            status: 'removed_in_newer_version',
            factor: f1.factor,
          })
        }
      }

      res.status(200).json({
        status: 'success',
        data: {
          compared: { v1, v2 },
          differences,
        },
      })
    } catch (error) {
      next(error)
    }
  },
}

export default emissionFactorController
