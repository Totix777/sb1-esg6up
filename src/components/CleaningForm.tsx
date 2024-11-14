import React, { useState, useRef } from 'react';
import { ClipboardList, Save, CheckCircle2, AlertCircle, Camera, Image as ImageIcon } from 'lucide-react';
import emailjs from '@emailjs/browser';
import type { CleaningTask } from '../types';

interface Props {
  roomNumber: string;
  onSave: (task: Omit<CleaningTask, 'id'>) => void;
  completedToday: boolean;
}

export default function CleaningForm({ roomNumber, onSave, completedToday: initialCompletedToday }: Props) {
  const [completedToday, setCompletedToday] = useState(initialCompletedToday);
  const [error, setError] = useState('');
  const [images, setImages] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [formData, setFormData] = useState<Omit<CleaningTask, 'id'>>({
    date: new Date().toISOString().split('T')[0],
    time: new Date().toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' }),
    roomNumber,
    visualCleaning: false,
    maintenanceCleaning: false,
    basicRoomCleaning: false,
    bedCleaning: false,
    windowsCurtainsCleaning: false,
    notes: '',
    staffName: '',
  });

  const getRoomLabel = (number: string) => {
    const specialRooms: Record<string, string> = {
      'G1': 'Gäste WC',
      'M1': 'Mitarbeiter WC',
      'B1': 'Behinderten WC',
      'P1': 'Pflegebad',
    };
    
    const suffix = number.slice(-2);
    return specialRooms[suffix] || `${number}`;
  };

  const sendEmailNotification = async (notes: string, roomNumber: string, images: string[]) => {
    try {
      const templateParams = {
        to_email: 'b.marconi@kv-vorderpfalz.drk.de',
        room_number: roomNumber,
        notes: notes,
        images: images.join('\n'),
        date: new Date().toLocaleString('de-DE'),
        service_id: 'service_drk',
        template_id: 'template_notes',
        user_id: 'your_public_key'
      };

      await emailjs.send(
        templateParams.service_id,
        templateParams.template_id,
        {
          to_email: templateParams.to_email,
          room_number: templateParams.room_number,
          notes: templateParams.notes,
          images: templateParams.images,
          date: templateParams.date
        },
        templateParams.user_id
      );
    } catch (error) {
      console.error('Failed to send email notification:', error);
    }
  };

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files) return;

    Array.from(files).forEach(file => {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImages(prev => [...prev, reader.result as string]);
      };
      reader.readAsDataURL(file);
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const hasSelectedCleaning = formData.visualCleaning ||
      formData.maintenanceCleaning ||
      formData.basicRoomCleaning ||
      formData.bedCleaning ||
      formData.windowsCurtainsCleaning;

    if (!hasSelectedCleaning) {
      setError('Bitte wählen Sie mindestens eine Reinigungsart aus');
      return;
    }

    setError('');
    
    // Send email notification if there are notes or images
    if (formData.notes.trim() || images.length > 0) {
      await sendEmailNotification(formData.notes, roomNumber, images);
    }

    onSave({ 
      ...formData,
      time: new Date().toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' })
    });
    
    setCompletedToday(true);
    setImages([]);
    
    setFormData(prev => ({
      ...prev,
      visualCleaning: false,
      maintenanceCleaning: false,
      basicRoomCleaning: false,
      bedCleaning: false,
      windowsCurtainsCleaning: false,
      notes: '',
    }));
  };

  const isSpecialRoom = roomNumber.match(/[GMBP]1$/);

  return (
    <form 
      onSubmit={handleSubmit} 
      className={`p-3 rounded-lg shadow-sm relative transition-colors ${
        completedToday || initialCompletedToday
          ? 'bg-green-50 border-2 border-green-200' 
          : 'bg-white'
      }`}
    >
      {(completedToday || initialCompletedToday) && (
        <div className="absolute -top-2 -right-2 bg-white rounded-full shadow-sm">
          <CheckCircle2 className="w-6 h-6 text-green-500" />
        </div>
      )}
      
      <div className="flex items-center justify-between gap-2 mb-2">
        <div className="flex items-center gap-1">
          <ClipboardList className={`w-5 h-5 ${completedToday || initialCompletedToday ? 'text-green-600' : ''}`} />
          <h3 className="text-lg font-semibold text-gray-800">{getRoomLabel(roomNumber)}</h3>
        </div>
        <input
          type="date"
          value={formData.date}
          onChange={e => setFormData(prev => ({ ...prev, date: e.target.value }))}
          className="text-sm rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          required
        />
      </div>

      <div className="space-y-1 text-sm mb-2">
        <label className="flex items-center">
          <input
            type="checkbox"
            checked={formData.visualCleaning}
            onChange={e => {
              setFormData(prev => ({ ...prev, visualCleaning: e.target.checked }));
              setError('');
            }}
            className="h-4 w-4 text-blue-600 rounded"
          />
          <span className="ml-2">Sichtreinigung</span>
        </label>

        <label className="flex items-center">
          <input
            type="checkbox"
            checked={formData.maintenanceCleaning}
            onChange={e => {
              setFormData(prev => ({ ...prev, maintenanceCleaning: e.target.checked }));
              setError('');
            }}
            className="h-4 w-4 text-blue-600 rounded"
          />
          <span className="ml-2">Unterhaltsreinigung</span>
        </label>

        {!isSpecialRoom && (
          <>
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={formData.basicRoomCleaning}
                onChange={e => {
                  setFormData(prev => ({ ...prev, basicRoomCleaning: e.target.checked }));
                  setError('');
                }}
                className="h-4 w-4 text-blue-600 rounded"
              />
              <span className="ml-2">Zimmer Grundreinigung</span>
            </label>

            <label className="flex items-center">
              <input
                type="checkbox"
                checked={formData.bedCleaning}
                onChange={e => {
                  setFormData(prev => ({ ...prev, bedCleaning: e.target.checked }));
                  setError('');
                }}
                className="h-4 w-4 text-blue-600 rounded"
              />
              <span className="ml-2">Bett Grundreinigung</span>
            </label>

            <label className="flex items-center">
              <input
                type="checkbox"
                checked={formData.windowsCurtainsCleaning}
                onChange={e => {
                  setFormData(prev => ({ ...prev, windowsCurtainsCleaning: e.target.checked }));
                  setError('');
                }}
                className="h-4 w-4 text-blue-600 rounded"
              />
              <span className="ml-2">Fenster und Gardinen</span>
            </label>
          </>
        )}
      </div>

      <div className="space-y-2 mb-2">
        <textarea
          value={formData.notes}
          onChange={e => setFormData(prev => ({ ...prev, notes: e.target.value }))}
          placeholder="Notizen"
          rows={2}
          className="w-full text-sm rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
        />

        <div className="flex items-center gap-2">
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleImageUpload}
            accept="image/*"
            multiple
            className="hidden"
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center gap-1 px-2 py-1 text-sm bg-gray-100 text-gray-700 rounded hover:bg-gray-200"
          >
            <Camera className="w-4 h-4" />
            Foto hinzufügen
          </button>
          {images.length > 0 && (
            <span className="text-sm text-gray-600 flex items-center gap-1">
              <ImageIcon className="w-4 h-4" />
              {images.length} Foto{images.length !== 1 ? 's' : ''}
            </span>
          )}
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-1 text-red-600 text-sm mb-2">
          <AlertCircle className="w-4 h-4" />
          <span>{error}</span>
        </div>
      )}

      <button
        type="submit"
        className={`w-full flex items-center justify-center gap-1 px-3 py-1.5 rounded-md text-sm ${
          completedToday || initialCompletedToday
            ? 'bg-green-600 hover:bg-green-700 text-white'
            : 'bg-blue-600 hover:bg-blue-700 text-white'
        }`}
      >
        <Save className="w-4 h-4" />
        {completedToday || initialCompletedToday ? 'Erneut reinigen' : 'Speichern'}
      </button>
    </form>
  );
}