import { describe, expect, it } from 'vitest';
import { buildMonthlyBarData, formatMonthLabel } from './chartData';

describe('monthly grouped bar chart data', () => {
  it('aligns each month with its own numeric and annotation columns including empty months', () => {
    const data = buildMonthlyBarData(['bucket.fast', 'bucket.pending'], [
      { name: '2025-11', data: [2, 1] },
      { name: '2025-12', data: [0, 0] },
      { name: '2026-01', data: [1, 4] }
    ], (label) => label === 'bucket.fast' ? 'เร็ว' : 'ยังไม่รับ');
    expect(data[0]).toEqual([
      'Category', formatMonthLabel('2025-11'), { role: 'annotation' },
      formatMonthLabel('2025-12'), { role: 'annotation' },
      formatMonthLabel('2026-01'), { role: 'annotation' }
    ]);
    expect(data[1]).toEqual(['เร็ว', 2, '2', 0, '0', 1, '1']);
    expect(data[2]).toEqual(['ยังไม่รับ', 1, '1', 0, '0', 4, '4']);
  });

  it('supports the previous API single-series payload and handles missing numeric entries', () => {
    expect(buildMonthlyBarData(['A', 'B'], [{ name: 'Count', data: [3] }])).toEqual([
      ['Category', 'Count', { role: 'annotation' }],
      ['A', 3, '3'],
      ['B', 0, '0']
    ]);
  });
});
