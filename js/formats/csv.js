/**
 * CSV/TSV format handler
 * Demonstrates table rendering capability
 */
(() => {
    // Register detector
    FileDetector.register('csv', {
        mimeTypes: ['text/csv', 'application/csv', 'text/tab-separated-values'],
        extensions: ['csv', 'tsv', 'tab'],
        contentMatcher: (content) => {
            const lines = content.split('\n').slice(0, 5);
            // Check for consistent delimiters
            const delimiters = [',', '\t', '|', ';'];
            return delimiters.some(d =>
                lines.every(line => line.includes(d))
            );
        },
        priority: 6
    });

    // Register formatter
    Formatter.register('csv', {
        parse: (text) => {
            const lines = text.trim().split('\n');
            const delimiter = detectDelimiter(text);

            // Parse as 2D array
            const rows = lines.map(line => parseCSVLine(line, delimiter));

            // Detect if first row is header
            const hasHeader = detectHeader(rows);

            return {
                headers: hasHeader ? rows[0] : null,
                data: hasHeader ? rows.slice(1) : rows,
                delimiter: delimiter,
                rowCount: rows.length,
                columnCount: rows[0]?.length || 0
            };
        },

        format: (data, options = {}) => {
            const delimiter = options.delimiter || data.delimiter || ',';
            const rows = [];

            if (data.headers) {
                rows.push(data.headers.map(h => escapeCSVValue(h, delimiter)).join(delimiter));
            }

            data.data.forEach(row => {
                rows.push(row.map(cell => escapeCSVValue(cell, delimiter)).join(delimiter));
            });

            return rows.join('\n');
        },

        validate: (data) => {
            if (!data.data || data.data.length === 0) {
                return { valid: false, error: 'Empty CSV data' };
            }

            // Check for consistent column count
            const columnCount = data.columnCount;
            const inconsistent = data.data.some(row => row.length !== columnCount);

            if (inconsistent) {
                return { valid: false, error: 'Inconsistent column count across rows' };
            }

            return { valid: true };
        }
    });

    // Custom HTML table renderer for CSV
    Highlighter.register('csv', {
        // CSV uses custom rendering instead of syntax highlighting
        highlight: (text, format) => {
            const parsed = Formatter.parse(text, 'csv');
            if (!parsed.success) {
                return escapeHtml(text);
            }

            const data = parsed.data;
            return renderCSVTable(data);
        }
    });

    /**
     * Detect CSV delimiter
     * @private
     */
    function detectDelimiter(text) {
        const delimiters = [',', '\t', '|', ';'];
        const lines = text.split('\n').slice(0, 10);

        let bestDelimiter = ',';
        let maxConsistency = 0;

        for (const delimiter of delimiters) {
            const counts = lines.map(line =>
                (line.match(new RegExp(delimiter, 'g')) || []).length
            );

            if (counts.length > 0 && counts[0] > 0) {
                const consistency = counts.filter(c => c === counts[0]).length;
                if (consistency > maxConsistency) {
                    maxConsistency = consistency;
                    bestDelimiter = delimiter;
                }
            }
        }

        return bestDelimiter;
    }

    /**
     * Parse CSV line considering quotes
     * @private
     */
    function parseCSVLine(line, delimiter) {
        const result = [];
        let current = '';
        let inQuotes = false;

        for (let i = 0; i < line.length; i++) {
            const char = line[i];
            const next = line[i + 1];

            if (char === '"') {
                if (inQuotes && next === '"') {
                    current += '"';
                    i++;
                } else {
                    inQuotes = !inQuotes;
                }
            } else if (char === delimiter && !inQuotes) {
                result.push(current.trim());
                current = '';
            } else {
                current += char;
            }
        }

        result.push(current.trim());
        return result;
    }

    /**
     * Detect if first row is header
     * @private
     */
    function detectHeader(rows) {
        if (rows.length < 2) return false;

        const firstRow = rows[0];
        const secondRow = rows[1];

        // Check if first row has text and second row has numbers
        const firstRowNumeric = firstRow.filter(cell => !isNaN(cell) && cell !== '').length;
        const secondRowNumeric = secondRow.filter(cell => !isNaN(cell) && cell !== '').length;

        return firstRowNumeric < firstRow.length / 2 &&
            secondRowNumeric > secondRow.length / 2;
    }

    /**
     * Escape CSV value
     * @private
     */
    function escapeCSVValue(value, delimiter) {
        if (value == null) return '';

        const str = String(value);
        if (str.includes(delimiter) || str.includes('"') || str.includes('\n')) {
            return `"${str.replace(/"/g, '""')}"`;
        }

        return str;
    }

    /**
     * Render CSV as HTML table
     * @private
     */
    function renderCSVTable(data) {
        let html = '<div class="fv-csv-wrapper"><table class="fv-csv-table">';

        // Headers
        if (data.headers) {
            html += '<thead><tr>';
            html += '<th class="fv-csv-row-num">#</th>';
            data.headers.forEach(header => {
                html += `<th>${escapeHtml(header)}</th>`;
            });
            html += '</tr></thead>';
        }

        // Body
        html += '<tbody>';
        data.data.forEach((row, index) => {
            html += '<tr>';
            html += `<td class="fv-csv-row-num">${index + 1}</td>`;
            row.forEach(cell => {
                const cellClass = !isNaN(cell) && cell !== '' ? 'fv-csv-numeric' : '';
                html += `<td class="${cellClass}">${escapeHtml(cell)}</td>`;
            });
            html += '</tr>';
        });
        html += '</tbody>';

        html += '</table></div>';

        // Add summary
        html += `<div class="fv-csv-summary">`;
        html += `Rows: ${data.rowCount} | Columns: ${data.columnCount}`;
        html += `</div>`;

        return html;
    }

    /**
     * Escape HTML
     * @private
     */
    function escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = String(text);
        return div.innerHTML;
    }
})();