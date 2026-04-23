import { ThumbnailImageListProps } from 'components/ThumbnailImageList/ThumbnailImageList';
import { ChangeEvent, ComponentType } from 'react';

export interface ImageFileUploadComponentProps {
  id: string;
  inputId: string;
  isDisabled: boolean;
  readOnly?: boolean;
  isMultiple: boolean;
  onChange?: (e: ChangeEvent<HTMLInputElement>) => void;
  handleClick?: () => void;
  isError: boolean;
}

export interface ImageFileUploaderWrapperProp
  extends Omit<ThumbnailImageListProps, 'progress' | 'isLoading'> {
  id: string;
  inputId: string;
  isDisabled: boolean;
  readOnly?: boolean;
  isPreviewDisabled?: boolean;
  isError: boolean;
  handleClick?: () => void;
  onSuccess: (files: File[], inputId: string) => void;
  onError: (error: unknown) => void;
  onSync?: () => void;
  fileUploader: ComponentType<ImageFileUploadComponentProps>;
}
