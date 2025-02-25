import React from 'react';
import { Link } from 'react-router-dom';
import { Search, Filter } from 'lucide-react';
import { supabase } from '../lib/supabase';
import https from 'https';
import UpcomingReleases from '../components/UpcomingReleases';

const MOVIE_CATEGORIES = [
  'Bollywood Movies',
  'Hollywood Hindi Movies',
  'South Indian Hindi Dubbed Movies',
  'Hollywood English Movies',
  'Punjabi Movies',
  'Tamil Movies',
  'Telugu Movies',
  'Bengali Movies',
  'Gujarati Movies',
  'Marathi Movies',
  'WWE Shows',
  'TV Series and Shows Hindi',
  'Kannada Movies',
  'Malayalam Movies',
  'Hindi Short Films',
  'Hollywood TV Shows And Series',
  'Hollywood Hindi Dubbed TV Series',
  'Hollywood Series Box Hindi',
  'Bhojpuri Movies',
  'Korean Movies'
];

export default function Home() {
  const [movies, setMovies] = React.useState([]);
  const [search, setSearch] = React.useState('');
  const [selectedCategory, setSelectedCategory] = React.useState('');
  const [loading, setLoading] = React.useState(true);
  const [showCategories, setShowCategories] = React.useState(false);
  const [noResults, setNoResults] = React.useState(false);

  React.useEffect(() => {
    loadMovies();
  }, [selectedCategory]);

  const loadMovies = async () => {
    try {
      let query = supabase
        .from('movies')
        .select('*')
        .order('rating', { ascending: false });

      if (selectedCategory) {
        query = query.eq('category', selectedCategory);
      }

      const { data, error } = await query.limit(20);

      if (error) throw error;
      setMovies(data || []);
    } catch (error) {
      console.error('Error loading movies:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setNoResults(false); // Reset noResults state

    try {
      // First, try searching the Supabase database
      let supabaseQuery = supabase
        .from('movies')
        .select('*')
        .ilike('title', `%${search}%`);

      if (selectedCategory) {
        supabaseQuery = supabaseQuery.eq('category', selectedCategory);
      }

      const { data: supabaseData, error: supabaseError } = await supabaseQuery.limit(20);

      if (supabaseData && supabaseData.length > 0) {
        // If Supabase returns results, use those
        setMovies(supabaseData);
        setNoResults(false);
      } else {
        // If Supabase returns no results, call the external API
        const url = `https://imdb236.p.rapidapi.com/imdb/find?q=${search}`;

        const apiData = await new Promise((resolve, reject) => {
          const xhr = new XMLHttpRequest();
          xhr.withCredentials = true;

          xhr.addEventListener('readystatechange', function () {
            if (this.readyState === this.DONE) {
              try {
                const parsedData = JSON.parse(this.responseText);
                resolve(parsedData);
              } catch (parseError) {
                console.error('Error parsing API response:', parseError);
                reject(parseError);
              }
            }
          });

          xhr.open('GET', url);
          xhr.setRequestHeader('x-rapidapi-key', '1471f8e35bmsh3dc596592de5deap196e55jsn33adf6f2bfe3');
          xhr.setRequestHeader('x-rapidapi-host', 'imdb236.p.rapidapi.com');

          xhr.onerror = () => {
            reject(new Error('Network error'));
          };

          xhr.send(null);
        });

        // Process the API data to match your movie structure
        const processedMovies = (apiData as any)?.titles?.map((item: any) => ({
          id: item.id,
          title: item.title,
          poster_url: item.image,
          description: item.runningTimeInMinutes,
          rating: item.rating,
          category: item.titleType,
        })) || [];

        if (processedMovies.length > 0) {
          setMovies(processedMovies);
          setNoResults(false);
        } else {
          setMovies([]);
          setNoResults(true); // Set noResults to true if API returns no results
        }
      }
    } catch (error) {
      console.error('Error searching movies:', error);
      setNoResults(true); // Also set noResults to true in case of an error
      setMovies([]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col items-center space-y-4">
        <h1 className="text-4xl font-bold text-gray-900">Discover Movies</h1>
        <div className="w-full max-w-4xl">
          <form onSubmit={handleSearch} className="flex gap-2">
            <div className="relative flex-1">
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search movies..."
                className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
              <button
                type="submit"
                className="absolute right-2 top-1/2 transform -translate-y-1/2"
              >
                <Search className="h-5 w-5 text-gray-400" />
              </button>
            </div>
            <button
              type="button"
              onClick={() => setShowCategories(!showCategories)}
              className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 flex items-center gap-2"
            >
              <Filter className="h-5 w-5" />
              Categories
            </button>
          </form>

          {showCategories && (
            <div className="mt-4 bg-white rounded-lg shadow-lg p-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                <button
                  onClick={() => {
                    setSelectedCategory('');
                    setShowCategories(false);
                  }}
                  className={`text-left px-3 py-2 rounded-md ${
                    !selectedCategory
                      ? 'bg-indigo-100 text-indigo-700'
                      : 'hover:bg-gray-100'
                  }`}
                >
                  All Categories
                </button>
                {MOVIE_CATEGORIES.map((category) => (
                  <button
                    key={category}
                    onClick={() => {
                      setSelectedCategory(category);
                      setShowCategories(false);
                    }}
                    className={`text-left px-3 py-2 rounded-md ${
                      selectedCategory === category
                        ? 'bg-indigo-100 text-indigo-700'
                        : 'hover:bg-gray-100'
                    }`}
                  >
                    {category}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {selectedCategory && (
        <div className="flex items-center justify-center">
          <div className="bg-indigo-100 text-indigo-700 px-4 py-2 rounded-full flex items-center gap-2">
            <span>{selectedCategory}</span>
            <button
              onClick={() => setSelectedCategory('')}
              className="hover:text-indigo-900"
            >
              ×
            </button>
          </div>
        </div>
      )}

      {loading ? (
        <div className="flex justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
        </div>
      ) : noResults ? (
        <div className="text-center text-gray-500">No movies found.</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {movies.map((movie: any) => (
            <Link
              key={movie.id}
              to={`/movie/${movie.id}`}
              className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow"
            >
              <img
                src={movie.poster_url || 'https://images.unsplash.com/photo-1485846234645-a62644f84728'}
                alt={movie.title}
                className="w-full h-48 object-cover"
              />
              <div className="p-4">
                <h2 className="text-lg font-semibold text-gray-900 mb-1">{movie.title}</h2>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <span className="text-yellow-500">★</span>
                    <span className="text-gray-600">{movie.rating?.toFixed(1)}</span>
                  </div>
                  {movie.category && (
                    <span className="text-sm text-gray-500">{movie.category}</span>
                  )}
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
      <UpcomingReleases />
    </div>
  );
}
