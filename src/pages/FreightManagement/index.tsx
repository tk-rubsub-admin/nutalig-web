/* eslint-disable prettier/prettier */
import { UploadFile, DownloadForOffline, CloudUpload } from '@mui/icons-material';
import { TableRow, TableCell, Grid, Table, TableContainer, TableHead, CircularProgress, TableBody, TextField, Autocomplete, MenuItem, Button, Typography, useTheme, useMediaQuery, Stack } from '@mui/material';
import { makeStyles } from '@mui/styles';
import PageTitle from 'components/PageTitle';
import { GridSearchSection, Wrapper } from 'components/Styled';
import { Page } from 'layout/LayoutRoute';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery } from 'react-query';
import { useHistory } from 'react-router-dom';
import { getProvince } from 'services/Address/address-api';
import { Province } from 'services/Address/address-type';
import { exportFreight, searchFreight } from 'services/Freight/freight-api';
import { FreightPrice, SearchFreightRequest } from 'services/Freight/freight-type';
import { formatMoney } from 'utils';
import UploadFreightDialog from './UploadFreightDialog';
import toast from 'react-hot-toast';
import ProgressDialog from 'components/ProgressDialog';

export default function FreightManagement() {
    const { t } = useTranslation();
    const theme = useTheme();
    const isDownSm = useMediaQuery(theme.breakpoints.down('sm'));
    const history = useHistory();
    const useStyles = makeStyles({
        hideObject: {
            display: 'none'
        },
        noResultMessage: {
            textAlign: 'center',
            fontSize: '1.2em',
            fontWeight: 'bold'
        },
        tableHeader: {
            border: '2px solid #e0e0e0',
            fontWeight: 'bold',
            paddingLeft: '10px',
            textAlign: 'center'
        },
        datePickerFromTo: {
            '&& .MuiOutlinedInput-input': {
                padding: '16.5px 14px'
            },
            '&& .MuiFormLabel-root': {
                fontSize: '13px'
            }
        },
        bkkChip: {
            backgroundColor: '#068710',
            color: 'white'
        },
        provinceChip: {
            backgroundColor: '#a533ff',
            color: 'white'
        },
        fileInput: {
            width: '100%',
            padding: '11px',
            border: '1px solid #ccc',
            borderRadius: '4px',
            fontSize: '14px',
            '::file-selector-button': {
                color: 'red'
            }
        }
    });
    const classes = useStyles();
    const [openUploadDialog, setOpenUploadDialog] = useState(false);
    const [selectedProvince, setSelectedProvince] = useState<Province>();
    const [selectedPackage, setSelectedPackage] = useState<string>();
    const [isOpenProgressDialog, setIsOpenProgressDialog] = useState(false)
    const [jobId, setJobId] = useState('')
    const {
        data: freightList,
        refetch: freightRefetch,
        isFetching: isFreightFetching
    } = useQuery(
        ['freight-list', {}, 1, 1100],
        () => searchFreight({} as SearchFreightRequest, 1, 1100),
        {
            refetchOnWindowFocus: false,
            keepPreviousData: true
        }
    );
    const packageOptions = [
        { value: 'bigBox', label: t('purchaseOrder.updateBoxSection.bigBox') },
        { value: 'smallBox', label: t('purchaseOrder.updateBoxSection.smallBox') },
        { value: 'softBox', label: t('purchaseOrder.updateBoxSection.softBox') },
        { value: 'bigFoamBox', label: t('purchaseOrder.updateBoxSection.bigFoamBox') },
        { value: 'smallFoamBox', label: t('purchaseOrder.updateBoxSection.smallFoamBox') },
        { value: 'oasis', label: t('purchaseOrder.updateBoxSection.oasis') },
        { value: 'wrap', label: t('purchaseOrder.updateBoxSection.wrap') },
        { value: 'bag', label: t('purchaseOrder.updateBoxSection.bag') }
    ];

    const { data:
        provinceList } = useQuery('province-list', () => getProvince(), {
            refetchOnWindowFocus: false
        });

    const freights = (!isFreightFetching &&
        freightList &&
        freightList?.freights.filter((f: FreightPrice) => {
            const matchProvince = !selectedProvince || f.province.id === selectedProvince.id;
            const matchPackage = !selectedPackage || f.packages === selectedPackage;
            return matchProvince && matchPackage; // both must match if selected
        }).length > 0 &&
        freightList?.freights.filter((f: FreightPrice) => {
            const matchProvince = !selectedProvince || f.province.id === selectedProvince.id;
            const matchPackage = !selectedPackage || f.packages === selectedPackage;
            return matchProvince && matchPackage; // both must match if selected
        }).map((f: FreightPrice) => {
            return (
                <TableRow
                    hover
                    id={`freight__index-${f.id}`}
                    key={f.id}
                >
                    <TableCell>
                        {f.freightName}
                    </TableCell>
                    <TableCell>
                        {f.packageName}
                    </TableCell>
                    <TableCell>
                        {f.province.nameTh}
                    </TableCell>
                    <TableCell align="center">
                        {f.packageProductSku}
                    </TableCell>
                    <TableCell align="center">
                        {formatMoney(f.packagePrice)}
                    </TableCell>
                    <TableCell align="center">
                        {f.freightProductSku}
                    </TableCell>
                    <TableCell align="center">
                        {formatMoney(f.freightPrice)}
                    </TableCell>
                </TableRow>
            )
        })) || (
            <TableRow>
                <TableCell colSpan={7}>
                    <div className={classes.noResultMessage}>{t('warning.noResultList')}</div>
                </TableCell>
            </TableRow>
        );
    const handleExportProduct = async () => {
        toast.promise(exportFreight(), {
            loading: t('toast.loading'),
            success: (response) => {
                // Create a temporary URL for the Blob
                const blob = response.data;
                const url = window.URL.createObjectURL(blob);

                const contentDisposition = response.headers['content-disposition'];

                let filename = 'template.xlsx';
                console.log("Download file size " + blob.size);
                if (contentDisposition) {
                    const match = contentDisposition.match(/filename\*?=(?:UTF-8'')?(.+)/);
                    if (match?.[1]) {
                        filename = decodeURIComponent(match[1].replace(/"/g, ''));
                    }
                }
                // Create a temporary <a> element to trigger the download
                const tempLink = document.createElement('a');
                tempLink.href = url;
                tempLink.setAttribute('download', filename); // Set the desired filename for the downloaded file

                // Append the <a> element to the body and click it to trigger the download
                document.body.appendChild(tempLink);
                tempLink.click();

                // Clean up the temporary elements and URL
                document.body.removeChild(tempLink);
                window.URL.revokeObjectURL(url);
                return t('toast.success');
            },
            error: () => {
                return t('toast.failed');
            }
        });
    }
    return (
        <Page>
            <PageTitle title={t('freightManagement.title')} />
            <Wrapper>
                <Stack
                    direction={{ xs: 'column', sm: 'row' }}
                    spacing={1}
                    useFlexGap
                    sx={{
                        mt: 1,
                        justifyContent: { sm: 'flex-end' }, // right-align when in row
                        alignItems: { xs: 'flex-end', sm: 'center' }, // right-align when stacked
                    }}
                >
                    <Button
                        fullWidth={isDownSm}
                        variant="contained"
                        className="btn-baby-blue"
                        onClick={() => setOpenUploadDialog(true)}
                        startIcon={<CloudUpload />}>
                        {t('button.importStocks')}
                    </Button>
                    <Button
                        fullWidth={isDownSm}
                        variant="contained"
                        className="btn-green-teal"
                        onClick={() => handleExportProduct()}
                        startIcon={<DownloadForOffline />}>
                        {t('button.export')}
                    </Button>
                </Stack>
            </Wrapper>
            <Wrapper>
                <GridSearchSection container spacing={1}>
                    <Grid item xs={12} sm={12}>
                        <Typography variant="h6" component="h2">
                            {t('freightManagement.freightList')}
                        </Typography>
                    </Grid>
                    <Grid item xs={12} sm={2} style={{ paddingTop: '30px' }}>
                        <Autocomplete
                            fullWidth
                            disabled={isFreightFetching}
                            options={packageOptions}
                            value={packageOptions.find(opt => opt.value === selectedPackage) || null}
                            onChange={(_, newValue) => setSelectedPackage(newValue ? newValue.value : '')}
                            getOptionLabel={(option) => option.label}
                            isOptionEqualToValue={(option, value) => option.value === value.value}
                            renderInput={(params) => (
                                <TextField
                                    {...params}
                                    label={t('freightManagement.package')}
                                    variant="outlined"
                                    InputLabelProps={{ shrink: true }}
                                />
                            )}
                        />
                    </Grid>
                    <Grid item xs={12} sm={2} style={{ paddingTop: '30px' }}>
                        <Autocomplete
                            disabled={isFreightFetching}
                            options={provinceList || []}
                            getOptionLabel={(option: Province) => option.nameTh}
                            sx={{ width: '100%' }}
                            value={selectedProvince}
                            onChange={(_event, value, reason) => {
                                if (reason === 'clear') {
                                    setSelectedProvince('');
                                } else {
                                    setSelectedProvince(value);
                                }
                            }}
                            renderInput={(params) => (
                                <TextField
                                    {...params}
                                    label={t('customerManagement.column.address.province')}
                                    InputLabelProps={{ shrink: true }}
                                />
                            )}
                        />
                    </Grid>
                </GridSearchSection>
                <GridSearchSection container spacing={1}>
                    <TableContainer>
                        <Table id="freight_list___table">
                            <TableHead>
                                <TableRow>
                                    <TableCell align="center" key="freightName" className={classes.tableHeader}>
                                        {t('freightManagement.column.name')}
                                    </TableCell>
                                    <TableCell align="center" key="packages" className={classes.tableHeader}>
                                        {t('freightManagement.column.package')}
                                    </TableCell>
                                    <TableCell align="center" key="packages" className={classes.tableHeader}>
                                        {t('freightManagement.column.province')}
                                    </TableCell>
                                    <TableCell align="center" key="packages" className={classes.tableHeader}>
                                        {t('freightManagement.column.packageSku')}
                                    </TableCell>
                                    <TableCell align="center" key="packages" className={classes.tableHeader}>
                                        {t('freightManagement.column.packagePrice')}
                                    </TableCell>
                                    <TableCell align="center" key="packages" className={classes.tableHeader}>
                                        {t('freightManagement.column.freightSku')}
                                    </TableCell>
                                    <TableCell align="center" key="packages" className={classes.tableHeader}>
                                        {t('freightManagement.column.freightPrice')}
                                    </TableCell>
                                </TableRow>
                            </TableHead>
                            {isFreightFetching ? (
                                <TableBody>
                                    <TableRow>
                                        <TableCell colSpan={7} align="center">
                                            <CircularProgress />
                                        </TableCell>
                                    </TableRow>
                                </TableBody>
                            ) : (
                                <TableBody>{freights}</TableBody>
                            )}
                        </Table>
                    </TableContainer>
                </GridSearchSection>
            </Wrapper>
            <UploadFreightDialog
                open={openUploadDialog}
                onClose={(job) => {
                    setOpenUploadDialog(false);
                    freightRefetch();
                    setJobId(job);
                    if (job != '' && jobId != null && jobId !== undefined) {
                        setIsOpenProgressDialog(true);
                    }
                }}
            />
            <ProgressDialog
                open={isOpenProgressDialog}
                jobId={jobId}
                onConfirm={() => {
                    setJobId(jobId)
                    setIsOpenProgressDialog(false);
                    freightRefetch();
                }}
                onClose={() => setIsOpenProgressDialog(false)}
            />
        </Page >
    )
}
