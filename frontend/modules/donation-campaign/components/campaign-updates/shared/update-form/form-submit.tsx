import { Button } from '@/components/ui/button';
import { IMAGE_CONSTRAINTS } from '@/modules/donation-campaign/constants';

interface FormSubmitProps {
  isSaving: boolean;
  validation: {
    isTitle: boolean;
    isDescription: boolean;
  };
  onSubmit: () => void;
  isEdit: boolean;
  totalSize: number;
}

export const FormSubmit = ({ isSaving, validation, onSubmit, isEdit, totalSize }: FormSubmitProps) => {
  return (
    <div className="w-full py-4">
      <Button
        variant="default"
        className="bg-brand-primary hover:bg-brand-primary/80 shadow-brand-primary/10 w-full rounded-xl text-white shadow-lg"
        onClick={onSubmit}
        disabled={isSaving || !validation.isTitle || !validation.isDescription || totalSize > IMAGE_CONSTRAINTS.MAX_IMAGES_SIZE * 1024 * 1024}
      >
        {isEdit ? (isSaving ? 'Saving Changes...' : 'Save Changes') : isSaving ? 'Creating Update...' : 'Create Update'}
      </Button>
    </div>
  );
};
