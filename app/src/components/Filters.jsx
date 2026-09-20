import React from 'react';

const Filters = ({ filters, setFilters, uniquePatterns, uniqueSubpatterns, uniqueCompanies }) => {
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({ ...prev, [name]: value }));
  };

  return (
    <div className="filters-container glass-panel">
      <div className="filter-group">
        <label htmlFor="pattern">Pattern</label>
        <select id="pattern" name="pattern" value={filters.pattern} onChange={handleChange}>
          <option value="">All Patterns</option>
          {uniquePatterns.map(p => (
            <option key={p} value={p}>{p}</option>
          ))}
        </select>
      </div>

      <div className="filter-group">
        <label htmlFor="subpattern">Subpattern</label>
        <select id="subpattern" name="subpattern" value={filters.subpattern} onChange={handleChange}>
          <option value="">All Subpatterns</option>
          {uniqueSubpatterns.map(p => (
            <option key={p} value={p}>{p}</option>
          ))}
        </select>
      </div>

      <div className="filter-group">
        <label htmlFor="difficulty">Difficulty</label>
        <select id="difficulty" name="difficulty" value={filters.difficulty} onChange={handleChange}>
          <option value="">All Difficulties</option>
          <option value="Easy">Easy</option>
          <option value="Medium">Medium</option>
          <option value="Hard">Hard</option>
        </select>
      </div>

      <div className="filter-group">
        <label htmlFor="company">Company</label>
        <select id="company" name="company" value={filters.company} onChange={handleChange}>
          <option value="">All Companies</option>
          {uniqueCompanies.map(c => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
      </div>

      <div className="filter-group">
        <label htmlFor="status">Status</label>
        <select id="status" name="status" value={filters.status} onChange={handleChange}>
          <option value="">All</option>
          <option value="completed">Completed</option>
          <option value="pending">Pending</option>
        </select>
      </div>
    </div>
  );
};

export default Filters;
