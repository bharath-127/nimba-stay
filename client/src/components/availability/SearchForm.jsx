import { useState } from 'react';
import Input from '../ui/Input.jsx';
import Select from '../ui/Select.jsx';
import Button from '../ui/Button.jsx';
import { addDays, countNights } from '../../utils/dates.js';
import { validateSearch, hasErrors } from '../../utils/validation.js';
import { pluralize } from '../../utils/format.js';

/**
 * Check-in / check-out / category form. Validates locally for instant
 * feedback, then hands the params to the parent, which calls the API.
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
    <form onSubmit={handleSubmit} noValidate className="space-y-4" aria-label="Search availability">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Input
          id="checkIn"
          label="Check-in"
          type="date"
          value={values.checkIn}
          onChange={update('checkIn')}
          error={errors.checkIn}
          required
        />
        <Input
          id="checkOut"
          label="Check-out"
          type="date"
          value={values.checkOut}
          min={values.checkIn ? addDays(values.checkIn, 1) : undefined}
          onChange={update('checkOut')}
          error={errors.checkOut}
          hint={nights > 0 ? pluralize(nights, 'night') : undefined}
          required
        />
      </div>

      <Select
        id="category"
        label="Room category"
        value={values.category}
        onChange={update('category')}
        disabled={categoriesLoading}
      >
        <option value="">All categories</option>
        {categories.map((c) => (
          <option key={c} value={c}>
            {c}
          </option>
        ))}
      </Select>

      <Button type="submit" size="lg" loading={loading} className="w-full">
        {loading ? 'Searching…' : 'Search availability'}
      </Button>
    </form>
  );
}
