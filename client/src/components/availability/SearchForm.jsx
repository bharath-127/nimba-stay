import { useState } from 'react';
import Input from '../ui/Input.jsx';
import Select from '../ui/Select.jsx';
import Button from '../ui/Button.jsx';
import Icon from '../ui/Icon.jsx';
import { addDays, countNights } from '../../utils/dates.js';
import { validateSearch, hasErrors } from '../../utils/validation.js';
import { formatINR, pluralize } from '../../utils/format.js';

/**
 * The booking bar: check-in · check-out · category · search.
 * A single horizontal row from `lg` up, stacked on phones. Validates locally
 * for instant feedback, then hands the params to the parent, which calls the
 * API. `categories` are room types from the API: `{ name, pricePerNight }`.
 */
export default function SearchForm({ initialValues, categories, categoriesLoading, loading, onSearch }) {
  const [values, setValues] = useState(initialValues);
  const [errors, setErrors] = useState({});

  const nights = countNights(values.checkIn, values.checkOut);

  const update = (field) => (e) => {
    const next = { ...values, [field]: e.target.value };
    // Keep check-out at least one night after a newly chosen check-in.
    if (field === 'checkIn' && next.checkOut && countNights(next.checkIn, next.checkOut) <= 0) {
      next.checkOut = addDays(next.checkIn, 1);
    }
    setValues(next);
    if (errors[field]) setErrors(validateSearch(next));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const nextErrors = validateSearch(values);
    setErrors(nextErrors);
    if (hasErrors(nextErrors)) return;
    onSearch({ checkIn: values.checkIn, checkOut: values.checkOut, category: values.category || '' });
  };

  return (
    <form
      onSubmit={handleSubmit}
      noValidate
      aria-label="Search availability"
      className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_minmax(0,1.15fr)_auto] lg:items-start"
    >
      <Input
        id="checkIn"
        label="Check-in"
        type="date"
        variant="hero"
        leading={<Icon name="calendar" className="h-4 w-4" />}
        value={values.checkIn}
        onChange={update('checkIn')}
        error={errors.checkIn}
        required
      />
      <Input
        id="checkOut"
        label="Check-out"
        type="date"
        variant="hero"
        leading={<Icon name="calendar" className="h-4 w-4" />}
        value={values.checkOut}
        min={values.checkIn ? addDays(values.checkIn, 1) : undefined}
        onChange={update('checkOut')}
        error={errors.checkOut}
        hint={nights > 0 ? pluralize(nights, 'night') : undefined}
        required
      />
      <Select
        id="category"
        label="Room category"
        variant="hero"
        value={values.category}
        onChange={update('category')}
        disabled={categoriesLoading}
        className="sm:col-span-2 lg:col-span-1"
      >
        <option value="">All categories</option>
        {categories.map((c) => (
          <option key={c.name} value={c.name}>
            {c.name}
            {typeof c.pricePerNight === 'number' ? ` · ${formatINR(c.pricePerNight)}/night` : ''}
          </option>
        ))}
      </Select>
      <div className="sm:col-span-2 lg:col-span-1 lg:pt-[26px]">
        <Button
          type="submit"
          size="xl"
          loading={loading}
          icon={<Icon name="search" className="h-5 w-5" strokeWidth={2} />}
          className="w-full lg:w-auto lg:min-w-[13.5rem]"
        >
          {loading ? 'Searching…' : 'Search availability'}
        </Button>
      </div>
    </form>
  );
}
