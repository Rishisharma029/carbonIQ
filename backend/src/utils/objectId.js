import mongoose from 'mongoose'

const objectIdPattern = /^[a-f\d]{24}$/i

export const isValidObjectId = (value) => {
  if (typeof value !== 'string' || !objectIdPattern.test(value)) return false
  const validator = mongoose.Types?.ObjectId?.isValid
  return typeof validator === 'function' ? validator(value) : true
}

export default isValidObjectId
