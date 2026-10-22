import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import axe from 'axe-core';
import { describe, expect, it, vi } from 'vitest';

import FlightCard from '@/components/flight-card';

describe('FlightCard', () => {
  it('渲染航司、航班号、价格与推荐标记，点击后通知选择', async () => {
    const onSelect = vi.fn();
    const { container } = render(
      <FlightCard
        airline="国航"
        flightNo="CA1234"
        // 128050 分 = 1280.50 元
        priceCents={128050}
        isRecommended
        onSelect={onSelect}
      />,
    );

    expect(screen.getByText('国航')).toBeTruthy();
    expect(screen.getByText('CA1234')).toBeTruthy();
    expect(screen.getByText('1280.50')).toBeTruthy();
    expect(screen.getByText('推荐')).toBeTruthy();

    await userEvent.click(screen.getByRole('button', { name: /CA1234/ }));
    expect(onSelect).toHaveBeenCalledOnce();

    const results = await axe.run(container);
    expect(results.violations).toEqual([]);
  });

  it('价格按分转元展示，不直接输出接口原值', () => {
    render(
      <FlightCard
        airline="南航"
        flightNo="CZ3000"
        priceCents={90000}
        isRecommended={false}
        onSelect={vi.fn()}
      />,
    );

    expect(screen.getByText('900.00')).toBeTruthy();
    expect(screen.queryByText('90000')).toBeNull();
  });

  it('非推荐航班不展示推荐标记', () => {
    render(
      <FlightCard
        airline="东航"
        flightNo="MU5678"
        priceCents={90000}
        isRecommended={false}
        onSelect={vi.fn()}
      />,
    );

    expect(screen.getByText('MU5678')).toBeTruthy();
    expect(screen.queryByText('推荐')).toBeNull();
  });
});
