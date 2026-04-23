export const ratingLabel: { [index: string]: string } = {
  1: 'น้อยที่สุด',
  2: 'น้อย',
  3: 'ปานกลาง',
  4: 'มาก',
  5: 'มากที่สุด'
};

export function getLabelText(value: number) {
  return `${value} Star${value !== 1 ? 's' : ''}, ${ratingLabel[value]}`;
}
