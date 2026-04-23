import { SaveAlt } from '@mui/icons-material';
import { Button } from '@mui/material';
import { saveAs } from 'file-saver';
import { useTranslation } from 'react-i18next';
import * as XLSX from 'xlsx';

interface ExcelExportProps {
  data: any;
  fileName: string;
  sheetName: string;
  disabled: boolean;
}

export default function ExcelExport({
  data,
  fileName,
  sheetName,
  disabled
}: ExcelExportProps): JSX.Element {
  const { t } = useTranslation();
  const exportToExcel = () => {
    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);
    const excelBuffer = XLSX.write(workbook, {
      bookType: 'xlsx',
      type: 'array'
    });
    const blob = new Blob([excelBuffer], { type: 'application/octet-stream' });
    saveAs(blob, `${fileName}.xlsx`);
  };

  return (
    <Button
      onClick={exportToExcel}
      variant="contained"
      component="label"
      disabled={disabled}
      startIcon={<SaveAlt />}>
      {t('button.export')}
    </Button>
  );
}
