import React from 'react';
import { useNavigate } from 'react-router-dom';
import { User, Film, Clock } from 'lucide-react';
import { supabase } from '../lib/supabase';

export default function Profile() {
  const navigate = useNavigate();
  const [user, setUser] = React.useState<any>(null);
  const [profile, setProfile] = React.useState<any>(null);
  const [watchlist, setWatchlist] = React.useState([]);
  const [preferences, setPreferences] = React.useState<any>(null);
  const [loading, setLoading] = React.useState(true);
  const [username, setUsername] = React.useState('');
  const [selectedGenres, setSelectedGenres] = React.useState<string[]>([]);

  const genres = [
    'Action', 'Adventure', 'Animation', 'Comedy', 'Crime',
    'Documentary', 'Drama', 'Family', 'Fantasy', 'Horror',
    'Mystery', 'Romance', 'Sci-Fi', 'Thriller'
  ];

  React.useEffect(() => {
    loadUserData();
  }, []);

  const loadUserData = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate('/login');
        return;
      }

      setUser(session.user);

      // Load profile
      const { data: profileData } = await supabase
        .from('users')
        .select('*')
        .eq('id', session.user.id)
        .single();

      setProfile(profileData);
      if (profileData?.username) {
        setUsername(profileData.username);
      }

      // Load preferences
      const { data: preferencesData } = await supabase
        .from('user_preferences')
        .select('*')
        .eq('user_id', session.user.id)
        .single();

      setPreferences(preferencesData);
      if (preferencesData?.preferred_genres) {
        setSelectedGenres(preferencesData.preferred_genres);
      }

      // Load watchlist
      const { data: watchlistData } = await supabase
        .from('watchlist')
        .select(`
          *,
          movies (*)
        `)
        .eq('user_id', session.user.id);

      setWatchlist(watchlistData || []);
    } catch (error) {
      console.error('Error loading user data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    try {
      // Update profile
      const { error: profileError } = await supabase
        .from('users')
        .upsert({
          id: user.id,
          username,
          updated_at: new Date().toISOString()
        });

      if (profileError) throw profileError;

      // Update preferences
      const { error: preferencesError } = await supabase
        .from('user_preferences')
        .upsert({
          user_id: user.id,
          preferred_genres: selectedGenres,
          updated_at: new Date().toISOString()
        });

      if (preferencesError) throw preferencesError;

      loadUserData();
    } catch (error) {
      console.error('Error updating profile:', error);
    }
  };

  const handleRemoveFromWatchlist = async (movieId: string) => {
    try {
      const { error } = await supabase
        .from('watchlist')
        .delete()
        .eq('user_id', user.id)
        .eq('movie_id', movieId);

      if (error) throw error;
      loadUserData();
    } catch (error) {
      console.error('Error removing from watchlist:', error);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
        <div className="flex items-center space-x-4 mb-6">
          <div className="w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center">
            <User className="h-8 w-8 text-indigo-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Profile Settings</h1>
            <p className="text-gray-600">{user?.email}</p>
          </div>
        </div>

        <form onSubmit={handleUpdateProfile} className="space-y-6">
          <div>
            <label htmlFor="username" className="block text-sm font-medium text-gray-700">
              Username
            </label>
            <input
              type="text"
              id="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Preferred Genres
            </label>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
              {genres.map((genre) => (
                <label
                  key={genre}
                  className="flex items-center space-x-2 text-sm"
                >
                  <input
                    type="checkbox"
                    checked={selectedGenres.includes(genre)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedGenres([...selectedGenres, genre]);
                      } else {
                        setSelectedGenres(selectedGenres.filter((g) => g !== genre));
                      }
                    }}
                    className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                  />
                  <span>{genre}</span>
                </label>
              ))}
            </div>
          </div>

          <button
            type="submit"
            className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            Save Changes
          </button>
        </form>
      </div>

      <div className="bg-white rounded-lg shadow-lg p-6">
        <div className="flex items-center space-x-2 mb-6">
          <Clock className="h-6 w-6 text-indigo-600" />
          <h2 className="text-xl font-bold text-gray-900">Watchlist</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {watchlist.map((item: any) => (
            <div
              key={item.id}
              className="flex bg-gray-50 rounded-lg overflow-hidden"
            >
              <img
                src={item.movies?.poster_url || 'https://images.unsplash.com/photo-1485846234645-a62644f84728'}
                alt={item.movies?.title}
                className="w-24 h-32 object-cover"
              />
              <div className="flex-1 p-4">
                <h3 className="font-semibold text-gray-900">{item.movies?.title}</h3>
                <div className="flex items-center space-x-1 text-yellow-500 mt-1">
                  <span>★</span>
                  <span className="text-gray-600">{item.movies?.rating?.toFixed(1)}</span>
                </div>
                <button
                  onClick={() => handleRemoveFromWatchlist(item.movies?.id)}
                  className="mt-2 text-sm text-red-600 hover:text-red-800"
                >
                  Remove
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
