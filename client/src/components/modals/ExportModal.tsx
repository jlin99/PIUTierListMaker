import React, { useRef, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { toPng, toJpeg } from 'html-to-image';
import { useToast } from '@/hooks/use-toast';

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  tierListRef: React.RefObject<HTMLDivElement>;
}

const ExportModal: React.FC<ExportModalProps> = ({ isOpen, onClose, tierListRef }) => {
  const [format, setFormat] = useState<'png' | 'jpeg'>('png');
  const [quality, setQuality] = useState<'high' | 'medium' | 'low'>('high');
  const [includeWatermark, setIncludeWatermark] = useState(false);
  const [includeTierLabels, setIncludeTierLabels] = useState(true);
  const previewRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  const generateImage = async () => {
    if (!tierListRef.current) {
      toast({
        title: "Error",
        description: "Could not generate image. Please try again.",
        variant: "destructive",
      });
      return;
    }

    try {
      // Apply temporary styles for export
      const tierLabels = tierListRef.current.querySelectorAll('.tier-label');
      if (!includeTierLabels) {
        tierLabels.forEach(label => {
          (label as HTMLElement).style.visibility = 'hidden';
        });
      }

      // Add watermark if needed
      let watermark: HTMLDivElement | null = null;
      if (includeWatermark) {
        watermark = document.createElement('div');
        watermark.style.position = 'absolute';
        watermark.style.bottom = '10px';
        watermark.style.right = '10px';
        watermark.style.padding = '5px 10px';
        watermark.style.background = 'rgba(255, 255, 255, 0.7)';
        watermark.style.borderRadius = '4px';
        watermark.style.fontSize = '12px';
        watermark.style.color = '#666';
        watermark.innerText = 'Created with Pump It Up Tier List Maker';
        tierListRef.current.style.position = 'relative';
        tierListRef.current.appendChild(watermark);
      }

      // Calculate scale based on quality
      const scale = quality === 'high' ? 2 : quality === 'medium' ? 1 : 0.5;

      // Generate the image
      const imageData = format === 'png' 
        ? await toPng(tierListRef.current, { cacheBust: true, pixelRatio: scale })
        : await toJpeg(tierListRef.current, { quality: 0.9, cacheBust: true, pixelRatio: scale });

      // Restore original styles
      if (!includeTierLabels) {
        tierLabels.forEach(label => {
          (label as HTMLElement).style.visibility = 'visible';
        });
      }

      // Remove watermark if added
      if (watermark) {
        tierListRef.current.removeChild(watermark);
        tierListRef.current.style.position = '';
      }

      // Create a download link
      const link = document.createElement('a');
      link.download = `tier-list-${new Date().toISOString()}.${format}`;
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
              {/* Preview content will be dynamically generated */}
              {tierListRef.current && (
                <div className="w-full h-[300px] flex items-center justify-center text-gray-400">
                  Tier list preview will appear here
                </div>
              )}
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <Label className="block text-sm font-medium mb-1">File Format</Label>
              <Select value={format} onValueChange={(value: 'png' | 'jpeg') => setFormat(value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select format" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="png">PNG Image (.png)</SelectItem>
                  <SelectItem value="jpeg">JPEG Image (.jpg)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="block text-sm font-medium mb-1">Quality</Label>
              <Select value={quality} onValueChange={(value: 'high' | 'medium' | 'low') => setQuality(value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select quality" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="high">High (2x)</SelectItem>
                  <SelectItem value="medium">Medium (1x)</SelectItem>
                  <SelectItem value="low">Low (0.5x)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <div className="flex justify-between mb-4">
            <div className="flex items-center space-x-2">
              <Checkbox 
                id="watermark" 
                checked={includeWatermark} 
                onCheckedChange={(checked) => setIncludeWatermark(!!checked)} 
              />
              <Label htmlFor="watermark">Include watermark</Label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox 
                id="tierLabels" 
                checked={includeTierLabels}
                onCheckedChange={(checked) => setIncludeTierLabels(!!checked)}
              />
              <Label htmlFor="tierLabels">Include tier labels</Label>
            </div>
          </div>
        </div>
        
        <DialogFooter className="bg-gray-50 p-4 sm:px-6">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={generateImage} className="bg-[#4C1D95] hover:bg-[#3B0764]">
            Download Image
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ExportModal;
