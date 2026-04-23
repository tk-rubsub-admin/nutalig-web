/* eslint-disable prettier/prettier */
import { Close } from '@mui/icons-material';
import { Box, Button, Chip, Dialog, DialogActions, DialogContent, DialogTitle, Grid, TextField } from '@mui/material';
import LoadingDialog from 'components/LoadingDialog';
import { GridTextField } from 'components/Styled';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { getProductBySku } from 'services/Product/product-api';
import { Data, Product } from 'services/Product/product-type';

export interface ProductDialogProps {
    open: boolean;
    itemSku: string;
    onClose: () => void;
}
export default function ProductDialog(props: ProductDialogProps): JSX.Element {
    const { open, itemSku, onClose } = props;
    const [product, setProduct] = useState<Product>();
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const { t } = useTranslation();

    useEffect(async () => {
        if (itemSku !== '' && itemSku !== undefined) {
            const productData = await getProductBySku(itemSku);
            console.log(JSON.stringify(productData.data));
            setProduct(productData.data);
            setIsLoading(false);
        }
    }, [itemSku]);

    return (
        <Dialog open={open} maxWidth="xs" fullWidth aria-labelledby="form-dialog-title" >
            {isLoading ? ('') : (
                <>
                    <DialogTitle id="form-dialog-title">{product?.name}</DialogTitle>
                    <DialogContent>
                        <Grid container spacing={1} style={{ paddingTop: '10px' }}>
                            <GridTextField item xs={12} sm={12} textAlign={'center'}>
                                <img src={product?.images?.[0]?.src || '/no-image.jpg'} width={'250px'} height={'250px'} />
                            </GridTextField>
                            <GridTextField item xs={12} sm={12}>
                                <TextField
                                    label="SKU"
                                    variant="outlined"
                                    fullWidth
                                    InputProps={{ readOnly: true }}
                                    InputLabelProps={{ shrink: true }}
                                    value={product?.sku}
                                />
                            </GridTextField>
                            <GridTextField item xs={12} sm={12} textAlign={'right'}>
                                <TextField
                                    label={t('productManagement.productList.column.keyword')}
                                    variant="outlined"
                                    fullWidth
                                    InputProps={{
                                        readOnly: true,
                                        startAdornment: (
                                            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1.0, marginTop: '10px', marginBottom: '10px' }}>
                                                {product?.tags?.map((tag: Data) => (
                                                    <Chip key={tag.name} label={tag.name} />
                                                ))}
                                            </Box>
                                        )
                                    }}
                                />
                            </GridTextField>
                        </Grid>
                        {/* <br />
                        <Link href={product?.permalink} underline='hover' target="_blank"
                            rel="noopener">ไปยังเว็บไซต์แสดงสินค้า</Link> */}
                    </DialogContent>
                    <DialogActions>
                        <Button
                            onClick={() => {
                                setProduct(null);
                                setIsLoading(true);
                                onClose();
                            }}
                            variant="contained"
                            startIcon={<Close />}
                            className="btn-cool-grey">
                            {t('button.close')}
                        </Button>
                    </DialogActions>
                </>
            )}
            <LoadingDialog open={isLoading} />
        </Dialog >
    )
}
