import { useParams, Link, useNavigate } from 'react-router-dom';
import { useQuery, useMutation } from '@tanstack/react-query';
import { MapPin, Star, DollarSign, CheckCircle, ArrowLeft, MessageSquare } from 'lucide-react';
import { profileApi } from '../../api/profile.api';
import { conversationsApi } from '../../api/conversations.api';
import { Spinner } from '../../components/ui/Spinner';
import { Badge } from '../../components/ui/Badge';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { useAuthStore } from '../../store/auth.store';
import type { User } from '../../types';

export function ProviderProfilePage() {
  const { userId } = useParams<{ userId: string }>();
  const navigate = useNavigate();
  const { user: me, isAuthenticated } = useAuthStore();

  const { data: profile, isLoading } = useQuery({
    queryKey: ['profile', userId],
    queryFn: () => profileApi.getProfileByUserId(userId!),
    enabled: !!userId,
  });

  const startConvMutation = useMutation({
    mutationFn: () => conversationsApi.startConversation({ recipientId: userId! }),
    onSuccess: () => navigate('/conversations'),
  });

  if (isLoading) return <Spinner fullPage />;
  if (!profile) return (
    <div className="text-center py-20">
      <p className="text-gray-500">Profile not found.</p>
    </div>
  );

  const user = profile.userId as User | undefined;

  // Show message button to any authenticated user who is NOT the profile owner
  const canMessage = isAuthenticated && me?.sub !== userId;

  return (
    <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 py-10">
      <Link
        to="/providers"
        className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-800 mb-6 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to providers
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
        {/* Sidebar */}
        <div className="space-y-4 lg:order-first">
          <Card className="text-center">
            {profile.photoUrl ? (
              <img
                src={profile.photoUrl}
                alt={user?.name}
                className="w-24 h-24 rounded-full object-cover mx-auto border-4 border-white shadow-md"
              />
            ) : (
              <div className="w-24 h-24 rounded-full bg-blue-700 flex items-center justify-center text-white text-3xl font-bold mx-auto">
                {(user?.name ?? 'P').charAt(0)}
              </div>
            )}
            <div className="mt-4">
              <div className="flex items-center justify-center gap-1.5">
                <h1 className="text-xl font-bold text-gray-900">{user?.name ?? 'Provider'}</h1>
                {profile.verified && <CheckCircle className="w-5 h-5 text-green-600" />}
              </div>
              {profile.title && <p className="text-gray-500 mt-1">{profile.title}</p>}
            </div>

            {profile.ratingCount > 0 ? (
              <Link
                to={`/reviews/${userId}`}
                className="flex items-center justify-center gap-1.5 mt-3 hover:opacity-80 transition-opacity"
              >
                <Star className="w-5 h-5 text-amber-400 fill-amber-400" />
                <span className="font-semibold text-gray-900">{profile.ratingAvg.toFixed(1)}</span>
                <span className="text-blue-700 text-sm underline">({profile.ratingCount} reviews)</span>
              </Link>
            ) : (
              <Link
                to={`/reviews/${userId}`}
                className="text-sm text-blue-700 hover:underline mt-3 block"
              >
                No reviews yet
              </Link>
            )}

            {profile.location && (
              <p className="text-sm text-gray-500 flex items-center justify-center gap-1 mt-2">
                <MapPin className="w-3.5 h-3.5" />
                {[profile.location.city, profile.location.country].filter(Boolean).join(', ')}
              </p>
            )}

            {profile.rate != null && (
              <p className="text-lg font-bold text-green-600 mt-2 flex items-center justify-center gap-1">
                <DollarSign className="w-5 h-5" />
                ₦{profile.rate}/hr
              </p>
            )}

            {/* ── Message button ── */}
            {canMessage && (
              <div className="mt-5 pt-4 border-t border-gray-100">
                <Button
                  fullWidth
                  loading={startConvMutation.isPending}
                  onClick={() => startConvMutation.mutate()}
                  className="gap-2"
                >
                  <MessageSquare className="w-4 h-4" />
                  Send a Message
                </Button>
              </div>
            )}

            {!isAuthenticated && (
              <div className="mt-5 pt-4 border-t border-gray-100">
                <Link to="/login">
                  <Button fullWidth variant="outline" className="gap-2">
                    <MessageSquare className="w-4 h-4" />
                    Log in to Message
                  </Button>
                </Link>
              </div>
            )}
          </Card>

          {profile.skills && profile.skills.length > 0 && (
            <Card>
              <h3 className="font-semibold text-gray-900 mb-3">Skills</h3>
              <div className="flex flex-wrap gap-2">
                {profile.skills.map((skill) => (
                  <Badge key={skill} variant="primary">{skill}</Badge>
                ))}
              </div>
            </Card>
          )}

          {profile.categories && profile.categories.length > 0 && (
            <Card>
              <h3 className="font-semibold text-gray-900 mb-3">Categories</h3>
              <div className="flex flex-wrap gap-2">
                {profile.categories.map((cat) => (
                  <Badge key={cat} variant="neutral">{cat}</Badge>
                ))}
              </div>
            </Card>
          )}
        </div>

        {/* Main */}
        <div className="lg:col-span-2 space-y-6">
          {profile.bio && (
            <Card>
              <h2 className="font-semibold text-gray-900 mb-3">About</h2>
              <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">{profile.bio}</p>
            </Card>
          )}

          {profile.portfolio && profile.portfolio.length > 0 && (
            <Card>
              <h2 className="font-semibold text-gray-900 mb-4">Portfolio</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {profile.portfolio.map((item, i) => (
                  <div key={i} className="rounded-xl border border-gray-100 overflow-hidden bg-gray-50">
                    {item.imageUrl && (
                      <img
                        src={item.imageUrl}
                        alt={item.title}
                        className="w-full h-36 object-cover"
                      />
                    )}
                    <div className="p-3">
                      <p className="font-medium text-gray-900">{item.title}</p>
                      {item.description && (
                        <p className="text-sm text-gray-500 mt-0.5 line-clamp-2">{item.description}</p>
                      )}
                      {item.link && /^https?:\/\//.test(item.link) && (
                        <a
                          href={item.link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-blue-700 hover:underline mt-1 block"
                        >
                          View project →
                        </a>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
