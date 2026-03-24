import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Bell, MapPin, CheckCircle2, Camera, User } from 'lucide-react';
import { settingsApi } from '../../api/settings.api';
import { profileApi } from '../../api/profile.api';
import { Spinner } from '../../components/ui/Spinner';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { useState, useRef } from 'react';
import { useAuthStore } from '../../store/auth.store';

function Toggle({
  checked,
  onChange,
  label,
  description,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label: string;
  description?: string;
}) {
  return (
    <div className="flex items-center justify-between gap-4 py-3">
      <div>
        <p className="text-sm font-medium text-gray-900">{label}</p>
        {description && <p className="text-xs text-gray-400 mt-0.5">{description}</p>}
      </div>
      <button
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={`relative inline-flex h-6 w-11 shrink-0 rounded-full transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:ring-offset-2 ${
          checked ? 'bg-blue-700' : 'bg-gray-200'
        }`}
      >
        <span
          className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform duration-200 mt-0.5 ${
            checked ? 'translate-x-5.5' : 'translate-x-0.5'
          }`}
        />
      </button>
    </div>
  );
}

export function SettingsPage() {
  const qc = useQueryClient();
  const { user } = useAuthStore();
  const [saved, setSaved] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [photoError, setPhotoError] = useState('');

  const { data: profile } = useQuery({
    queryKey: ['my-profile'],
    queryFn: profileApi.getMyProfile,
  });

  const updatePhotoMutation = useMutation({
    mutationFn: (file: File) => profileApi.updateProfilePhoto(file),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['my-profile'] });
      setPhotoError('');
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    },
    onError: () => setPhotoError('Failed to update photo. Try again.'),
  });

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { setPhotoError('Photo must be under 5 MB'); return; }
    updatePhotoMutation.mutate(file);
  };

  const { data: settings, isLoading } = useQuery({
    queryKey: ['settings'],
    queryFn: settingsApi.getSettings,
  });

  const notifMutation = useMutation({
    mutationFn: settingsApi.updateNotifications,
    onSuccess: (updated) => {
      qc.setQueryData(['settings'], updated);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    },
  });

  const locationMutation = useMutation({
    mutationFn: settingsApi.updateLocation,
    onSuccess: (updated) => {
      qc.setQueryData(['settings'], updated);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    },
  });

  if (isLoading || !settings) return <Spinner fullPage />;

  return (
    <div className="mx-auto max-w-2xl px-4 sm:px-6 lg:px-8 py-10">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
        {saved && (
          <span className="flex items-center gap-1.5 text-sm text-green-600 font-medium">
            <CheckCircle2 className="w-4 h-4" /> Saved
          </span>
        )}
      </div>

      {/* Profile photo */}
      <Card className="mb-6">
        <div className="flex items-center gap-2 mb-4">
          <User className="w-4 h-4 text-blue-700" />
          <h2 className="font-semibold text-gray-900">Profile Photo</h2>
        </div>
        <div className="flex items-center gap-5">
          {/* Avatar */}
          <div className="relative group shrink-0">
            {profile?.photoUrl ? (
              <img
                src={profile.photoUrl}
                alt="Profile"
                className="w-20 h-20 rounded-full object-cover border-4 border-white shadow-md"
              />
            ) : (
              <div className="w-20 h-20 rounded-full bg-gradient-to-br from-blue-600 to-blue-400 flex items-center justify-center text-white text-2xl font-bold">
                {user?.name?.charAt(0).toUpperCase() ?? 'U'}
              </div>
            )}
            {/* Hover overlay */}
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={updatePhotoMutation.isPending}
              className="absolute inset-0 rounded-full bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity disabled:cursor-wait"
              title="Change photo"
            >
              {updatePhotoMutation.isPending
                ? <div className="w-5 h-5 rounded-full border-2 border-white/40 border-t-white animate-spin" />
                : <Camera className="w-5 h-5 text-white" />
              }
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handlePhotoChange}
            />
          </div>

          {/* Text + tap button */}
          <div>
            <p className="text-sm font-medium text-gray-900">{user?.name}</p>
            <p className="text-xs text-gray-400 capitalize mb-2">{user?.role}</p>
            <Button
              size="sm"
              variant="outline"
              loading={updatePhotoMutation.isPending}
              onClick={() => fileInputRef.current?.click()}
            >
              <Camera className="w-3.5 h-3.5" />
              {profile?.photoUrl ? 'Change photo' : 'Add photo'}
            </Button>
            {photoError && <p className="text-xs text-red-500 mt-1">{photoError}</p>}
          </div>
        </div>
      </Card>

      {/* Notifications */}
      <Card className="mb-6">
        <div className="flex items-center gap-2 mb-4">
          <Bell className="w-4 h-4 text-blue-700" />
          <h2 className="font-semibold text-gray-900">Notifications</h2>
        </div>
        <div className="divide-y divide-gray-50">
          <Toggle
            label="Email notifications"
            description="Receive updates about jobs, bids, and messages by email"
            checked={settings.emailNotifications}
            onChange={(v) => notifMutation.mutate({ emailNotifications: v })}
          />
          <Toggle
            label="Push notifications"
            description="In-app real-time alerts for new activity"
            checked={settings.pushNotifications}
            onChange={(v) => notifMutation.mutate({ pushNotifications: v })}
          />
          <Toggle
            label="SMS notifications"
            description="Text message alerts for urgent updates"
            checked={settings.smsNotifications}
            onChange={(v) => notifMutation.mutate({ smsNotifications: v })}
          />
        </div>
      </Card>

      {/* Location */}
      <Card>
        <div className="flex items-center gap-2 mb-4">
          <MapPin className="w-4 h-4 text-blue-700" />
          <h2 className="font-semibold text-gray-900">Location Preferences</h2>
        </div>
        <Toggle
          label="Share my location"
          description="Allow others to see your approximate location for nearby matching"
          checked={settings.shareLocation}
          onChange={(v) => locationMutation.mutate({ shareLocation: v })}
        />
        <div className="mt-4 pt-4 border-t border-gray-50">
          <label className="text-sm font-medium text-gray-700 block mb-2">
            Search radius: <span className="text-blue-700">{settings.locationRadius} km</span>
          </label>
          <input
            type="range"
            min={1}
            max={500}
            value={settings.locationRadius}
            onChange={(e) =>
              qc.setQueryData(['settings'], { ...settings, locationRadius: +e.target.value })
            }
            onMouseUp={(e) =>
              locationMutation.mutate({ locationRadius: +(e.target as HTMLInputElement).value })
            }
            className="w-full accent-blue-700"
          />
          <div className="flex justify-between text-xs text-gray-400 mt-1">
            <span>1 km</span>
            <span>500 km</span>
          </div>
        </div>
      </Card>
    </div>
  );
}
