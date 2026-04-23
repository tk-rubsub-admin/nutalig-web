/* eslint-disable prettier/prettier */
import { Save } from '@mui/icons-material';
import { Grid, Typography, TextField, MenuItem, FormControlLabel, Button, Switch, Box } from '@mui/material';
import { GridTextField } from './Styled';
import { useTranslation } from 'react-i18next';
import CustomSwitch from './CustomSwitch';
import ManualHelpButton from 'pages/Manual/ManualHelpButton';

interface CustomerFormProps {
    customerFormik: any;
    isDownSm?: boolean;
    isCustomerTypeFetching?: boolean;
    customerTypeList?: any[];
    provinces?: any[];
    amphures?: any[];
    tumbons?: any[];
    isHeadOffice: boolean;
    onToggleHeadOffice: (checked: boolean) => void;
    enableUpdate?: boolean;
    onSubmitClick?: () => void;
}

export default function CustomerForm({
    customerFormik,
    isDownSm,
    isCustomerTypeFetching,
    customerTypeList,
    provinces,
    amphures,
    tumbons,
    isHeadOffice,
    onToggleHeadOffice,
    enableUpdate = true,
    onSubmitClick
}: CustomerFormProps) {
    const { t } = useTranslation();
    return (
        <>
            <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                    <Grid container spacing={2}>
                        <GridTextField item xs={6} sm={12}>
                            <Box display="flex" alignItems="center">
                                <Typography variant="subtitle1" fontWeight={600}>{t('purchaseOrder.customerInformationSection.title')}</Typography>
                                <ManualHelpButton manualId="MANUAL000010" />
                            </Box>
                        </GridTextField>
                        <GridTextField item xs={12} sm={6}>
                            <TextField
                                type="text"
                                label={t('invoiceManagement.create.customerName')}
                                fullWidth
                                value={customerFormik.values.displayName}
                                disabled={true}
                                variant="outlined"
                                InputLabelProps={{ shrink: true }}
                            />
                        </GridTextField>
                        <GridTextField item xs={12} sm={6}>
                            <TextField
                                label={t('customerManagement.column.contactName') + ' *'}
                                fullWidth
                                variant="outlined"
                                {...customerFormik.getFieldProps('contactName')}
                                error={Boolean(
                                    customerFormik.touched.contactName && customerFormik.errors.contactName
                                )}
                                helperText={
                                    customerFormik.touched.contactName && customerFormik.errors.contactName
                                }
                                InputLabelProps={{ shrink: true }}
                            />
                        </GridTextField>
                        <GridTextField item xs={6} sm={3}>
                            <TextField
                                name="contactNumber1"
                                type="text"
                                label={t('customerManagement.column.telNo1')}
                                fullWidth
                                value={customerFormik.values.contactNumber1}
                                onChange={customerFormik.handleChange}
                                onBlur={customerFormik.handleBlur}
                                error={Boolean(customerFormik.touched.contactNumber1 && customerFormik.errors.contactNumber1)}
                                helperText={customerFormik.touched.contactNumber1 && customerFormik.errors.contactNumber1}
                                variant="outlined"
                                InputLabelProps={{ shrink: true }}
                            />
                        </GridTextField>
                        <GridTextField item xs={6} sm={3}>
                            <TextField
                                name="contactNumber2"
                                type="text"
                                label={t('customerManagement.column.telNo2')}
                                fullWidth
                                value={customerFormik.values.contactNumber2}
                                onChange={customerFormik.handleChange}
                                onBlur={customerFormik.handleBlur}
                                variant="outlined"
                                InputLabelProps={{ shrink: true }}
                            />
                        </GridTextField>
                        <GridTextField item xs={6} sm={6}>
                            <TextField
                                select
                                fullWidth
                                label={t('customerManagement.column.type') + ' *'}
                                disabled={isCustomerTypeFetching}
                                InputLabelProps={{ shrink: true }}
                                error={Boolean(customerFormik.touched.type && customerFormik.errors.type)}
                                helperText={customerFormik.touched.type && customerFormik.errors.type}
                                value={customerFormik.values.type}
                                onChange={(event) => {
                                    const selectedCode = event.target.value;
                                    if (selectedCode === '') {
                                        customerFormik.setFieldValue('type', selectedCode);
                                    } else {
                                        const selectedValue = customerTypeList?.find((type) => type.code === selectedCode) || null;
                                        customerFormik.setFieldValue('type', selectedValue?.code);
                                    }
                                }}
                            >
                                <MenuItem value="">
                                    {t('general.clearSelected')}
                                </MenuItem>
                                {customerTypeList?.map((option) => (
                                    <MenuItem key={option.code} value={option.code}>
                                        {option.nameTh}
                                    </MenuItem>
                                )) || []}
                            </TextField>
                        </GridTextField>
                        <GridTextField item xs={12} sm={6}>
                            <TextField
                                name="taxId"
                                type="text"
                                label={t('invoiceManagement.create.taxId') + ' *'}
                                fullWidth
                                placeholder={t('customerManagement.message.validateTaxId')}
                                value={customerFormik.values.taxId}
                                variant="outlined"
                                InputLabelProps={{ shrink: true }}
                                error={Boolean(customerFormik.touched.taxId && customerFormik.errors.taxId)}
                                helperText={customerFormik.touched.taxId && customerFormik.errors.taxId}
                                onChange={customerFormik.handleChange}
                                onBlur={customerFormik.handleBlur}
                            />
                        </GridTextField>
                        {/* Company block */}
                        {customerFormik.values.type === 'COMPANY' && (
                            <>
                                <GridTextField item xs={12} sm={12}>
                                    <Grid container alignItems="center" justifyContent="space-between" mb={1}>
                                        <Typography variant="subtitle1" fontWeight={600}>
                                            {t('customerManagement.column.company.title')}
                                        </Typography>

                                        <CustomSwitch
                                            checked={isHeadOffice}
                                            label={t('customerManagement.column.company.headOffice')}
                                            onChange={onToggleHeadOffice}
                                        />
                                    </Grid>
                                </GridTextField>
                                <GridTextField item xs={12} md={6}>
                                    <TextField
                                        name="companyName"
                                        label={t('customerManagement.column.company.name') + ' *'}
                                        fullWidth
                                        value={customerFormik.values.companyName}
                                        onChange={customerFormik.handleChange}
                                        onBlur={customerFormik.handleBlur}
                                        error={Boolean(
                                            customerFormik.touched.companyName && customerFormik.errors.companyName
                                        )}
                                        helperText={
                                            customerFormik.touched.companyName && customerFormik.errors.companyName
                                        }
                                        InputLabelProps={{ shrink: true }}
                                    />
                                </GridTextField>


                                {/* Branch code */}
                                <GridTextField item xs={12} md={3}>
                                    <TextField
                                        name="companyBranchCode"
                                        label={t('customerManagement.column.company.branchCode') + ' *'}
                                        fullWidth
                                        value={customerFormik.values.companyBranchCode}
                                        onChange={customerFormik.handleChange}
                                        onBlur={customerFormik.handleBlur}
                                        error={Boolean(
                                            customerFormik.touched.companyBranchCode &&
                                            customerFormik.errors.companyBranchCode
                                        )}
                                        helperText={
                                            customerFormik.touched.companyBranchCode &&
                                            customerFormik.errors.companyBranchCode
                                        }
                                        InputLabelProps={{ shrink: true }}
                                    />
                                </GridTextField>

                                {/* Branch name */}
                                <GridTextField item xs={12} md={3}>
                                    <TextField
                                        name="companyBranchName"
                                        label={t('customerManagement.column.company.branchName') + ' *'}
                                        fullWidth
                                        value={customerFormik.values.companyBranchName}
                                        onChange={customerFormik.handleChange}
                                        onBlur={customerFormik.handleBlur}
                                        error={Boolean(
                                            customerFormik.touched.companyBranchName &&
                                            customerFormik.errors.companyBranchName
                                        )}
                                        helperText={
                                            customerFormik.touched.companyBranchName &&
                                            customerFormik.errors.companyBranchName
                                        }
                                        InputLabelProps={{ shrink: true }}
                                    />
                                </GridTextField>
                            </>
                        )}
                    </Grid>
                </Grid>
                <Grid item xs={12} sm={6}>
                    <Grid container spacing={2}>
                        <GridTextField item xs={12} sm={12}>
                            <Typography variant="subtitle1" fontWeight={600}>
                                {t('customerManagement.column.address.invoice')}
                            </Typography>
                        </GridTextField>
                        <GridTextField item xs={12} sm={12}>
                            <TextField
                                name="address"
                                type="text"
                                label={t('customerManagement.column.address.title')}
                                fullWidth
                                variant="outlined"
                                value={customerFormik.values.address}
                                onChange={customerFormik.handleChange}
                                onBlur={customerFormik.handleBlur}
                                error={Boolean(customerFormik.touched.address && customerFormik.errors.address)}
                                helperText={customerFormik.touched.address && customerFormik.errors.address}
                                InputLabelProps={{ shrink: true }}
                            />
                        </GridTextField>
                        <GridTextField item xs={6} sm={6}>
                            <TextField
                                name="addressProvince"
                                select
                                label={t('customerManagement.column.address.province')}
                                fullWidth
                                variant="outlined"
                                value={customerFormik.values.addressProvince}
                                onChange={customerFormik.handleChange}
                                onBlur={customerFormik.handleBlur}
                                error={Boolean(customerFormik.touched.addressProvince && customerFormik.errors.addressProvince)}
                                helperText={customerFormik.touched.addressProvince && customerFormik.errors.addressProvince}
                                InputLabelProps={{ shrink: true }}>
                                <MenuItem value="">{t('general.clearSelected')}</MenuItem>
                                {provinces?.map((g) => (
                                    <MenuItem key={g.id} value={g.id}>
                                        {g.nameTh}
                                    </MenuItem>
                                ))}
                            </TextField>
                        </GridTextField>
                        <GridTextField item xs={6} sm={6}>
                            <TextField
                                name="addressAmphure"
                                select
                                label={t('customerManagement.column.address.amphure')}
                                fullWidth
                                variant="outlined"
                                value={customerFormik.values.addressAmphure}
                                onChange={customerFormik.handleChange}
                                onBlur={customerFormik.handleBlur}
                                error={Boolean(customerFormik.touched.addressAmphure && customerFormik.errors.addressAmphure)}
                                helperText={customerFormik.touched.addressAmphure && customerFormik.errors.addressAmphure}
                                InputLabelProps={{ shrink: true }}>
                                <MenuItem value="">{t('general.clearSelected')}</MenuItem>
                                {amphures
                                    ?.filter((a) => customerFormik.values.addressProvince === a.provinceId)
                                    .map((g) => (
                                        <MenuItem key={g.id} value={g.id}>
                                            {g.nameTh}
                                        </MenuItem>
                                    ))}
                            </TextField>
                        </GridTextField>
                        <GridTextField item xs={6} sm={6}>
                            <TextField
                                name="addressTumbon"
                                select
                                label={t('customerManagement.column.address.tumbon')}
                                fullWidth
                                variant="outlined"
                                value={customerFormik.values.addressTumbon} // <-- just the id
                                error={Boolean(customerFormik.touched.addressTumbon && customerFormik.errors.addressTumbon)}
                                helperText={customerFormik.touched.addressTumbon && customerFormik.errors.addressTumbon}
                                onChange={({ target }) => {
                                    const selected = tumbons.find((t) => t.id === target.value);
                                    customerFormik.setFieldValue('addressTumbon', selected?.id ?? '');
                                    customerFormik.setFieldValue('postalCode', selected?.zipCode ?? '');
                                }}
                                onBlur={customerFormik.handleBlur}
                                InputLabelProps={{ shrink: true }}>
                                <MenuItem value="">{t('general.clearSelected')}</MenuItem>
                                {tumbons
                                    ?.filter((t) => t.amphureId === customerFormik.values.addressAmphure) // ← match amphure
                                    .map((t) => (
                                        <MenuItem key={t.id} value={t.id}>
                                            {t.nameTh}
                                        </MenuItem>
                                    ))}
                            </TextField>
                        </GridTextField>
                        <GridTextField item xs={6} sm={6}>
                            <TextField
                                name="postalCode"
                                type="text"
                                label={t('customerManagement.column.address.postalCode')}
                                fullWidth
                                disabled
                                variant="outlined"
                                value={customerFormik.values.postalCode}
                                error={Boolean(customerFormik.touched.postalCode && customerFormik.errors.postalCode)}
                                helperText={customerFormik.touched.postalCode && customerFormik.errors.postalCode}
                                InputLabelProps={{ shrink: true }}
                            />
                        </GridTextField>
                    </Grid>
                </Grid>
            </Grid>
            {enableUpdate ?
                <Grid container spacing={2}>
                    <Grid item xs={12} style={{ textAlign: 'right' }}>
                        <Button
                            fullWidth={isDownSm}
                            disabled={!customerFormik.dirty || customerFormik.isSubmitting}
                            onClick={onSubmitClick}
                            variant="contained"
                            startIcon={<Save />}
                            color="success"
                        >
                            {t('button.update') + 'ลูกค้า'}
                        </Button>
                    </Grid>
                </Grid> : <></>}
        </>
    )
}
