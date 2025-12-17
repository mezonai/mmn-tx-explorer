import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@radix-ui/react-separator';

interface BasicfieldProps {
  form: {
    title: string;
    description: string;
    images: string[];
  };
  setForm: (form: { title: string; description: string; images: string[] }) => void;
  validation: {
    isTitle: boolean;
    isDescription: boolean;
  };
}

export const Basicfield = ({ form, setForm, validation }: BasicfieldProps) => {
  return (
    <>
      <div className="">
        <Input
          type="text"
          label="Title"
          className="bg-background mt-2"
          value={form.title}
          onChange={(e) => setForm({ ...form, title: e.target.value })}
        />
      </div>
      <div>
        <Textarea
          rows={5}
          label="Description"
          className="bg-background mt-2"
          value={form.description}
          onChange={(e) => setForm({ ...form, description: e.target.value })}
        />
      </div>
    </>
  );
};
