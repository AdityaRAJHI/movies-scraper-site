import React, { useState, useEffect } from 'react';

interface UpcomingMovie {
  id: string;
  title: string;
  image: string;
  url: string;
  year: number;
}

const UpcomingReleases = () => {
  const [upcomingMovies, setUpcomingMovies] = useState<UpcomingMovie[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchUpcomingReleases = async () => {
      setLoading(true);
      setError(null);

      const url = 'https://imdb236.p.rapidapi.com/imdb/upcoming-releases?countryCode=US&type=MOVIE';
      const options = {
        method: 'GET',
        headers: {
          'x-rapidapi-key': '1471f8e35bmsh3dc596592de5deap196e55jsn33adf6f2bfe3',
          'x-rapidapi-host': 'imdb236.p.rapidapi.com'
        }
      };

      try {
        const response = await fetch(url, options);

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();

        if (data && Array.isArray(data.results)) {
          setUpcomingMovies(data.results);
        } else {
          setError('Failed to parse upcoming releases data');
        }
      } catch (err: any) {
        setError('Error fetching upcoming releases: ' + err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchUpcomingReleases();
  }, []);

  if (loading) {
    return <p>Loading upcoming releases...</p>;
  }

  if (error) {
    return <p>Error: {error}</p>;
  }

  return (
    <div className="container mx-auto py-8">
      <h2 className="text-2xl font-bold mb-4">Upcoming Movie Releases</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {upcomingMovies.map((movie) => (
          <div key={movie.id} className="bg-white rounded-lg shadow-md overflow-hidden">
            <img src={movie.image} alt={movie.title} className="w-full h-48 object-cover" />
            <div className="p-4">
              <h3 className="text-lg font-semibold">{movie.title}</h3>
              <p className="text-gray-600">{movie.year}</p>
              <a href={movie.url} className="text-blue-500 hover:underline">
                View Details
              </a>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default UpcomingReleases;
