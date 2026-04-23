/* eslint-disable prettier/prettier */
import { Box, Link } from '@mui/material';
import { LocalPhone } from '@mui/icons-material';

type Props = {
    phoneNumber: string;
    onClickLink?: (event: React.MouseEvent<HTMLAnchorElement>) => void;
};

export default function PhoneCallBox({ phoneNumber, onClickLink }: Props) {
    const formattedNumber = phoneNumber.replaceAll('-', '');
    return (
        <Box
            sx={{
                display: 'flex',
                alignItems: 'center',
                border: '1px solid #ccc',
                borderRadius: '5px',
                padding: '5px 3px',
                backgroundColor: '#f9f9f9'
            }}>
            <LocalPhone color="primary" sx={{ marginRight: 2 }} />
            {/* <Box> */}
            <Link
                href={`tel:${formattedNumber}`}
                underline="hover"
                color="primary"
                onClick={onClickLink}
                sx={{
                    display: 'inline-block',
                    marginTop: '4px'
                }}>
                {phoneNumber}
            </Link>
            {/* </Box> */}
        </Box>
    );
}
