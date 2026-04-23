/* eslint-disable prettier/prettier */
import { Check, CheckBox, CheckBoxOutlineBlank, Close, Save } from "@mui/icons-material";
import { Dialog, DialogTitle, DialogContent, Button, DialogActions, Grid, Autocomplete, Checkbox, TextField, Paper, Popper, Chip } from "@mui/material";
import { makeStyles } from "@mui/styles";
import { GridSearchSection } from "components/Styled";
import dayjs from "dayjs";
import { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import { useTranslation } from "react-i18next";
import { createDuty } from "services/Duty/duty-api";
import { CreateDutyRequest } from "services/Duty/duty-type";
import { assignUnassignSaleOrder } from "services/SaleOrder/sale-order-api";
import { UserProfileResponse } from "services/User/user-type";
import { DEFAULT_DATE_FORMAT_BFF } from "utils";
import ManualHelpButton from "./Manual/ManualHelpButton";

export interface DutyDialogProps {
    open: boolean;
    userList: UserProfileResponse[];
    checkedUser: string[];
    onClose: () => void;
}

export default function DutyDialog(props: DutyDialogProps): JSX.Element {
    const useStyles = makeStyles({
        datePickerFromTo: {
            '&& .MuiOutlinedInput-input': {
                padding: '16.5px 14px',
            },
            '&& .MuiFormLabel-root': {
                fontSize: '13px'
            }
        }
    })
    const classes = useStyles()
    const { open, userList, checkedUser, onClose } = props;
    const [openDropdown, setOpenDropdown] = useState(false);
    const { t } = useTranslation();
    const [searchDate] = useState<string>(dayjs(new Date()).startOf('day').format(DEFAULT_DATE_FORMAT_BFF));
    const [selectedStaff, setSelectedStaff] = useState<UserProfileResponse[]>([]);
    const icon = <CheckBoxOutlineBlank fontSize="small" />;
    const checkedIcon = <CheckBox fontSize="small" />;

    const groupKey = (u: UserProfileResponse) =>
        (u.role?.roleNameTh ?? u.staff?.role?.roleNameTh ?? 'ไม่ระบุ').trim();

    function CustomPopper(props) {
        const { setOpenDropdown } = props; // get callback to close
        return (
            <Popper {...props} placement="bottom-start" style={{ width: props.style?.width }}>
                <Paper>
                    {/* Close button bar */}
                    <div style={{ display: "flex", justifyContent: "flex-end", padding: "4px" }}>
                        <Button
                            fullWidth
                            onClick={() => setOpenDropdown(false)}
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

    const sortedUsers = useMemo(
        () =>
            (userList ?? [])
                .slice()
                .sort((a, b) => {
                    const ga = groupKey(a);
                    const gb = groupKey(b);
                    if (ga !== gb) return ga.localeCompare(gb, 'th'); // เรียงตามกลุ่ม
                    // ภายในกลุ่ม เรียงตามชื่อแสดง
                    return (a.staff.displayName ?? '').localeCompare(b.staff.displayName ?? '', 'th');
                }),
        [userList]
    );

    const getGroupChipColor = (group: string) => {
        switch (group) {
            case 'พนักงานจัดออเดอร์ กทม.':
                return {
                    bg: '#E3F2FD',
                    color: '#1565C0',
                };
            case 'พนักงานจัดออเดอร์ ตจว.':
                return {
                    bg: '#E8F5E9',
                    color: '#2E7D32',
                };
            default:
                return {
                    bg: '#EEEEEE',
                    color: '#424242',
                };
        }
    };

    const callAssignOrder = async () => {
        await assignUnassignSaleOrder(searchDate);
    }

    useEffect(() => {
        if (!open) return;
        if (!Array.isArray(userList) || !Array.isArray(checkedUser)) return;

        const preselected = userList.filter(u => checkedUser.includes(u.id)); // <-- เทียบด้วย id
        setSelectedStaff(preselected);
    }, [open, userList, checkedUser]);

    return (
        <>
            <Dialog open={open} maxWidth="xs" fullWidth aria-labelledby="form-dialog-title">
                <DialogTitle
                    id="form-dialog-title"
                    sx={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        pr: 1, // เว้นที่ให้ icon
                    }}
                >
                    {t('dailyDuty.title')}

                    <ManualHelpButton manualId="MANUAL000001" />
                </DialogTitle>
                <DialogContent>
                    <GridSearchSection container spacing={1}>
                        <Grid item xs={12} sm={12} style={{ paddingTop: '20px' }}>
                            <Autocomplete
                                multiple
                                limitTags={6}
                                disableCloseOnSelect
                                open={openDropdown}
                                onOpen={() => setOpenDropdown(true)}
                                onClose={() => setOpenDropdown(false)}
                                PopperComponent={(p) => <CustomPopper {...p} setOpenDropdown={setOpenDropdown} />}
                                options={sortedUsers}
                                getOptionLabel={(o) => o.staff.displayName}
                                value={selectedStaff}
                                isOptionEqualToValue={(option, value) => option.id === value.id}
                                groupBy={groupKey}
                                renderGroup={(params) => (
                                    <li key={params.key}>
                                        <div
                                            style={{
                                                backgroundColor: '#f5f5f5',
                                                fontWeight: 600,
                                                padding: '6px 12px',
                                                borderTop: '1px solid #ddd',
                                                borderBottom: '1px solid #ddd',
                                                fontSize: '0.9rem',
                                                color: '#333',
                                            }}
                                        >
                                            {params.group}
                                        </div>
                                        <ul style={{ paddingLeft: 0, margin: 0 }}>{params.children}</ul>
                                    </li>
                                )}
                                renderOption={(props, option, { selected }) => (
                                    <li {...props}>
                                        <Checkbox icon={icon} checkedIcon={checkedIcon} checked={selected} sx={{ mr: 1 }} />
                                        {option.staff.displayName}
                                    </li>
                                )}
                                renderInput={(params) => (
                                    <TextField
                                        {...params}
                                        fullWidth
                                        variant="outlined"
                                        label={t('dailyDuty.person')}
                                        InputLabelProps={{ shrink: true }}
                                        inputProps={{
                                            ...params.inputProps,
                                            readOnly: true, // Disable keyboard on mobile
                                        }}
                                    />
                                )}
                                renderTags={(value, getTagProps) =>
                                    value.map((option, index) => {
                                        const group = groupKey(option);
                                        const { bg, color } = getGroupChipColor(group);

                                        return (
                                            <Chip
                                                {...getTagProps({ index })}
                                                key={option.id}
                                                label={option.staff.displayName}
                                                sx={{
                                                    backgroundColor: bg,
                                                    color,
                                                    fontWeight: 500,
                                                }}
                                            />
                                        );
                                    })
                                }
                                onChange={(_event, value, reason) => {
                                    if (reason === 'clear') {
                                        setSelectedStaff([]);
                                    } else {
                                        setSelectedStaff(value);
                                    }
                                }}
                            />
                        </Grid>
                    </GridSearchSection>
                </DialogContent>
                <DialogActions>
                    <Button
                        onClick={() => {
                            onClose()
                        }}
                        variant="contained"
                        startIcon={<Close />}
                        className="btn-cool-grey">
                        {t('button.close')}
                    </Button>
                    <Button
                        color="success"
                        variant="contained"
                        disabled={selectedStaff.length === 0}
                        startIcon={<Save />}
                        onClick={() => {
                            const req: CreateDutyRequest = {
                                date: searchDate,
                                persons: selectedStaff
                            }
                            toast.promise(createDuty(req), {
                                loading: t('toast.loading'),
                                success: () => {
                                    callAssignOrder();
                                    onClose();
                                    return t('toast.success');
                                },
                                error: (error) => t('toast.failed') + ' ' + error.message
                            })
                        }}>
                        {t('button.save')}
                    </Button>
                </DialogActions>
            </Dialog>
        </>
    );
}
