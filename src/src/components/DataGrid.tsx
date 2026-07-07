import React, { useState, useMemo } from 'react';
import { ChevronUp, ChevronDown, Search, Download, ChevronLeft, ChevronRight, Edit2, Trash2, Eye } from 'lucide-react';

/**
 * Interface representing a column definition in the DataGrid.
 */
export interface GridColumn<T> {
  key: string;                                          // Field name key in row object
  label: string;                                        // Header text label displayed
  sortable?: boolean;                                   // Can this column be sorted?
  render?: (row: T) => React.ReactNode;                 // Custom renderer for cell content
  type?: 'string' | 'number' | 'currency' | 'date';     // Data type to apply proper alignment and sorting math
}

/**
 * Props expected by the reusable DataGrid component.
 */
interface DataGridProps<T> {
  data: T[];                                            // Raw list of records
  columns: GridColumn<T>[];                             // Column schemas
  searchPlaceholder?: string;                           // Placeholder text for global search input
  searchKeys?: (keyof T | string)[];                    // Specific keys to scan during full-text search
  onView?: (row: T) => void;                            // Optional view details handler
  onEdit?: (row: T) => void;                            // Optional edit handler
  onDelete?: (row: T) => void;                          // Optional delete handler
  canEdit?: (row: T) => boolean;                        // Callback to check if editing is permitted for a row
  canDelete?: (row: T) => boolean;                      // Callback to check if deleting is permitted for a row
  exportFilename?: string;                              // File name prefix for CSV downloads
  actionsLabel?: string;                                // Header title for action column
}

export function DataGrid<T extends { id?: string | number; [key: string]: any }>({
  data,
  columns,
  searchPlaceholder = 'Search records...',
  searchKeys,
  onView,
  onEdit,
  onDelete,
  canEdit,
  canDelete,
  exportFilename = 'export',
  actionsLabel = 'Actions'
}: DataGridProps<T>) {
  
  // --- STATE MANAGERS ---
  const [searchTerm, setSearchTerm] = useState<string>('');                     // Current search phrase
  const [sortKey, setSortKey] = useState<string | null>(null);                  // Active sorting field key
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');    // Sort direction toggle
  const [currentPage, setCurrentPage] = useState<number>(1);                    // Paging controller state
  const [pageSize, setPageSize] = useState<number>(10);                         // Items displayed per view page

  // --- EXPLANATION OF SORTING ALGORITHM ---
  /**
   * Sorts two rows based on a specific property key and its defined type.
   * Handling currency values, numeric sizes, and standard strings carefully.
   */
  const handleSortClick = (key: string) => {
    if (sortKey === key) {
      // Toggle sort direction if same header clicked again
      setSortDirection(prev => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      // Initiate new sorting column
      setSortKey(key);
      setSortDirection('asc');
    }
    setCurrentPage(1); // Reset back to first page
  };

  // --- EXPLANATION OF FILTERING & SEARCHING ---
  /**
   * Memoized processing of raw data list. Performs global searching,
   * handles dynamic sorting according to active directions, and paginates.
   */
  const processedData = useMemo(() => {
    let result = [...data];

    // 1. Apply Full-Text Search Filter
    if (searchTerm.trim() !== '') {
      const query = searchTerm.toLowerCase().trim();
      const keysToSearch = searchKeys || columns.map(c => c.key);

      result = result.filter(row => {
        return keysToSearch.some(key => {
          const value = row[key as string];
          if (value === undefined || value === null) return false;
          return String(value).toLowerCase().includes(query);
        });
      });
    }

    // 2. Apply Column-based Sorting
    if (sortKey) {
      const columnDef = columns.find(c => c.key === sortKey);
      const isAsc = sortDirection === 'asc';

      result.sort((a, b) => {
        let valA = a[sortKey];
        let valB = b[sortKey];

        // Handle null values
        if (valA === undefined || valA === null) return isAsc ? 1 : -1;
        if (valB === undefined || valB === null) return isAsc ? -1 : 1;

        if (columnDef?.type === 'number' || columnDef?.type === 'currency') {
          const numA = Number(valA);
          const numB = Number(valB);
          return isAsc ? numA - numB : numB - numA;
        } else if (columnDef?.type === 'date') {
          const dateA = new Date(valA).getTime();
          const dateB = new Date(valB).getTime();
          return isAsc ? dateA - dateB : dateB - dateA;
        } else {
          // Standard case insensitive string collation
          const strA = String(valA).toLowerCase();
          const strB = String(valB).toLowerCase();
          return isAsc 
            ? strA.localeCompare(strB) 
            : strB.localeCompare(strA);
        }
      });
    }

    return result;
  }, [data, columns, searchTerm, searchKeys, sortKey, sortDirection]);

  // --- EXPLANATION OF PAGINATION RANGE CALCULATION ---
  const totalItems = processedData.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  
  // Guard current page range
  const activePage = Math.min(currentPage, totalPages);

  const paginatedData = useMemo(() => {
    const startIndex = (activePage - 1) * pageSize;
    return processedData.slice(startIndex, startIndex + pageSize);
  }, [processedData, activePage, pageSize]);

  // --- EXPLANATION OF CSV EXPORT FUNCTION ---
  /**
   * Iterates over filtered/sorted items and formats row objects into a CSV table blob,
   * managing escaping of commas, quotes, and carriage returns.
   */
  const handleExportCSV = () => {
    // Generate Header row
    const csvHeaders = columns.map(col => `"${col.label.replace(/"/g, '""')}"`).join(',');

    // Map each row value to string
    const csvRows = processedData.map(row => {
      return columns.map(col => {
        const val = row[col.key];
        let displayVal = '';
        if (val !== undefined && val !== null) {
          if (col.type === 'currency') {
            displayVal = `₹${Number(val).toLocaleString('en-IN')}`;
          } else {
            displayVal = String(val);
          }
        }
        // Escape standard CSV delimiters
        if (displayVal.includes(',') || displayVal.includes('"') || displayVal.includes('\n')) {
          return `"${displayVal.replace(/"/g, '""')}"`;
        }
        return `"${displayVal}"`;
      }).join(',');
    });

    const csvContent = '\uFEFF' + [csvHeaders, ...csvRows].join('\n'); // Add UTF-8 BOM
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `${exportFilename}_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-sm flex flex-col gap-4 animate-fade-in w-full">
      
      {/* 1. GRID ACTION BAR: SEARCH, EXPORT, PAGE SIZE */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3.5 border-b border-slate-100 pb-4">
        
        {/* Search Input Container */}
        <div className="relative w-full sm:max-w-xs">
          <Search className="absolute left-3.5 top-2.5 h-4 w-4 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentPage(1); // Return to first page on search
            }}
            placeholder={searchPlaceholder}
            className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-4 py-2 text-xs font-semibold text-slate-800 placeholder-slate-400 focus:outline-none focus:border-[#EE1D23] transition-colors"
          />
        </div>

        {/* Export and Configuration Buttons */}
        <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
          {/* Page size selector */}
          <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-500">
            <span>Show</span>
            <select
              value={pageSize}
              onChange={(e) => {
                setPageSize(Number(e.target.value));
                setCurrentPage(1);
              }}
              className="bg-slate-50 border border-slate-200 rounded-lg px-2 py-1 text-xs font-bold text-slate-700 focus:outline-none"
            >
              <option value={5}>5</option>
              <option value={10}>10</option>
              <option value={20}>20</option>
              <option value={50}>50</option>
            </select>
          </div>

          {/* Export Button */}
          <button
            onClick={handleExportCSV}
            title="Export filtered records to spreadsheet CSV format"
            className="bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs px-3.5 py-2 rounded-xl transition-all shadow-sm flex items-center gap-1.5 cursor-pointer select-none"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* 2. MAIN DATA TABLE */}
      <div className="overflow-x-auto rounded-2xl border border-slate-100 bg-slate-50/20">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="bg-slate-50 text-[9px] text-slate-400 font-extrabold uppercase tracking-widest border-b border-slate-100 select-none">
              {columns.map((col) => (
                <th
                  key={col.key}
                  onClick={() => col.sortable !== false && handleSortClick(col.key)}
                  className={`p-3.5 font-black ${col.sortable !== false ? 'cursor-pointer hover:bg-slate-100/70 hover:text-slate-700 transition-colors' : ''} ${
                    col.type === 'number' || col.type === 'currency' ? 'text-right' : 'text-left'
                  }`}
                >
                  <div className={`flex items-center gap-1 ${col.type === 'number' || col.type === 'currency' ? 'justify-end' : 'justify-start'}`}>
                    <span>{col.label}</span>
                    {col.sortable !== false && sortKey === col.key && (
                      sortDirection === 'asc' ? <ChevronUp className="w-3 h-3 text-[#EE1D23]" /> : <ChevronDown className="w-3 h-3 text-[#EE1D23]" />
                    )}
                  </div>
                </th>
              ))}
              {(onView || onEdit || onDelete) && (
                <th className="p-3.5 text-right font-black w-28">{actionsLabel}</th>
              )}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 bg-white">
            {paginatedData.map((row, rowIdx) => {
              const rowId = row.id || rowIdx;
              return (
                <tr key={rowId} className="hover:bg-slate-50/60 transition-colors">
                  {columns.map((col) => {
                    const cellVal = row[col.key];
                    const isRightAlign = col.type === 'number' || col.type === 'currency';

                    return (
                      <td
                        key={col.key}
                        className={`p-3.5 font-semibold text-slate-700 ${isRightAlign ? 'text-right' : 'text-left'}`}
                      >
                        {col.render ? (
                          col.render(row)
                        ) : col.type === 'currency' ? (
                          <span className="font-bold text-slate-900">
                            ₹{Number(cellVal || 0).toLocaleString('en-IN')}
                          </span>
                        ) : col.type === 'date' ? (
                          <span className="font-bold text-slate-800">{String(cellVal || '')}</span>
                        ) : (
                          String(cellVal ?? '')
                        )}
                      </td>
                    );
                  })}
                  {(onView || onEdit || onDelete) && (
                    <td className="p-3.5 text-right space-x-1 whitespace-nowrap">
                      {onView && (
                        <button
                          onClick={() => onView(row)}
                          title="View Details"
                          className="text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 p-1.5 rounded-lg transition-all inline-flex items-center cursor-pointer"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                      )}
                      {onEdit && (!canEdit || canEdit(row)) && (
                        <button
                          onClick={() => onEdit(row)}
                          title="Edit this entry"
                          className="text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 p-1.5 rounded-lg transition-all inline-flex items-center cursor-pointer"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                      {onDelete && (!canDelete || canDelete(row)) && (
                        <button
                          onClick={() => onDelete(row)}
                          title="Delete this entry"
                          className="text-slate-400 hover:text-[#EE1D23] hover:bg-red-50 p-1.5 rounded-lg transition-all inline-flex items-center cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </td>
                  )}
                </tr>
              );
            })}
            
            {/* Empty Fallback */}
            {totalItems === 0 && (
              <tr>
                <td colSpan={columns.length + (onView || onEdit || onDelete ? 1 : 0)} className="p-10 text-center">
                  <div className="flex flex-col items-center justify-center gap-2">
                    <span className="text-sm font-bold text-slate-800">No matching records found</span>
                    <span className="text-xs text-slate-400">Try adjusting your search filters or add a new entry.</span>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* 3. GRID FOOTER PAGINATION CONTROLLS */}
      {totalItems > 0 && (
        <div className="flex flex-col sm:flex-row justify-between items-center gap-3 pt-3 border-t border-slate-100">
          
          {/* Entry Info Summary */}
          <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wide">
            Showing <span className="text-slate-700">{(activePage - 1) * pageSize + 1}</span> to{' '}
            <span className="text-slate-700">{Math.min(activePage * pageSize, totalItems)}</span> of{' '}
            <span className="text-slate-700">{totalItems}</span> entries
          </div>

          {/* Navigation Controls */}
          <div className="flex items-center gap-1">
            <button
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              disabled={activePage === 1}
              className="p-1.5 border border-slate-200 rounded-lg text-slate-500 hover:bg-slate-50 disabled:opacity-40 disabled:hover:bg-transparent transition-colors cursor-pointer"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
            </button>
            
            {/* Direct Page Numbers */}
            {Array.from({ length: totalPages }, (_, idx) => {
              const pageNum = idx + 1;
              const isActive = pageNum === activePage;
              return (
                <button
                  key={pageNum}
                  onClick={() => setCurrentPage(pageNum)}
                  className={`w-7 h-7 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                    isActive
                      ? 'bg-[#EE1D23] text-white shadow-sm'
                      : 'text-slate-500 hover:bg-slate-50 border border-transparent hover:border-slate-200'
                  }`}
                >
                  {pageNum}
                </button>
              );
            })}

            <button
              onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
              disabled={activePage === totalPages}
              className="p-1.5 border border-slate-200 rounded-lg text-slate-500 hover:bg-slate-50 disabled:opacity-40 disabled:hover:bg-transparent transition-colors cursor-pointer"
            >
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

    </div>
  );
}
