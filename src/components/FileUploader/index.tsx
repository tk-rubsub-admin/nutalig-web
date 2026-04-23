import { useTranslation } from 'react-i18next';
import UploadFileIcon from '@mui/icons-material/UploadFile';
import Button from '@mui/material/Button';
import Stack from '@mui/material/Stack';
import { FileUploaderProps } from './FileUploaderProp';

export default function FileUploader({
  id,
  inputId,
  isDisabled,
  readOnly,
  isMultiple,
  onChange
}: Readonly<FileUploaderProps>): JSX.Element {
  const { t } = useTranslation();
  return (
    <Stack direction="column" alignItems={'center'} spacing={1}>
      <Stack direction="row" alignItems="center">
        {!readOnly && (
          <Button
            id={`${id}__upload_button_${inputId}`}
            variant="contained"
            className="btn-baby-blue"
            component="label"
            startIcon={<UploadFileIcon />}
            size="large"
            sx={{
              marginTop: 1
            }}
            disabled={isDisabled}>
            {t('inputUpload.submitButton')}
            <input
              hidden
              accept="image/jpeg,image/jpg,image/png,.heic,.heif"
              type="file"
              multiple={isMultiple}
              id={`${id}_document_uploader_button_${inputId}`}
              name={inputId}
              onChange={onChange}
              disabled={isDisabled}
            />
          </Button>
        )}
      </Stack>
    </Stack>
  );
}
