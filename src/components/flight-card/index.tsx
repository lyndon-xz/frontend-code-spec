import type { MouseEventHandler } from 'react';

/** 航班卡片入参：数据与选择回调由外部注入 */
export interface FlightCardProps {
  airline: string;
  flightNo: string;
  price: number;
  isRecommended: boolean;
  onSelect: MouseEventHandler<HTMLButtonElement>;
}

// 价格展示保留的小数位数
const PRICE_FRACTION_DIGITS = 2;

/**
 * 航班卡片：展示航司、航班号与价格，点击时直接透传外部回调。
 * 演示 props 接口命名（FlightCardProps）与 JSX 事件直传（无冗余箭头包裹）。
 */
export default function FlightCard(props: FlightCardProps) {
  const { airline, flightNo, price, isRecommended, onSelect } = props;

  return (
    <button type="button" onClick={onSelect}>
      <span>{airline}</span>
      <span>{flightNo}</span>
      <span>{price.toFixed(PRICE_FRACTION_DIGITS)}</span>
      {isRecommended ? <span>推荐</span> : null}
    </button>
  );
}
