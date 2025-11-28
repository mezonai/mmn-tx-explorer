'use client';
import { PageHeader } from '@/components/shared';
import { BreadcrumbNavigation } from '@/components/shared';
import { IBreadcrumb } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { ROUTES } from '@/configs/routes.config';
import { useState, ChangeEvent } from 'react';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Folder, X } from 'lucide-react';
import { useParams } from 'next/navigation';
import { useCampaign } from '../../hooks';

export const CreateUpdate = () => {
  const params = useParams<{ slug: string }>();
  const slug = params?.slug ? String(params.slug) : '';

  const breadcrumbs: IBreadcrumb[] = [
    { label: 'Donation campaign', href: ROUTES.DONATION_CAMPAIGN },
    { label: 'Campaign Details', href: ROUTES.CAMPAIGN(slug) },
    { label: 'Create Campaign Update', href: '#' },
  ];

  const [images, setImages] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);

  const handleImageChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    const files = Array.from(e.target.files);
    if (images.length + files.length > 5) {
      setError('You can upload up to 5 images.');
      return;
    }
    setError(null);
    const newImages = [...images, ...files];
    setImages(newImages);
    setPreviews(newImages.map((file) => URL.createObjectURL(file)));
    e.target.value = '';
  };

  const handleRemoveImage = (idx: number) => {
    const newImages = images.filter((_, i) => i !== idx);
    setImages(newImages);
    setPreviews(newImages.map((file) => URL.createObjectURL(file)));
  };

  return (
    <div className="space-y-6">
      <BreadcrumbNavigation breadcrumbs={breadcrumbs} />
      <PageHeader
        title="Campaign Update"
        header="Create Campaign Update"
        description="Share the latest news and progress of your donation campaign with your supporters."
      />
      <div className="my-3 flex w-full flex-col items-center justify-center">
        <Card className="border-brand-primary/50 bg-card w-full max-w-[800px] rounded-3xl border px-3 py-6 md:px-5 dark:border-white/10">
          <div className="bg-brand-primary/8 shadow-brand-primary/20 border-primary/20 shadow-brand-primary/10 dark:shadow-background rounded-2xl border shadow-lg">
            <CardHeader className="text-brand-primary border-none px-5 pt-4 text-left">
              <CardTitle className="text-brand-primary text-lg">Campaign Update</CardTitle>
              <p className="text-brand-primary/90 text-sm">
                Each update is permanently recorded on the MMN chain using a unique content hash that proves the data’s
                authenticity.
              </p>
            </CardHeader>
            <CardContent className="text-brand-primary space-y-5 p-6 text-left shadow-md">
              <div className="">
                <Input type="text" label="Title" className="bg-card dark:bg-background" />
              </div>

              <div>
                <Textarea rows={5} label="Description" className="bg-card dark:bg-background" />
              </div>
              <Separator className="my-4 w-full" />
              <div>
                {error && <p className="mt-2 text-sm text-red-500">{error}</p>}
                {previews.length > 0 && (
                  <div className="mt-4 flex flex-wrap items-center justify-center gap-4">
                    {previews.map((src, idx) => (
                      <div key={idx} className="group relative">
                        <img
                          src={src}
                          alt={`Preview ${idx + 1}`}
                          className="max-w-50 rounded border object-cover md:h-32 md:w-32"
                        />
                        <Button
                          variant="ghost"
                          onClick={() => handleRemoveImage(idx)}
                          className="absolute top-0 right-0 rounded-full text-white"
                          aria-label="Remove image"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                    {images.length < 5 && (
                      <label className="hover:border-brand-primary flex h-32 w-32 cursor-pointer flex-col items-center justify-center rounded border-2 border-dashed border-gray-300 transition-colors">
                        <span className="text-2xl text-gray-400">+</span>
                        <span className="text-xs text-gray-400">Add More</span>
                        <Input
                          type="file"
                          accept="image/*"
                          multiple
                          onChange={handleImageChange}
                          className="hidden"
                          disabled={images.length >= 5}
                        />
                      </label>
                    )}
                  </div>
                )}
                {previews.length === 0 && images.length < 5 && (
                  <div>
                    <p className="text-primary mb-1 text-xs tracking-[0.2em] uppercase dark:text-white">
                      Upload Photos
                    </p>
                    <label className="bg-card dark:bg-background hover:border-brand-primary flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-white/10 p-6 text-center">
                      <div className="bg-card dark:bg-background flex h-12 w-12 items-center justify-center rounded-xl text-3xl">
                        <Folder className="text-brand-primary" />
                      </div>
                      <p className="text-muted-foreground/70 text-sm">Click to upload images</p>
                      <Input
                        type="file"
                        accept="image/jpeg,image/png"
                        multiple
                        onChange={handleImageChange}
                        max={5}
                        className="hidden"
                        disabled={images.length >= 5}
                      />
                    </label>
                    <p className="mt-1 text-xs text-gray-500">Supported: JPG, PNG. Max 10MB</p>
                  </div>
                )}
              </div>
              <Separator className="my-4 w-full" />
              <div className="w-full py-4">
                <Button
                  variant="default"
                  className="bg-brand-primary hover:bg-brand-primary/80 shadow-brand-primary/10 w-full rounded-xl text-white shadow-lg"
                >
                  Submit
                </Button>
              </div>
            </CardContent>
          </div>
        </Card>
      </div>
    </div>
  );
};
