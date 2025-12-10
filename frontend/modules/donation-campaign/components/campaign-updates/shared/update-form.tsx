'use client';

import { Chip } from '@/components/shared';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Folder, X, Loader2 } from 'lucide-react';
import { formatFileSize } from '@/utils';
import { ChangeEvent } from 'react';

const UNIT = 'MB';
const MAX_IMAGES_SIZE = 5;

interface UpdateFormProps {
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
    images: File[];
    previews: string[];
    isCompressing: boolean;
    isSaving: boolean;
    handleImageChange: (e: ChangeEvent<HTMLInputElement>) => void;
    handleRemoveImage: (idx: number) => void;
    handleRemoveAll: () => void;
    onSubmit: () => void;
    isEdit?: boolean;
}

export const UpdateForm = ({
    form,
    setForm,
    validation,
    images,
    previews,
    isCompressing,
    isSaving,
    handleImageChange,
    handleRemoveImage,
    handleRemoveAll,
    onSubmit,
    isEdit = false,
}: UpdateFormProps) => {
    const totalSize = images.reduce((sum, img) => sum + img.size, 0);
    const maxTotalSize = MAX_IMAGES_SIZE * 1024 * 1024;

    return (
        <Card className="border-primary/40 bg-card shadow-brand-primary/10 w-full max-w-[700px] rounded-3xl border p-3 shadow-lg dark:border-white/10">
            <CardHeader className="text-brand-primary border-none px-4 pt-3 text-left">
                <CardTitle className="text-primary text-lg font-semibold">Campaign Update</CardTitle>
                <Chip
                    variant="outline-warning"
                    className="mt-2 rounded-md bg-amber-100 p-3 text-sm font-normal hover:bg-amber-100 dark:bg-amber-500/10 dark:hover:bg-amber-500/10"
                >
                    Each update is permanently recorded on the MMN chain using a unique content hash that proves the data's
                    authenticity.
                </Chip>
            </CardHeader>
            <CardContent className="text-brand-primary space-y-5 p-5 text-left">
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
                <Separator className="my-4 w-full" />
                {isCompressing && (
                    <div className="text-brand-primary flex items-center justify-center gap-2 p-3 text-sm">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        <span>Compressing images...</span>
                    </div>
                )}
                <div>
                    {previews.length > 0 && (
                        <>
                            <div className="mt-4 flex flex-wrap items-center justify-center gap-4">
                                {previews.map((src, idx) => (
                                    <div key={idx} className="group relative py-3">
                                        <img
                                            src={src}
                                            alt={`Preview ${idx + 1}`}
                                            className="hover:border-primary/40 shadow-primary/20 max-w-60 rounded border object-cover shadow-sm hover:shadow-md md:h-32 md:w-32"
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
                                {totalSize < maxTotalSize && (
                                    <label className="hover:border-brand-primary flex h-32 w-32 cursor-pointer flex-col items-center justify-center rounded border-2 border-dashed border-gray-300 transition-colors">
                                        <span className="text-2xl text-gray-400">+</span>
                                        <span className="text-xs text-gray-400">Add More</span>
                                        <Input
                                            type="file"
                                            accept="image/*"
                                            multiple
                                            onChange={handleImageChange}
                                            className="hidden"
                                            disabled={totalSize >= maxTotalSize || isCompressing}
                                        />
                                    </label>
                                )}
                            </div>
                            <div className="mt-3 flex flex-col items-start gap-3 py-3 md:flex-row md:justify-between">
                                <p className="text-xs font-medium text-gray-600">
                                    Current: {formatFileSize(totalSize)} / {MAX_IMAGES_SIZE} {UNIT}
                                </p>
                                <Button
                                    variant="destructive"
                                    size="sm"
                                    onClick={handleRemoveAll}
                                    className="bg-destructive/10 text-destructive hover:bg-destructive/20 dark:bg-destructive/60 dark:hover:bg-destructive/80 text-xs dark:text-white"
                                >
                                    Remove all images
                                </Button>
                            </div>
                        </>
                    )}
                    {previews.length === 0 && (
                        <div>
                            <p className="text-primary mb-1 text-xs uppercase tracking-[0.2em] dark:text-white">Upload Photos</p>
                            <label className="bg-background hover:border-brand-primary border-muted-foreground mt-2 flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border border-dashed p-6 text-center">
                                <div className="bg-background flex h-12 w-12 items-center justify-center rounded-xl text-3xl">
                                    <Folder className="text-brand-primary" />
                                </div>
                                <p className="text-muted-foreground/70 text-sm">Click to upload images</p>
                                <Input
                                    type="file"
                                    accept="image/jpeg,image/png"
                                    multiple
                                    onChange={handleImageChange}
                                    className="hidden"
                                    disabled={totalSize >= maxTotalSize || isCompressing}
                                />
                            </label>
                            <p className="text-muted-foreground mt-1 text-xs">
                                Supported: JPG, PNG. Total size limit: {MAX_IMAGES_SIZE} {UNIT} for all images (auto-compressed)
                            </p>
                            <p className="text-muted-foreground/80 mt-1 text-xs font-medium">
                                Current: {formatFileSize(totalSize)} / {MAX_IMAGES_SIZE} {UNIT}
                            </p>
                        </div>
                    )}
                </div>
                <Separator className="my-4 w-full" />
                <div className="w-full py-4">
                    <Button
                        variant="default"
                        className="bg-brand-primary hover:bg-brand-primary/80 shadow-brand-primary/10 w-full rounded-xl text-white shadow-lg"
                        onClick={onSubmit}
                        disabled={isSaving || !validation.isTitle || !validation.isDescription}
                    >
                        {isSaving ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                {isEdit ? 'Updating...' : 'Submitting...'}
                            </>
                        ) : (
                            isEdit ? 'Update' : 'Submit'
                        )}
                    </Button>
                </div>
            </CardContent>
        </Card>
    );
};
