import { HttpClient } from '@angular/common/http';
import { Injectable, inject, signal } from '@angular/core';

export type BusinessInfo = {
  id: string;
  name: string;
  tradingName: string;
  address: string;
  address2: string;
  city: string;
  postCode: string;
  county: string;
  countryRegionCode: string;
  phoneNo: string;
  mobilePhoneNo: string;
  email: string;
  homePage: string;
  vatRegistrationNo: string;
  registrationNo: string;
  industrialClassification: string;
  taxAreaCode: string;
  picture: string;
  reportLogo: string;
  languageCode: string;
  currencyCode: string;
  timeZone: string;
  bankName: string;
  bankAccountNo: string;
  iban: string;
  swiftCode: string;
  paymentRoutingInfo: string;
  baseCalendarCode: string;
  icPartnerCode: string;
  responsibilityCenter: string;
  shipmentAddress: string;
  shipmentAddress2: string;
  shipmentCity: string;
  shipmentPostCode: string;
  shipmentCounty: string;
  shipmentCountryRegionCode: string;
  locationCode: string;
  shippingAgentCode: string;
  updatedAt: string;
};

export const defaultBusinessInfo: BusinessInfo = {
  id: 'primary',
  name: 'The Exchange Commercial Ltd.',
  tradingName: 'The Exchange Commercial',
  address: 'The Exchange Building',
  address2: '42 Market Street',
  city: 'Dublin',
  postCode: 'D02 EX42',
  county: 'County Dublin',
  countryRegionCode: 'IE',
  phoneNo: '+353 1 600 0050',
  mobilePhoneNo: '+353 87 600 0050',
  email: 'hello@theexchange.example',
  homePage: 'https://theexchange.example',
  vatRegistrationNo: 'IE1234567X',
  registrationNo: '712345',
  industrialClassification: 'NACE 6820 - Renting and operating of own or leased real estate',
  taxAreaCode: 'IE-DUB',
  picture: '',
  reportLogo: '',
  languageCode: 'en-IE',
  currencyCode: 'EUR',
  timeZone: 'Europe/Dublin',
  bankName: 'Allied Irish Bank',
  bankAccountNo: '12345678',
  iban: 'IE29AIBK93115212345678',
  swiftCode: 'AIBKIE2D',
  paymentRoutingInfo: 'Quote invoice or booking reference on all payments.',
  baseCalendarCode: 'IE-BUSINESS',
  icPartnerCode: '',
  responsibilityCenter: 'DUBLIN-CENTRE',
  shipmentAddress: 'The Exchange Building',
  shipmentAddress2: '42 Market Street',
  shipmentCity: 'Dublin',
  shipmentPostCode: 'D02 EX42',
  shipmentCounty: 'County Dublin',
  shipmentCountryRegionCode: 'IE',
  locationCode: 'EXCHANGE-DUBLIN',
  shippingAgentCode: 'LOCAL-COURIER',
  updatedAt: ''
};

@Injectable({ providedIn: 'root' })
export class BusinessInfoService {
  private readonly http = inject(HttpClient);
  readonly info = signal<BusinessInfo>(defaultBusinessInfo);

  load() {
    this.http.get<{ businessInfo: BusinessInfo }>('/api/business-info').subscribe({
      next: ({ businessInfo }) => {
        if (businessInfo) {
          this.info.set(businessInfo);
        }
      }
    });
  }

  addressLines(info = this.info()) {
    return [info.address, info.address2, [info.city, info.county, info.postCode].filter(Boolean).join(', '), info.countryRegionCode]
      .filter(Boolean);
  }
}
