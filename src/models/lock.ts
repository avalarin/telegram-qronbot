import { Document, Model, model, Schema } from 'mongoose'

export interface ILockModel extends ILock, Document {
}

export interface ILock {
  taken: boolean,
  takenBy: string
}

export const LockSchema: Schema = new Schema({
  taken: Boolean,
  takenBy: { type: Schema.Types.ObjectId, ref: 'Heartbeat' },
})
