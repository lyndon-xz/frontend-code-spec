import type { MouseEventHandler } from 'react';

/** 航班卡片入参：数据与选择回调由外部注入 */
export interface FlightCardProps {
  airline: string;
  flightNo: string;
  /** 售价，单位与接口一致为「分」，展示时换算成元 */
  price: number;
  isRecommended: boolean;
  onSelect: MouseEventHandler<HTMLButtonElement>;
}

const CENTS_PER_YUAN = 100;
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
      <span>{(price / CENTS_PER_YUAN).toFixed(PRICE_FRACTION_DIGITS)}</span>
      {isRecommended ? <span>推荐</span> : null}
    </button>
  );
}
