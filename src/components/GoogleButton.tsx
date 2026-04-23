/* eslint-disable prettier/prettier */
import Button from '@mui/material/Button';
import { styled } from '@mui/material/styles';

interface GoogleButtonProp {
    onClick: () => void
}
const GoogleIcon = () => (
    <svg width="20" height="20" viewBox="0 0 533.5 544.3">
        <path
            fill="#4285f4"
            d="M533.5 278.4c0-17.4-1.5-34-4.3-50.1H272v95h147.4c-6.3 34.1-25.4 62.9-54.1 82.1v68h87.4c51.2-47.1 80.8-116.5 80.8-195z"
        />
        <path
            fill="#34a853"
            d="M272 544.3c73.5 0 135-24.4 180-66.2l-87.4-68c-24.3 16.3-55.3 25.9-92.6 25.9-71 0-131.2-47.9-152.7-112.3H29.6v70.7C74.3 483.3 167.4 544.3 272 544.3z"
        />
        <path
            fill="#fbbc04"
            d="M119.3 323.7c-10.3-30.3-10.3-63.4 0-93.7V159.3H29.6c-36.5 71.5-36.5 154.2 0 225.7l89.7-61.3z"
        />
        <path
            fill="#ea4335"
            d="M272 107.3c39.9-.6 78.4 14.1 107.8 41.1l80.3-80.3C409.7 24.8 341.4 0 272 0 167.4 0 74.3 61 29.6 159.3l89.7 70.7C140.8 155.2 201 107.3 272 107.3z"
        />
    </svg>
);

const GoogleButton = styled(Button)({
    backgroundColor: '#4d8a3f',
    color: '#fff',
    borderRadius: 30,
    padding: '10px 20px',
    fontSize: '16px',
    fontWeight: 500,
    '&:hover': {
        backgroundColor: '#3b6f30'
    }
});

const GoogleSignIn = (props: GoogleButtonProp) => {

    return <GoogleButton onClick={props.onClick} startIcon={<GoogleIcon />}>Google</GoogleButton>;
};

export default GoogleSignIn;
