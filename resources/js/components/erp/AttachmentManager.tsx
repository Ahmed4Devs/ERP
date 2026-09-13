import React, { useState, useEffect } from 'react';
import { Paperclip, Upload, Trash2, Download, FileText, Image, FileArchive, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useTranslation } from '@/lib/i18n';

export interface Attachment {
    id: string;
    file_name: string;
    file_size: number;
    mime_type: string;
    category: string;
    description?: string;
    created_at: string;
    uploadedBy?: { name: string };
}

interface Props {
    attachableType: string;
    attachableId: string;
    title?: string;
    canUpload?: boolean;
    canDelete?: boolean;
}

export function AttachmentManager({
    attachableType,
    attachableId,
    title,
    canUpload = true,
    canDelete = true,
}: Props) {
    const { t, isRtl } = useTranslation();

    const [attachments, setAttachments] = useState<Attachment[]>([]);
    const [loading, setLoading] = useState(true);
    const [uploading, setUploading] = useState(false);
    const [selectedCategory, setSelectedCategory] = useState('general');
    const [description, setDescription] = useState('');
    const [errorMessage, setErrorMessage] = useState<string | null>(null);

    const loadAttachments = async () => {
        try {
            setLoading(true);
            const res = await fetch(`/attachments?attachable_type=${encodeURIComponent(attachableType)}&attachable_id=${encodeURIComponent(attachableId)}`);
            if (res.ok) {
                const data = await res.json();
                setAttachments(data);
            }
        } catch (err) {
            console.error('Failed to load attachments', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (attachableType && attachableId) {
            loadAttachments();
        }
    }, [attachableType, attachableId]);

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setUploading(true);
        setErrorMessage(null);

        const formData = new FormData();
        formData.append('file', file);
        formData.append('attachable_type', attachableType);
        formData.append('attachable_id', attachableId);
        formData.append('category', selectedCategory);
        if (description) formData.append('description', description);

        try {
            const csrfToken = (document.querySelector('meta[name="csrf-token"]') as HTMLMetaElement)?.content;
            const res = await fetch('/attachments', {
                method: 'POST',
                headers: {
                    'X-CSRF-TOKEN': csrfToken || '',
                    'Accept': 'application/json',
                },
                body: formData,
            });

            if (res.ok) {
                const result = await res.json();
                setAttachments((prev) => [result.attachment, ...prev]);
                setDescription('');
                e.target.value = '';
            } else {
                const err = await res.json();
                setErrorMessage(err.message || 'فشل رفع الملف / Upload failed');
            }
        } catch (err: any) {
            setErrorMessage('Network error during upload');
        } finally {
            setUploading(false);
        }
    };

    const handleDelete = async (attachmentId: string) => {
        if (!confirm(t('common.confirmDelete', 'هل أنت متأكد من حذف هذا المرفق؟'))) return;

        try {
            const csrfToken = (document.querySelector('meta[name="csrf-token"]') as HTMLMetaElement)?.content;
            const res = await fetch(`/attachments/${attachmentId}`, {
                method: 'DELETE',
                headers: {
                    'X-CSRF-TOKEN': csrfToken || '',
                    'Accept': 'application/json',
                },
            });

            if (res.ok) {
                setAttachments((prev) => prev.filter((a) => a.id !== attachmentId));
            }
        } catch (err) {
            console.error('Delete error', err);
        }
    };

    const formatBytes = (bytes: number) => {
        if (bytes === 0) return '0 B';
        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
    };

    const getFileIcon = (mime: string) => {
        if (mime.includes('image')) return <Image className="w-4 h-4 text-purple-500" />;
        if (mime.includes('pdf')) return <FileText className="w-4 h-4 text-rose-500" />;
        if (mime.includes('zip') || mime.includes('archive')) return <FileArchive className="w-4 h-4 text-amber-500" />;
        return <Paperclip className="w-4 h-4 text-blue-500" />;
    };

    return (
        <div className="bg-card border border-border rounded-xl p-5 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-border pb-3">
                <div className="flex items-center gap-2">
                    <Paperclip className="w-5 h-5 text-indigo-500" />
                    <h3 className="font-semibold text-base text-foreground">
                        {title || t('attachments.title', 'المرفقات والأرشفة الإلكترونية (DMS)')}
                    </h3>
                    <span className="text-xs px-2 py-0.5 rounded-full bg-muted font-mono font-medium">
                        {attachments.length}
                    </span>
                </div>
            </div>

            {errorMessage && (
                <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 dark:bg-rose-950/40 dark:border-rose-900 dark:text-rose-400 text-xs flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 flex-shrink-0" />
                    <span>{errorMessage}</span>
                </div>
            )}

            {/* Upload form */}
            {canUpload && (
                <div className="p-3.5 bg-muted/40 border border-border rounded-lg space-y-3">
                    <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-end">
                        <div className="sm:col-span-4">
                            <label className="block text-[11px] font-medium text-muted-foreground mb-1">
                                {t('attachments.category', 'تصنيف المرفق')}
                            </label>
                            <select
                                className="w-full h-8 text-xs rounded border border-input bg-background px-2"
                                value={selectedCategory}
                                onChange={(e) => setSelectedCategory(e.target.value)}
                            >
                                <option value="general">{t('attachments.catGeneral', 'مستند عام (General)')}</option>
                                <option value="invoice">{t('attachments.catInvoice', 'فاتورة رسمية (Invoice)')}</option>
                                <option value="contract">{t('attachments.catContract', 'عقد أو اتفاقية (Contract)')}</option>
                                <option value="receipt">{t('attachments.catReceipt', 'إيصال دفع أو قبض (Receipt)')}</option>
                                <option value="tax_document">{t('attachments.catTax', 'مستند ضريبي أو جمركي (Tax/Customs)')}</option>
                                <option value="check_copy">{t('attachments.catCheck', 'صورة شيك أو ضمان (Check/Guarantee)')}</option>
                            </select>
                        </div>

                        <div className="sm:col-span-5">
                            <label className="block text-[11px] font-medium text-muted-foreground mb-1">
                                {t('common.description', 'الوصف / ملاحظة')}
                            </label>
                            <Input
                                className="h-8 text-xs"
                                placeholder={t('attachments.descPlaceholder', 'ملاحظات حول الملف...')}
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                            />
                        </div>

                        <div className="sm:col-span-3">
                            <label className="cursor-pointer inline-flex items-center justify-center w-full h-8 px-3 rounded-md bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium gap-1.5 shadow-sm transition-colors">
                                {uploading ? (
                                    <>
                                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                        <span>{t('common.uploading', 'جاري الرفع...')}</span>
                                    </>
                                ) : (
                                    <>
                                        <Upload className="w-3.5 h-3.5" />
                                        <span>{t('attachments.uploadBtn', 'اختيار ورفع ملف')}</span>
                                    </>
                                )}
                                <input
                                    type="file"
                                    className="hidden"
                                    disabled={uploading}
                                    onChange={handleFileUpload}
                                />
                            </label>
                        </div>
                    </div>
                </div>
            )}

            {/* List */}
            {loading ? (
                <div className="py-6 text-center text-xs text-muted-foreground flex items-center justify-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>{t('common.loading', 'جاري تحميل المرفقات...')}</span>
                </div>
            ) : attachments.length === 0 ? (
                <p className="py-6 text-center text-xs text-muted-foreground">
                    {t('attachments.noFiles', 'لا توجد مرفقات مرتبطة بهذا السجل حتى الآن')}
                </p>
            ) : (
                <div className="divide-y divide-border border border-border rounded-lg overflow-hidden">
                    {attachments.map((file) => (
                        <div key={file.id} className="p-3 flex items-center justify-between hover:bg-muted/30 transition-colors">
                            <div className="flex items-center gap-3 min-w-0">
                                <div className="p-2 rounded-lg bg-muted flex-shrink-0">
                                    {getFileIcon(file.mime_type)}
                                </div>
                                <div className="min-w-0">
                                    <p className="text-xs font-semibold text-foreground truncate">{file.file_name}</p>
                                    <div className="flex items-center gap-2 text-[11px] text-muted-foreground mt-0.5">
                                        <span className="font-mono">{formatBytes(file.file_size)}</span>
                                        <span>•</span>
                                        <span className="px-1.5 py-0.2 rounded bg-secondary text-secondary-foreground text-[10px] font-medium">
                                            {file.category}
                                        </span>
                                        {file.description && (
                                            <>
                                                <span>•</span>
                                                <span className="truncate">{file.description}</span>
                                            </>
                                        )}
                                        {file.uploadedBy && (
                                            <>
                                                <span>•</span>
                                                <span>{file.uploadedBy.name}</span>
                                            </>
                                        )}
                                    </div>
                                </div>
                            </div>

                            <div className="flex items-center gap-2 flex-shrink-0">
                                <a
                                    href={`/attachments/${file.id}/download`}
                                    target="_blank"
                                    rel="noreferrer"
                                >
                                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-indigo-600 hover:text-indigo-700">
                                        <Download className="w-4 h-4" />
                                    </Button>
                                </a>
                                {canDelete && (
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => handleDelete(file.id)}
                                        className="h-8 w-8 p-0 text-rose-500 hover:text-rose-600"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </Button>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
