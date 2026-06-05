import { Search, ExpandMore } from '@mui/icons-material';
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Grid,
  Stack,
  TextField,
  Typography
} from '@mui/material';
import { makeStyles } from '@mui/styles';
import PageTitle from 'components/PageTitle';
import { GridSearchSection, Wrapper } from 'components/Styled';
import { Page } from 'layout/LayoutRoute';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery } from 'react-query';
import { getProductFamilies } from 'services/Product/product-api';
import { ProductFamily, ProductMaterial, ProductSubtype1, ProductSubtype2 } from 'services/Product/product-type';

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

const subtype2MatchesKeyword = (subtype2List: ProductSubtype2[], keyword: string) =>
  subtype2List.some((item) =>
    [item.code, item.nameTh, item.nameEn].some((value) =>
      value?.toLowerCase().includes(keyword)
    )
  );

const subtype1MatchesKeyword = (subtype1List: ProductSubtype1[], keyword: string) =>
  subtype1List.some((item) =>
    [item.code, item.nameTh, item.nameEn].some((value) =>
      value?.toLowerCase().includes(keyword)
    ) || subtype2MatchesKeyword(item.subtype2List || [], keyword)
  );

export default function ProductFamilyManagement(): JSX.Element {
  const classes = useStyles();
  const { t } = useTranslation();
  const [keyword, setKeyword] = useState('');

  const {
    data: productFamilies = [],
    isFetching: isProductFamiliesFetching
  } = useQuery(['product-family-list'], () => getProductFamilies(), {
    refetchOnWindowFocus: false
  });

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

  return (
    <Page>
      <PageTitle title={t('productFamilyManagement.title')} />
      <Wrapper>
        <GridSearchSection container spacing={2}>
          <Grid item xs={12}>
            <Typography variant="h6">{t('productFamilyManagement.searchPanel')}</Typography>
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
                        <Typography variant="h6" fontWeight={700}>
                          {formatDisplayName(family.nameTh, family.nameEn)}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {t('productFamilyManagement.label.code')}: {family.code}
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
                                      sx={{ mb: 1 }}
                                    >
                                      {t('productFamilyManagement.label.systemMechanics')}
                                    </Typography>
                                    <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap">
                                      {subtype1.subtype2List?.length ? (
                                        subtype1.subtype2List.map((subtype2) => (
                                          <Chip
                                            key={subtype2.code}
                                            label={formatDisplayName(subtype2.nameTh, subtype2.nameEn)}
                                            size="small"
                                          />
                                        ))
                                      ) : (
                                        <Chip
                                          label={t('productFamilyManagement.label.optionalMechanic')}
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
    </Page>
  );
}
