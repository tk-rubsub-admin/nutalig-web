import { GridLocaleText } from '@material-ui/data-grid';

const gridLocaleText: Partial<GridLocaleText> = {
  // Root
  noRowsLabel: 'ไม่มีรายการ',
  noResultsOverlayLabel: 'ไม่มีข้อมูล',
  errorOverlayDefaultLabel: 'เกิดข้อผิดพลาด',

  // Density selector toolbar button text
  toolbarDensity: 'ความหนาแน่น',
  toolbarDensityLabel: 'ความหนาแน่น',
  toolbarDensityCompact: 'กระชับ',
  toolbarDensityStandard: 'มาตรฐาน',
  toolbarDensityComfortable: 'สบายตา',

  // Columns selector toolbar button text
  toolbarColumns: 'คอลัมน์',
  toolbarColumnsLabel: 'เลือกคอลัมน์',

  // Filters toolbar button text
  toolbarFilters: 'ตัวกรอง',
  toolbarFiltersLabel: 'แสดงตัวกรอง',
  toolbarFiltersTooltipHide: 'ซ่อนตัวกรอง',
  toolbarFiltersTooltipShow: 'แสดงตัวกรอง',
  toolbarFiltersTooltipActive: (count) =>
    count !== 1 ? `เปิดใช้งาน ${count} ตัวกรอง` : `เปิดใช้งาน ${count} ตัวกรอง`,

  // Export selector toolbar button text
  toolbarExport: 'โหลดไฟล์',
  toolbarExportLabel: 'โหลดไฟล์',
  toolbarExportCSV: 'ดาวน์โหลดไฟล์ CSV',

  // Columns panel text
  columnsPanelTextFieldLabel: 'ค้นหาคอลัมน์',
  columnsPanelTextFieldPlaceholder: 'ชื่อคอลัมน์',
  columnsPanelDragIconLabel: 'จัดเรียงคอลัมน์',
  columnsPanelShowAllButton: 'แสดงทั้งหมด',
  columnsPanelHideAllButton: 'ซ่อนทั้งหมด',

  // Filter panel text
  filterPanelAddFilter: 'เพิ่มตัวกรอง',
  filterPanelDeleteIconLabel: 'ลบ',
  filterPanelOperators: 'ตัวดำเนินการ',
  filterPanelOperatorAnd: 'และ',
  filterPanelOperatorOr: 'หรือ',
  filterPanelColumns: 'คอลัมน์',
  filterPanelInputLabel: 'ค่า',
  filterPanelInputPlaceholder: 'ตัวกรองค่า',

  // Filter operators text
  filterOperatorContains: 'ประกอบด้วย',
  filterOperatorEquals: 'เท่ากับ',
  filterOperatorStartsWith: 'เริ่มต้นด้วย',
  filterOperatorEndsWith: 'ลงท้ายด้วย',
  filterOperatorIs: 'ใช่',
  filterOperatorNot: 'ไม่ใช่',
  filterOperatorAfter: 'หลังจาก',
  filterOperatorOnOrAfter: 'ใช่หรือหลังจาก',
  filterOperatorBefore: 'ก่อนหน้า',
  filterOperatorOnOrBefore: 'ใช่หรือก่อนหน้า',

  // Filter values text
  filterValueAny: 'ใดๆ',
  filterValueTrue: 'จริง',
  filterValueFalse: 'เท็จ',

  // Column menu text
  columnMenuLabel: 'เมนู',
  columnMenuShowColumns: 'แสดงคอลัมน์',
  columnMenuFilter: 'ตัวกรอง',
  columnMenuHideColumn: 'ซ่อน',
  columnMenuUnsort: 'ไม่เรียงลำดับ',
  columnMenuSortAsc: 'เรียงลำดับจากน้อยไปมาก',
  columnMenuSortDesc: 'เรียงลำดับจากมากไปน้อย',

  // Column header text
  columnHeaderFiltersTooltipActive: (count) =>
    count !== 1 ? `เปิดใช้งาน ${count} ตัวกรอง` : `เปิดใช้งาน ${count} ตัวกรอง`,
  columnHeaderFiltersLabel: 'แสดงตัวกรอง',
  columnHeaderSortIconLabel: 'เรียงลำดับ',

  // Rows selected footer text
  footerRowSelected: (count) =>
    count !== 1 ? `เลือก ${count.toLocaleString()} แถว` : `เลือก ${count.toLocaleString()} แถว`,

  // Total rows footer text
  footerTotalRows: 'แถวทั้งหมด:',

  // Checkbox selection text
  checkboxSelectionHeaderName: 'กล่องตัวเลือก',

  // Boolean cell text
  booleanCellTrueLabel: 'จริง',
  booleanCellFalseLabel: 'เท็จ'
};

export default {
  gridLocaleText
};
