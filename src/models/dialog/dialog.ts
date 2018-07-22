import { Document, Model, model, Schema } from 'mongoose'

export interface IDialogModel extends IDialog, Document {
}

export interface IDialog {
  state: string
  messageId: number
  chatId: number
  ownerId: number
  data: any
}

const DialogSchema: Schema = new Schema({
  state: { type: String, default: 'START' },
  messageId: { type: Number, index: true },
  chatId: { type: Number, index: true },
  ownerId: { type: Number, index: true },
  data: { type: Object },
})

export const Dialog: Model<IDialogModel> = model<IDialogModel>('Dialog', DialogSchema)
