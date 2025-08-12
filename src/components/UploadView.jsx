"use client";

import { useState } from 'react';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Loader2, Wand2, UploadCloud } from 'lucide-react';
import { scrapeAndExtractWithAI } from '@/actions/extract';
import { addKnowledge } from '@/actions/knowledge';

export function UploadView() {
    const [url, setUrl] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [extractedData, setExtractedData] = useState(null);

    const handleScrape = async () => {
        if (!url || !url.startsWith('http')) {
            toast.error("Please enter a valid, complete URL (e.g., https://...).");
            return;
        }
        setIsLoading(true);
        const result = await scrapeAndExtractWithAI(url);
        setIsLoading(false);

        if (result.success) {
            setExtractedData({
                ...result.data,
                link: url, // Add the original link to the data object
            });
            setIsModalOpen(true);
            toast.success("Content extracted successfully!");
        } else {
            toast.error(`Extraction failed: ${result.error}`);
        }
    };

    const handleSave = async () => {
        if (!extractedData.country || !extractedData.publication) {
            toast.error("Please specify both the country and publication before saving.");
            return;
        }

        setIsLoading(true);
        const result = await addKnowledge({
            headline: extractedData.headline,
            content: extractedData.content,
            source: extractedData.publication,
            country: extractedData.country,
            link: extractedData.link,
        });
        setIsLoading(false);
        setIsModalOpen(false);

        if (result.success) {
            toast.success(result.message);
            setUrl('');
            setExtractedData(null);
        } else {
            toast.error(`Failed to save: ${result.message}`);
        }
    };

    return (
        <>
            <div className="max-w-4xl mx-auto">
                <Card className="bg-black/20 backdrop-blur-sm border border-white/10 shadow-2xl shadow-black/30">
                    <CardHeader>
                        <CardTitle>Upload New Knowledge</CardTitle>
                        <CardDescription>
                            Provide an article URL. The system will use an AI to extract the relevant content, which you can then add to the knowledge base.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="url" className="text-lg font-semibold">Article URL</Label>
                            <div className="flex gap-2">
                                <Input
                                    id="url"
                                    placeholder="https://example.com/article"
                                    value={url}
                                    onChange={(e) => setUrl(e.target.value)}
                                    disabled={isLoading}
                                    onKeyDown={(e) => e.key === 'Enter' && handleScrape()}
                                />
                                <Button onClick={handleScrape} disabled={isLoading}>
                                    {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Wand2 className="mr-2 h-4 w-4" />}
                                    Extract Content
                                </Button>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
                <DialogContent className="sm:max-w-3xl bg-slate-900 border-slate-700">
                    <DialogHeader>
                        <DialogTitle>Review Extracted Knowledge</DialogTitle>
                        <DialogDescription>
                            The AI has extracted and analyzed the content. Please verify the details before adding it to the knowledge base.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-6">
                        <div>
                            <Label>Headline</Label>
                            <p className="font-semibold text-slate-200">{extractedData?.headline}</p>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                             <div>
                                <Label htmlFor="modal-publication">Publication *</Label>
                                <Input 
                                    id="modal-publication"
                                    value={extractedData?.publication || ''}
                                    onChange={(e) => setExtractedData(prev => ({...prev, publication: e.target.value}))}
                                    placeholder="e.g., The Financial Times"
                                    className="bg-slate-800 border-slate-600"
                                />
                            </div>
                             <div>
                                <Label htmlFor="modal-country">Country of Origin *</Label>
                                <Input 
                                    id="modal-country"
                                    value={extractedData?.country || ''}
                                    onChange={(e) => setExtractedData(prev => ({...prev, country: e.target.value}))}
                                    placeholder="e.g., Denmark"
                                    className="bg-slate-800 border-slate-600"
                                />
                            </div>
                        </div>
                        <div>
                            <Label>Extracted Content</Label>
                            <div className="p-4 rounded-md bg-slate-800/50 border border-slate-700 text-sm text-slate-300 whitespace-pre-wrap max-h-64 overflow-y-auto">
                                {extractedData?.content}
                            </div>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsModalOpen(false)} disabled={isLoading}>Cancel</Button>
                        <Button onClick={handleSave} disabled={isLoading}>
                            {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <UploadCloud className="mr-2 h-4 w-4" />}
                            Add to Knowledge Base
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
}