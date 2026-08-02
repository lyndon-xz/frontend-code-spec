import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';

import FlightCard from '@/components/flight-card';

describe('FlightCard', () => {
  it('渲染航司、航班号、价格与推荐标记', () => {
    const html = renderToStaticMarkup(
      createElement(FlightCard, {
        airline: '国航',
        flightNo: 'CA1234',
        // 128050 分 = 1280.50 元
        price: 128050,
        isRecommended: true,
        onSelect: vi.fn(),
      }),
    );

    expect(html).toContain('国航');
    expect(html).toContain('CA1234');
    expect(html).toContain('1280.50');
    expect(html).toContain('推荐');
  });

  it('价格按分转元展示，不直接输出接口原值', () => {
    const html = renderToStaticMarkup(
      createElement(FlightCard, {
        airline: '南航',
        flightNo: 'CZ3000',
        price: 90000,
        isRecommended: false,
        onSelect: vi.fn(),
      }),
    );

    expect(html).toContain('900.00');
    expect(html).not.toContain('90000');
  });

  it('非推荐航班不展示推荐标记', () => {
    const html = renderToStaticMarkup(
      createElement(FlightCard, {
        airline: '东航',
        flightNo: 'MU5678',
        price: 90000,
        isRecommended: false,
        onSelect: vi.fn(),
      }),
    );

    expect(html).toContain('MU5678');
    expect(html).not.toContain('推荐');
  });
});
