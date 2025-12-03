
import React, { useState, useRef } from 'react';
import { AppConfig, AccessRecord, Photo, Testimonial } from '../types';
import { Button } from './Button';
import { Input } from './Input';
import {
  X, Plus, Trash2, Image as ImageIcon, Upload,
  LayoutDashboard, Users, DollarSign, ShoppingCart, Clock, LogOut, Mail, AlertCircle, Star, CheckCircle
} from 'lucide-react';
import { sendInviteEmail } from '../services/emailService';

interface AdminPanelProps {
  config: AppConfig;
  isOpen: boolean;
  onClose: () => void;
  onUpdate: (newConfig: AppConfig) => void;
}

type Tab = 'OVERVIEW' | 'ACCESS' | 'SETTINGS';

export const AdminPanel: React.FC<AdminPanelProps> = ({ config, isOpen, onClose, onUpdate }) => {
  const [activeTab, setActiveTab] = useState<Tab>('OVERVIEW');

  const [newRecordCode, setNewRecordCode] = useState('');
  const [newRecordEmail, setNewRecordEmail] = useState('');
  const [newRecordAddress, setNewRecordAddress] = useState('');
  const [sendEmailOnCreate, setSendEmailOnCreate] = useState(true);
  // Removed newRecordLink state as it's no longer required
  
  const [selectedRecordId, setSelectedRecordId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const [newTestimonialQuote, setNewTestimonialQuote] = useState('');
  const [newTestimonialAuthor, setNewTestimonialAuthor] = useState('');
  const [newTestimonialRating, setNewTestimonialRating] = useState<number>(5);

  // State for Email Sending Feedback
  const [sendingEmailId, setSendingEmailId] = useState<string | null>(null);
  const [emailStatus, setEmailStatus] = useState<{success: boolean, msg: string} | null>(null);

  if (!isOpen) return null;

  const handleChange = (field: keyof AppConfig['copy'] | 'driveLink', value: string) => {
    if (field === 'driveLink') {
      onUpdate({ ...config, driveLink: value });
    } else {
      onUpdate({
        ...config,
        copy: {
          ...config.copy,
          [field]: value,
        },
      });
    }
  };

  const sendInviteForRecord = async (record: AccessRecord) => {
    setSendingEmailId(record.id);
    setEmailStatus(null);

    try {
      await sendInviteEmail({
        toEmail: record.email,
        accessCode: record.code,
        inviteLink: `${window.location.origin}?code=${record.code}`,
        propertyAddress: record.address
      });
      setEmailStatus({ success: true, msg: 'Invite sent!' });
    } catch (error: any) {
      console.error('Failed to send email', error);
      setEmailStatus({ success: false, msg: error?.message || 'Failed to send' });
    } finally {
      setTimeout(() => setEmailStatus(null), 3000);
      setSendingEmailId(null);
    }
  };

  const handleAddRecord = async () => {
    if (!newRecordCode || !newRecordEmail || !newRecordAddress) return;

    const newRecord: AccessRecord = {
      id: Date.now().toString(),
      code: newRecordCode,
      email: newRecordEmail,
      address: newRecordAddress,
      // Drive Link is no longer required
      photos: []
    };

    onUpdate({
      ...config,
      accessRecords: [...(config.accessRecords || []), newRecord]
    });

    setNewRecordCode('');
    setNewRecordEmail('');
    setNewRecordAddress('');

    if (sendEmailOnCreate) {
      await sendInviteForRecord(newRecord);
    }
  };

  const handleDeleteRecord = (id: string) => {
    onUpdate({
      ...config,
      accessRecords: (config.accessRecords || []).filter(r => r.id !== id)
    });
    if (selectedRecordId === id) setSelectedRecordId(null);
  };

  const handleSendInvite = async (record: AccessRecord) => {
    await sendInviteForRecord(record);
  };

  const handleAddTestimonial = () => {
    if (!newTestimonialQuote || !newTestimonialAuthor) return;
    const newT: Testimonial = {
      id: Date.now().toString(),
      quote: newTestimonialQuote,
      author: newTestimonialAuthor,
      rating: newTestimonialRating
    };
    onUpdate({
      ...config,
      testimonials: [...config.testimonials, newT]
    });
    setNewTestimonialQuote('');
    setNewTestimonialAuthor('');
    setNewTestimonialRating(5);
  };

  const handleUpdateTestimonial = (id: string, field: keyof Testimonial, value: string | number) => {
    const updated = config.testimonials.map(t => 
      t.id === id ? { ...t, [field]: value } : t
    );
    onUpdate({ ...config, testimonials: updated });
  };

  const handleDeleteTestimonial = (id: string) => {
    onUpdate({
      ...config,
      testimonials: config.testimonials.filter(t => t.id !== id)
    });
  };

  const processFiles = async (files: File[]) => {
    if (!selectedRecordId) return;
    setUploadError(null);

    const validFiles: File[] = [];
    const invalidFiles: string[] = [];

    files.forEach(file => {
      if (file.type === 'image/jpeg' || file.type === 'image/png' || file.type.startsWith('image/')) {
        validFiles.push(file);
      } else {
        invalidFiles.push(file.name);
      }
    });

    if (invalidFiles.length > 0) {
      setUploadError(`Skipped ${invalidFiles.length} invalid file(s). Only JPG/PNG images are allowed.`);
    }

    if (validFiles.length === 0) return;

    setIsUploading(true);
    setUploadProgress(0);

    for (let i = 0; i <= 100; i += 10) {
      setUploadProgress(i);
      await new Promise(resolve => setTimeout(resolve, 150)); 
    }

    const newPhotos: Photo[] = validFiles.map((file, index) => {
      const objectUrl = URL.createObjectURL(file);
      return {
        id: `uploaded_${Date.now()}_${index}_${Math.random().toString(36).substr(2, 9)}`,
        title: file.name,
        url: objectUrl,
        highResUrl: objectUrl 
      };
    });

    const updatedRecords = config.accessRecords.map(record => {
      if (record.id === selectedRecordId) {
        return {
          ...record,
          photos: [...(record.photos || []), ...newPhotos]
        };
      }
      return record;
    });

    onUpdate({
      ...config,
      accessRecords: updatedRecords
    });

    setIsUploading(false);
    setUploadProgress(0);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      processFiles(Array.from(e.target.files));
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processFiles(Array.from(e.dataTransfer.files));
    }
  };

  const handleDeletePhoto = (recordId: string, photoId: string) => {
    const updatedRecords = config.accessRecords.map(record => {
      if (record.id === recordId) {
        return {
          ...record,
          photos: record.photos.filter(p => p.id !== photoId)
        };
      }
      return record;
    });

    onUpdate({
      ...config,
      accessRecords: updatedRecords
    });
  };

  const selectedRecord = config.accessRecords.find(r => r.id === selectedRecordId);
  const analytics = config.analytics;

  return (
    <div className="fixed inset-0 z-50 bg-white text-slate-900 font-sans overflow-hidden flex">
      
      <div className="w-64 bg-[#0047BB] text-white flex flex-col flex-shrink-0">
        <div className="p-6 border-b border-blue-700 flex items-center gap-3">
          <div className="w-8 h-8 bg-white text-[#0047BB] rounded flex items-center justify-center font-bold">C.</div>
          <h1 className="font-bold text-lg tracking-wide">Admin</h1>
        </div>
        
        <nav className="flex-1 p-4 space-y-2">
          <button 
            onClick={() => setActiveTab('OVERVIEW')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${activeTab === 'OVERVIEW' ? 'bg-white text-[#0047BB] shadow-md' : 'text-blue-100 hover:bg-blue-700'}`}
          >
            <LayoutDashboard className="w-5 h-5" />
            Dashboard
          </button>
          <button 
             onClick={() => setActiveTab('ACCESS')}
             className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${activeTab === 'ACCESS' ? 'bg-white text-[#0047BB] shadow-md' : 'text-blue-100 hover:bg-blue-700'}`}
          >
            <Users className="w-5 h-5" />
            Access & Photos
          </button>
          <button 
             onClick={() => setActiveTab('SETTINGS')}
             className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${activeTab === 'SETTINGS' ? 'bg-white text-[#0047BB] shadow-md' : 'text-blue-100 hover:bg-blue-700'}`}
          >
            <ImageIcon className="w-5 h-5" />
            Site Content
          </button>
        </nav>

        <div className="p-4 border-t border-blue-700">
          <button onClick={onClose} className="flex items-center gap-2 text-blue-200 hover:text-white transition-colors w-full px-4 py-2">
            <LogOut className="w-4 h-4" />
            Exit Admin Mode
          </button>
        </div>
      </div>

      <div className="flex-1 flex flex-col overflow-hidden bg-white">
        <header className="bg-white border-b border-slate-200 h-16 flex items-center px-8 justify-between shrink-0">
          <h2 className="text-xl font-bold text-slate-800">
            {activeTab === 'OVERVIEW' && 'Dashboard Overview'}
            {activeTab === 'ACCESS' && 'Client Access & Photos'}
            {activeTab === 'SETTINGS' && 'Site Configuration'}
          </h2>
          <div className="text-sm text-slate-500">Logged in as Admin</div>
        </header>

        <main className="flex-1 overflow-auto p-8">
          {activeTab === 'OVERVIEW' && (
            <div className="space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                   <div className="flex items-center justify-between mb-4">
                     <h3 className="text-slate-500 text-sm font-semibold uppercase">Total Revenue</h3>
                     <div className="p-2 bg-green-100 text-green-600 rounded-lg"><DollarSign className="w-5 h-5" /></div>
                   </div>
                   <p className="text-3xl font-bold text-slate-900">£{analytics.purchases.reduce((acc, curr) => acc + curr.amount, 0)}</p>
                   <p className="text-sm text-green-600 mt-2 flex items-center">All time sales</p>
                </div>

                <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                   <div className="flex items-center justify-between mb-4">
                     <h3 className="text-slate-500 text-sm font-semibold uppercase">Abandoned Carts</h3>
                     <div className="p-2 bg-orange-100 text-orange-600 rounded-lg"><ShoppingCart className="w-5 h-5" /></div>
                   </div>
                   <p className="text-3xl font-bold text-slate-900">{analytics.abandonedCheckouts.length}</p>
                   <p className="text-sm text-slate-400 mt-2">Potential Revenue: £{analytics.abandonedCheckouts.reduce((acc, curr) => acc + curr.potentialValue, 0)}</p>
                </div>

                <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                   <div className="flex items-center justify-between mb-4">
                     <h3 className="text-slate-500 text-sm font-semibold uppercase">Recent Logins</h3>
                     <div className="p-2 bg-blue-100 text-[#0047BB] rounded-lg"><Clock className="w-5 h-5" /></div>
                   </div>
                   <p className="text-3xl font-bold text-slate-900">{analytics.logins.length}</p>
                   <p className="text-sm text-slate-400 mt-2">Active sessions logged</p>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
                  <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50">
                    <h3 className="font-bold text-slate-800">Recent Login Activity</h3>
                  </div>
                  <table className="w-full text-sm text-left">
                    <thead className="text-xs text-slate-500 bg-slate-50 uppercase">
                      <tr>
                        <th className="px-6 py-3">Email</th>
                        <th className="px-6 py-3">Code</th>
                        <th className="px-6 py-3">Duration</th>
                        <th className="px-6 py-3">Time</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {analytics.logins.map(log => (
                        <tr key={log.id} className="hover:bg-slate-50">
                          <td className="px-6 py-4 font-medium text-slate-900">{log.email}</td>
                          <td className="px-6 py-4 font-mono text-xs text-slate-500">{log.codeUsed}</td>
                          <td className="px-6 py-4 text-slate-600">{log.durationMinutes} mins</td>
                          <td className="px-6 py-4 text-slate-400 text-xs">{new Date(log.timestamp).toLocaleDateString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
                  <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
                    <h3 className="font-bold text-slate-800">Live Abandoned Carts</h3>
                    <span className="text-xs font-medium text-orange-600 bg-orange-100 px-2 py-1 rounded-full">High Priority</span>
                  </div>
                  <table className="w-full text-sm text-left">
                    <thead className="text-xs text-slate-500 bg-slate-50 uppercase">
                      <tr>
                        <th className="px-6 py-3">Email</th>
                        <th className="px-6 py-3">Stage</th>
                        <th className="px-6 py-3">Value</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {analytics.abandonedCheckouts.map(ab => (
                        <tr key={ab.id} className="hover:bg-slate-50">
                          <td className="px-6 py-4 font-medium text-slate-900">{ab.email}</td>
                          <td className="px-6 py-4">
                            <span className={`px-2 py-1 rounded text-xs font-medium ${ab.stage === 'Checkout' ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-800'}`}>
                              {ab.stage}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-slate-900 font-bold">£{ab.potentialValue}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'ACCESS' && (
             <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-full">
               <div className="lg:col-span-2 space-y-4 flex flex-col">
                 <div className="bg-white border border-slate-200 rounded-lg shadow-sm overflow-hidden flex-1">
                   <table className="w-full text-left text-sm">
                     <thead className="bg-slate-50 border-b border-slate-200">
                       <tr className="text-slate-500">
                       <th className="p-4 font-semibold">Code</th>
                       <th className="p-4 font-semibold">Email</th>
                        <th className="p-4 font-semibold">Address</th>
                       <th className="p-4 font-semibold">Photos</th>
                       <th className="p-4 font-semibold text-right">Actions</th>
                       </tr>
                     </thead>
                     <tbody className="divide-y divide-slate-100">
                       {(config.accessRecords || []).map(record => (
                         <tr 
                           key={record.id} 
                           className={`hover:bg-blue-50 cursor-pointer transition-colors ${selectedRecordId === record.id ? 'bg-blue-50' : 'bg-white'}`}
                           onClick={() => setSelectedRecordId(record.id)}
                         >
                          <td className="p-4 font-mono font-medium text-slate-900">{record.code}</td>
                          <td className="p-4 text-slate-600">{record.email}</td>
                          <td className="p-4 text-slate-600">{record.address}</td>
                          <td className="p-4">
                             <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${record.photos?.length > 0 ? 'bg-green-100 text-green-800' : 'bg-slate-100 text-slate-600'}`}>
                               {record.photos?.length || 0} items
                             </span>
                           </td>
                           <td className="p-4 text-right flex justify-end items-center gap-2">
                             <button 
                               onClick={(e) => { e.stopPropagation(); handleSendInvite(record); }}
                               className={`p-2 transition-colors rounded-full ${sendingEmailId === record.id ? 'bg-blue-100 text-[#0047BB]' : 'text-slate-400 hover:text-[#0047BB] hover:bg-blue-50'}`}
                               title="Send Invite Email"
                               disabled={sendingEmailId !== null}
                             >
                               {sendingEmailId === record.id ? <Clock className="w-4 h-4 animate-spin" /> : (
                                  emailStatus && sendingEmailId === null && selectedRecordId === record.id ? <CheckCircle className="w-4 h-4 text-green-500" /> : <Mail className="w-4 h-4" />
                               )}
                             </button>
                             <button 
                               onClick={(e) => { e.stopPropagation(); handleDeleteRecord(record.id); }}
                               className="text-slate-400 hover:text-red-600 p-2 transition-colors hover:bg-red-50 rounded-full"
                               title="Remove User"
                             >
                               <Trash2 className="w-4 h-4" />
                             </button>
                           </td>
                         </tr>
                       ))}
                     </tbody>
                   </table>
                 </div>

                 <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                   <h4 className="text-xs font-bold text-slate-400 uppercase mb-4">Add New Client Record</h4>
                   <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <Input
                          label="Access Code"
                          placeholder="e.g. HOUSE123"
                          value={newRecordCode}
                          onChange={e => setNewRecordCode(e.target.value)}
                      />
                      <Input
                          label="Email Address"
                          placeholder="client@example.com"
                          value={newRecordEmail}
                          onChange={e => setNewRecordEmail(e.target.value)}
                      />
                      <Input
                          label="Property Address"
                          placeholder="123 Example Street, City"
                          value={newRecordAddress}
                          onChange={e => setNewRecordAddress(e.target.value)}
                      />
                    </div>
                     <div className="flex items-center justify-between gap-3 flex-wrap">
                       <label className="flex items-center gap-2 text-sm text-slate-600">
                         <input
                           type="checkbox"
                           className="rounded border-slate-300 text-[#0047BB] focus:ring-[#0047BB]"
                           checked={sendEmailOnCreate}
                           onChange={(e) => setSendEmailOnCreate(e.target.checked)}
                         />
                         Send invite email after creating record
                       </label>
                       {emailStatus && (
                         <span className={`text-sm font-medium ${emailStatus.success ? 'text-green-600' : 'text-red-600'}`}>
                           {emailStatus.msg}
                         </span>
                       )}
                     </div>
                     <div className="flex justify-end">
                       <button
                         onClick={handleAddRecord}
                         className="bg-[#0047BB] text-white px-6 py-3 rounded-md hover:bg-blue-800 transition-colors flex items-center justify-center gap-2 font-medium whitespace-nowrap h-[50px] w-full md:w-auto"
                       >
                         <Plus className="w-4 h-4" /> Create Record
                       </button>
                     </div>
                   </div>
                 </div>
               </div>

               <div className="border border-slate-200 bg-white rounded-xl shadow-sm p-6 flex flex-col h-[calc(100vh-12rem)]">
                  {selectedRecord ? (
                    <>
                      <div className="mb-6 border-b border-slate-100 pb-4">
                        <h4 className="font-bold text-slate-900 text-xl mb-1">{selectedRecord.code}</h4>
                        <p className="text-sm text-slate-500 mb-1">{selectedRecord.email}</p>
                        <p className="text-sm text-slate-600 mb-2">{selectedRecord.address}</p>
                        
                        {selectedRecord.driveLink && (
                          <a href={selectedRecord.driveLink} target="_blank" rel="noreferrer" className="text-xs text-[#0047BB] hover:underline flex items-center gap-1">
                            Open Drive Folder <Upload className="w-3 h-3" />
                          </a>
                        )}
                      </div>

                      <div className="flex-grow overflow-y-auto mb-6 custom-scrollbar pr-2">
                        {selectedRecord.photos && selectedRecord.photos.length > 0 ? (
                          <div className="grid grid-cols-4 gap-2">
                            {selectedRecord.photos.map(photo => (
                              <div key={photo.id} className="relative aspect-square group rounded-lg overflow-hidden bg-slate-100">
                                <img src={photo.url} className="w-full h-full object-cover" alt="thumbnail" />
                                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                  <button 
                                    onClick={() => handleDeletePhoto(selectedRecord.id, photo.id)}
                                    className="bg-white/20 p-2 rounded-full backdrop-blur-sm text-white hover:bg-red-500 hover:text-white transition-colors"
                                  >
                                    <Trash2 className="w-3 h-3" />
                                  </button>
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="h-full flex flex-col items-center justify-center text-slate-400 space-y-4 text-center">
                            <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center">
                               <ImageIcon className="w-8 h-8 opacity-20" />
                            </div>
                            <p className="text-sm max-w-[200px]">No photos uploaded for this client yet.</p>
                          </div>
                        )}
                      </div>

                      <div className="relative">
                        {uploadError && (
                          <div className="mb-3 p-3 bg-red-50 text-red-700 text-xs rounded-lg flex items-start gap-2">
                            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                            <span>{uploadError}</span>
                            <button onClick={() => setUploadError(null)} className="ml-auto"><X className="w-3 h-3" /></button>
                          </div>
                        )}

                        {isUploading ? (
                          <div className="bg-slate-50 rounded-xl p-6 border border-slate-200 text-center">
                             <div className="w-full bg-slate-200 rounded-full h-2 mb-3">
                               <div 
                                 className="bg-[#0047BB] h-2 rounded-full transition-all duration-150 ease-out" 
                                 style={{ width: `${uploadProgress}%` }}
                               ></div>
                             </div>
                             <p className="text-xs text-slate-500 font-medium">Uploading... {uploadProgress}%</p>
                          </div>
                        ) : (
                          <div 
                            onDragOver={handleDragOver}
                            onDragLeave={handleDragLeave}
                            onDrop={handleDrop}
                            className={`
                              relative border-2 border-dashed rounded-xl p-6 transition-all duration-200 text-center
                              ${isDragging ? 'border-[#0047BB] bg-blue-50' : 'border-slate-200 hover:border-blue-400 hover:bg-slate-50'}
                            `}
                          >
                            <input 
                              type="file" 
                              ref={fileInputRef}
                              className="hidden"
                              multiple 
                              accept="image/png, image/jpeg"
                              onChange={handleFileInputChange}
                            />
                            <div className="pointer-events-none">
                              <Upload className={`w-8 h-8 mx-auto mb-2 ${isDragging ? 'text-[#0047BB]' : 'text-slate-400'}`} />
                              <h5 className="text-sm font-medium text-slate-700 mb-1">
                                {isDragging ? 'Drop files to upload' : 'Upload Photos'}
                              </h5>
                              <p className="text-xs text-slate-400 mb-4">
                                Drag & drop or select files.<br/>JPG, PNG allowed.
                              </p>
                            </div>
                            <Button 
                              onClick={() => fileInputRef.current?.click()}
                              variant="secondary"
                              className="w-full py-2 text-sm relative z-10"
                            >
                              Select Files
                            </Button>
                          </div>
                        )}
                      </div>
                    </>
                  ) : (
                    <div className="h-full flex flex-col items-center justify-center text-slate-400 p-8 text-center">
                      <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-4">
                         <Users className="w-8 h-8 opacity-20" />
                      </div>
                      <p className="text-sm">Select a client record from the list to manage their specific gallery photos.</p>
                    </div>
                  )}
               </div>
             </div>
          )}

          {activeTab === 'SETTINGS' && (
            <div className="max-w-4xl mx-auto space-y-8">
               <div className="bg-white p-8 rounded-xl border border-slate-200 shadow-sm">
                  <h3 className="text-lg font-bold text-slate-900 mb-6 pb-4 border-b border-slate-100">Authentication Screen</h3>
                  <div className="grid gap-6">
                    <Input
                      label="Headline"
                      value={config.copy.authHeadline}
                      onChange={(e) => handleChange('authHeadline', e.target.value)}
                    />
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Subtext</label>
                      <textarea
                        className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#0047BB] outline-none"
                        rows={3}
                        value={config.copy.authSubtext}
                        onChange={(e) => handleChange('authSubtext', e.target.value)}
                      />
                    </div>
                  </div>
               </div>

               <div className="bg-white p-8 rounded-xl border border-slate-200 shadow-sm">
                  <h3 className="text-lg font-bold text-slate-900 mb-6 pb-4 border-b border-slate-100">Gallery & Checkout</h3>
                  <div className="grid gap-6">
                    <Input
                      label="Gallery Main Headline"
                      value={config.copy.galleryHeadline}
                      onChange={(e) => handleChange('galleryHeadline', e.target.value)}
                    />
                     <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Gallery Subtext</label>
                      <textarea
                        className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#0047BB] outline-none"
                        rows={3}
                        value={config.copy.gallerySubtext}
                        onChange={(e) => handleChange('gallerySubtext', e.target.value)}
                      />
                    </div>
                    <Input
                      label="Sidebar Headline"
                      value={config.copy.galleryPanelHeadline}
                      onChange={(e) => handleChange('galleryPanelHeadline', e.target.value)}
                    />
                  </div>
               </div>

               <div className="bg-white p-8 rounded-xl border border-slate-200 shadow-sm">
                  <h3 className="text-lg font-bold text-slate-900 mb-6 pb-4 border-b border-slate-100">Testimonials</h3>
                  
                  <div className="space-y-6">
                    {config.testimonials.map(t => (
                      <div key={t.id} className="flex gap-4 items-start bg-slate-50 p-4 rounded-lg border border-slate-100">
                         <div className="flex-1 space-y-2">
                             <textarea 
                                value={t.quote}
                                onChange={(e) => handleUpdateTestimonial(t.id, 'quote', e.target.value)}
                                className="w-full p-2 border border-slate-300 rounded text-sm focus:ring-1 focus:ring-[#0047BB] outline-none"
                                placeholder="Quote"
                                rows={2}
                             />
                             <div className="flex flex-col md:flex-row md:items-center gap-2 md:gap-4">
                               <div className="flex items-center gap-2 flex-1">
                                 <span className="text-slate-400 text-xs uppercase font-bold">By</span>
                                 <input 
                                    value={t.author}
                                    onChange={(e) => handleUpdateTestimonial(t.id, 'author', e.target.value)}
                                    className="flex-1 p-2 border border-slate-300 rounded text-sm font-bold focus:ring-1 focus:ring-[#0047BB] outline-none"
                                    placeholder="Author"
                                 />
                               </div>
                               <div className="flex items-center gap-2">
                                 <span className="text-slate-400 text-xs uppercase font-bold">Rating</span>
                                 <select
                                   value={t.rating || 5}
                                   onChange={(e) => handleUpdateTestimonial(t.id, 'rating', parseInt(e.target.value))}
                                   className="p-2 border border-slate-300 rounded text-sm focus:ring-1 focus:ring-[#0047BB] outline-none bg-white"
                                 >
                                   {[1, 2, 3, 4, 5].map(r => <option key={r} value={r}>{r} Stars</option>)}
                                 </select>
                               </div>
                             </div>
                         </div>
                         <button onClick={() => handleDeleteTestimonial(t.id)} className="text-slate-400 hover:text-red-500 p-2 transition-colors" title="Delete Testimonial">
                             <Trash2 className="w-4 h-4" />
                         </button>
                      </div>
                    ))}

                    <div className="pt-6 border-t border-slate-100">
                       <h4 className="text-sm font-bold text-slate-700 mb-3 flex items-center gap-2">
                         <Star className="w-4 h-4 text-yellow-500" /> Add New Testimonial
                       </h4>
                       <div className="space-y-3">
                          <textarea 
                             value={newTestimonialQuote} 
                             onChange={e => setNewTestimonialQuote(e.target.value)}
                             placeholder="Enter client quote..."
                             className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#0047BB] outline-none"
                             rows={2}
                          />
                          <div className="flex flex-col md:flex-row gap-3">
                             <input 
                                value={newTestimonialAuthor}
                                onChange={e => setNewTestimonialAuthor(e.target.value)}
                                placeholder="Author Name (e.g. Homeowner in London)"
                                className="flex-1 px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#0047BB] outline-none"
                              />
                             <select
                               value={newTestimonialRating}
                               onChange={e => setNewTestimonialRating(parseInt(e.target.value))}
                               className="px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#0047BB] outline-none bg-white"
                             >
                               {[1, 2, 3, 4, 5].map(r => <option key={r} value={r}>{r} Stars</option>)}
                             </select>
                             <Button onClick={handleAddTestimonial} className="whitespace-nowrap h-10">
                                <Plus className="w-4 h-4 mr-2" /> Add
                             </Button>
                          </div>
                       </div>
                    </div>
                  </div>
               </div>
            </div>
          )}

        </main>
      </div>
    </div>
  );
};
