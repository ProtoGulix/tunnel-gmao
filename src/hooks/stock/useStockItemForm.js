/**
 * @fileoverview Hook état et logique du formulaire stock item
 * @module hooks/stock/useStockItemForm
 */

import { useState, useMemo } from 'react';
import { useStockFamilies } from '@/hooks/stock/useStockFamilies';
import { useStockSubFamilies } from '@/hooks/stock/useStockSubFamilies';
import { generatePattern } from '@/lib/utils/templatePatternGenerator';
import { charsToForm } from '@/lib/utils/stockItemPayload';

const DEFAULTS = {
  ref: '',
  name: '',
  family_code: '',
  sub_family_code: '',
  spec: '',
  dimension: '',
  quantity: 0,
  unit: 'pcs',
  location: '',
};

function fromItem(item) {
  if (!item) return { ...DEFAULTS, characteristics: {} };
  const base = Object.fromEntries(Object.keys(DEFAULTS).map((k) => [k, item[k] ?? DEFAULTS[k]]));
  return { ...base, characteristics: charsToForm(item.characteristics) };
}

export function useStockItemForm(item) {
  const [form, setForm] = useState(() => fromItem(item));
  const [errors, setErrors] = useState([]);
  const { families, loading: familiesLoading } = useStockFamilies();
  const { subFamilies: allSubFamilies } = useStockSubFamilies();

  const subFamilies = useMemo(() => {
    if (!form.family_code) return [];
    return allSubFamilies.filter((s) => s.family_code === form.family_code);
  }, [allSubFamilies, form.family_code]);

  const template = useMemo(
    () =>
      allSubFamilies.find(
        (s) => s.family_code === form.family_code && s.code === form.sub_family_code
      )?.template ?? null,
    [allSubFamilies, form.family_code, form.sub_family_code]
  );

  const suggestedRef = useMemo(() => {
    const prefix = [form.family_code, form.sub_family_code].filter(Boolean).join('-');
    if (template?.pattern) {
      const spec = generatePattern(template.pattern, form.characteristics);
      return [prefix, spec].filter(Boolean).join('-');
    }
    return [prefix, form.spec?.trim(), form.dimension?.trim()].filter(Boolean).join('-');
  }, [
    template,
    form.characteristics,
    form.family_code,
    form.sub_family_code,
    form.spec,
    form.dimension,
  ]);

  const set = (field) => (e) => setForm((prev) => ({ ...prev, [field]: e.target.value }));
  const setVal = (field) => (val) => setForm((prev) => ({ ...prev, [field]: val }));
  const setChar = (key, val) =>
    setForm((prev) => ({ ...prev, characteristics: { ...prev.characteristics, [key]: val } }));

  const handleFamilyChange = (val) => {
    setForm((prev) => ({
      ...prev,
      family_code: val === '__none__' ? '' : val,
      sub_family_code: '',
      characteristics: {},
    }));
  };

  const handleSubFamilyChange = (val) => {
    setForm((prev) => ({
      ...prev,
      sub_family_code: val === '__none__' ? '' : val,
      characteristics: {},
    }));
  };

  return {
    form,
    errors,
    setErrors,
    families,
    familiesLoading,
    subFamilies,
    template,
    suggestedRef,
    set,
    setVal,
    setChar,
    handleFamilyChange,
    handleSubFamilyChange,
  };
}
