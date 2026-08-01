'use client';

type MonthSelectProps = {
  name?: string;
  value: string;
  id?: string;
  className?: string;
  autoSubmit?: boolean;
};

export function MonthSelect({
  name = 'month',
  value,
  id = 'month',
  className = 'filter-input',
  autoSubmit = false,
}: MonthSelectProps) {
  const [yearText] = value.split('-');
  const selectedYear = Number(yearText) || new Date().getFullYear();
  const options = [];

  for (let year = selectedYear - 3; year <= selectedYear + 3; year += 1) {
    for (let month = 1; month <= 12; month += 1) {
      const optionValue = `${year}-${String(month).padStart(2, '0')}`;
      options.push(
        <option key={optionValue} value={optionValue}>
          Tháng {month} năm {year}
        </option>,
      );
    }
  }

  return (
    <select
      id={id}
      className={className}
      name={name}
      defaultValue={value}
      aria-label="Chọn tháng"
      onChange={autoSubmit ? (event) => event.currentTarget.form?.requestSubmit() : undefined}
    >
      {options}
    </select>
  );
}
