import {Adapter} from 'js-data-adapter'

interface IDict {
  [key: string]: any;
}
interface IBaseAdapter extends IDict {
  debug?: boolean,
  raw?: boolean
}
interface IBaseCloudDatastoreAdapter extends IBaseAdapter {
  gcloudOpts?: IDict
  gcloud?: any
}
export class CloudDatastoreAdapter extends Adapter {
  static extend(instanceProps?: IDict, classProps?: IDict): typeof CloudDatastoreAdapter
  constructor(opts?: IBaseCloudDatastoreAdapter)
}
export interface OPERATORS {
  '==': Function
  '===': Function
  '!=': Function
  '!==': Function
  '>': Function
  '>=': Function
  '<': Function
  '<=': Function
}
export interface version {
  full: string
  minor: string
  major: string
  patch: string
  alpha: string | boolean
  beta: string | boolean
}