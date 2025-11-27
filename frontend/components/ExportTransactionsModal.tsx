import { Button } from '@/components/ui/button';
import { DatePicker } from '@/components/ui/datepicker';
import React from 'react';

interface ExportTransactionsModalProps {
  show: boolean;
  onClose: () => void;
  onExportRange: (fromDate: Date | null, toDate: Date | null) => void;
  onExportAll: () => void;
  exportFromDate: Date | null;
  exportToDate: Date | null;
  setExportFromDate: (date: Date | null) => void;
  setExportToDate: (date: Date | null) => void;
}

export const ExportTransactionsModal: React.FC<ExportTransactionsModalProps> = ({
  show,
  onClose,
  onExportRange,
  onExportAll,
  exportFromDate,
  exportToDate,
  setExportFromDate,
  setExportToDate,
}) => {
  React.useEffect(() => {
    if (show) {
      const today = new Date();
      const oneMonthAgo = new Date();
      oneMonthAgo.setMonth(today.getMonth() - 1);
      if (!exportToDate) setExportToDate(today);
      if (!exportFromDate) setExportFromDate(oneMonthAgo);
    }
  }, [show, exportFromDate, exportToDate, setExportFromDate, setExportToDate]);
  if (!show) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="dark:bg-card min-w-[320px] rounded-xl bg-white p-6 shadow-lg">
        <h3 className="mb-4 text-center text-lg font-semibold">Export Transactions</h3>
        <div className="mb-4 flex flex-col gap-3">
          <label className="text-sm font-medium">From Date</label>
          <DatePicker
            selected={exportFromDate}
            onChange={setExportFromDate}
            maxDate={exportToDate ?? undefined}
            className="bg-card h-10 w-full"
            placeholder="Start date"
          />
          <label className="text-sm font-medium">To Date</label>
          <DatePicker
            selected={exportToDate}
            onChange={setExportToDate}
            minDate={exportFromDate ?? undefined}
            className="bg-card h-10 w-full"
            placeholder="End date"
          />
        </div>
        <div className="flex justify-end gap-2">
          <Button
            type="button"
            className="bg-blue-500/20 text-blue-400 hover:bg-blue-500/40"
            onClick={() => onExportRange(exportFromDate, exportToDate)}
          >
            Export Range
          </Button>
          <Button type="button" className="bg-green-500/20 text-green-400 hover:bg-green-500/40" onClick={onExportAll}>
            Export All
          </Button>
          <Button type="button" className="bg-orange-500/20 text-orange-400 hover:bg-orange-500/40" onClick={onClose}>
            Cancel
          </Button>
        </div>
      </div>
    </div>
  );
};
