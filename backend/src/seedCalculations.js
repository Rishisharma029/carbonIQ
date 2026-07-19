import mongoose from 'mongoose'
import { connectDB } from './config/db.js'
import { User } from './models/User.js'
import { Calculation } from './models/Calculation.js'
import { MonthlySummary } from './models/MonthlySummary.js'
import { Goal } from './models/Goal.js'
import { EmissionFactor } from './models/EmissionFactor.js'
import { ScoreCalculator } from './calculators/ScoreCalculator.js'

const run = async () => {
  try {
    await connectDB()
    console.log('MongoDB connected')

    const users = await User.find({ deletedAt: null })
    if (users.length === 0) {
      console.log('No users found in database. Run register first or register a user via the UI.')
      mongoose.connection.close()
      return
    }

    // Retrieve active emission factors to build a real factors map
    const dbFactors = await EmissionFactor.find({ isActive: true })
    const factorMap = {}
    for (const f of dbFactors) {
      factorMap[f.key] = f.factor
    }

    // Default fallbacks for standard calculator keys if not present
    const defaultFactors = {
      'transport_car_gasoline': 0.000143,
      'transport_car_diesel': 0.000135,
      'transport_car_hybrid': 0.000095,
      'transport_car_electric': 0.000055,
      'transport_transit': 0.000015,
      'transport_flight': 0.115,
      'electricity_grid': 0.00071,
      'food_diet_meat-heavy': 3.3,
      'food_diet_balanced': 2.2,
      'food_diet_vegetarian': 1.5,
      'food_diet_vegan': 1.2,
      'waste_landfill_bag': 0.052,
      'water_consumption': 0.0003,
      'gas_combustion': 0.00298,
    }

    const finalFactors = { ...defaultFactors, ...factorMap }

    // Seed calculations for every user in the database
    for (const user of users) {
      console.log(`Seeding calculations and summaries for user: ${user.email} (${user._id})`)

      // Clear existing calculations and monthly summaries for this user to avoid conflicts
      await Calculation.deleteMany({ userId: user._id })
      await MonthlySummary.deleteMany({ userId: user._id })
      await Goal.deleteMany({ userId: user._id })

      // Generate 6 months of historical calculations (from 6 months ago up to today)
      const now = new Date()
      const startEmissions = []

      for (let i = 5; i >= 0; i--) {
        const date = new Date(now.getFullYear(), now.getMonth() - i, 15)
        
        // Define realistic inputs that decrease gradually over months (showing reduction progress)
        const improvementFactor = 1 - i * 0.05 // e.g. 25% better footprint over time
        const inputs = {
          transport: {
            carDistance: Math.round(500 * improvementFactor),
            carFuelType: 'gasoline',
            transitHours: Math.round(15 + i * 2), // increasing transit
            flightHours: i === 5 ? 5 : 0, // flight in month 5
          },
          electricity: {
            gridConsumption: Math.round(250 * improvementFactor),
            cleanEnergyShare: Math.round(10 + (5 - i) * 8), // increasing clean energy
          },
          food: {
            dietType: i > 2 ? 'meat-heavy' : 'balanced', // switching to balanced diet
            organicShare: Math.round(10 + (5 - i) * 10),
          },
          waste: {
            landfillBags: Math.round(8 * improvementFactor),
            recycledPaper: true,
            recycledPlastic: i < 4,
            recycledGlass: i < 2,
          },
          water: {
            consumptionLitres: Math.round(3000 * improvementFactor),
          },
          gas: {
            consumptionM3: Math.round(12 * improvementFactor),
          },
        }

        // Compute using the real ScoreCalculator and database emission factors
        const calculated = ScoreCalculator.calculateAll(inputs, finalFactors)
        const results = {
          transportEmission: calculated.transportEmission,
          electricityEmission: calculated.electricityEmission,
          foodEmission: calculated.foodEmission,
          wasteEmission: calculated.wasteEmission,
          waterEmission: calculated.waterEmission,
          gasEmission: calculated.gasEmission,
          totalEmission: calculated.totalEmission,
        }

        const calculation = await Calculation.create({
          userId: user._id,
          inputs,
          results,
          score: calculated.score,
          explainability: calculated.explainability,
          factorVersion: 'IN-2023-V1.0',
          schemaVersion: 2,
          createdByVersion: '1.0.0',
          createdAt: date,
          updatedAt: date,
        })

        // Add monthly summary entry
        const year = date.getUTCFullYear()
        const month = date.getUTCMonth() + 1
        
        await MonthlySummary.create({
          userId: user._id,
          year,
          month,
          transport: results.transportEmission,
          electricity: results.electricityEmission,
          food: results.foodEmission,
          waste: results.wasteEmission,
          totalEmission: results.totalEmission,
          averageScore: calculated.score,
          calculationCount: 1,
          createdAt: date,
          updatedAt: date,
        })

        if (i === 5) {
          startEmissions.push(results.totalEmission)
        }
      }

      // Seed a realistic Goal
      const baseline = startEmissions[0] || 10.0
      await Goal.create({
        userId: user._id,
        title: 'Reduce overall annual CO2 footprint by 20%',
        category: 'total',
        baselineEmission: baseline,
        currentEmission: baseline * 0.85,
        targetReduction: baseline * 0.80,
        progress: 75.0,
        endDate: new Date(now.getFullYear(), now.getMonth() + 3, 1),
        status: 'active',
      })

      console.log(`Seeding complete for user ${user.email}. Seeding results: 6 calculations, 6 monthly summaries, 1 reduction goal.`)
    }

    mongoose.connection.close()
    console.log('Database connection closed.')
  } catch (err) {
    console.error('Error seeding calculations:', err)
  }
}

run()
