import type { MouseEventHandler } from 'react';

export interface FlightCardProps {
  airline: string;
  flightNo: string;
  priceCents: number;
  isRecommended: boolean;
  onSelect: MouseEventHandler<HTMLButtonElement>;
}

const CENTS_PER_YUAN = 100;
const PRICE_FRACTION_DIGITS = 2;

export default function FlightCard(props: FlightCardProps) {
  const { airline, flightNo, priceCents, isRecommended, onSelect } = props;

  return (
    <button type="button" onClick={onSelect}>
      <span>{airline}</span>
      <span>{flightNo}</span>
      <span>{(priceCents / CENTS_PER_YUAN).toFixed(PRICE_FRACTION_DIGITS)}</span>
      {isRecommended && <span>推荐</span>}
    </button>
  );
}
