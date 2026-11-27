import {
  Add,
  Edit,
  Search,
  ToggleOff,
  ToggleOn
} from '@mui/icons-material';
import {
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Grid,
  MenuItem,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography
} from '@mui/material';
import ConfirmDialog from 'components/ConfirmDialog';
import PageTitle from 'components/PageTitle';
import Paginate from 'components/Paginate';
import { GridSearchSection, Wrapper } from 'components/Styled';
import { Page } from 'layout/LayoutRoute';
import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { useQuery } from 'react-query';
import {
  createComponentDictionary,
  getComponentDictionaryList,
  updateComponentDictionary,
  updateComponentDictionaryStatus
} from 'services/ComponentDictionary/component-dictionary-api';
import {
  ComponentDictionary,
  ComponentDictionarySearch,
  ComponentDictionaryStatus
} from 'services/ComponentDictionary/component-dictionary-type';

const emptyForm: ComponentDictionary = {
  componentCode: '',
  nameTh: '',
  nameEn: '',
  nameZh: '',
  status: 'ACTIVE',
  remark: ''
};

export default function ComponentDictionaryManagement(): JSX.Element {
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [search, setSearch] = useState<ComponentDictionarySearch>({});
  const [searchInput, setSearchInput] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState<ComponentDictionary>(emptyForm);
  const [statusTarget, setStatusTarget] = useState<ComponentDictionary | null>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const urlPage = Number(params.get('page')) || 1;
    const urlSize = Number(params.get('pageSize')) || 20;
    const keyword = params.get('keyword') || '';
    const status = (params.get('status') || '') as ComponentDictionaryStatus | '';
    setPage(urlPage);
    setPageSize(urlSize);
    setSearch({ keyword, status });
    setSearchInput(keyword);
  }, []);

  useEffect(() => {
    const params = new URLSearchParams();
    params.set('page', String(page));
    params.set('pageSize', String(pageSize));
    if (search.keyword) params.set('keyword', search.keyword);
    if (search.status) params.set('status', search.status);
    window.history.replaceState({}, '', `${window.location.pathname}?${params.toString()}`);
  }, [page, pageSize, search]);

  const query = useQuery(
    ['component-dictionary-list', page, pageSize, search],
    () => getComponentDictionaryList(page, pageSize, search),
    { keepPreviousData: true, refetchOnWindowFocus: false }
  );

  const records = query.data?.records || [];
  const pagination = query.data?.pagination;
  const updateForm = (field: keyof ComponentDictionary, value: string) =>
    setForm((current) => ({ ...current, [field]: value }));

  const submitSearch = () => {
    setPage(1);
    setSearch({ keyword: searchInput.trim(), status: search.status || '' });
  };

  const save = async () => {
    if (!form.nameTh.trim()) return;
    try {
      const payload = { ...form, componentCode: form.componentCode?.trim() || null };
      await toast.promise(
        form.id ? updateComponentDictionary(form.id, payload) : createComponentDictionary(payload),
        { loading: 'กำลังบันทึก...', success: 'บันทึกสำเร็จ', error: 'บันทึกไม่สำเร็จ' }
      );
      setDialogOpen(false);
      await query.refetch();
    } catch {
      // toast.promise handles the user-facing error.
    }
  };

  const confirmStatus = async () => {
    if (!statusTarget?.id) return;
    const status: ComponentDictionaryStatus = statusTarget.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
    try {
      await toast.promise(updateComponentDictionaryStatus(statusTarget.id, status), {
        loading: 'กำลังปรับสถานะ...',
        success: 'ปรับสถานะสำเร็จ',
        error: 'ปรับสถานะไม่สำเร็จ'
      });
      setStatusTarget(null);
      await query.refetch();
    } catch {
      // toast.promise handles the user-facing error.
    }
  };

  return (
    <Page>
      <PageTitle title="Component Dictionary" />
      <Wrapper>
        <Grid container spacing={1} alignItems="center" sx={{ mb: 2 }}>
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              size="small"
              label="ค้นหารหัส หรือชื่อ Component"
              value={searchInput}
              onChange={(event) => setSearchInput(event.target.value)}
              onKeyDown={(event) => event.key === 'Enter' && submitSearch()}
            />
          </Grid>
          <Grid item xs={12} sm={4} md={3}>
            <TextField
              select
              fullWidth
              size="small"
              label="สถานะ"
              value={search.status || ''}
              onChange={(event) => {
                setPage(1);
                setSearch((current) => ({ ...current, status: event.target.value as ComponentDictionaryStatus | '' }));
              }}
            >
              <MenuItem value="">ทั้งหมด</MenuItem>
              <MenuItem value="ACTIVE">ใช้งาน</MenuItem>
              <MenuItem value="INACTIVE">ไม่ใช้งาน</MenuItem>
            </TextField>
          </Grid>
          <Grid item xs={12} sm={4} md={3}>
            <Stack direction="row" spacing={1} justifyContent="flex-end">
              <Button variant="contained" startIcon={<Search />} onClick={submitSearch}>ค้นหา</Button>
              <Button variant="outlined" startIcon={<Add />} onClick={() => { setForm({ ...emptyForm }); setDialogOpen(true); }}>
                เพิ่ม
              </Button>
            </Stack>
          </Grid>
        </Grid>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Component Code</TableCell>
                <TableCell>ไทย</TableCell>
                <TableCell>English</TableCell>
                <TableCell>中文</TableCell>
                <TableCell align="center">สถานะ</TableCell>
                <TableCell align="center">จัดการ</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {query.isFetching ? (
                <TableRow><TableCell colSpan={6} align="center"><CircularProgress /></TableCell></TableRow>
              ) : records.length === 0 ? (
                <TableRow><TableCell colSpan={6} align="center"><Typography color="text.secondary">ไม่พบข้อมูล</Typography></TableCell></TableRow>
              ) : records.map((item) => (
                <TableRow key={item.id} hover>
                  <TableCell>{item.componentCode || '-'}</TableCell>
                  <TableCell>{item.nameTh}</TableCell>
                  <TableCell>{item.nameEn || '-'}</TableCell>
                  <TableCell>{item.nameZh || '-'}</TableCell>
                  <TableCell align="center">{item.status === 'ACTIVE' ? 'ใช้งาน' : 'ไม่ใช้งาน'}</TableCell>
                  <TableCell align="center">
                    <Button size="small" startIcon={<Edit />} onClick={() => { setForm({ ...item }); setDialogOpen(true); }}>แก้ไข</Button>
                    <Button size="small" color={item.status === 'ACTIVE' ? 'warning' : 'success'} startIcon={item.status === 'ACTIVE' ? <ToggleOff /> : <ToggleOn />} onClick={() => setStatusTarget(item)}>
                      {item.status === 'ACTIVE' ? 'ปิดใช้' : 'เปิดใช้'}
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
        {pagination && (
          <GridSearchSection container>
            <Grid item xs={12}>
              <Paginate pagination={pagination} page={page} pageSize={pageSize} setPage={setPage} setPageSize={setPageSize} refetch={query.refetch} totalRecords={pagination.totalRecords} isShow />
            </Grid>
          </GridSearchSection>
        )}
      </Wrapper>
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} fullWidth maxWidth="md">
        <DialogTitle>{form.id ? 'แก้ไข Component Dictionary' : 'เพิ่ม Component Dictionary'}</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 0.5 }}>
            <Grid item xs={12} sm={6}><TextField fullWidth label="Component Code" value={form.componentCode || ''} onChange={(e) => updateForm('componentCode', e.target.value)} /></Grid>
            <Grid item xs={12} sm={6}><TextField fullWidth required label="ชื่อภาษาไทย" value={form.nameTh} onChange={(e) => updateForm('nameTh', e.target.value)} /></Grid>
            <Grid item xs={12} sm={6}><TextField fullWidth label="ชื่อภาษาอังกฤษ" value={form.nameEn || ''} onChange={(e) => updateForm('nameEn', e.target.value)} /></Grid>
            <Grid item xs={12} sm={6}><TextField fullWidth label="ชื่อภาษาจีน" value={form.nameZh || ''} onChange={(e) => updateForm('nameZh', e.target.value)} /></Grid>
            <Grid item xs={12}><TextField fullWidth multiline minRows={2} label="หมายเหตุ" value={form.remark || ''} onChange={(e) => updateForm('remark', e.target.value)} /></Grid>
          </Grid>
        </DialogContent>
        <DialogActions><Button onClick={() => setDialogOpen(false)}>ยกเลิก</Button><Button variant="contained" disabled={!form.nameTh.trim()} onClick={save}>บันทึก</Button></DialogActions>
      </Dialog>
      <ConfirmDialog open={!!statusTarget} title="ยืนยันการเปลี่ยนสถานะ" message={`ต้องการ${statusTarget?.status === 'ACTIVE' ? 'ปิด' : 'เปิด'}ใช้งานรายการนี้หรือไม่`} confirmText="ยืนยัน" cancelText="ยกเลิก" isShowCancelButton isShowConfirmButton onConfirm={confirmStatus} onCancel={() => setStatusTarget(null)} />
    </Page>
  );
}
