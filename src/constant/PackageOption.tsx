import { SelectOption } from 'utils';

export const getNFPackageOptions = (): SelectOption[] => [
  {
    value: '30',
    label: 'NF ต่ออายุ 1 เดือน 159 บาท'
  },
  {
    value: '60',
    label: 'NF ต่ออายุ 2 เดือน 259 บาท'
  },
  {
    value: '90',
    label: 'NF ต่ออายุ 3 เดือน 359 บาท'
  },
  {
    value: '180',
    label: 'NF ต่ออายุ 6 เดือน 659 บาท'
  },
  {
    value: '365',
    label: 'NF ต่ออายุ 1 ปี 1059 บาท'
  }
];

export const getAccountTypeOptions = (): SelectOption[] => [
  {
    value: 'TV',
    label: 'ทีวี'
  },
  {
    value: 'ADDITIONAL',
    label: 'จอเสริม'
  },
  {
    value: 'OTHER',
    label: 'อุปกรณ์อื่นๆ'
  }
];
