import mongoose from 'mongoose'
import dotenv from 'dotenv'
import path from 'path'
import { dashboardService } from './services/dashboardService.js'

dotenv.config({ path: path.join(process.cwd(), '.env') })

const run = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI)
    console.log('MongoDB connected successfully')
    
    // Query dashboard metrics for a dummy ID
    const dummyId = new mongoose.Types.ObjectId()
    console.log('Querying dashboard metrics for dummy user:', dummyId)
    const metrics = await dashboardService.getMetrics(dummyId)
    console.log('Metrics output:', metrics)
    
    mongoose.connection.close()
  } catch (err) {
    console.error('Error running dashboard service test:', err)
  }
}

run()
