export interface Country {
  countryId: number;
  countryName: string;
}

export interface City {
  cityId: number;
  cityName: string;
  provinceId: number;
}

export interface Province {
  provinceId: number;
  provinceName: string;
  countryId: number;
}
