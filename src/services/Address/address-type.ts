export interface Address {
  addressDetail: string;
  addressType: string;
  isDefault: boolean;
  label: string;
  addressLine1: string;
  addressLine2: string;
  subdistrict: SubDistrict | null;
  district: District | null;
  province: Province | null;
  country: string;
}
export interface SubDistrict {
  id: string;
  districtId: string;
  nameTh: string;
  nameEn: string;
  zipCode: string;
}

export interface District {
  id: string;
  provinceId: string;
  nameTh: string;
  nameEn: string;
}

export interface Province {
  id: string;
  nameTh: string;
  nameEn: string;
  type: string;
}

export interface GetProvince {
  data: Province[];
}

export interface GetDistrict {
  data: District[];
}

export interface GetSubDistrict {
  data: SubDistrict[];
}
