import React from 'react';
import ThumbnailImageList from 'components/ThumbnailImageList';
import { StyledBox } from './styles';
import { ImageFileUploaderWrapperProp } from './ImageFileUploaderWrapperProp';

export default function ImageFileUploaderWrapper({
  id,
  inputId,
  isDisabled,
  readOnly,
  isPreviewDisabled = false,
  isMultiple,
  onError,
  maxFiles,
  onDeleted,
  onSuccess,
  onSync,
  isError,
  files,
  fileUploader: FileUploadComponent
}: Readonly<ImageFileUploaderWrapperProp>): JSX.Element {
  const [isCompressing, setIsCompressing] = React.useState(false);
  const [progress, setProgress] = React.useState(0);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    let timer;
    if (e.target.files && onSuccess) {
      try {
        setIsCompressing(true);
        setProgress(0);
        timer = setInterval(() => {
          setProgress((prevProgress) => (prevProgress >= 90 ? 90 : prevProgress + 10));
        }, 200);
        const newFiles = await Promise.all(Array.from(e.target.files).map((file) => file));
        onSuccess(Array.from(newFiles), inputId);
      } catch (error) {
        onError(error);
      } finally {
        setIsCompressing(false);
        clearInterval(timer);
      }
    }
  };

  return (
    <StyledBox>
      {files.length >= 1 || isCompressing ? (
        <ThumbnailImageList
          id={id}
          isDisabled={isDisabled || isPreviewDisabled}
          inputId={inputId}
          maxFiles={maxFiles}
          files={files}
          isMultiple={isMultiple}
          onDeleted={onDeleted}
          onChange={handleFileChange}
          progress={progress}
          isLoading={isCompressing}
        />
      ) : (
        <FileUploadComponent
          id={id}
          inputId={inputId}
          readOnly={readOnly}
          isDisabled={isDisabled}
          isMultiple={isMultiple}
          onChange={handleFileChange}
          handleClick={onSync}
          isError={isError}
        />
      )}
    </StyledBox>
  );
}
