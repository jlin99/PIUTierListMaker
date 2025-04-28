import React, { useRef, useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { toPng } from 'html-to-image';
import { useToast } from '@/hooks/use-toast';
import { TierList, ChartFilter } from '@/data/data-types';
import TierRow from '@/components/TierRow';

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  tierList: TierList;
  filter: ChartFilter;
}

const ExportModal: React.FC<ExportModalProps> = ({ isOpen, onClose, tierList, filter }) => {
  const previewRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();
  const [isGenerating, setIsGenerating] = useState(false);

  const waitForImages = async (element: HTMLElement): Promise<void> => {
    const images = element.getElementsByTagName('img');
    const imagePromises = Array.from(images).map(img => {
      if (img.complete) return Promise.resolve();
      return new Promise((resolve) => {
        img.onload = resolve;
        img.onerror = resolve; // Resolve even on error to not block the process
      });
    });
    await Promise.all(imagePromises);
  };

  const generateImage = async () => {
    if (!previewRef.current) {
      toast({
        title: "Error",
        description: "Could not generate image. Please try again.",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsGenerating(true);
      
      // Wait for all images to load
      await waitForImages(previewRef.current);

      const imageData = await toPng(previewRef.current, { 
        cacheBust: true, 
        pixelRatio: 1,
        skipFonts: true,
        skipAutoScale: true
      });

      const link = document.createElement('a');
      link.download = `${tierList.name}.png`;
      link.href = imageData;
      link.click();

      toast({
        title: "Success",
        description: "Tier list image has been downloaded.",
      });

      onClose();
    } catch (error) {
      console.error('Error generating image:', error);
      toast({
        title: "Error",
        description: "Failed to generate image. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="font-poppins font-bold text-lg">Export Tier List</DialogTitle>
        </DialogHeader>
        
        <div className="p-4">
          <div className="border rounded-lg p-4 mb-4 bg-gray-50">
            <h4 className="font-medium mb-3">Preview</h4>
            <div className="bg-white border p-4 rounded" ref={previewRef}>
              <div className="space-y-4">
                <h2 className="font-poppins font-bold text-xl mb-4">
                  {tierList.name}
                </h2>
                {tierList.tiers.map((tier) => (
                  <TierRow
                    key={tier.position}
                    tier={tier}
                    charts={tier.charts}
                    mode={filter.mode}
                    level={filter.level}
                    onTierNameChange={() => {}}
                    onRemoveChart={() => {}}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
        
        <DialogFooter className="bg-gray-50 p-4 sm:px-6">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button 
            onClick={generateImage} 
            className="bg-[#4C1D95] hover:bg-[#3B0764]"
            disabled={isGenerating}
          >
            {isGenerating ? 'Generating...' : 'Download Image'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ExportModal;
