import { IDialogMenu } from './IDialogMenu'

export interface IDialogMessage {
  text: string,
  final: boolean,
  menu?: IDialogMenu
}
