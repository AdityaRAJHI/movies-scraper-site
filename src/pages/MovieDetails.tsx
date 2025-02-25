import React from 'react';
import { useParams } from 'react-router-dom';
import { Star, Clock, Plus } from 'lucide-react';
import { supabase } from '../lib/supabase';
import https from 'https';

export default function MovieDetails() {
  const { id } = useParams();
  const [movie, setMovie] = React.useState<any>(null);
  const [loading, setLoading] = React.useState(true);
  const [userRating, setUserRating] = React.useState<number | null>(null);
  const [reviews, setReviews] = React.useState([]);
  const [reviewContent, setReviewContent] = React.useState('');
  const [user, setUser] = React.useState<any>(null);
  const [cast, setCast] = React.useState<any[]>([]);

  React.useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
    });

    loadMovieDetails();
  }, [id]);

  const loadMovieDetails = async () => {
    try {
      setLoading(true);
      // Load movie details
      const { data: movieData, error: movieError } = await supabase
        .from('movies')
        .select('*')
        .eq('id', id)
        .single();

      if (movieError) throw movieError;
      setMovie(movieData);

      // Load reviews
      const { data: reviewsData, error: reviewsError } = await supabase
        .from('reviews')
        .select(`
          *,
          users (username, avatar_url)
        `)
        .eq('movie_id', id)
        .order('created_at', { ascending: false });

      if (reviewsError) throw reviewsError;
      setReviews(reviewsData || []);

      // Load user's rating if logged in
      if (user) {
        const { data: ratingData } = await supabase
          .from('user_ratings')
          .select('rating')
          .eq('movie_id', id)
          .eq('user_id', user.id)
          .single();

        if (ratingData) {
          setUserRating(ratingData.rating);
        }
      }

      // Load cast information from external API
      const options = {
        method: 'GET',
        hostname: 'imdb236.p.rapidapi.com',
        port: null,
        path: `/imdb/${id}/cast`,
        headers: {
          'x-rapidapi-key': '1471f8e35bmsh3dc596592de5deap196e55jsn33adf6f2bfe3',
          'x-rapidapi-host': 'imdb236.p.rapidapi.com'
        }
      };

      const apiData = await new Promise((resolve, reject) => {
        const req = https.request(options, (res) => {
          const chunks: any[] = [];

          res.on('data', (chunk) => {
            chunks.push(chunk);
          });

          res.on('end', () => {
            const body = Buffer.concat(chunks);
            resolve(JSON.parse(body.toString()));
          });

          res.on('error', (error) => {
            reject(error);
          });
        });

        req.on('error', (error) => {
          reject(error);
        });

        req.end();
      });

      setCast(apiData || []);
    } catch (error) {
      console.error('Error loading movie details:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRating = async (rating: number) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('user_ratings')
        .upsert({
          user_id: user.id,
          movie_id: id,
          rating
        });

      if (error) throw error;
      setUserRating(rating);
      loadMovieDetails(); // Reload to update average rating
    } catch (error) {
      console.error('Error rating movie:', error);
    }
  };

  const handleAddToWatchlist = async () => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('watchlist')
        .insert({
          user_id: user.id,
          movie_id: id
        });

      if (error) throw error;
      // Show success message or update UI
    } catch (error) {
      console.error('Error adding to watchlist:', error);
    }
  };

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !reviewContent.trim()) return;

    try {
      const { error } = await supabase
        .from('reviews')
        .insert({
          user_id: user.id,
          movie_id: id,
          content: reviewContent.trim()
        });

      if (error) throw error;
      setReviewContent('');
      loadMovieDetails(); // Reload to show new review
    } catch (error) {
      console.error('Error submitting review:', error);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (!movie) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-bold text-gray-900">Movie not found</h2>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-white rounded-lg shadow-lg overflow-hidden">
        <div className="md:flex">
          <div className="md:w-1/3">
            <img
              src={movie.poster_url || 'https://images.unsplash.com/photo-1485846234645-a62644f84728'}
              alt={movie.title}
              className="w-full h-96 object-cover"
            />
          </div>
          <div className="md:w-2/3 p-6">
            <div className="flex justify-between items-start">
              <h1 className="text-3xl font-bold text-gray-900">{movie.title}</h1>
              {user && (
                <button
                  onClick={handleAddToWatchlist}
                  className="flex items-center space-x-1 text-indigo-600 hover:text-indigo-800"
                >
                  <Clock className="h-5 w-5" />
                  <span>Add to Watchlist</span>
                </button>
              )}
            </div>
            
            <p className="mt-4 text-gray-600">{movie.description}</p>
            
            <div className="mt-6">
              <div className="flex items-center space-x-2">
                <Star className="h-5 w-5 text-yellow-500" />
                <span className="text-lg font-semibold">{movie.rating.toFixed(1)}</span>
                <span className="text-gray-500">({movie.rating_count} ratings)</span>
              </div>
              
              {user && (
                <div className="mt-4">
                  <p className="text-sm text-gray-600 mb-2">Rate this movie:</p>
                  <div className="flex space-x-2">
                    {[1, 2, 3, 4, 5].map((rating) => (
                      <button
                        key={rating}
                        onClick={() => handleRating(rating)}
                        className={`p-2 rounded-full ${
                          userRating === rating
                            ? 'bg-yellow-500 text-white'
                            : 'bg-gray-100 hover:bg-gray-200'
                        }`}
                      >
                        <Star className="h-5 w-5" />
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="mt-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Cast</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {cast.map((actor) => (
            <div key={actor.id} className="bg-white rounded-lg shadow p-4">
              <h3 className="font-semibold text-gray-900">{actor.fullName}</h3>
              <p className="text-gray-600">as {actor.characters.join(', ')}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Reviews</h2>
        
        {user && (
          <form onSubmit={handleSubmitReview} className="mb-6">
            <textarea
              value={reviewContent}
              onChange={(e) => setReviewContent(e.target.value)}
              placeholder="Write your review..."
              className="w-full p-4 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              rows={4}
            />
            <button
              type="submit"
              className="mt-2 px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
            >
              Submit Review
            </button>
          </form>
        )}

        <div className="space-y-4">
          {reviews.map((review: any) => (
            <div key={review.id} className="bg-white rounded-lg shadow p-4">
              <div className="flex items-center space-x-2 mb-2">
                <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
                  {review.users?.username?.[0]?.toUpperCase() || 'U'}
                </div>
                <div>
                  <p className="font-semibold">{review.users?.username || 'Anonymous'}</p>
                  <p className="text-sm text-gray-500">
                    {new Date(review.created_at).toLocaleDateString()}
                  </p>
                </div>
              </div>
              <p className="text-gray-700">{review.content}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
