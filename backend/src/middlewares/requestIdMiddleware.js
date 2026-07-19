import { v4 as uuidv4 } from 'uuid'

const REQUEST_ID_PATTERN = /^[A-Za-z0-9._:-]{1,128}$/

export const requestIdMiddleware = (req, res, next) => {
  const incomingReqId = req.headers['x-request-id']
  const reqId = REQUEST_ID_PATTERN.test(incomingReqId || '') ? incomingReqId : uuidv4()
  req.id = reqId
  res.setHeader('x-request-id', reqId)
  next()
}
