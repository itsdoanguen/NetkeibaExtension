function Dropdown({ label, value, options }) {
  return (
    <label className="field">
      <span>{label}</span>
      <select defaultValue={value} aria-label={label}>
        {options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
    </label>
  )
}

export default Dropdown
