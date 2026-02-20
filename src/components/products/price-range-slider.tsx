'use client';

import { useState, useEffect } from 'react';
import { Slider } from '@/components/ui/slider';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useSettings } from '@/hooks/use-settings';

interface PriceRangeSliderProps {
  min: number;
  max: number;
  value: [number, number];
  onChange: (value: [number, number]) => void;
  step?: number;
}

export function PriceRangeSlider({
  min,
  max,
  value,
  onChange,
  step = 10
}: PriceRangeSliderProps) {
  const { settings, formatPrice } = useSettings();
  const [localValue, setLocalValue] = useState<[number, number]>(value);
  const [minInput, setMinInput] = useState(value[0].toString());
  const [maxInput, setMaxInput] = useState(value[1].toString());

  useEffect(() => {
    setLocalValue(value);
    setMinInput(value[0].toString());
    setMaxInput(value[1].toString());
  }, [value]);

  const handleSliderChange = (newValue: number[]) => {
    const range: [number, number] = [newValue[0] || min, newValue[1] || max];
    setLocalValue(range);
    setMinInput(range[0].toString());
    setMaxInput(range[1].toString());
    onChange(range);
  };

  const handleMinInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setMinInput(val);

    const numVal = parseFloat(val);
    if (!isNaN(numVal) && numVal >= min && numVal <= localValue[1]) {
      const newRange: [number, number] = [numVal, localValue[1]];
      setLocalValue(newRange);
      onChange(newRange);
    }
  };

  const handleMaxInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setMaxInput(val);

    const numVal = parseFloat(val);
    if (!isNaN(numVal) && numVal <= max && numVal >= localValue[0]) {
      const newRange: [number, number] = [localValue[0], numVal];
      setLocalValue(newRange);
      onChange(newRange);
    }
  };

  return (
    <div className="space-y-4">
      <div className="px-2">
        <Slider
          min={min}
          max={max}
          step={step}
          value={localValue}
          onValueChange={handleSliderChange}
          className="w-full"
        />
      </div>

      <div className="flex items-center gap-4">
        <div className="flex-1">
          <Label htmlFor="min-price" className="text-xs text-slate-600 mb-1 block">
            Min Price
          </Label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-slate-500">
              {settings?.currency_symbol || 'Rs.'}
            </span>
            <Input
              id="min-price"
              type="number"
              value={minInput}
              onChange={handleMinInputChange}
              min={min}
              max={localValue[1]}
              className="pl-9"
            />
          </div>
        </div>

        <div className="pt-6">
          <span className="text-slate-400">-</span>
        </div>

        <div className="flex-1">
          <Label htmlFor="max-price" className="text-xs text-slate-600 mb-1 block">
            Max Price
          </Label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-slate-500">
              {settings?.currency_symbol || 'Rs.'}
            </span>
            <Input
              id="max-price"
              type="number"
              value={maxInput}
              onChange={handleMaxInputChange}
              min={localValue[0]}
              max={max}
              className="pl-9"
            />
          </div>
        </div>
      </div>

      <div className="text-center">
        <p className="text-sm text-slate-600">
          {formatPrice(localValue[0])} - {formatPrice(localValue[1])}
        </p>
      </div>
    </div>
  );
}
