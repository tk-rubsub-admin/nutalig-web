/* eslint-disable prettier/prettier */
import React, { useMemo, useState } from 'react';
import {
    Autocomplete,
    Checkbox,
    Grid,
    IconButton,
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableRow,
    TextField,
    Typography,
    Stack,
    Box,
    Button,
    Paper,
    Popper,
} from '@mui/material';
import {
    Delete as DeleteIcon,
    CheckBox as CheckBoxIcon,
    CheckBoxOutlineBlank as CheckBoxOutlineBlankIcon,
    Check
} from '@mui/icons-material';
import styled from 'styled-components';
import { Staff, StaffKPI } from 'services/Staff/staff-type';
import { updateSaleOrderPackageKpi } from 'services/SaleOrder/sale-order-api';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';
import { isMobileOnly } from 'react-device-detect';
import NumberTextField from 'components/NumberTextField';

const icon = <CheckBoxOutlineBlankIcon fontSize="small" />;
const checkedIcon = <CheckBoxIcon fontSize="small" />;

type Props = {
    poId: string;
    staffList: Staff[];
    value?: StaffKPI[]; // ค่าเดิมจาก parent
    onChange?: (rows: StaffKPI[]) => void;
    onSaved?: () => void; // แจ้ง parent เมื่อบันทึกสำเร็จ (ถ้าต้องการ)
    label?: string;
};

const NoArrowTextField = styled(TextField)({
    '& input::-webkit-outer-spin-button, & input::-webkit-inner-spin-button': {
        display: 'none',
    },
    '& input[type=number]': {
        MozAppearance: 'textfield',
    },
});

// helper: สร้าง map จาก list เพื่อเทียบความเปลี่ยนแปลง
const toIdScoreMap = (rows: StaffKPI[]) =>
    new Map(rows.map((r) => [r.staff.id, Number(r.score ?? 0)]));

// helper: เทียบ 2 maps แบบ staffId/score
const isSameMap = (a: Map<string, number>, b: Map<string, number>) => {
    if (a.size !== b.size) return false;
    for (const [k, v] of a) {
        if (!b.has(k) || b.get(k) !== v) return false;
    }
    return true;
};

export default function StaffKPISelector({
    poId,
    staffList,
    value,
    onChange,
    onSaved,
    label = 'เลือกพนักงานที่แพ็คสินค้า',
}: Props) {
    // state ภายใน
    const { t } = useTranslation();
    const [rows, setRows] = useState<StaffKPI[]>(value ?? []);
    const [saving, setSaving] = useState(false);
    const [openDropdown, setOpenDropdown] = useState(false);

    // sync จาก parent
    React.useEffect(() => {
        if (value) setRows(value);
    }, [value]);

    // รายชื่อที่เลือก (value ของ Autocomplete)
    const selectedStaff = useMemo(() => rows.map((r) => r.staff), [rows]);

    const updateRows = (next: StaffKPI[]) => {
        setRows(next);
        onChange?.(next);
    };

    const handleAutoCompleteChange = (_: any, newStaffList: Staff[]) => {
        if (newStaffList.length === 0) {
            toast.promise(updateSaleOrderPackageKpi(poId, {
                staffs: []
            }), {
                loading: t('toast.loading'),
                success: t('toast.success'),
                error: t('toast.failed')
            });
        }
        const byId = new Map(rows.map((r) => [r.staff.id, r]));
        const nextRows: StaffKPI[] = newStaffList.map((s) => {
            const existed = byId.get(s.id);
            return existed ? existed : { staff: s, score: '' as any };
        });
        updateRows(nextRows);
    };

    const handleChangeValue = (staffId: string, val: string) => {
        // เก็บเป็น number หรือ '' (ถ้าว่าง)
        const parsed = val === '' ? '' : String(Math.max(0, Number(val)));
        const next = rows.map((r) =>
            r.staff.id === staffId ? { ...r, score: parsed as any } : r
        );
        updateRows(next);
    };

    const handleBlueValue = (staffId: string, val: string) => {
        // เก็บเป็น number หรือ '' (ถ้าว่าง)
        const parsed = val === '' ? '' : String(Math.max(0, Number(val)));
        const next = rows.map((r) =>
            r.staff.id === staffId ? { ...r, score: parsed as any } : r
        );

        const payload = next
            .filter((r) => r.score !== '' && r.score !== undefined && r.score !== null)
            .map((r) => ({
                staff: r.staff,
                score: Number(r.score),
            }));


        toast.promise(updateSaleOrderPackageKpi(poId, {
            staffs: payload
        }), {
            loading: t('toast.loading'),
            success: t('toast.success'),
            error: t('toast.failed')
        });
    };

    const handleRemove = (staffId: string) => {
        const payload = rows
            .filter((r) => r.staff.id !== staffId)
            .map((r) => ({
                staff: r.staff,
                score: Number(r.score),
            }));


        toast.promise(updateSaleOrderPackageKpi(poId, {
            staffs: payload
        }), {
            loading: t('toast.loading'),
            success: t('toast.success'),
            error: t('toast.failed')
        });
        updateRows(rows.filter((r) => r.staff.id !== staffId));
    };

    // ---------- ปุ่ม Enable เมื่อ "มีการแก้ไข" หรือ "มีการกรอกค่าอย่างน้อย 1 ราย" ----------
    const originalMap = useMemo(() => toIdScoreMap(value ?? []), [value]);
    const currentMap = useMemo(() => toIdScoreMap(rows), [rows]);

    // มีคนใส่คะแนนอย่างน้อย 1 ราย
    const hasAnyInput = useMemo(
        () => rows.some((r) => r.score !== undefined && r.score !== null && r.score !== ''),
        [rows]
    );

    // เป็นการเปลี่ยนแปลงจากค่าเดิม?
    const isDirty = useMemo(() => !isSameMap(originalMap, currentMap), [originalMap, currentMap]);

    // ---------- บันทึกไปหลังบ้าน ----------
    const handleSave = async () => {
        setSaving(true);
        try {
            // เตรียม payload: กรองคนที่มีคะแนนเป็นตัวเลข >= 0
            const payload = rows
                .filter((r) => r.score !== '' && r.score !== undefined && r.score !== null)
                .map((r) => ({
                    staff: r.staff,
                    score: Number(r.score),
                }));


            toast.promise(updateSaleOrderPackageKpi(poId, {
                staffs: payload
            }), {
                loading: t('toast.loading'),
                success: t('toast.success'),
                error: t('toast.failed')
            });

            onSaved?.();
        } catch (e) {
            // คุณจะใช้ toast ของโปรเจกต์ก็ได้
            console.error('save staff KPI failed', e);
        } finally {
            setSaving(false);
        }
    };

    const handleSaveWhenSelectedStaff = async () => {
        const payload = rows
            .map((r) => ({
                staff: r.staff,
                score: 0,
            }));


        toast.promise(updateSaleOrderPackageKpi(poId, {
            staffs: payload
        }), {
            loading: t('toast.loading'),
            success: t('toast.success'),
            error: t('toast.failed')
        });

        onSaved?.();
    }

    function CustomPopper(props) {
        const { setOpenDropdown } = props; // get callback to close
        return (
            <Popper {...props} placement="bottom-start" style={{ width: props.style?.width }}>
                <Paper>
                    {/* Close button bar */}
                    <div style={{ display: "flex", justifyContent: "flex-end", padding: "4px" }}>
                        <Button
                            fullWidth
                            variant="contained"
                            startIcon={<Check />}
                            color="success">
                            {t('commons.confirm')}
                        </Button>
                    </div>
                    {props.children}
                </Paper>
            </Popper>
        );
    }

    return (
        <Grid container spacing={2}>
            <Grid item xs={12}>
                <Autocomplete
                    multiple
                    limitTags={6}
                    options={staffList}
                    value={selectedStaff}
                    getOptionLabel={(option: Staff) => option.displayName}
                    disableCloseOnSelect
                    open={openDropdown}
                    onOpen={() => setOpenDropdown(true)}
                    onClose={() => {
                        handleSaveWhenSelectedStaff();
                        setOpenDropdown(false)
                    }}
                    PopperComponent={(p) => <CustomPopper {...p} setOpenDropdown={setOpenDropdown} />}
                    onChange={handleAutoCompleteChange}
                    renderOption={(props, option, { selected }) => (
                        <li {...props}>
                            <Checkbox icon={icon} checkedIcon={checkedIcon} sx={{ mr: 1 }} checked={selected} />
                            {option.displayName}
                        </li>
                    )}
                    renderInput={(params) => (
                        <TextField
                            {...params}
                            fullWidth
                            variant="outlined"
                            label={label}
                            InputLabelProps={{ shrink: true }}
                            inputProps={{
                                ...params.inputProps,
                                readOnly: true,
                            }}
                        />
                    )}
                />
            </Grid>

            <Grid item xs={12}>
                {rows.length === 0 ? (
                    <Box
                        sx={{
                            py: 2,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            minHeight: 100,
                        }}
                    >
                        <Typography color="text.secondary">ยังไม่ได้เลือกพนักงาน</Typography>
                    </Box>
                ) : (
                    <Table size="small">
                        <TableHead>
                            <TableRow>
                                <TableCell align="center">พนักงาน</TableCell>
                                <TableCell align="center" width={isMobileOnly ? 100 : 140}>จำนวนกล่อง</TableCell>
                                <TableCell align="center" width={isMobileOnly ? 20 : 64}></TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {rows.map((r) => (
                                <TableRow key={r.staff.id}>
                                    <TableCell>
                                        <Stack direction="row" spacing={1} alignItems="center">
                                            <Typography>{r.staff.displayName}</Typography>
                                        </Stack>
                                    </TableCell>
                                    <TableCell>
                                        <NumberTextField
                                            fullWidth
                                            variant="outlined"
                                            value={r.score ?? null}
                                            min={0}
                                            onChange={(val) => handleChangeValue(r.staff.id, val)}
                                            onBlur={(e) => handleBlueValue(r.staff.id, e.target.value)}
                                        />
                                    </TableCell>
                                    <TableCell align="center" style={{ padding: '6px 2px' }}>
                                        <IconButton onClick={() => handleRemove(r.staff.id)}>
                                            <DeleteIcon fontSize="small" />
                                        </IconButton>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                )}
            </Grid>
        </Grid>
    );
}