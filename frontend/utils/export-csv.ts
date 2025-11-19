export function exportTransactionsToCSV(
  transactions: Record<string, unknown>[],
  filename: string = 'transactions.csv'
) {
  if (!Array.isArray(transactions) || transactions.length === 0) {
    console.warn('No transactions to export');
    return;
  }

  const allKeys = Array.from(
    transactions.reduce((keys, tx) => {
      Object.keys(tx).forEach((key) => keys.add(key));
      return keys;
    }, new Set<string>())
  );

  const csvRows = [allKeys.join(',')];
  for (const tx of transactions) {
    const values = allKeys.map((key) => {
      const value = tx[key];
      if (value === undefined || value === null) {
        return '';
      }
      let stringValue = '';
      if (typeof value === 'object') {
        stringValue = JSON.stringify(value);
      } else {
        stringValue = String(value);
      }
      return '"' + stringValue.replace(/"/g, '""') + '"';
    });
    csvRows.push(values.join(','));
  }

  const csvContent = csvRows.join('\n');
  const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.setAttribute('href', url);
  a.setAttribute('download', filename);
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  window.URL.revokeObjectURL(url);
}
