import React, { useState } from 'react';
import { AppConfig, CheckoutOption, Photo } from '../types';
import { Button } from './Button';
import { Download, CheckCircle, Loader2 } from 'lucide-react';
import JSZip from 'jszip';
import saveAs from 'file-saver';

interface SuccessStepProps {
  config: AppConfig;
  mode: CheckoutOption;
  photos: Photo[];
  selectedIds: string[];
}

export const SuccessStep: React.FC<SuccessStepProps> = ({ config, mode, photos, selectedIds }) => {
  const [isDownloading, setIsDownloading] = useState(false);

  const handleDownload = async () => {
    setIsDownloading(true);

    try {
      const zip = new JSZip();
      const folder = zip.folder("Click_Property_Photos");

      // Determine which photos to download
      const photosToDownload = mode === CheckoutOption.ALL 
        ? photos 
        : photos.filter(p => selectedIds.includes(p.id));

      if (!folder) return;

      // Fetch all images
      const downloadPromises = photosToDownload.map(async (photo) => {
        try {
          const response = await fetch(photo.highResUrl);
          const blob = await response.blob();
          const fileName = `${photo.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.jpg`;
          folder.file(fileName, blob);
        } catch (err) {
          console.error(`Failed to download image ${photo.id}`, err);
        }
      });

      await Promise.all(downloadPromises);

      const content = await zip.generateAsync({ type: "blob" });
      saveAs(content, "Click_Property_Photos.zip");

    } catch (error) {
      console.error("Error creating zip:", error);
      alert("There was an issue preparing your download. Please try again.");
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] w-full max-w-2xl mx-auto px-6 text-center">
      
      <div className="w-24 h-24 bg-green-50 rounded-full flex items-center justify-center mb-8 border border-green-100 shadow-sm">
        <CheckCircle className="w-12 h-12 text-[#47E692]" />
      </div>

      <h1 className="text-4xl md:text-5xl font-bold text-[#0047BB] mb-6 tracking-tight">
        {config.copy.successHeadline}
      </h1>
      
      <p className="text-lg text-slate-600 mb-12 leading-relaxed max-w-lg mx-auto">
        {config.copy.successSubtext}
      </p>

      <div className="space-y-4 w-full max-w-md">
        <Button 
          onClick={handleDownload} 
          className="w-full py-4 flex items-center justify-center text-lg shadow-xl shadow-blue-900/10"
          disabled={isDownloading}
        >
          {isDownloading ? (
            <>
               <Loader2 className="w-5 h-5 mr-3 animate-spin" />
               Preparing Zip...
            </>
          ) : (
            <>
              <Download className="w-5 h-5 mr-3" />
              {mode === CheckoutOption.ALL ? 'Download All Photos (ZIP)' : 'Download Selected Photos'}
            </>
          )}
        </Button>

        <Button variant="ghost" className="w-full font-medium" onClick={() => window.print()}>
           Print Receipt
        </Button>
      </div>

      <div className="mt-16 p-8 bg-blue-50 rounded-2xl text-left w-full border border-blue-100">
        <h4 className="font-bold text-[#0047BB] mb-2">What's next?</h4>
        <p className="text-sm text-blue-900/70 leading-relaxed">
          A confirmation email with these download links has been sent to your address. 
          Your license allows you to use these images for marketing with future agents or for personal use indefinitely.
        </p>
      </div>
    </div>
  );
};