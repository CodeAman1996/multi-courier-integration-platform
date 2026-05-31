export type UrbaneBoltManifestPayload = {
  customerCode: string;
  orderNumber: string;
  declaredValue: number;
  collectableValue: number;
  serviceType: string;
  payMode: string;
  itemDescription: string;
  pieces: number;
  weight: number;
  length: number;
  breadth: number;
  height: number;
  consName: string;
  consMobile: string;
  consAddress: string;
  consCity: string;
  consState: string;
  consPincode: string;
  shprName: string;
  shprMobile: string;
  shprAddress: string;
  shprCity: string;
  shprState: string;
  shprPincode: string;
  rtnName: string;
  rtnMobile: string;
  rtnAddress: string;
  rtnCity: string;
  rtnState: string;
  rtnPincode: string;
};

export type UrbaneBoltTokenResponse = {
  token?: string;
  access?: string;
  access_token?: string;
  expires_in?: number;
};

export type UrbaneBoltManifestResponse = {
  orderNumber?: string;
  order_number?: string;
  shipmentId?: string;
  shipment_id?: string;
  awb?: string;
  awbNumber?: string;
  awb_number?: string;
  status?: string;
};

export type UrbaneBoltTrackingResponse = {
  status?: string;
  current_status?: string;
  history?: Array<Record<string, unknown>>;
  scans?: Array<Record<string, unknown>>;
};

export type UrbaneBoltCancelResponse = {
  status?: string;
  cancelled?: boolean;
  success?: boolean;
};
