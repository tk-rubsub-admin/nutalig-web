import { Add, Search, ExpandMore } from '@mui/icons-material';
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  FormControlLabel,
  Grid,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  Switch,
  TextField,
  Typography
} from '@mui/material';
import { makeStyles } from '@mui/styles';
import PageTitle from 'components/PageTitle';
import { GridSearchSection, Wrapper } from 'components/Styled';
import { Page } from 'layout/LayoutRoute';
import { useState } from 'react';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';
import { useQuery, useQueryClient } from 'react-query';
import {
  createProductFamily,
  createProductMaterial,
  createProductSubtype1,
  createProductSubtype2,
  getProductFamilies
} from 'services/Product/product-api';
import {
  ProductFamily,
  ProductMaterial,
  ProductSubtype1,
  ProductSubtype2
} from 'services/Product/product-type';

const useStyles = makeStyles({
  searchIcon: {
    marginRight: 8,
    verticalAlign: 'middle'
  },
  noResultMessage: {
    textAlign: 'center',
    fontSize: '1.1em',
    fontWeight: 700,
    padding: '48px 0'
  }
});

const formatDisplayName = (nameTh?: string | null, nameEn?: string | null) => {
  const thai = nameTh?.trim();
  const english = nameEn?.trim();

  if (thai && english) {
    return `${thai} (${english})`;
  }

  return thai || english || '-';
};

const getFamilyMaterials = (family: ProductFamily): ProductMaterial[] =>
  family.materialList || family.productMaterialList || [];

type NewItemType = 'FAMILY' | 'SUBTYPE1' | 'SUBTYPE2' | 'MATERIAL';

interface NewItemForm {
  type: NewItemType;
  productFamilyCode: string;
  productSubtype1Code: string;
  nameTh: string;
  nameEn: string;
  subtype2Required: boolean;
}

const emptyNewItemForm = (): NewItemForm => ({
  type: 'SUBTYPE1',
  productFamilyCode: '',
  productSubtype1Code: '',
  nameTh: '',
  nameEn: '',
  subtype2Required: false
});

const subtype2MatchesKeyword = (subtype2List: ProductSubtype2[], keyword: string) =>
  subtype2List.some((item) =>
    [item.code, item.nameTh, item.nameEn].some((value) => value?.toLowerCase().includes(keyword))
  );

const subtype1MatchesKeyword = (subtype1List: ProductSubtype1[], keyword: string) =>
  subtype1List.some(
    (item) =>
      [item.code, item.nameTh, item.nameEn].some((value) =>
        value?.toLowerCase().includes(keyword)
      ) || subtype2MatchesKeyword(item.subtype2List || [], keyword)
  );

export default function ProductFamilyManagement(): JSX.Element {
  const classes = useStyles();
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [keyword, setKeyword] = useState('');
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [newItemForm, setNewItemForm] = useState<NewItemForm>(emptyNewItemForm);
  const [isCreating, setIsCreating] = useState(false);

  const { data: productFamilies = [], isFetching: isProductFamiliesFetching } = useQuery(
    ['product-family-list'],
    () => getProductFamilies(),
    {
      refetchOnWindowFocus: false
    }
  );

  const normalizedKeyword = keyword.trim().toLowerCase();
  const filteredFamilies = !normalizedKeyword
    ? productFamilies
    : productFamilies.filter((family) => {
      const materialList = getFamilyMaterials(family);

      return (
        [family.code, family.nameTh, family.nameEn].some((value) =>
          value?.toLowerCase().includes(normalizedKeyword)
        ) ||
        materialList.some((material) =>
          [material.code, material.nameTh, material.nameEn].some((value) =>
            value?.toLowerCase().includes(normalizedKeyword)
          )
        ) ||
        subtype1MatchesKeyword(family.subtype1List || [], normalizedKeyword)
      );
    });

  const totalMaterialCount = productFamilies.reduce(
    (sum, family) => sum + getFamilyMaterials(family).length,
    0
  );
  const totalUsageCount = productFamilies.reduce(
    (sum, family) => sum + (family.subtype1List?.length || 0),
    0
  );
  const selectedFamily = productFamilies.find(
    (family) => family.code === newItemForm.productFamilyCode
  );
  const subtype1Options = selectedFamily?.subtype1List || [];
  const isNewItemValid = Boolean(
    newItemForm.nameTh.trim() &&
    (newItemForm.type === 'FAMILY' ||
      (newItemForm.type === 'SUBTYPE2'
        ? newItemForm.productSubtype1Code
        : newItemForm.productFamilyCode))
  );

  const openCreateDialog = (family: ProductFamily) => {
    setNewItemForm({ ...emptyNewItemForm(), productFamilyCode: family.code });
    setIsCreateDialogOpen(true);
  };

  const openCreateFamilyDialog = () => {
    setNewItemForm({ ...emptyNewItemForm(), type: 'FAMILY' });
    setIsCreateDialogOpen(true);
  };

  const handleCreateItem = async () => {
    if (!isNewItemValid) return;

    setIsCreating(true);
    try {
      const common = {
        nameTh: newItemForm.nameTh.trim(),
        nameEn: newItemForm.nameEn.trim()
      };

      if (newItemForm.type === 'FAMILY') {
        await createProductFamily({ ...common, isActive: true });
      } else if (newItemForm.type === 'SUBTYPE1') {
        await createProductSubtype1({
          ...common,
          productFamilyCode: newItemForm.productFamilyCode,
          subtype2Required: newItemForm.subtype2Required
        });
      } else if (newItemForm.type === 'SUBTYPE2') {
        await createProductSubtype2({
          ...common,
          productSubtype1Code: newItemForm.productSubtype1Code
        });
      } else {
        await createProductMaterial({
          ...common,
          productFamilyCode: newItemForm.productFamilyCode
        });
      }

      toast.success(t('productFamilyManagement.create.success'));
      setIsCreateDialogOpen(false);
      setNewItemForm(emptyNewItemForm());
      await queryClient.invalidateQueries(['product-family-list']);
    } catch (error) {
      // API interceptor already provides the detailed server error when available.
      toast.error(t('productFamilyManagement.create.error'));
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <Page>
      <PageTitle title={t('productFamilyManagement.title')} />
      <Wrapper>
        <GridSearchSection container spacing={2}>
          <Grid
            item
            xs={12}
            display="flex"
            justifyContent="space-between"
            alignItems="center"
            gap={2}>
            <Typography variant="h6">{t('productFamilyManagement.searchPanel')}</Typography>
            <Button variant="contained" startIcon={<Add />} onClick={openCreateFamilyDialog}>
              {t('productFamilyManagement.create.familyButton')}
            </Button>
          </Grid>
          <Grid item xs={12}>
            <TextField
              fullWidth
              value={keyword}
              onChange={(event) => setKeyword(event.target.value)}
              placeholder={t('productFamilyManagement.searchPlaceholder')}
              InputProps={{
                startAdornment: <Search className={classes.searchIcon} />
              }}
            />
          </Grid>
        </GridSearchSection>

        {isProductFamiliesFetching ? (
          <Stack alignItems="center" justifyContent="center" sx={{ py: 8 }}>
            <CircularProgress />
          </Stack>
        ) : filteredFamilies.length === 0 ? (
          <div className={classes.noResultMessage}>{t('warning.noResultList')}</div>
        ) : (
          <Stack spacing={2}>
            {filteredFamilies.map((family) => {
              const materialList = getFamilyMaterials(family);

              return (
                <Accordion key={family.code} defaultExpanded={filteredFamilies.length <= 3}>
                  <AccordionSummary expandIcon={<ExpandMore />}>
                    <Grid container spacing={2} alignItems="center">
                      <Grid item xs={12} md={5}>
                        <Typography variant="body2" color="text.secondary">
                          {t('productFamilyManagement.label.code')}: {family.code}
                        </Typography>
                        <Typography variant="h6" fontWeight={700}>
                          {family.nameTh}
                        </Typography>
                        <Typography variant="h6" fontWeight={700}>
                          {family.nameEn}
                        </Typography>
                      </Grid>
                      <Grid item xs={6} md={3}>
                        <Typography variant="body2" color="text.secondary">
                          {t('productFamilyManagement.label.materials')}
                        </Typography>
                        <Typography variant="subtitle1" fontWeight={700}>
                          {materialList.length}
                        </Typography>
                      </Grid>
                      <Grid item xs={6} md={4}>
                        <Typography variant="body2" color="text.secondary">
                          {t('productFamilyManagement.label.productUsages')}
                        </Typography>
                        <Typography variant="subtitle1" fontWeight={700}>
                          {family.subtype1List?.length || 0}
                        </Typography>
                      </Grid>
                    </Grid>
                  </AccordionSummary>
                  <AccordionDetails>
                    <Stack spacing={3}>
                      <Stack direction="row" justifyContent="flex-end">
                        <Button
                          variant="contained"
                          size="small"
                          startIcon={<Add />}
                          onClick={() => openCreateDialog(family)}>
                          {t('productFamilyManagement.create.button')}
                        </Button>
                      </Stack>
                      <Stack spacing={1}>
                        <Typography variant="subtitle1" fontWeight={700}>
                          {t('productFamilyManagement.label.materials')}
                        </Typography>
                        <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap">
                          {materialList.length > 0 ? (
                            materialList.map((material) => (
                              <Chip
                                key={material.code}
                                label={formatDisplayName(material.nameTh, material.nameEn)}
                                variant="outlined"
                              />
                            ))
                          ) : (
                            <Typography variant="body2" color="text.secondary">
                              -
                            </Typography>
                          )}
                        </Stack>
                      </Stack>

                      <Stack spacing={1.5}>
                        <Typography variant="subtitle1" fontWeight={700}>
                          {t('productFamilyManagement.label.productUsages')}
                        </Typography>
                        {family.subtype1List?.length ? (
                          family.subtype1List.map((subtype1) => (
                            <Card key={subtype1.code} variant="outlined">
                              <CardContent>
                                <Stack spacing={1.5}>
                                  <div>
                                    <Typography variant="subtitle1" fontWeight={700}>
                                      {formatDisplayName(subtype1.nameTh, subtype1.nameEn)}
                                    </Typography>
                                    <Typography variant="body2" color="text.secondary">
                                      {t('productFamilyManagement.label.code')}: {subtype1.code}
                                    </Typography>
                                  </div>

                                  <div>
                                    <Typography
                                      variant="body2"
                                      color="text.secondary"
                                      sx={{ mb: 1 }}>
                                      {t('productFamilyManagement.label.systemMechanics')}
                                    </Typography>
                                    <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap">
                                      {subtype1.subtype2List?.length ? (
                                        subtype1.subtype2List.map((subtype2) => (
                                          <Chip
                                            key={subtype2.code}
                                            label={formatDisplayName(
                                              subtype2.nameTh,
                                              subtype2.nameEn
                                            )}
                                            size="small"
                                          />
                                        ))
                                      ) : (
                                        <Chip
                                          label={t(
                                            'productFamilyManagement.label.optionalMechanic'
                                          )}
                                          size="small"
                                          variant="outlined"
                                        />
                                      )}
                                    </Stack>
                                  </div>
                                </Stack>
                              </CardContent>
                            </Card>
                          ))
                        ) : (
                          <Typography variant="body2" color="text.secondary">
                            -
                          </Typography>
                        )}
                      </Stack>
                    </Stack>
                  </AccordionDetails>
                </Accordion>
              );
            })}
          </Stack>
        )}
      </Wrapper>

      <Dialog
        open={isCreateDialogOpen}
        onClose={() => !isCreating && setIsCreateDialogOpen(false)}
        fullWidth
        maxWidth="sm">
        <DialogTitle>
          {newItemForm.type === 'FAMILY'
            ? t('productFamilyManagement.create.familyTitle')
            : t('productFamilyManagement.create.title')}
        </DialogTitle>
        <DialogContent>
          <Stack spacing={2.5} sx={{ pt: 1 }}>
            {newItemForm.type !== 'FAMILY' && (
              <>
                <TextField
                  label={t('productFamilyManagement.create.parentFamily')}
                  value={
                    selectedFamily
                      ? `${selectedFamily.code} — ${formatDisplayName(
                        selectedFamily.nameTh,
                        selectedFamily.nameEn
                      )}`
                      : ''
                  }
                  InputProps={{ readOnly: true }}
                />
                <FormControl fullWidth>
                  <InputLabel id="product-family-new-item-type-label">
                    {t('productFamilyManagement.create.type')}
                  </InputLabel>
                  <Select
                    labelId="product-family-new-item-type-label"
                    label={t('productFamilyManagement.create.type')}
                    value={newItemForm.type}
                    onChange={(event) =>
                      setNewItemForm({
                        ...emptyNewItemForm(),
                        productFamilyCode: newItemForm.productFamilyCode,
                        type: event.target.value as NewItemType
                      })
                    }>
                    <MenuItem value="SUBTYPE1">
                      {t('productFamilyManagement.create.subtype1')}
                    </MenuItem>
                    <MenuItem value="SUBTYPE2">
                      {t('productFamilyManagement.create.subtype2')}
                    </MenuItem>
                    <MenuItem value="MATERIAL">
                      {t('productFamilyManagement.create.material')}
                    </MenuItem>
                  </Select>
                </FormControl>
              </>
            )}

            {newItemForm.type === 'SUBTYPE2' && (
              <FormControl fullWidth required>
                <InputLabel id="product-family-subtype1-label">
                  {t('productFamilyManagement.create.parentSubtype1')}
                </InputLabel>
                <Select
                  labelId="product-family-subtype1-label"
                  label={t('productFamilyManagement.create.parentSubtype1')}
                  value={newItemForm.productSubtype1Code}
                  onChange={(event) =>
                    setNewItemForm({ ...newItemForm, productSubtype1Code: event.target.value })
                  }>
                  {subtype1Options.map((subtype1) => (
                    <MenuItem key={subtype1.code} value={subtype1.code}>
                      {subtype1.code} — {formatDisplayName(subtype1.nameTh, subtype1.nameEn)}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            )}

            <TextField
              label={t('productFamilyManagement.create.nameTh')}
              value={newItemForm.nameTh}
              required
              inputProps={{ maxLength: 255 }}
              InputLabelProps={{ shrink: true }}
              onChange={(event) => setNewItemForm({ ...newItemForm, nameTh: event.target.value })}
            />
            <TextField
              label={t('productFamilyManagement.create.nameEn')}
              value={newItemForm.nameEn}
              inputProps={{ maxLength: 255 }}
              InputLabelProps={{ shrink: true }}
              onChange={(event) => setNewItemForm({ ...newItemForm, nameEn: event.target.value })}
            />
            {newItemForm.type === 'SUBTYPE1' && (
              <FormControlLabel
                control={
                  <Switch
                    checked={newItemForm.subtype2Required}
                    onChange={(event) =>
                      setNewItemForm({ ...newItemForm, subtype2Required: event.target.checked })
                    }
                  />
                }
                label={t('productFamilyManagement.create.subtype2Required')}
              />
            )}
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setIsCreateDialogOpen(false)} disabled={isCreating}>
            {t('button.cancel')}
          </Button>
          <Button
            variant="contained"
            onClick={handleCreateItem}
            disabled={!isNewItemValid || isCreating}>
            {isCreating ? t('productFamilyManagement.create.saving') : t('button.create')}
          </Button>
        </DialogActions>
      </Dialog>
    </Page>
  );
}
