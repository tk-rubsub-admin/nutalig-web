import ShippingContainerEditor, { ShippingContainerEditorProps } from './ShippingContainerEditor';

export default function ShippingContainerDialog(props: ShippingContainerEditorProps) {
  return <ShippingContainerEditor {...props} variant="dialog" />;
}
