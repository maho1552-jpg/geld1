import express from 'express';
import axios from 'axios';
import { authMiddleware } from '../middleware/auth';

const router = express.Router();

// iTunes Search API is now used for music search instead of Spotify
// No authentication required for iTunes API

// iTunes Search API ile müzik arama (öncelik)
async function searchiTunesMusic(query: string): Promise<any[]> {
  try {
    const response = await axios.get('https://itunes.apple.com/search', {
      params: {
        term: query,
        media: 'music',
        entity: 'song',
        limit: 8,
        country: 'TR'
      },
      timeout: 5000
    });

    const results = response.data.results;
    
    return results.map((track: any) => ({
      id: track.trackId,
      title: track.trackName,
      artist: track.artistName,
      album: track.collectionName,
      year: track.releaseDate ? new Date(track.releaseDate).getFullYear() : null,
      genre: track.primaryGenreName || 'Pop',
      duration: track.trackTimeMillis ? Math.floor(track.trackTimeMillis / 1000) : null,
      price: track.trackPrice,
      preview_url: track.previewUrl,
      itunes_url: track.trackViewUrl,
      image: track.artworkUrl100 ? track.artworkUrl100.replace('100x100', '300x300') : null,
      itunesId: track.trackId
    }));
  } catch (error) {
    console.error('iTunes Search API error:', error);
    return [];
  }
}

// TMDB genre mapping
const MOVIE_GENRES: { [key: number]: string } = {
  28: 'Aksiyon',
  12: 'Macera',
  16: 'Animasyon',
  35: 'Komedi',
  80: 'Suç',
  99: 'Belgesel',
  18: 'Drama',
  10751: 'Aile',
  14: 'Fantastik',
  36: 'Tarih',
  27: 'Korku',
  10402: 'Müzik',
  9648: 'Gizem',
  10749: 'Romantik',
  878: 'Bilim Kurgu',
  10770: 'TV Film',
  53: 'Gerilim',
  10752: 'Savaş',
  37: 'Vahşi Batı'
};

const TV_GENRES: { [key: number]: string } = {
  10759: 'Aksiyon & Macera',
  16: 'Animasyon',
  35: 'Komedi',
  80: 'Suç',
  99: 'Belgesel',
  18: 'Drama',
  10751: 'Aile',
  10762: 'Çocuk',
  9648: 'Gizem',
  10763: 'Haber',
  10764: 'Reality',
  10765: 'Bilim Kurgu & Fantastik',
  10766: 'Pembe Dizi',
  10767: 'Talk Show',
  10768: 'Savaş & Politika'
};

// TMDB API configuration
const TMDB_BASE_URL = 'https://api.themoviedb.org/3';
const TMDB_API_KEY = process.env.TMDB_API_KEY || 'demo_key';
const TMDB_IMAGE_BASE = 'https://image.tmdb.org/t/p/w500';

// TMDB API için film arama
router.get('/movies', authMiddleware, async (req, res) => {
  try {
    const { query } = req.query;
    const searchQuery = typeof query === 'string' ? query : '';
    
    if (!searchQuery || searchQuery.length < 2) {
      return res.json([]);
    }

    // TMDB API key yoksa mock data döndür
    if (TMDB_API_KEY === 'demo_key') {
      const mockResults = [
        {
          id: 1,
          title: `${searchQuery}`,
          year: 2023,
          director: 'Christopher Nolan',
          genre: ['Aksiyon', 'Sci-Fi'],
          poster: null,
          tmdbId: 12345,
          overview: `${searchQuery} hakkında örnek açıklama`
        }
      ];
      return res.json(mockResults);
    }

    // Gerçek TMDB API çağrısı
    const headers: any = {
      'Content-Type': 'application/json'
    };
    
    if (TMDB_API_KEY.startsWith('eyJ')) {
      headers['Authorization'] = `Bearer ${TMDB_API_KEY}`;
    }

    const response = await axios.get(`${TMDB_BASE_URL}/search/movie`, {
      params: TMDB_API_KEY.startsWith('eyJ') ? {
        query: searchQuery,
        language: 'tr-TR',
        page: 1
      } : {
        api_key: TMDB_API_KEY,
        query: searchQuery,
        language: 'tr-TR',
        page: 1
      },
      headers,
      timeout: 5000
    });

    const results = response.data.results.slice(0, 8).map((movie: any) => ({
      id: movie.id,
      title: movie.title,
      year: movie.release_date ? new Date(movie.release_date).getFullYear() : null,
      genre: movie.genre_ids ? movie.genre_ids.map((id: number) => MOVIE_GENRES[id]).filter(Boolean) : [],
      poster: movie.poster_path ? `${TMDB_IMAGE_BASE}${movie.poster_path}` : null,
      tmdbId: movie.id,
      overview: movie.overview
    }));

    res.json(results);
  } catch (error) {
    console.error('Movie search error:', error);
    res.json([]);
  }
});

// TMDB API için dizi arama
router.get('/tv-shows', authMiddleware, async (req, res) => {
  try {
    const { query } = req.query;
    const searchQuery = typeof query === 'string' ? query : '';
    
    if (!searchQuery || searchQuery.length < 2) {
      return res.json([]);
    }

    if (TMDB_API_KEY === 'demo_key') {
      const mockResults = [
        {
          id: 1,
          title: `${searchQuery} Dizisi`,
          year: 2023,
          seasons: 3,
          genre: ['Drama', 'Gerilim'],
          poster: null,
          tmdbId: 54321,
          overview: `${searchQuery} dizisi hakkında örnek açıklama`
        }
      ];
      return res.json(mockResults);
    }

    const headers: any = {
      'Content-Type': 'application/json'
    };
    
    if (TMDB_API_KEY.startsWith('eyJ')) {
      headers['Authorization'] = `Bearer ${TMDB_API_KEY}`;
    }

    const response = await axios.get(`${TMDB_BASE_URL}/search/tv`, {
      params: TMDB_API_KEY.startsWith('eyJ') ? {
        query: searchQuery,
        language: 'tr-TR',
        page: 1
      } : {
        api_key: TMDB_API_KEY,
        query: searchQuery,
        language: 'tr-TR',
        page: 1
      },
      headers,
      timeout: 5000
    });

    const results = response.data.results.slice(0, 8).map((show: any) => ({
      id: show.id,
      title: show.name,
      year: show.first_air_date ? new Date(show.first_air_date).getFullYear() : null,
      seasons: show.number_of_seasons,
      genre: show.genre_ids ? show.genre_ids.map((id: number) => TV_GENRES[id]).filter(Boolean) : [],
      poster: show.poster_path ? `${TMDB_IMAGE_BASE}${show.poster_path}` : null,
      tmdbId: show.id,
      overview: show.overview
    }));

    res.json(results);
  } catch (error) {
    console.error('TV show search error:', error);
    res.json([]);
  }
});

// Müzik arama - iTunes API ile (öncelik) ve Last.fm fallback
router.get('/music', authMiddleware, async (req, res) => {
  try {
    const { query } = req.query;
    const searchQuery = typeof query === 'string' ? query : '';
    
    if (!searchQuery || searchQuery.length < 2) {
      return res.json([]);
    }

    // Önce iTunes Search API'yi dene
    try {
      const itunesResults = await searchiTunesMusic(searchQuery);
      if (itunesResults.length > 0) {
        return res.json(itunesResults);
      }
    } catch (error) {
      console.error('iTunes API error:', error);
    }

    // iTunes başarısız olursa Last.fm'i dene
    const LASTFM_API_KEY = process.env.LASTFM_API_KEY;
    if (LASTFM_API_KEY && LASTFM_API_KEY !== 'demo_key') {
      try {
        console.log('Last.fm API ile müzik arama yapılıyor:', searchQuery);
        console.log('API Key:', LASTFM_API_KEY);
        
        const apiUrl = 'https://ws.audioscrobbler.com/2.0/';
        const params = {
          method: 'track.search',
          track: searchQuery,
          api_key: LASTFM_API_KEY,
          format: 'json',
          limit: 20
        };
        
        console.log('API URL:', apiUrl);
        console.log('API Params:', params);
        
        // Last.fm track.search API'sini kullan
        const response = await axios.get(apiUrl, {
          params,
          timeout: 10000
        });

        console.log('Last.fm API yanıtı:', response.data);

        if (response.data.results && response.data.results.trackmatches && response.data.results.trackmatches.track) {
          let tracks = response.data.results.trackmatches.track;
          
          // Eğer tek sonuç varsa array'e çevir
          if (!Array.isArray(tracks)) {
            tracks = [tracks];
          }

          const results = await Promise.all(tracks.slice(0, 8).map(async (track: any, index: number) => {
            let albumInfo = null;
            let albumCover = null;
            let albumYear = null;
            let genres: string[] = [];

            // Her şarkı için album bilgilerini al
            try {
              if (track.artist && track.name) {
                const albumResponse = await axios.get('https://ws.audioscrobbler.com/2.0/', {
                  params: {
                    method: 'track.getInfo',
                    api_key: LASTFM_API_KEY,
                    artist: track.artist,
                    track: track.name,
                    format: 'json'
                  },
                  timeout: 5000
                });

                if (albumResponse.data.track) {
                  const trackInfo = albumResponse.data.track;
                  albumInfo = trackInfo.album?.title || 'Bilinmeyen Album';
                  
                  // Album kapağını al
                  if (trackInfo.album && trackInfo.album.image) {
                    const images = trackInfo.album.image;
                    const largeImage = images.find((img: any) => img.size === 'large' || img.size === 'extralarge');
                    albumCover = largeImage ? largeImage['#text'] : null;
                  }

                  // Şarkı etiketlerini (genre) al
                  if (trackInfo.toptags && trackInfo.toptags.tag) {
                    let tags = trackInfo.toptags.tag;
                    if (!Array.isArray(tags)) tags = [tags];
                    genres = tags.slice(0, 3).map((tag: any) => tag.name);
                  }

                  // Album yılını almak için album.getInfo çağrısı yap
                  if (trackInfo.album?.title && trackInfo.album?.artist) {
                    try {
                      const albumDetailResponse = await axios.get('https://ws.audioscrobbler.com/2.0/', {
                        params: {
                          method: 'album.getInfo',
                          api_key: LASTFM_API_KEY,
                          artist: trackInfo.album.artist,
                          album: trackInfo.album.title,
                          format: 'json'
                        },
                        timeout: 3000
                      });

                      if (albumDetailResponse.data.album && albumDetailResponse.data.album.wiki) {
                        const published = albumDetailResponse.data.album.wiki.published;
                        if (published) {
                          const yearMatch = published.match(/\d{4}/);
                          if (yearMatch) {
                            albumYear = parseInt(yearMatch[0]);
                          }
                        }
                      }
                    } catch (albumError: any) {
                      console.log('Album detay bilgisi alınamadı:', albumError.message);
                    }
                  }
                }
              }
            } catch (trackInfoError: any) {
              console.log('Şarkı detay bilgisi alınamadı:', trackInfoError.message);
            }

            return {
              id: track.mbid || `lastfm_${index}`,
              title: track.name,
              artist: track.artist,
              album: albumInfo || 'Bilinmeyen Album',
              year: albumYear || null,
              genre: genres.length > 0 ? genres : ['Pop'],
              lastfmId: track.mbid || `lastfm_${index}`,
              cover: albumCover,
              popularity: track.listeners ? parseInt(track.listeners) : Math.floor(Math.random() * 100000),
              duration: Math.floor(Math.random() * 180) + 120, // Last.fm'de duration bilgisi genelde yok
              url: track.url
            };
          }));

          console.log(`Last.fm'den ${results.length} müzik sonucu bulundu`);
          return res.json(results);
        }
      } catch (lastfmError: any) {
        console.error('Last.fm API error:', {
          message: lastfmError.message,
          response: lastfmError.response?.data,
          status: lastfmError.response?.status,
          statusText: lastfmError.response?.statusText,
          url: lastfmError.config?.url,
          params: lastfmError.config?.params
        });
      }
    }

    // Last.fm API çalışmazsa, genişletilmiş mock database'e geri dön
    console.log('Last.fm API çalışmadı, genişletilmiş mock database kullanılıyor');

    // Kapsamlı müzik veritabanı (500+ şarkı)
    const musicDatabase = [
      // Türk Pop - Daha fazla şarkı
      { artist: 'Tarkan', title: 'Şımarık', album: 'Ölürüm Sana', genre: ['Pop', 'Türk Pop'], year: 1997 },
      { artist: 'Tarkan', title: 'Dudu', album: 'Tarkan', genre: ['Pop', 'Türk Pop'], year: 1999 },
      { artist: 'Tarkan', title: 'Kış Güneşi', album: 'Metamorfoz', genre: ['Pop', 'Türk Pop'], year: 2007 },
      { artist: 'Tarkan', title: 'Öp', album: 'Karma', genre: ['Pop', 'Türk Pop'], year: 2001 },
      { artist: 'Tarkan', title: 'Kuzu Kuzu', album: 'Karma', genre: ['Pop', 'Türk Pop'], year: 2001 },
      { artist: 'Tarkan', title: 'Arada Bir', album: 'Metamorfoz', genre: ['Pop', 'Türk Pop'], year: 2007 },
      { artist: 'Tarkan', title: 'Bounce', album: 'Come Closer', genre: ['Pop', 'Türk Pop'], year: 2006 },
      { artist: 'Tarkan', title: 'Kiss Kiss', album: 'Come Closer', genre: ['Pop', 'Türk Pop'], year: 2006 },
      
      { artist: 'Sezen Aksu', title: 'Gidiyorum', album: 'Gidiyorum', genre: ['Pop', 'Türk Pop'], year: 1996 },
      { artist: 'Sezen Aksu', title: 'Şarkı Söylemek Lazım', album: 'Şarkı Söylemek Lazım', genre: ['Pop', 'Türk Pop'], year: 1998 },
      { artist: 'Sezen Aksu', title: 'Hadi Bakalım', album: 'Düş Bahçeleri', genre: ['Pop', 'Türk Pop'], year: 2003 },
      { artist: 'Sezen Aksu', title: 'Vazgeçtim', album: 'Bahane', genre: ['Pop', 'Türk Pop'], year: 2017 },
      { artist: 'Sezen Aksu', title: 'Kaybolan Yıllar', album: 'Kaybolan Yıllar', genre: ['Pop', 'Türk Pop'], year: 1986 },
      
      { artist: 'Ajda Pekkan', title: 'Pet\'r Oil', album: 'Süperstar', genre: ['Pop', 'Türk Pop'], year: 1978 },
      { artist: 'Ajda Pekkan', title: 'Bambaşka Biri', album: 'Bambaşka Biri', genre: ['Pop', 'Türk Pop'], year: 1977 },
      { artist: 'Ajda Pekkan', title: 'O Benim Dünyam', album: 'O Benim Dünyam', genre: ['Pop', 'Türk Pop'], year: 1971 },
      
      { artist: 'Hadise', title: 'Düm Tek Tek', album: 'Fast Life', genre: ['Pop', 'Türk Pop'], year: 2009 },
      { artist: 'Hadise', title: 'Stir Me Up', album: 'Hadise', genre: ['Pop', 'Türk Pop'], year: 2005 },
      { artist: 'Hadise', title: 'My Man and the Devil on His Shoulder', album: 'Hadise', genre: ['Pop', 'Türk Pop'], year: 2005 },
      
      { artist: 'Kenan Doğulu', title: 'Çakkıdı', album: 'Çakkıdı', genre: ['Pop', 'Türk Pop'], year: 2006 },
      { artist: 'Kenan Doğulu', title: 'Shake It Up Şekerim', album: 'Kenan Doğulu 2000', genre: ['Pop', 'Türk Pop'], year: 2000 },
      { artist: 'Kenan Doğulu', title: 'Tencere Tava Havası', album: 'Kenan Doğulu 2000', genre: ['Pop', 'Türk Pop'], year: 2000 },
      
      { artist: 'Mustafa Sandal', title: 'Aya Benzer', album: 'Araba', genre: ['Pop', 'Türk Pop'], year: 2005 },
      { artist: 'Mustafa Sandal', title: 'İndir', album: 'Devamı Var', genre: ['Pop', 'Türk Pop'], year: 2007 },
      { artist: 'Mustafa Sandal', title: 'Jest Oldu', album: 'Akışına Bırak', genre: ['Pop', 'Türk Pop'], year: 2004 },
      
      { artist: 'Demet Akalın', title: 'Afedersin', album: 'Kusursuz 19', genre: ['Pop', 'Türk Pop'], year: 2006 },
      { artist: 'Demet Akalın', title: 'Çanta', album: 'Zirve', genre: ['Pop', 'Türk Pop'], year: 2009 },
      { artist: 'Demet Akalın', title: 'Mucize', album: 'Mucize', genre: ['Pop', 'Türk Pop'], year: 2013 },
      
      { artist: 'Hande Yener', title: 'Sen Yoluna Ben Yoluma', album: 'Sen Yoluna Ben Yoluma', genre: ['Pop', 'Türk Pop'], year: 2002 },
      { artist: 'Hande Yener', title: 'Acele Etme', album: 'Acele Etme', genre: ['Pop', 'Türk Pop'], year: 2004 },
      { artist: 'Hande Yener', title: 'Romeo', album: 'Apayrı', genre: ['Pop', 'Türk Pop'], year: 2006 },
      
      { artist: 'Gülben Ergen', title: 'Yaşamak Lazım', album: 'Yaşamak Lazım', genre: ['Pop', 'Türk Pop'], year: 1997 },
      { artist: 'Gülben Ergen', title: 'Seni Seviyorum', album: 'Seni Seviyorum', genre: ['Pop', 'Türk Pop'], year: 1999 },
      
      { artist: 'Ebru Gündeş', title: 'Rüya', album: 'Rüya', genre: ['Pop', 'Türk Pop'], year: 1999 },
      { artist: 'Ebru Gündeş', title: 'Çok Çok', album: 'Çok Çok', genre: ['Pop', 'Türk Pop'], year: 2001 },
      
      // Türk Rock & Anadolu Rock - Genişletilmiş
      { artist: 'Barış Manço', title: 'Dönence', album: 'Dönence', genre: ['Rock', 'Anadolu Rock'], year: 1981 },
      { artist: 'Barış Manço', title: 'Gülpembe', album: 'Sahibinden İhtiyaçtan', genre: ['Rock', 'Anadolu Rock'], year: 1985 },
      { artist: 'Barış Manço', title: 'Sarı Çizmeli Mehmet Ağa', album: 'Sarı Çizmeli Mehmet Ağa', genre: ['Rock', 'Anadolu Rock'], year: 1970 },
      { artist: 'Barış Manço', title: 'Kara Sevda', album: 'Kara Sevda', genre: ['Rock', 'Anadolu Rock'], year: 1972 },
      { artist: 'Barış Manço', title: 'Alla Beni Pulla Beni', album: 'Alla Beni Pulla Beni', genre: ['Rock', 'Anadolu Rock'], year: 1976 },
      
      { artist: 'Cem Karaca', title: 'Tamirci Çırağı', album: 'Safinaz', genre: ['Rock', 'Anadolu Rock'], year: 1978 },
      { artist: 'Cem Karaca', title: 'Resimdeki Gözyaşları', album: 'Safinaz', genre: ['Rock', 'Anadolu Rock'], year: 1978 },
      { artist: 'Cem Karaca', title: 'Deniz Üstü Köpürür', album: 'Deniz Üstü Köpürür', genre: ['Rock', 'Anadolu Rock'], year: 1975 },
      { artist: 'Cem Karaca', title: 'Emrah', album: 'Emrah', genre: ['Rock', 'Anadolu Rock'], year: 1977 },
      
      { artist: 'Erkin Koray', title: 'Cemalim', album: 'Elektronik Türküler', genre: ['Rock', 'Psychedelic'], year: 1974 },
      { artist: 'Erkin Koray', title: 'Şaşkın', album: 'Şaşkın', genre: ['Rock', 'Psychedelic'], year: 1973 },
      { artist: 'Erkin Koray', title: 'Fesuphanallah', album: 'Fesuphanallah', genre: ['Rock', 'Psychedelic'], year: 1973 },
      
      { artist: 'Moğollar', title: 'Haliç\'te Güneşin Batışı', album: 'Moğollar', genre: ['Rock', 'Anadolu Rock'], year: 1971 },
      { artist: 'Moğollar', title: 'Katip Arzuhalim', album: 'Katip Arzuhalim', genre: ['Rock', 'Anadolu Rock'], year: 1976 },
      
      { artist: 'Duman', title: 'Her Şeyi Yak', album: 'Her Şeyi Yak', genre: ['Rock', 'Alternative'], year: 2002 },
      { artist: 'Duman', title: 'Senden Daha Güzel', album: 'Senden Daha Güzel', genre: ['Rock', 'Alternative'], year: 2006 },
      { artist: 'Duman', title: 'Bu Akşam', album: 'Duman', genre: ['Rock', 'Alternative'], year: 1999 },
      { artist: 'Duman', title: 'Elleri Ellerime', album: 'Belki Alışman Lazım', genre: ['Rock', 'Alternative'], year: 2003 },
      
      { artist: 'maNga', title: 'Cevapsız Sorular', album: 'Şehr-i Hüzün', genre: ['Rock', 'Nu Metal'], year: 2004 },
      { artist: 'maNga', title: 'Bir Kadın Çizeceksin', album: 'Manga', genre: ['Rock', 'Nu Metal'], year: 2004 },
      { artist: 'maNga', title: 'We Could Be The Same', album: 'Şehr-i Hüzün', genre: ['Rock', 'Nu Metal'], year: 2010 },
      
      { artist: 'Teoman', title: 'İstanbul\'da Sonbahar', album: 'Teoman', genre: ['Rock', 'Alternative'], year: 1996 },
      { artist: 'Teoman', title: 'Paramparça', album: 'Paramparça', genre: ['Rock', 'Alternative'], year: 1998 },
      { artist: 'Teoman', title: 'Papatya', album: 'Papatya', genre: ['Rock', 'Alternative'], year: 2001 },
      
      { artist: 'Şebnem Ferah', title: 'Bu Aşk Fazla Sana', album: 'Artık Kısa Cümleler Kuruyorum', genre: ['Rock', 'Alternative'], year: 2000 },
      { artist: 'Şebnem Ferah', title: 'Sigara', album: 'Şebnem Ferah', genre: ['Rock', 'Alternative'], year: 1996 },
      { artist: 'Şebnem Ferah', title: 'Vazgeçtim Dünyadan', album: 'Vazgeçtim Dünyadan', genre: ['Rock', 'Alternative'], year: 2004 },
      
      { artist: 'Athena', title: 'Tam Zamanı Şimdi', album: 'Tam Zamanı Şimdi', genre: ['Rock', 'Ska'], year: 2004 },
      { artist: 'Athena', title: 'For Real', album: 'Holigan', genre: ['Rock', 'Ska'], year: 2002 },
      
      { artist: 'Mor ve Ötesi', title: 'Deli', album: 'Dünya Yalan Söylüyor', genre: ['Rock', 'Alternative'], year: 2004 },
      { artist: 'Mor ve Ötesi', title: 'Sevda Çiçeği', album: 'Gül Kendine', genre: ['Rock', 'Alternative'], year: 2013 },
      { artist: 'Mor ve Ötesi', title: 'Cambaz', album: 'Büyük Düşler', genre: ['Rock', 'Alternative'], year: 2006 },
      
      { artist: 'Gripin', title: 'Aşk Nereden Nereye', album: 'Gripin', genre: ['Rock', 'Pop'], year: 2004 },
      { artist: 'Gripin', title: 'Böyle Kahpedir Dünya', album: 'Böyle Kahpedir Dünya', genre: ['Rock', 'Pop'], year: 2006 },
      { artist: 'Gripin', title: 'Durma Yağmur Durma', album: 'Nasılım Biliyor musun?', genre: ['Rock', 'Pop'], year: 2009 },
      
      // Türk Rap & Hip Hop
      { artist: 'Ceza', title: 'Holocaust', album: 'Rapstar', genre: ['Hip Hop', 'Türk Rap'], year: 2004 },
      { artist: 'Ceza', title: 'Suspus', album: 'Suspus', genre: ['Hip Hop', 'Türk Rap'], year: 2002 },
      { artist: 'Ceza', title: 'Med Cezir', album: 'Med Cezir', genre: ['Hip Hop', 'Türk Rap'], year: 2006 },
      { artist: 'Ceza', title: 'Türk Marşı', album: 'Türk Marşı', genre: ['Hip Hop', 'Türk Rap'], year: 2008 },
      
      { artist: 'Sagopa Kajmer', title: 'Bir Pesimistin Gözyaşları', album: 'Bir Pesimistin Gözyaşları', genre: ['Hip Hop', 'Türk Rap'], year: 2002 },
      { artist: 'Sagopa Kajmer', title: 'Galiba', album: 'Galiba', genre: ['Hip Hop', 'Türk Rap'], year: 2005 },
      { artist: 'Sagopa Kajmer', title: 'Merhaba', album: 'Kağıt Kesikleri', genre: ['Hip Hop', 'Türk Rap'], year: 2003 },
      
      { artist: 'Ezhel', title: 'Geceler', album: 'Müptezhel', genre: ['Hip Hop', 'Türk Rap'], year: 2017 },
      { artist: 'Ezhel', title: 'Şehrimin Tadı', album: 'Müptezhel', genre: ['Hip Hop', 'Türk Rap'], year: 2017 },
      { artist: 'Ezhel', title: 'Felaket', album: 'Felaket', genre: ['Hip Hop', 'Türk Rap'], year: 2020 },
      
      { artist: 'Norm Ender', title: 'Kaktüs', album: 'Kaktüs', genre: ['Hip Hop', 'Türk Rap'], year: 2017 },
      { artist: 'Norm Ender', title: 'Mekanın Sahibi', album: 'Mekanın Sahibi', genre: ['Hip Hop', 'Türk Rap'], year: 2016 },
      
      // International Pop - Genişletilmiş
      { artist: 'Adele', title: 'Someone Like You', album: '21', genre: ['Pop', 'Soul'], year: 2011 },
      { artist: 'Adele', title: 'Rolling in the Deep', album: '21', genre: ['Pop', 'Soul'], year: 2010 },
      { artist: 'Adele', title: 'Hello', album: '25', genre: ['Pop', 'Soul'], year: 2015 },
      { artist: 'Adele', title: 'Set Fire to the Rain', album: '21', genre: ['Pop', 'Soul'], year: 2011 },
      { artist: 'Adele', title: 'Skyfall', album: 'Skyfall', genre: ['Pop', 'Soul'], year: 2012 },
      
      { artist: 'Ed Sheeran', title: 'Shape of You', album: '÷', genre: ['Pop'], year: 2017 },
      { artist: 'Ed Sheeran', title: 'Perfect', album: '÷', genre: ['Pop', 'Ballad'], year: 2017 },
      { artist: 'Ed Sheeran', title: 'Thinking Out Loud', album: 'x', genre: ['Pop', 'Ballad'], year: 2014 },
      { artist: 'Ed Sheeran', title: 'Photograph', album: 'x', genre: ['Pop', 'Ballad'], year: 2014 },
      { artist: 'Ed Sheeran', title: 'Castle on the Hill', album: '÷', genre: ['Pop'], year: 2017 },
      
      { artist: 'Taylor Swift', title: 'Shake It Off', album: '1989', genre: ['Pop'], year: 2014 },
      { artist: 'Taylor Swift', title: 'Anti-Hero', album: 'Midnights', genre: ['Pop'], year: 2022 },
      { artist: 'Taylor Swift', title: 'Blank Space', album: '1989', genre: ['Pop'], year: 2014 },
      { artist: 'Taylor Swift', title: 'Love Story', album: 'Fearless', genre: ['Country', 'Pop'], year: 2008 },
      { artist: 'Taylor Swift', title: 'Bad Blood', album: '1989', genre: ['Pop'], year: 2015 },
      
      { artist: 'Billie Eilish', title: 'Bad Guy', album: 'When We All Fall Asleep, Where Do We Go?', genre: ['Pop', 'Alternative'], year: 2019 },
      { artist: 'Billie Eilish', title: 'Happier Than Ever', album: 'Happier Than Ever', genre: ['Pop', 'Alternative'], year: 2021 },
      { artist: 'Billie Eilish', title: 'Ocean Eyes', album: 'Ocean Eyes', genre: ['Pop', 'Alternative'], year: 2016 },
      
      { artist: 'Dua Lipa', title: 'Levitating', album: 'Future Nostalgia', genre: ['Pop', 'Dance'], year: 2020 },
      { artist: 'Dua Lipa', title: 'Don\'t Start Now', album: 'Future Nostalgia', genre: ['Pop', 'Dance'], year: 2019 },
      { artist: 'Dua Lipa', title: 'New Rules', album: 'Dua Lipa', genre: ['Pop'], year: 2017 },
      
      { artist: 'The Weeknd', title: 'Blinding Lights', album: 'After Hours', genre: ['Pop', 'Synthwave'], year: 2019 },
      { artist: 'The Weeknd', title: 'Can\'t Feel My Face', album: 'Beauty Behind the Madness', genre: ['R&B', 'Pop'], year: 2015 },
      { artist: 'The Weeknd', title: 'Starboy', album: 'Starboy', genre: ['Pop', 'R&B'], year: 2016 },
      
      { artist: 'Ariana Grande', title: 'Thank U, Next', album: 'Thank U, Next', genre: ['Pop', 'R&B'], year: 2018 },
      { artist: 'Ariana Grande', title: '7 rings', album: 'Thank U, Next', genre: ['Pop', 'R&B'], year: 2019 },
      { artist: 'Ariana Grande', title: 'Problem', album: 'My Everything', genre: ['Pop', 'R&B'], year: 2014 },
      
      // Rock Classics - Genişletilmiş
      { artist: 'Queen', title: 'Bohemian Rhapsody', album: 'A Night at the Opera', genre: ['Rock', 'Progressive'], year: 1975 },
      { artist: 'Queen', title: 'We Will Rock You', album: 'News of the World', genre: ['Rock'], year: 1977 },
      { artist: 'Queen', title: 'We Are the Champions', album: 'News of the World', genre: ['Rock'], year: 1977 },
      { artist: 'Queen', title: 'Don\'t Stop Me Now', album: 'Jazz', genre: ['Rock'], year: 1978 },
      { artist: 'Queen', title: 'Another One Bites the Dust', album: 'The Game', genre: ['Rock', 'Funk'], year: 1980 },
      
      { artist: 'The Beatles', title: 'Hey Jude', album: 'Hey Jude', genre: ['Rock', 'Pop'], year: 1968 },
      { artist: 'The Beatles', title: 'Let It Be', album: 'Let It Be', genre: ['Rock', 'Pop'], year: 1970 },
      { artist: 'The Beatles', title: 'Yesterday', album: 'Help!', genre: ['Rock', 'Pop'], year: 1965 },
      { artist: 'The Beatles', title: 'Come Together', album: 'Abbey Road', genre: ['Rock'], year: 1969 },
      { artist: 'The Beatles', title: 'Here Comes the Sun', album: 'Abbey Road', genre: ['Rock', 'Pop'], year: 1969 },
      
      { artist: 'Led Zeppelin', title: 'Stairway to Heaven', album: 'Led Zeppelin IV', genre: ['Rock', 'Hard Rock'], year: 1971 },
      { artist: 'Led Zeppelin', title: 'Whole Lotta Love', album: 'Led Zeppelin II', genre: ['Rock', 'Hard Rock'], year: 1969 },
      { artist: 'Led Zeppelin', title: 'Kashmir', album: 'Physical Graffiti', genre: ['Rock', 'Hard Rock'], year: 1975 },
      
      { artist: 'Pink Floyd', title: 'Wish You Were Here', album: 'Wish You Were Here', genre: ['Rock', 'Progressive'], year: 1975 },
      { artist: 'Pink Floyd', title: 'Comfortably Numb', album: 'The Wall', genre: ['Rock', 'Progressive'], year: 1979 },
      { artist: 'Pink Floyd', title: 'Another Brick in the Wall', album: 'The Wall', genre: ['Rock', 'Progressive'], year: 1979 },
      
      { artist: 'AC/DC', title: 'Back in Black', album: 'Back in Black', genre: ['Rock', 'Hard Rock'], year: 1980 },
      { artist: 'AC/DC', title: 'Highway to Hell', album: 'Highway to Hell', genre: ['Rock', 'Hard Rock'], year: 1979 },
      { artist: 'AC/DC', title: 'Thunderstruck', album: 'The Razors Edge', genre: ['Rock', 'Hard Rock'], year: 1990 },
      
      { artist: 'Guns N\' Roses', title: 'Sweet Child O\' Mine', album: 'Appetite for Destruction', genre: ['Rock', 'Hard Rock'], year: 1987 },
      { artist: 'Guns N\' Roses', title: 'Welcome to the Jungle', album: 'Appetite for Destruction', genre: ['Rock', 'Hard Rock'], year: 1987 },
      { artist: 'Guns N\' Roses', title: 'November Rain', album: 'Use Your Illusion I', genre: ['Rock', 'Hard Rock'], year: 1991 },
      
      { artist: 'Nirvana', title: 'Smells Like Teen Spirit', album: 'Nevermind', genre: ['Rock', 'Grunge'], year: 1991 },
      { artist: 'Nirvana', title: 'Come As You Are', album: 'Nevermind', genre: ['Rock', 'Grunge'], year: 1991 },
      { artist: 'Nirvana', title: 'Lithium', album: 'Nevermind', genre: ['Rock', 'Grunge'], year: 1991 },
      
      { artist: 'Metallica', title: 'Enter Sandman', album: 'Metallica', genre: ['Metal', 'Heavy Metal'], year: 1991 },
      { artist: 'Metallica', title: 'Master of Puppets', album: 'Master of Puppets', genre: ['Metal', 'Thrash Metal'], year: 1986 },
      { artist: 'Metallica', title: 'One', album: '...And Justice for All', genre: ['Metal', 'Thrash Metal'], year: 1988 },
      
      { artist: 'Radiohead', title: 'Creep', album: 'Pablo Honey', genre: ['Rock', 'Alternative'], year: 1992 },
      { artist: 'Radiohead', title: 'Karma Police', album: 'OK Computer', genre: ['Rock', 'Alternative'], year: 1997 },
      { artist: 'Radiohead', title: 'Paranoid Android', album: 'OK Computer', genre: ['Rock', 'Alternative'], year: 1997 },
      
      { artist: 'Coldplay', title: 'Yellow', album: 'Parachutes', genre: ['Rock', 'Alternative'], year: 2000 },
      { artist: 'Coldplay', title: 'Fix You', album: 'X&Y', genre: ['Rock', 'Alternative'], year: 2005 },
      { artist: 'Coldplay', title: 'Viva La Vida', album: 'Viva la Vida or Death and All His Friends', genre: ['Rock', 'Alternative'], year: 2008 },
      
      // Hip Hop & Rap - Genişletilmiş
      { artist: 'Eminem', title: 'Lose Yourself', album: '8 Mile Soundtrack', genre: ['Hip Hop', 'Rap'], year: 2002 },
      { artist: 'Eminem', title: 'Stan', album: 'The Marshall Mathers LP', genre: ['Hip Hop', 'Rap'], year: 2000 },
      { artist: 'Eminem', title: 'Without Me', album: 'The Eminem Show', genre: ['Hip Hop', 'Rap'], year: 2002 },
      { artist: 'Eminem', title: 'Love The Way You Lie', album: 'Recovery', genre: ['Hip Hop', 'Rap'], year: 2010 },
      
      { artist: 'Drake', title: 'God\'s Plan', album: 'Scorpion', genre: ['Hip Hop', 'Rap'], year: 2018 },
      { artist: 'Drake', title: 'Hotline Bling', album: 'Views', genre: ['Hip Hop', 'R&B'], year: 2015 },
      { artist: 'Drake', title: 'In My Feelings', album: 'Scorpion', genre: ['Hip Hop', 'Rap'], year: 2018 },
      
      { artist: 'Kendrick Lamar', title: 'HUMBLE.', album: 'DAMN.', genre: ['Hip Hop', 'Rap'], year: 2017 },
      { artist: 'Kendrick Lamar', title: 'DNA.', album: 'DAMN.', genre: ['Hip Hop', 'Rap'], year: 2017 },
      { artist: 'Kendrick Lamar', title: 'Swimming Pools (Drank)', album: 'good kid, m.A.A.d city', genre: ['Hip Hop', 'Rap'], year: 2012 },
      
      { artist: 'Post Malone', title: 'Circles', album: 'Hollywood\'s Bleeding', genre: ['Hip Hop', 'Pop'], year: 2019 },
      { artist: 'Post Malone', title: 'Rockstar', album: 'Beerbongs & Bentleys', genre: ['Hip Hop', 'Rap'], year: 2017 },
      { artist: 'Post Malone', title: 'Sunflower', album: 'Spider-Man: Into the Spider-Verse', genre: ['Hip Hop', 'Pop'], year: 2018 },
      
      { artist: 'Travis Scott', title: 'SICKO MODE', album: 'ASTROWORLD', genre: ['Hip Hop', 'Trap'], year: 2018 },
      { artist: 'Travis Scott', title: 'Goosebumps', album: 'Birds in the Trap Sing McKnight', genre: ['Hip Hop', 'Trap'], year: 2016 },
      
      // Electronic & Dance - Genişletilmiş
      { artist: 'Daft Punk', title: 'Get Lucky', album: 'Random Access Memories', genre: ['Electronic', 'Funk'], year: 2013 },
      { artist: 'Daft Punk', title: 'One More Time', album: 'Discovery', genre: ['Electronic', 'House'], year: 2000 },
      { artist: 'Daft Punk', title: 'Harder Better Faster Stronger', album: 'Discovery', genre: ['Electronic', 'House'], year: 2001 },
      
      { artist: 'Calvin Harris', title: 'Feel So Close', album: '18 Months', genre: ['Electronic', 'Dance'], year: 2011 },
      { artist: 'Calvin Harris', title: 'We Found Love', album: 'Talk That Talk', genre: ['Electronic', 'Dance'], year: 2011 },
      { artist: 'Calvin Harris', title: 'Summer', album: 'Motion', genre: ['Electronic', 'Dance'], year: 2014 },
      
      { artist: 'David Guetta', title: 'Titanium', album: 'Nothing but the Beat', genre: ['Electronic', 'Dance'], year: 2011 },
      { artist: 'David Guetta', title: 'When Love Takes Over', album: 'One Love', genre: ['Electronic', 'Dance'], year: 2009 },
      { artist: 'David Guetta', title: 'Memories', album: 'One Love', genre: ['Electronic', 'Dance'], year: 2009 },
      
      { artist: 'Avicii', title: 'Wake Me Up', album: 'True', genre: ['Electronic', 'Dance'], year: 2013 },
      { artist: 'Avicii', title: 'Levels', album: 'Levels', genre: ['Electronic', 'Progressive House'], year: 2011 },
      { artist: 'Avicii', title: 'Hey Brother', album: 'True', genre: ['Electronic', 'Dance'], year: 2013 },
      
      { artist: 'Skrillex', title: 'Bangarang', album: 'Bangarang', genre: ['Electronic', 'Dubstep'], year: 2011 },
      { artist: 'Skrillex', title: 'Scary Monsters and Nice Sprites', album: 'Scary Monsters and Nice Sprites', genre: ['Electronic', 'Dubstep'], year: 2010 },
      
      // R&B & Soul - Genişletilmiş
      { artist: 'Beyoncé', title: 'Crazy in Love', album: 'Dangerously in Love', genre: ['R&B', 'Pop'], year: 2003 },
      { artist: 'Beyoncé', title: 'Single Ladies (Put a Ring on It)', album: 'I Am... Sasha Fierce', genre: ['R&B', 'Pop'], year: 2008 },
      { artist: 'Beyoncé', title: 'Halo', album: 'I Am... Sasha Fierce', genre: ['R&B', 'Pop'], year: 2008 },
      
      { artist: 'John Legend', title: 'All of Me', album: 'Love in the Future', genre: ['R&B', 'Soul'], year: 2013 },
      { artist: 'John Legend', title: 'Ordinary People', album: 'Get Lifted', genre: ['R&B', 'Soul'], year: 2004 },
      
      { artist: 'Alicia Keys', title: 'Fallin\'', album: 'Songs in A Minor', genre: ['R&B', 'Soul'], year: 2001 },
      { artist: 'Alicia Keys', title: 'No One', album: 'As I Am', genre: ['R&B', 'Soul'], year: 2007 },
      { artist: 'Alicia Keys', title: 'If I Ain\'t Got You', album: 'The Diary of Alicia Keys', genre: ['R&B', 'Soul'], year: 2003 },
      
      { artist: 'Bruno Mars', title: 'Uptown Funk', album: 'Uptown Special', genre: ['Funk', 'Pop'], year: 2014 },
      { artist: 'Bruno Mars', title: 'Just the Way You Are', album: 'Doo-Wops & Hooligans', genre: ['Pop', 'R&B'], year: 2010 },
      { artist: 'Bruno Mars', title: 'Grenade', album: 'Doo-Wops & Hooligans', genre: ['Pop', 'R&B'], year: 2010 },
      
      // Daha fazla popüler şarkılar
      { artist: 'Justin Bieber', title: 'Sorry', album: 'Purpose', genre: ['Pop'], year: 2015 },
      { artist: 'Justin Bieber', title: 'Baby', album: 'My World 2.0', genre: ['Pop'], year: 2010 },
      { artist: 'Justin Bieber', title: 'Love Yourself', album: 'Purpose', genre: ['Pop'], year: 2015 },
      
      { artist: 'Rihanna', title: 'Umbrella', album: 'Good Girl Gone Bad', genre: ['Pop', 'R&B'], year: 2007 },
      { artist: 'Rihanna', title: 'Diamonds', album: 'Unapologetic', genre: ['Pop', 'R&B'], year: 2012 },
      { artist: 'Rihanna', title: 'We Found Love', album: 'Talk That Talk', genre: ['Pop', 'Dance'], year: 2011 },
      
      { artist: 'Katy Perry', title: 'Roar', album: 'Prism', genre: ['Pop'], year: 2013 },
      { artist: 'Katy Perry', title: 'Firework', album: 'Teenage Dream', genre: ['Pop'], year: 2010 },
      { artist: 'Katy Perry', title: 'California Gurls', album: 'Teenage Dream', genre: ['Pop'], year: 2010 },
      
      { artist: 'Lady Gaga', title: 'Bad Romance', album: 'The Fame Monster', genre: ['Pop', 'Dance'], year: 2009 },
      { artist: 'Lady Gaga', title: 'Poker Face', album: 'The Fame', genre: ['Pop', 'Dance'], year: 2008 },
      { artist: 'Lady Gaga', title: 'Shallow', album: 'A Star Is Born', genre: ['Pop', 'Country'], year: 2018 },
      
      // Klasik şarkılar
      { artist: 'Michael Jackson', title: 'Billie Jean', album: 'Thriller', genre: ['Pop', 'R&B'], year: 1982 },
      { artist: 'Michael Jackson', title: 'Beat It', album: 'Thriller', genre: ['Pop', 'Rock'], year: 1982 },
      { artist: 'Michael Jackson', title: 'Smooth Criminal', album: 'Bad', genre: ['Pop', 'R&B'], year: 1987 },
      { artist: 'Michael Jackson', title: 'Black or White', album: 'Dangerous', genre: ['Pop', 'R&B'], year: 1991 },
      
      { artist: 'Whitney Houston', title: 'I Will Always Love You', album: 'The Bodyguard', genre: ['Pop', 'R&B'], year: 1992 },
      { artist: 'Whitney Houston', title: 'I Wanna Dance with Somebody', album: 'Whitney', genre: ['Pop', 'R&B'], year: 1987 },
      
      { artist: 'Madonna', title: 'Like a Virgin', album: 'Like a Virgin', genre: ['Pop'], year: 1984 },
      { artist: 'Madonna', title: 'Material Girl', album: 'Like a Virgin', genre: ['Pop'], year: 1984 },
      { artist: 'Madonna', title: 'Vogue', album: 'I\'m Breathless', genre: ['Pop', 'Dance'], year: 1990 },
      
      // Daha fazla Türk sanatçıları
      { artist: 'Sertab Erener', title: 'Everyway That I Can', album: 'No Boundaries', genre: ['Pop'], year: 2003 },
      { artist: 'Sertab Erener', title: 'Aşk', album: 'Lal', genre: ['Pop', 'Türk Pop'], year: 1999 },
      { artist: 'Sertab Erener', title: 'Rengarenk', album: 'Rengarenk', genre: ['Pop', 'Türk Pop'], year: 2010 },
      
      { artist: 'Nilüfer', title: 'Show Yapma', album: 'Show Yapma', genre: ['Pop', 'Türk Pop'], year: 1986 },
      { artist: 'Nilüfer', title: 'Yorgun', album: 'Yorgun', genre: ['Pop', 'Türk Pop'], year: 1985 },
      
      { artist: 'Model', title: 'Yalnızlık Ömür Boyu', album: 'Yalnızlık Ömür Boyu', genre: ['Rock', 'New Wave'], year: 1985 },
      { artist: 'Model', title: 'Makyaj', album: 'Makyaj', genre: ['Rock', 'New Wave'], year: 1987 },
      
      { artist: 'Mazhar ve Fuat', title: 'Adımız Miskindir Bizim', album: 'Türküz Türkü Çağırırız', genre: ['Rock', 'Folk'], year: 1983 },
      { artist: 'Mazhar ve Fuat', title: 'Işte Hendek İşte Deve', album: 'Türküz Türkü Çağırırız', genre: ['Rock', 'Folk'], year: 1983 },
      
      { artist: 'Pentagram', title: 'Gündüz Gece', album: 'Gündüz Gece', genre: ['Rock', 'Heavy Metal'], year: 1999 },
      { artist: 'Pentagram', title: 'Bir', album: 'Bir', genre: ['Rock', 'Heavy Metal'], year: 2002 },
      
      { artist: 'Replikas', title: 'Avare', album: 'Köledoyuran', genre: ['Rock', 'Alternative'], year: 2000 },
      { artist: 'Replikas', title: 'Sessizce', album: 'Dadaruhi', genre: ['Rock', 'Alternative'], year: 2004 },
      
      // Türk Arabesk & Özgün - Genişletilmiş
      { artist: 'İbrahim Tatlıses', title: 'Haydi Söyle', album: 'Haydi Söyle', genre: ['Arabesk', 'Türk Halk'], year: 1988 },
      { artist: 'İbrahim Tatlıses', title: 'Mutlu Ol Yeter', album: 'Mutlu Ol Yeter', genre: ['Arabesk', 'Türk Halk'], year: 1990 },
      { artist: 'İbrahim Tatlıses', title: 'Mavi Mavi', album: 'Mavi Mavi', genre: ['Arabesk', 'Türk Halk'], year: 1992 },
      
      { artist: 'Orhan Gencebay', title: 'Dil Yarası', album: 'Dil Yarası', genre: ['Arabesk', 'Türk Sanat'], year: 1971 },
      { artist: 'Orhan Gencebay', title: 'Batsın Bu Dünya', album: 'Batsın Bu Dünya', genre: ['Arabesk', 'Türk Sanat'], year: 1981 },
      { artist: 'Orhan Gencebay', title: 'Hatasız Kul Olmaz', album: 'Hatasız Kul Olmaz', genre: ['Arabesk', 'Türk Sanat'], year: 1977 },
      
      { artist: 'Müslüm Gürses', title: 'Hangimiz Sevmedik', album: 'Hangimiz Sevmedik', genre: ['Arabesk'], year: 1981 },
      { artist: 'Müslüm Gürses', title: 'İtirazım Var', album: 'İtirazım Var', genre: ['Arabesk'], year: 1986 },
      { artist: 'Müslüm Gürses', title: 'Affet', album: 'Affet', genre: ['Arabesk'], year: 1985 },
      
      { artist: 'Ferdi Tayfur', title: 'Emmoğlu', album: 'Emmoğlu', genre: ['Arabesk'], year: 1982 },
      { artist: 'Ferdi Tayfur', title: 'Huzurum Kalmadı', album: 'Huzurum Kalmadı', genre: ['Arabesk'], year: 1984 },
      { artist: 'Ferdi Tayfur', title: 'Ben de Özledim', album: 'Ben de Özledim', genre: ['Arabesk'], year: 1987 },
      
      { artist: 'Zeki Müren', title: 'Şimdi Uzaklardasın', album: 'Şimdi Uzaklardasın', genre: ['Türk Sanat'], year: 1965 },
      { artist: 'Zeki Müren', title: 'Elbet Bir Gün Buluşacağız', album: 'Elbet Bir Gün Buluşacağız', genre: ['Türk Sanat'], year: 1970 },
      { artist: 'Zeki Müren', title: 'Gitme Sana Muhtacım', album: 'Gitme Sana Muhtacım', genre: ['Türk Sanat'], year: 1968 },
      
      // Türk Rock & Anadolu Rock
      { artist: 'Barış Manço', title: 'Dönence', album: 'Dönence', genre: ['Rock', 'Anadolu Rock'], year: 1981 },
      { artist: 'Barış Manço', title: 'Gülpembe', album: 'Sahibinden İhtiyaçtan', genre: ['Rock', 'Anadolu Rock'], year: 1985 },
      { artist: 'Cem Karaca', title: 'Tamirci Çırağı', album: 'Safinaz', genre: ['Rock', 'Anadolu Rock'], year: 1978 },
      { artist: 'Erkin Koray', title: 'Cemalim', album: 'Elektronik Türküler', genre: ['Rock', 'Psychedelic'], year: 1974 },
      { artist: 'Moğollar', title: 'Haliç\'te Güneşin Batışı', album: 'Moğollar', genre: ['Rock', 'Anadolu Rock'], year: 1971 },
      { artist: 'Duman', title: 'Her Şeyi Yak', album: 'Her Şeyi Yak', genre: ['Rock', 'Alternative'], year: 2002 },
      { artist: 'maNga', title: 'Cevapsız Sorular', album: 'Şehr-i Hüzün', genre: ['Rock', 'Nu Metal'], year: 2004 },
      { artist: 'Teoman', title: 'İstanbul\'da Sonbahar', album: 'Teoman', genre: ['Rock', 'Alternative'], year: 1996 },
      { artist: 'Şebnem Ferah', title: 'Bu Aşk Fazla Sana', album: 'Artık Kısa Cümleler Kuruyorum', genre: ['Rock', 'Alternative'], year: 2000 },
      { artist: 'Athena', title: 'Tam Zamanı Şimdi', album: 'Tam Zamanı Şimdi', genre: ['Rock', 'Ska'], year: 2004 },
      
      // Türk Arabesk & Özgün
      { artist: 'İbrahim Tatlıses', title: 'Haydi Söyle', album: 'Haydi Söyle', genre: ['Arabesk', 'Türk Halk'], year: 1988 },
      { artist: 'Orhan Gencebay', title: 'Dil Yarası', album: 'Dil Yarası', genre: ['Arabesk', 'Türk Sanat'], year: 1971 },
      { artist: 'Müslüm Gürses', title: 'Hangimiz Sevmedik', album: 'Hangimiz Sevmedik', genre: ['Arabesk'], year: 1981 },
      { artist: 'Ferdi Tayfur', title: 'Emmoğlu', album: 'Emmoğlu', genre: ['Arabesk'], year: 1982 },
      { artist: 'Zeki Müren', title: 'Şimdi Uzaklardasın', album: 'Şimdi Uzaklardasın', genre: ['Türk Sanat'], year: 1965 },
      
      // International Pop
      { artist: 'Adele', title: 'Someone Like You', album: '21', genre: ['Pop', 'Soul'], year: 2011 },
      { artist: 'Adele', title: 'Rolling in the Deep', album: '21', genre: ['Pop', 'Soul'], year: 2010 },
      { artist: 'Ed Sheeran', title: 'Shape of You', album: '÷', genre: ['Pop'], year: 2017 },
      { artist: 'Ed Sheeran', title: 'Perfect', album: '÷', genre: ['Pop', 'Ballad'], year: 2017 },
      { artist: 'Taylor Swift', title: 'Shake It Off', album: '1989', genre: ['Pop'], year: 2014 },
      { artist: 'Taylor Swift', title: 'Anti-Hero', album: 'Midnights', genre: ['Pop'], year: 2022 },
      { artist: 'Billie Eilish', title: 'Bad Guy', album: 'When We All Fall Asleep, Where Do We Go?', genre: ['Pop', 'Alternative'], year: 2019 },
      { artist: 'Dua Lipa', title: 'Levitating', album: 'Future Nostalgia', genre: ['Pop', 'Dance'], year: 2020 },
      { artist: 'The Weeknd', title: 'Blinding Lights', album: 'After Hours', genre: ['Pop', 'Synthwave'], year: 2019 },
      { artist: 'Ariana Grande', title: 'Thank U, Next', album: 'Thank U, Next', genre: ['Pop', 'R&B'], year: 2018 },
      
      // Rock Classics
      { artist: 'Queen', title: 'Bohemian Rhapsody', album: 'A Night at the Opera', genre: ['Rock', 'Progressive'], year: 1975 },
      { artist: 'The Beatles', title: 'Hey Jude', album: 'Hey Jude', genre: ['Rock', 'Pop'], year: 1968 },
      { artist: 'Led Zeppelin', title: 'Stairway to Heaven', album: 'Led Zeppelin IV', genre: ['Rock', 'Hard Rock'], year: 1971 },
      { artist: 'Pink Floyd', title: 'Wish You Were Here', album: 'Wish You Were Here', genre: ['Rock', 'Progressive'], year: 1975 },
      { artist: 'AC/DC', title: 'Back in Black', album: 'Back in Black', genre: ['Rock', 'Hard Rock'], year: 1980 },
      { artist: 'Guns N\' Roses', title: 'Sweet Child O\' Mine', album: 'Appetite for Destruction', genre: ['Rock', 'Hard Rock'], year: 1987 },
      { artist: 'Nirvana', title: 'Smells Like Teen Spirit', album: 'Nevermind', genre: ['Rock', 'Grunge'], year: 1991 },
      { artist: 'Metallica', title: 'Enter Sandman', album: 'Metallica', genre: ['Metal', 'Heavy Metal'], year: 1991 },
      { artist: 'Radiohead', title: 'Creep', album: 'Pablo Honey', genre: ['Rock', 'Alternative'], year: 1992 },
      { artist: 'Coldplay', title: 'Yellow', album: 'Parachutes', genre: ['Rock', 'Alternative'], year: 2000 },
      
      // Hip Hop & Rap
      { artist: 'Eminem', title: 'Lose Yourself', album: '8 Mile Soundtrack', genre: ['Hip Hop', 'Rap'], year: 2002 },
      { artist: 'Drake', title: 'God\'s Plan', album: 'Scorpion', genre: ['Hip Hop', 'Rap'], year: 2018 },
      { artist: 'Kendrick Lamar', title: 'HUMBLE.', album: 'DAMN.', genre: ['Hip Hop', 'Rap'], year: 2017 },
      { artist: 'Post Malone', title: 'Circles', album: 'Hollywood\'s Bleeding', genre: ['Hip Hop', 'Pop'], year: 2019 },
      { artist: 'Travis Scott', title: 'SICKO MODE', album: 'ASTROWORLD', genre: ['Hip Hop', 'Trap'], year: 2018 },
      
      // Electronic & Dance
      { artist: 'Daft Punk', title: 'Get Lucky', album: 'Random Access Memories', genre: ['Electronic', 'Funk'], year: 2013 },
      { artist: 'Calvin Harris', title: 'Feel So Close', album: '18 Months', genre: ['Electronic', 'Dance'], year: 2011 },
      { artist: 'David Guetta', title: 'Titanium', album: 'Nothing but the Beat', genre: ['Electronic', 'Dance'], year: 2011 },
      { artist: 'Avicii', title: 'Wake Me Up', album: 'True', genre: ['Electronic', 'Dance'], year: 2013 },
      { artist: 'Skrillex', title: 'Bangarang', album: 'Bangarang', genre: ['Electronic', 'Dubstep'], year: 2011 },
      
      // R&B & Soul
      { artist: 'Beyoncé', title: 'Crazy in Love', album: 'Dangerously in Love', genre: ['R&B', 'Pop'], year: 2003 },
      { artist: 'John Legend', title: 'All of Me', album: 'Love in the Future', genre: ['R&B', 'Soul'], year: 2013 },
      { artist: 'Alicia Keys', title: 'Fallin\'', album: 'Songs in A Minor', genre: ['R&B', 'Soul'], year: 2001 },
      { artist: 'Bruno Mars', title: 'Uptown Funk', album: 'Uptown Special', genre: ['Funk', 'Pop'], year: 2014 },
      { artist: 'The Weeknd', title: 'Can\'t Feel My Face', album: 'Beauty Behind the Madness', genre: ['R&B', 'Pop'], year: 2015 },
      
      // Jazz & Blues
      { artist: 'Miles Davis', title: 'Kind of Blue', album: 'Kind of Blue', genre: ['Jazz'], year: 1959 },
      { artist: 'John Coltrane', title: 'A Love Supreme', album: 'A Love Supreme', genre: ['Jazz'], year: 1965 },
      { artist: 'B.B. King', title: 'The Thrill Is Gone', album: 'Completely Well', genre: ['Blues'], year: 1969 },
      { artist: 'Ella Fitzgerald', title: 'Summertime', album: 'Porgy and Bess', genre: ['Jazz', 'Vocal'], year: 1958 },
      { artist: 'Louis Armstrong', title: 'What a Wonderful World', album: 'What a Wonderful World', genre: ['Jazz'], year: 1967 },
      
      // Country
      { artist: 'Johnny Cash', title: 'Ring of Fire', album: 'Ring of Fire: The Best of Johnny Cash', genre: ['Country'], year: 1963 },
      { artist: 'Dolly Parton', title: 'Jolene', album: 'Jolene', genre: ['Country'], year: 1973 },
      { artist: 'Willie Nelson', title: 'On the Road Again', album: 'Honeysuckle Rose', genre: ['Country'], year: 1980 },
      { artist: 'Carrie Underwood', title: 'Before He Cheats', album: 'Some Hearts', genre: ['Country', 'Pop'], year: 2006 },
      { artist: 'Keith Urban', title: 'Blue Ain\'t Your Color', album: 'Ripcord', genre: ['Country'], year: 2016 },
      
      // Reggae
      { artist: 'Bob Marley', title: 'No Woman No Cry', album: 'Live!', genre: ['Reggae'], year: 1975 },
      { artist: 'Bob Marley', title: 'Three Little Birds', album: 'Exodus', genre: ['Reggae'], year: 1977 },
      { artist: 'Jimmy Buffett', title: 'Margaritaville', album: 'Changes in Latitudes, Changes in Attitudes', genre: ['Reggae', 'Country'], year: 1977 },
      
      // Latin
      { artist: 'Shakira', title: 'Hips Don\'t Lie', album: 'Oral Fixation, Vol. 2', genre: ['Latin', 'Pop'], year: 2006 },
      { artist: 'Ricky Martin', title: 'Livin\' la Vida Loca', album: 'Ricky Martin', genre: ['Latin', 'Pop'], year: 1999 },
      { artist: 'Jennifer Lopez', title: 'On the Floor', album: 'Love?', genre: ['Latin', 'Dance'], year: 2011 },
      { artist: 'Bad Bunny', title: 'Dakiti', album: 'El Último Tour Del Mundo', genre: ['Reggaeton', 'Latin'], year: 2020 },
      
      // Alternative & Indie
      { artist: 'Arctic Monkeys', title: 'Do I Wanna Know?', album: 'AM', genre: ['Alternative', 'Indie'], year: 2013 },
      { artist: 'The Strokes', title: 'Last Nite', album: 'Is This It', genre: ['Alternative', 'Indie'], year: 2001 },
      { artist: 'Vampire Weekend', title: 'A-Punk', album: 'Vampire Weekend', genre: ['Indie', 'Alternative'], year: 2008 },
      { artist: 'Tame Impala', title: 'The Less I Know the Better', album: 'Currents', genre: ['Psychedelic', 'Indie'], year: 2015 },
      { artist: 'Foster the People', title: 'Pumped Up Kicks', album: 'Torches', genre: ['Indie', 'Alternative'], year: 2010 },
      
      // Daha fazla Türk müziği
      { artist: 'Mor ve Ötesi', title: 'Deli', album: 'Dünya Yalan Söylüyor', genre: ['Rock', 'Alternative'], year: 2004 },
      { artist: 'Gripin', title: 'Aşk Nereden Nereye', album: 'Gripin', genre: ['Rock', 'Pop'], year: 2004 },
      { artist: 'Sertab Erener', title: 'Everyway That I Can', album: 'No Boundaries', genre: ['Pop'], year: 2003 },
      { artist: 'Nilüfer', title: 'Show Yapma', album: 'Show Yapma', genre: ['Pop', 'Türk Pop'], year: 1986 },
      { artist: 'Ceza', title: 'Holocaust', album: 'Rapstar', genre: ['Hip Hop', 'Türk Rap'], year: 2004 },
      { artist: 'Sagopa Kajmer', title: 'Bir Pesimistin Gözyaşları', album: 'Bir Pesimistin Gözyaşları', genre: ['Hip Hop', 'Türk Rap'], year: 2002 },
      { artist: 'Model', title: 'Yalnızlık Ömür Boyu', album: 'Yalnızlık Ömür Boyu', genre: ['Rock', 'New Wave'], year: 1985 },
      { artist: 'Mazhar ve Fuat', title: 'Adımız Miskindir Bizim', album: 'Türküz Türkü Çağırırız', genre: ['Rock', 'Folk'], year: 1983 },
      { artist: 'Pentagram', title: 'Gündüz Gece', album: 'Gündüz Gece', genre: ['Rock', 'Heavy Metal'], year: 1999 },
      { artist: 'Replikas', title: 'Avare', album: 'Köledoyuran', genre: ['Rock', 'Alternative'], year: 2000 },
      
      // Daha fazla Türk Pop & Arabesk
      { artist: 'Tarkan', title: 'Şımarık', album: 'Ölürüm Sana', genre: ['Pop', 'Türk Pop'], year: 1997 },
      { artist: 'Tarkan', title: 'Dudu', album: 'Karma', genre: ['Pop', 'Türk Pop'], year: 2001 },
      { artist: 'Tarkan', title: 'Kuzu Kuzu', album: 'Aacayipsin', genre: ['Pop', 'Türk Pop'], year: 1994 },
      { artist: 'Ajda Pekkan', title: 'Pet\'r Oil', album: 'Süperstar', genre: ['Pop', 'Türk Pop'], year: 1980 },
      { artist: 'Ajda Pekkan', title: 'Bambaşka Biri', album: 'Bambaşka Biri', genre: ['Pop', 'Türk Pop'], year: 1977 },
      { artist: 'Sezen Aksu', title: 'Gidiyorum', album: 'Gidiyorum', genre: ['Pop', 'Türk Pop'], year: 1996 },
      { artist: 'Sezen Aksu', title: 'Şarkı Söylemek Lazım', album: 'Şarkı Söylemek Lazım', genre: ['Pop', 'Türk Pop'], year: 1999 },
      { artist: 'Kenan Doğulu', title: 'Çakkıdı', album: 'Çakkıdı', genre: ['Pop', 'Türk Pop'], year: 2003 },
      { artist: 'Mustafa Sandal', title: 'Aya Benzer', album: 'Araba', genre: ['Pop', 'Türk Pop'], year: 2000 },
      { artist: 'Hadise', title: 'Düm Tek Tek', album: 'Fast Life', genre: ['Pop', 'Türk Pop'], year: 2009 },
      { artist: 'Demet Akalın', title: 'Afedersin', album: 'Banane', genre: ['Pop', 'Türk Pop'], year: 2004 },
      { artist: 'Hande Yener', title: 'Acele Etme', album: 'Acele Etme', genre: ['Pop', 'Türk Pop'], year: 2004 },
      { artist: 'Gülben Ergen', title: 'Yaşamak İstiyorum', album: 'Yaşamak İstiyorum', genre: ['Pop', 'Türk Pop'], year: 2000 },
      { artist: 'Ebru Gündeş', title: 'Rüya', album: 'Rüya', genre: ['Pop', 'Türk Pop'], year: 1999 },
      { artist: 'Sibel Can', title: 'Galata', album: 'Galata', genre: ['Pop', 'Türk Pop'], year: 1999 },
      
      // Daha fazla Türk Rock
      { artist: 'Kurban', title: 'Yalnızlık', album: 'Kurban', genre: ['Rock', 'Alternative'], year: 2005 },
      { artist: 'Kargo', title: 'Sevda Sözleri', album: 'Sevda Sözleri', genre: ['Rock', 'Alternative'], year: 2003 },
      { artist: 'Vega', title: 'Elimde Değil', album: 'Elimde Değil', genre: ['Rock', 'Alternative'], year: 2004 },
      { artist: 'Şebnem Ferah', title: 'Sil Baştan', album: 'Sil Baştan', genre: ['Rock', 'Alternative'], year: 2007 },
      { artist: 'Hayko Cepkin', title: 'Fırtına', album: 'Sakin Olmaya Çalışıyorum', genre: ['Rock', 'Alternative'], year: 2002 },
      { artist: 'Emre Aydın', title: 'Afili Yalnızlık', album: 'Kağıt Evler', genre: ['Rock', 'Alternative'], year: 2006 },
      { artist: 'Yüksek Sadakat', title: 'Belki Üstümüzden Bir Kuş Geçer', album: 'Yüksek Sadakat', genre: ['Rock', 'Alternative'], year: 2005 },
      { artist: 'Pinhani', title: 'Hele Bi Gel', album: 'Pinhani', genre: ['Rock', 'Folk'], year: 2004 },
      { artist: 'Manga', title: 'Bir Kadın Çizeceksin', album: 'Manga+', genre: ['Rock', 'Nu Metal'], year: 2005 },
      { artist: 'Duman', title: 'Senden Daha Güzel', album: 'Senden Daha Güzel', genre: ['Rock', 'Alternative'], year: 2006 },
      
      // Daha fazla International Pop
      { artist: 'Justin Bieber', title: 'Sorry', album: 'Purpose', genre: ['Pop'], year: 2015 },
      { artist: 'Justin Bieber', title: 'Love Yourself', album: 'Purpose', genre: ['Pop'], year: 2015 },
      { artist: 'Rihanna', title: 'Umbrella', album: 'Good Girl Gone Bad', genre: ['Pop', 'R&B'], year: 2007 },
      { artist: 'Rihanna', title: 'Diamonds', album: 'Unapologetic', genre: ['Pop', 'R&B'], year: 2012 },
      { artist: 'Katy Perry', title: 'Roar', album: 'Prism', genre: ['Pop'], year: 2013 },
      { artist: 'Katy Perry', title: 'Firework', album: 'Teenage Dream', genre: ['Pop'], year: 2010 },
      { artist: 'Lady Gaga', title: 'Bad Romance', album: 'The Fame Monster', genre: ['Pop', 'Dance'], year: 2009 },
      { artist: 'Lady Gaga', title: 'Shallow', album: 'A Star Is Born Soundtrack', genre: ['Pop', 'Country'], year: 2018 },
      { artist: 'Bruno Mars', title: '24K Magic', album: '24K Magic', genre: ['Funk', 'Pop'], year: 2016 },
      { artist: 'Bruno Mars', title: 'Count on Me', album: 'Doo-Wops & Hooligans', genre: ['Pop', 'Folk'], year: 2010 },
      { artist: 'Maroon 5', title: 'Sugar', album: 'V', genre: ['Pop', 'Rock'], year: 2014 },
      { artist: 'Maroon 5', title: 'Payphone', album: 'Overexposed', genre: ['Pop', 'Rock'], year: 2012 },
      { artist: 'OneRepublic', title: 'Counting Stars', album: 'Native', genre: ['Pop', 'Rock'], year: 2013 },
      { artist: 'Imagine Dragons', title: 'Radioactive', album: 'Night Visions', genre: ['Rock', 'Alternative'], year: 2012 },
      { artist: 'Imagine Dragons', title: 'Believer', album: 'Evolve', genre: ['Rock', 'Alternative'], year: 2017 },
      
      // Daha fazla Hip Hop & Rap
      { artist: 'Kanye West', title: 'Stronger', album: 'Graduation', genre: ['Hip Hop', 'Rap'], year: 2007 },
      { artist: 'Jay-Z', title: 'Empire State of Mind', album: 'The Blueprint 3', genre: ['Hip Hop', 'Rap'], year: 2009 },
      { artist: '50 Cent', title: 'In Da Club', album: 'Get Rich or Die Tryin\'', genre: ['Hip Hop', 'Rap'], year: 2003 },
      { artist: 'Snoop Dogg', title: 'Drop It Like It\'s Hot', album: 'R&G (Rhythm & Gangsta)', genre: ['Hip Hop', 'Rap'], year: 2004 },
      { artist: 'Lil Wayne', title: 'Lollipop', album: 'Tha Carter III', genre: ['Hip Hop', 'Rap'], year: 2008 },
      { artist: 'Nicki Minaj', title: 'Super Bass', album: 'Pink Friday', genre: ['Hip Hop', 'Rap'], year: 2011 },
      { artist: 'Cardi B', title: 'Bodak Yellow', album: 'Invasion of Privacy', genre: ['Hip Hop', 'Rap'], year: 2017 },
      { artist: 'Migos', title: 'Bad and Boujee', album: 'Culture', genre: ['Hip Hop', 'Trap'], year: 2016 },
      { artist: 'Future', title: 'Mask Off', album: 'Future', genre: ['Hip Hop', 'Trap'], year: 2017 },
      { artist: 'Lil Baby', title: 'Drip Too Hard', album: 'Drip Harder', genre: ['Hip Hop', 'Trap'], year: 2018 },
      
      // Daha fazla Electronic & Dance
      { artist: 'Deadmau5', title: 'Ghosts \'n\' Stuff', album: 'For Lack of a Better Name', genre: ['Electronic', 'Progressive House'], year: 2009 },
      { artist: 'Swedish House Mafia', title: 'Don\'t You Worry Child', album: 'Until Now', genre: ['Electronic', 'Progressive House'], year: 2012 },
      { artist: 'Tiësto', title: 'Red Lights', album: 'A Town Called Paradise', genre: ['Electronic', 'Progressive House'], year: 2014 },
      { artist: 'Martin Garrix', title: 'Animals', album: 'Animals', genre: ['Electronic', 'Big Room'], year: 2013 },
      { artist: 'Zedd', title: 'Clarity', album: 'Clarity', genre: ['Electronic', 'Progressive House'], year: 2012 },
      { artist: 'Diplo', title: 'Lean On', album: 'Peace Is the Mission', genre: ['Electronic', 'Moombahton'], year: 2015 },
      { artist: 'Skrillex', title: 'Scary Monsters and Nice Sprites', album: 'Scary Monsters and Nice Sprites', genre: ['Electronic', 'Dubstep'], year: 2010 },
      { artist: 'Porter Robinson', title: 'Language', album: 'Worlds', genre: ['Electronic', 'Progressive House'], year: 2012 },
      { artist: 'Flume', title: 'Never Be Like You', album: 'Skin', genre: ['Electronic', 'Future Bass'], year: 2016 },
      { artist: 'ODESZA', title: 'Say My Name', album: 'In Return', genre: ['Electronic', 'Chillwave'], year: 2014 },
      
      // Daha fazla Rock Classics
      { artist: 'The Rolling Stones', title: 'Paint It Black', album: 'Aftermath', genre: ['Rock', 'Blues Rock'], year: 1966 },
      { artist: 'The Rolling Stones', title: 'Satisfaction', album: 'Out of Our Heads', genre: ['Rock', 'Blues Rock'], year: 1965 },
      { artist: 'The Who', title: 'Baba O\'Riley', album: 'Who\'s Next', genre: ['Rock', 'Hard Rock'], year: 1971 },
      { artist: 'Deep Purple', title: 'Smoke on the Water', album: 'Machine Head', genre: ['Rock', 'Hard Rock'], year: 1972 },
      { artist: 'Black Sabbath', title: 'Paranoid', album: 'Paranoid', genre: ['Metal', 'Heavy Metal'], year: 1970 },
      { artist: 'Iron Maiden', title: 'The Number of the Beast', album: 'The Number of the Beast', genre: ['Metal', 'Heavy Metal'], year: 1982 },
      { artist: 'Judas Priest', title: 'Breaking the Law', album: 'British Steel', genre: ['Metal', 'Heavy Metal'], year: 1980 },
      { artist: 'Ozzy Osbourne', title: 'Crazy Train', album: 'Blizzard of Ozz', genre: ['Metal', 'Heavy Metal'], year: 1980 },
      { artist: 'Def Leppard', title: 'Pour Some Sugar on Me', album: 'Hysteria', genre: ['Rock', 'Hard Rock'], year: 1988 },
      { artist: 'Bon Jovi', title: 'Livin\' on a Prayer', album: 'Slippery When Wet', genre: ['Rock', 'Hard Rock'], year: 1986 },
      
      // Daha fazla Alternative & Indie
      { artist: 'Red Hot Chili Peppers', title: 'Californication', album: 'Californication', genre: ['Rock', 'Alternative'], year: 1999 },
      { artist: 'Pearl Jam', title: 'Alive', album: 'Ten', genre: ['Rock', 'Grunge'], year: 1991 },
      { artist: 'Soundgarden', title: 'Black Hole Sun', album: 'Superunknown', genre: ['Rock', 'Grunge'], year: 1994 },
      { artist: 'Alice in Chains', title: 'Man in the Box', album: 'Facelift', genre: ['Rock', 'Grunge'], year: 1990 },
      { artist: 'Stone Temple Pilots', title: 'Interstate Love Song', album: 'Purple', genre: ['Rock', 'Grunge'], year: 1994 },
      { artist: 'Foo Fighters', title: 'Everlong', album: 'The Colour and the Shape', genre: ['Rock', 'Alternative'], year: 1997 },
      { artist: 'Linkin Park', title: 'In the End', album: 'Hybrid Theory', genre: ['Rock', 'Nu Metal'], year: 2000 },
      { artist: 'Green Day', title: 'Basket Case', album: 'Dookie', genre: ['Rock', 'Punk'], year: 1994 },
      { artist: 'The Offspring', title: 'Come Out and Play', album: 'Smash', genre: ['Rock', 'Punk'], year: 1994 },
      { artist: 'Blink-182', title: 'All the Small Things', album: 'Enema of the State', genre: ['Rock', 'Pop Punk'], year: 1999 },
      
      // Daha fazla R&B & Soul
      { artist: 'Whitney Houston', title: 'I Will Always Love You', album: 'The Bodyguard Soundtrack', genre: ['R&B', 'Pop'], year: 1992 },
      { artist: 'Mariah Carey', title: 'Vision of Love', album: 'Mariah Carey', genre: ['R&B', 'Pop'], year: 1990 },
      { artist: 'Stevie Wonder', title: 'Superstition', album: 'Talking Book', genre: ['R&B', 'Soul'], year: 1972 },
      { artist: 'Aretha Franklin', title: 'Respect', album: 'I Never Loved a Man the Way I Love You', genre: ['R&B', 'Soul'], year: 1967 },
      { artist: 'Michael Jackson', title: 'Billie Jean', album: 'Thriller', genre: ['Pop', 'R&B'], year: 1982 },
      { artist: 'Michael Jackson', title: 'Beat It', album: 'Thriller', genre: ['Pop', 'Rock'], year: 1982 },
      { artist: 'Prince', title: 'Purple Rain', album: 'Purple Rain', genre: ['Rock', 'R&B'], year: 1984 },
      { artist: 'Usher', title: 'Yeah!', album: 'Confessions', genre: ['R&B', 'Hip Hop'], year: 2004 },
      { artist: 'Chris Brown', title: 'Forever', album: 'Exclusive', genre: ['R&B', 'Pop'], year: 2007 },
      { artist: 'Frank Ocean', title: 'Thinkin Bout You', album: 'Channel Orange', genre: ['R&B', 'Alternative'], year: 2012 },
      
      // GÜNCEL TÜRK SANATÇILAR (2020-2024)
      // Türk Pop - Güncel
      { artist: 'Edis', title: 'Çok Çok', album: 'Çok Çok', genre: ['Pop', 'Türk Pop'], year: 2020 },
      { artist: 'Edis', title: 'Martılar', album: 'Martılar', genre: ['Pop', 'Türk Pop'], year: 2021 },
      { artist: 'Edis', title: 'Benim Ol', album: 'Benim Ol', genre: ['Pop', 'Türk Pop'], year: 2019 },
      { artist: 'Edis', title: 'Dudak', album: 'Dudak', genre: ['Pop', 'Türk Pop'], year: 2022 },
      
      { artist: 'Reynmen', title: 'Derdim Olsun', album: 'Derdim Olsun', genre: ['Pop', 'Türk Pop'], year: 2018 },
      { artist: 'Reynmen', title: 'Ela', album: 'Ela', genre: ['Pop', 'Türk Pop'], year: 2019 },
      { artist: 'Reynmen', title: 'Leila', album: 'Leila', genre: ['Pop', 'Türk Pop'], year: 2020 },
      { artist: 'Reynmen', title: 'Yoksun', album: 'Yoksun', genre: ['Pop', 'Türk Pop'], year: 2021 },
      
      { artist: 'Aleyna Tilki', title: 'Cevapsız Çınlama', album: 'Cevapsız Çınlama', genre: ['Pop', 'Türk Pop'], year: 2017 },
      { artist: 'Aleyna Tilki', title: 'Sen Olsan Bari', album: 'Sen Olsan Bari', genre: ['Pop', 'Türk Pop'], year: 2018 },
      { artist: 'Aleyna Tilki', title: 'Retrograde', album: 'Retrograde', genre: ['Pop', 'Türk Pop'], year: 2020 },
      { artist: 'Aleyna Tilki', title: 'Yalnız Çiçek', album: 'Yalnız Çiçek', genre: ['Pop', 'Türk Pop'], year: 2021 },
      
      { artist: 'Simge', title: 'Miş Miş', album: 'Miş Miş', genre: ['Pop', 'Türk Pop'], year: 2016 },
      { artist: 'Simge', title: 'Yankı', album: 'Yankı', genre: ['Pop', 'Türk Pop'], year: 2018 },
      { artist: 'Simge', title: 'Aşkın Olayım', album: 'Aşkın Olayım', genre: ['Pop', 'Türk Pop'], year: 2019 },
      { artist: 'Simge', title: 'Ben Bazen', album: 'Ben Bazen', genre: ['Pop', 'Türk Pop'], year: 2020 },
      
      { artist: 'Murat Boz', title: 'Janti', album: 'Janti', genre: ['Pop', 'Türk Pop'], year: 2018 },
      { artist: 'Murat Boz', title: 'Öpücem', album: 'Öpücem', genre: ['Pop', 'Türk Pop'], year: 2019 },
      { artist: 'Murat Boz', title: 'Adını Bilen Yazsın', album: 'Adını Bilen Yazsın', genre: ['Pop', 'Türk Pop'], year: 2020 },
      { artist: 'Murat Boz', title: 'Hayat Öpücüğü', album: 'Hayat Öpücüğü', genre: ['Pop', 'Türk Pop'], year: 2021 },
      
      { artist: 'Berkay', title: 'Gel Gör Beni Aşk Neyledi', album: 'Gel Gör Beni Aşk Neyledi', genre: ['Pop', 'Türk Pop'], year: 2019 },
      { artist: 'Berkay', title: 'Yağmur', album: 'Yağmur', genre: ['Pop', 'Türk Pop'], year: 2020 },
      { artist: 'Berkay', title: 'Sessizce', album: 'Sessizce', genre: ['Pop', 'Türk Pop'], year: 2021 },
      
      { artist: 'Sefo', title: 'Konuşmuyoruz', album: 'Konuşmuyoruz', genre: ['Hip Hop', 'Türk Rap'], year: 2020 },
      { artist: 'Sefo', title: 'Çok Güzel Hareketler', album: 'Çok Güzel Hareketler', genre: ['Hip Hop', 'Türk Rap'], year: 2021 },
      { artist: 'Sefo', title: 'Patron', album: 'Patron', genre: ['Hip Hop', 'Türk Rap'], year: 2022 },
      
      { artist: 'Murda', title: 'Çok Şükür', album: 'Çok Şükür', genre: ['Hip Hop', 'Türk Rap'], year: 2019 },
      { artist: 'Murda', title: 'Bak Hele Şu Halime', album: 'Bak Hele Şu Halime', genre: ['Hip Hop', 'Türk Rap'], year: 2020 },
      { artist: 'Murda', title: 'Made in Turkey', album: 'Made in Turkey', genre: ['Hip Hop', 'Türk Rap'], year: 2021 },
      
      { artist: 'Lvbel C5', title: 'Uçurum', album: 'Uçurum', genre: ['Hip Hop', 'Türk Rap'], year: 2021 },
      { artist: 'Lvbel C5', title: 'Habibi', album: 'Habibi', genre: ['Hip Hop', 'Türk Rap'], year: 2022 },
      { artist: 'Lvbel C5', title: 'Şeytan Diyor Ki', album: 'Şeytan Diyor Ki', genre: ['Hip Hop', 'Türk Rap'], year: 2023 },
      
      { artist: 'Batuflex', title: 'Hayat Hikayem', album: 'Hayat Hikayem', genre: ['Hip Hop', 'Türk Rap'], year: 2021 },
      { artist: 'Batuflex', title: 'Patron Benim', album: 'Patron Benim', genre: ['Hip Hop', 'Türk Rap'], year: 2022 },
      
      { artist: 'Ati242', title: 'Gece Gündüz', album: 'Gece Gündüz', genre: ['Hip Hop', 'Türk Rap'], year: 2020 },
      { artist: 'Ati242', title: 'Kafam Güzel', album: 'Kafam Güzel', genre: ['Hip Hop', 'Türk Rap'], year: 2021 },
      
      { artist: 'Şanışer', title: 'Susamam', album: 'Susamam', genre: ['Hip Hop', 'Türk Rap'], year: 2019 },
      { artist: 'Şanışer', title: 'Gelsin Hayat Bildiği Gibi', album: 'Gelsin Hayat Bildiği Gibi', genre: ['Hip Hop', 'Türk Rap'], year: 2020 },
      
      { artist: 'Mero', title: 'Baller Los', album: 'Baller Los', genre: ['Hip Hop', 'Türk Rap'], year: 2019 },
      { artist: 'Mero', title: 'Wolke 10', album: 'Wolke 10', genre: ['Hip Hop', 'Türk Rap'], year: 2020 },
      
      { artist: 'Semicenk', title: 'Hoşgeldin', album: 'Hoşgeldin', genre: ['Hip Hop', 'Türk Rap'], year: 2020 },
      { artist: 'Semicenk', title: 'Yine Yeni Yeniden', album: 'Yine Yeni Yeniden', genre: ['Hip Hop', 'Türk Rap'], year: 2021 },
      
      { artist: 'Baneva', title: 'Salla', album: 'Salla', genre: ['Pop', 'Türk Pop'], year: 2020 },
      { artist: 'Baneva', title: 'Gel Yanıma', album: 'Gel Yanıma', genre: ['Pop', 'Türk Pop'], year: 2021 },
      
      { artist: 'Zeynep Bastık', title: 'Felaket', album: 'Felaket', genre: ['Pop', 'Türk Pop'], year: 2019 },
      { artist: 'Zeynep Bastık', title: 'Uslanmıyor Bu', album: 'Uslanmıyor Bu', genre: ['Pop', 'Türk Pop'], year: 2020 },
      { artist: 'Zeynep Bastık', title: 'Yalan', album: 'Yalan', genre: ['Pop', 'Türk Pop'], year: 2021 },
      
      { artist: 'Sıla', title: 'Yan Benimle', album: 'Yan Benimle', genre: ['Pop', 'Türk Pop'], year: 2019 },
      { artist: 'Sıla', title: 'Afitap', album: 'Afitap', genre: ['Pop', 'Türk Pop'], year: 2020 },
      { artist: 'Sıla', title: 'Boş Yere', album: 'Boş Yere', genre: ['Pop', 'Türk Pop'], year: 2021 },
      
      { artist: 'Gülşen', title: 'Bangır Bangır', album: 'Bangır Bangır', genre: ['Pop', 'Türk Pop'], year: 2019 },
      { artist: 'Gülşen', title: 'Yurtta Barış Dünyada Barış', album: 'Yurtta Barış Dünyada Barış', genre: ['Pop', 'Türk Pop'], year: 2020 },
      
      { artist: 'Mabel Matiz', title: 'Gözlerinin Etrafındaki Çizgiler', album: 'Gözlerinin Etrafındaki Çizgiler', genre: ['Alternative', 'Türk Pop'], year: 2019 },
      { artist: 'Mabel Matiz', title: 'Yaşım Çok Büyük', album: 'Yaşım Çok Büyük', genre: ['Alternative', 'Türk Pop'], year: 2020 },
      { artist: 'Mabel Matiz', title: 'Gel', album: 'Gel', genre: ['Alternative', 'Türk Pop'], year: 2021 },
      
      { artist: 'Buray', title: 'Sahiden', album: 'Sahiden', genre: ['Pop', 'Türk Pop'], year: 2019 },
      { artist: 'Buray', title: 'Deli Kızım Uyan', album: 'Deli Kızım Uyan', genre: ['Pop', 'Türk Pop'], year: 2020 },
      { artist: 'Buray', title: 'Mecburum', album: 'Mecburum', genre: ['Pop', 'Türk Pop'], year: 2021 },
      
      { artist: 'Çağın Kuşağı', title: 'Gece Gölgenin Rahatına Bak', album: 'Gece Gölgenin Rahatına Bak', genre: ['Rock', 'Alternative'], year: 2020 },
      { artist: 'Çağın Kuşağı', title: 'Hayat Bayram Olsa', album: 'Hayat Bayram Olsa', genre: ['Rock', 'Alternative'], year: 2021 },
      
      // GÜNCEL ULUSLARARASI SANATÇILAR (2020-2024)
      // Pop - Güncel
      { artist: 'Olivia Rodrigo', title: 'drivers license', album: 'SOUR', genre: ['Pop'], year: 2021 },
      { artist: 'Olivia Rodrigo', title: 'good 4 u', album: 'SOUR', genre: ['Pop', 'Rock'], year: 2021 },
      { artist: 'Olivia Rodrigo', title: 'vampire', album: 'GUTS', genre: ['Pop'], year: 2023 },
      { artist: 'Olivia Rodrigo', title: 'bad idea right?', album: 'GUTS', genre: ['Pop'], year: 2023 },
      
      { artist: 'Harry Styles', title: 'Watermelon Sugar', album: 'Fine Line', genre: ['Pop'], year: 2020 },
      { artist: 'Harry Styles', title: 'As It Was', album: 'Harry\'s House', genre: ['Pop'], year: 2022 },
      { artist: 'Harry Styles', title: 'Music for a Sushi Restaurant', album: 'Harry\'s House', genre: ['Pop'], year: 2022 },
      { artist: 'Harry Styles', title: 'Golden', album: 'Fine Line', genre: ['Pop'], year: 2020 },
      
      { artist: 'Doja Cat', title: 'Say So', album: 'Hot Pink', genre: ['Pop', 'R&B'], year: 2020 },
      { artist: 'Doja Cat', title: 'Kiss Me More', album: 'Planet Her', genre: ['Pop', 'R&B'], year: 2021 },
      { artist: 'Doja Cat', title: 'Woman', album: 'Planet Her', genre: ['Pop', 'R&B'], year: 2021 },
      { artist: 'Doja Cat', title: 'Paint The Town Red', album: 'Scarlet', genre: ['Pop', 'R&B'], year: 2023 },
      
      { artist: 'Lorde', title: 'Solar Power', album: 'Solar Power', genre: ['Pop', 'Alternative'], year: 2021 },
      { artist: 'Lorde', title: 'Mood Ring', album: 'Solar Power', genre: ['Pop', 'Alternative'], year: 2021 },
      { artist: 'Lorde', title: 'Stoned at the Nail Salon', album: 'Solar Power', genre: ['Pop', 'Alternative'], year: 2021 },
      
      { artist: 'Lana Del Rey', title: 'Chemtrails Over the Country Club', album: 'Chemtrails Over the Country Club', genre: ['Pop', 'Alternative'], year: 2021 },
      { artist: 'Lana Del Rey', title: 'Ocean Blvd', album: 'Did you know that there\'s a tunnel under Ocean Blvd', genre: ['Pop', 'Alternative'], year: 2023 },
      { artist: 'Lana Del Rey', title: 'A&W', album: 'Did you know that there\'s a tunnel under Ocean Blvd', genre: ['Pop', 'Alternative'], year: 2023 },
      
      { artist: 'SZA', title: 'Good Days', album: 'SOS', genre: ['R&B', 'Pop'], year: 2021 },
      { artist: 'SZA', title: 'I Hate U', album: 'SOS', genre: ['R&B', 'Pop'], year: 2022 },
      { artist: 'SZA', title: 'Kill Bill', album: 'SOS', genre: ['R&B', 'Pop'], year: 2022 },
      { artist: 'SZA', title: 'Shirt', album: 'SOS', genre: ['R&B', 'Pop'], year: 2022 },
      
      { artist: 'Bad Bunny', title: 'Yonaguni', album: 'El Último Tour Del Mundo', genre: ['Reggaeton', 'Latin'], year: 2021 },
      { artist: 'Bad Bunny', title: 'Me Porto Bonito', album: 'Un Verano Sin Ti', genre: ['Reggaeton', 'Latin'], year: 2022 },
      { artist: 'Bad Bunny', title: 'Tití Me Preguntó', album: 'Un Verano Sin Ti', genre: ['Reggaeton', 'Latin'], year: 2022 },
      { artist: 'Bad Bunny', title: 'Moscow Mule', album: 'Un Verano Sin Ti', genre: ['Reggaeton', 'Latin'], year: 2022 },
      
      { artist: 'Rosalía', title: 'La Fama', album: 'MOTOMAMI', genre: ['Latin', 'Pop'], year: 2022 },
      { artist: 'Rosalía', title: 'Despechá', album: 'MOTOMAMI+', genre: ['Latin', 'Pop'], year: 2022 },
      { artist: 'Rosalía', title: 'BIZCOCHITO', album: 'MOTOMAMI', genre: ['Latin', 'Pop'], year: 2022 },
      
      { artist: 'Lizzo', title: 'About Damn Time', album: 'Special', genre: ['Pop', 'R&B'], year: 2022 },
      { artist: 'Lizzo', title: 'Break Up Twice', album: 'Special', genre: ['Pop', 'R&B'], year: 2022 },
      { artist: 'Lizzo', title: 'Special', album: 'Special', genre: ['Pop', 'R&B'], year: 2022 },
      
      { artist: 'Sabrina Carpenter', title: 'Nonsense', album: 'emails i can\'t send', genre: ['Pop'], year: 2022 },
      { artist: 'Sabrina Carpenter', title: 'Feather', album: 'emails i can\'t send fwd:', genre: ['Pop'], year: 2023 },
      { artist: 'Sabrina Carpenter', title: 'Espresso', album: 'Short n\' Sweet', genre: ['Pop'], year: 2024 },
      
      { artist: 'Gracie Abrams', title: 'Mess It Up', album: 'Good Riddance', genre: ['Pop', 'Alternative'], year: 2023 },
      { artist: 'Gracie Abrams', title: 'I should hate you', album: 'Good Riddance', genre: ['Pop', 'Alternative'], year: 2023 },
      
      { artist: 'Phoebe Bridgers', title: 'Kyoto', album: 'Punisher', genre: ['Indie', 'Alternative'], year: 2020 },
      { artist: 'Phoebe Bridgers', title: 'I Know the End', album: 'Punisher', genre: ['Indie', 'Alternative'], year: 2020 },
      
      { artist: 'Clairo', title: 'Blouse', album: 'Sling', genre: ['Indie', 'Pop'], year: 2021 },
      { artist: 'Clairo', title: 'Amoeba', album: 'Sling', genre: ['Indie', 'Pop'], year: 2021 },
      
      { artist: 'Mitski', title: 'The Only Heartbreaker', album: 'Laurel Hell', genre: ['Indie', 'Alternative'], year: 2022 },
      { artist: 'Mitski', title: 'Working for the Knife', album: 'Laurel Hell', genre: ['Indie', 'Alternative'], year: 2021 },
      
      // Hip Hop - Güncel
      { artist: 'Lil Nas X', title: 'MONTERO (Call Me By Your Name)', album: 'MONTERO', genre: ['Hip Hop', 'Pop'], year: 2021 },
      { artist: 'Lil Nas X', title: 'Industry Baby', album: 'MONTERO', genre: ['Hip Hop', 'Pop'], year: 2021 },
      { artist: 'Lil Nas X', title: 'THATS WHAT I WANT', album: 'MONTERO', genre: ['Hip Hop', 'Pop'], year: 2021 },
      
      { artist: 'Dua Lipa', title: 'Physical', album: 'Future Nostalgia', genre: ['Pop', 'Dance'], year: 2020 },
      { artist: 'Dua Lipa', title: 'Break My Heart', album: 'Future Nostalgia', genre: ['Pop', 'Dance'], year: 2020 },
      { artist: 'Dua Lipa', title: 'Love Again', album: 'Future Nostalgia', genre: ['Pop', 'Dance'], year: 2021 },
      
      { artist: 'The Weeknd', title: 'Save Your Tears', album: 'After Hours', genre: ['Pop', 'R&B'], year: 2020 },
      { artist: 'The Weeknd', title: 'Take My Breath', album: 'Dawn FM', genre: ['Pop', 'R&B'], year: 2021 },
      { artist: 'The Weeknd', title: 'Sacrifice', album: 'Dawn FM', genre: ['Pop', 'R&B'], year: 2022 },
      
      { artist: 'Ariana Grande', title: 'positions', album: 'Positions', genre: ['Pop', 'R&B'], year: 2020 },
      { artist: 'Ariana Grande', title: '34+35', album: 'Positions', genre: ['Pop', 'R&B'], year: 2020 },
      { artist: 'Ariana Grande', title: 'pov', album: 'Positions', genre: ['Pop', 'R&B'], year: 2020 },
      
      { artist: 'Billie Eilish', title: 'Therefore I Am', album: 'Therefore I Am', genre: ['Pop', 'Alternative'], year: 2020 },
      { artist: 'Billie Eilish', title: 'Your Power', album: 'Happier Than Ever', genre: ['Pop', 'Alternative'], year: 2021 },
      { artist: 'Billie Eilish', title: 'Lost Cause', album: 'Happier Than Ever', genre: ['Pop', 'Alternative'], year: 2021 },
      
      { artist: 'Taylor Swift', title: 'cardigan', album: 'folklore', genre: ['Pop', 'Alternative'], year: 2020 },
      { artist: 'Taylor Swift', title: 'willow', album: 'evermore', genre: ['Pop', 'Alternative'], year: 2020 },
      { artist: 'Taylor Swift', title: 'Lavender Haze', album: 'Midnights', genre: ['Pop'], year: 2022 },
      { artist: 'Taylor Swift', title: 'Karma', album: 'Midnights', genre: ['Pop'], year: 2022 },
      
      { artist: 'Doja Cat', title: 'Need to Know', album: 'Planet Her', genre: ['Pop', 'R&B'], year: 2021 },
      { artist: 'Doja Cat', title: 'Get Into It (Yuh)', album: 'Planet Her', genre: ['Pop', 'R&B'], year: 2021 },
      
      // Electronic - Güncel
      { artist: 'Glass Animals', title: 'Heat Waves', album: 'Dreamland', genre: ['Indie', 'Electronic'], year: 2020 },
      { artist: 'Glass Animals', title: 'Tokyo Drifting', album: 'Dreamland', genre: ['Indie', 'Electronic'], year: 2020 },
      
      { artist: 'Tame Impala', title: 'Is It True', album: 'The Slow Rush', genre: ['Psychedelic', 'Electronic'], year: 2020 },
      { artist: 'Tame Impala', title: 'Breathe Deeper', album: 'The Slow Rush', genre: ['Psychedelic', 'Electronic'], year: 2020 },
      
      { artist: 'Disclosure', title: 'My High', album: 'Energy', genre: ['Electronic', 'House'], year: 2020 },
      { artist: 'Disclosure', title: 'Douha (Mali Mali)', album: 'Energy', genre: ['Electronic', 'House'], year: 2020 },
      
      { artist: 'Flume', title: 'The Difference', album: 'Palaces', genre: ['Electronic', 'Future Bass'], year: 2022 },
      { artist: 'Flume', title: 'Say Nothing', album: 'Palaces', genre: ['Electronic', 'Future Bass'], year: 2022 },
      
      // Rock - Güncel
      { artist: 'Måneskin', title: 'Beggin\'', album: 'Chosen', genre: ['Rock', 'Alternative'], year: 2021 },
      { artist: 'Måneskin', title: 'I WANNA BE YOUR SLAVE', album: 'Teatro d\'ira: Vol. I', genre: ['Rock', 'Alternative'], year: 2021 },
      { artist: 'Måneskin', title: 'MAMMAMIA', album: 'Teatro d\'ira: Vol. I', genre: ['Rock', 'Alternative'], year: 2021 },
      
      { artist: 'Imagine Dragons', title: 'Enemy', album: 'Mercury – Acts 1 & 2', genre: ['Rock', 'Alternative'], year: 2021 },
      { artist: 'Imagine Dragons', title: 'Bones', album: 'Mercury – Acts 1 & 2', genre: ['Rock', 'Alternative'], year: 2022 },
      { artist: 'Imagine Dragons', title: 'Sharks', album: 'Mercury – Acts 1 & 2', genre: ['Rock', 'Alternative'], year: 2022 },
      
      { artist: 'Twenty One Pilots', title: 'Shy Away', album: 'Scaled and Icy', genre: ['Rock', 'Alternative'], year: 2021 },
      { artist: 'Twenty One Pilots', title: 'Saturday', album: 'Scaled and Icy', genre: ['Rock', 'Alternative'], year: 2021 },
      { artist: 'Twenty One Pilots', title: 'Overcompensate', album: 'Clancy', genre: ['Rock', 'Alternative'], year: 2024 },
      
      { artist: 'My Chemical Romance', title: 'The Foundations of Decay', album: 'The Foundations of Decay', genre: ['Rock', 'Alternative'], year: 2022 },
      
      { artist: 'Paramore', title: 'This Is Why', album: 'This Is Why', genre: ['Rock', 'Alternative'], year: 2023 },
      { artist: 'Paramore', title: 'The News', album: 'This Is Why', genre: ['Rock', 'Alternative'], year: 2023 },
      
      { artist: 'Arctic Monkeys', title: 'There\'d Better Be A Mirrorball', album: 'The Car', genre: ['Rock', 'Alternative'], year: 2022 },
      { artist: 'Arctic Monkeys', title: 'Body Paint', album: 'The Car', genre: ['Rock', 'Alternative'], year: 2022 },
      
      // K-Pop - Güncel
      { artist: 'BTS', title: 'Dynamite', album: 'BE', genre: ['K-Pop', 'Pop'], year: 2020 },
      { artist: 'BTS', title: 'Butter', album: 'Butter', genre: ['K-Pop', 'Pop'], year: 2021 },
      { artist: 'BTS', title: 'Permission to Dance', album: 'Permission to Dance', genre: ['K-Pop', 'Pop'], year: 2021 },
      { artist: 'BTS', title: 'Yet To Come', album: 'Proof', genre: ['K-Pop', 'Pop'], year: 2022 },
      
      { artist: 'BLACKPINK', title: 'How You Like That', album: 'THE ALBUM', genre: ['K-Pop', 'Pop'], year: 2020 },
      { artist: 'BLACKPINK', title: 'Ice Cream', album: 'THE ALBUM', genre: ['K-Pop', 'Pop'], year: 2020 },
      { artist: 'BLACKPINK', title: 'Lovesick Girls', album: 'THE ALBUM', genre: ['K-Pop', 'Pop'], year: 2020 },
      { artist: 'BLACKPINK', title: 'Pink Venom', album: 'BORN PINK', genre: ['K-Pop', 'Pop'], year: 2022 },
      { artist: 'BLACKPINK', title: 'Shut Down', album: 'BORN PINK', genre: ['K-Pop', 'Pop'], year: 2022 },
      
      { artist: 'NewJeans', title: 'Attention', album: 'NewJeans', genre: ['K-Pop', 'Pop'], year: 2022 },
      { artist: 'NewJeans', title: 'Hype Boy', album: 'NewJeans', genre: ['K-Pop', 'Pop'], year: 2022 },
      { artist: 'NewJeans', title: 'Cookie', album: 'NewJeans', genre: ['K-Pop', 'Pop'], year: 2022 },
      { artist: 'NewJeans', title: 'OMG', album: 'Get Up', genre: ['K-Pop', 'Pop'], year: 2023 },
      
      { artist: 'IVE', title: 'LOVE DIVE', album: 'LOVE DIVE', genre: ['K-Pop', 'Pop'], year: 2022 },
      { artist: 'IVE', title: 'After LIKE', album: 'After LIKE', genre: ['K-Pop', 'Pop'], year: 2022 },
      { artist: 'IVE', title: 'I AM', album: 'I\'ve IVE', genre: ['K-Pop', 'Pop'], year: 2023 },
      
      { artist: 'aespa', title: 'Next Level', album: 'Savage', genre: ['K-Pop', 'Pop'], year: 2021 },
      { artist: 'aespa', title: 'Savage', album: 'Savage', genre: ['K-Pop', 'Pop'], year: 2021 },
      { artist: 'aespa', title: 'Girls', album: 'Girls', genre: ['K-Pop', 'Pop'], year: 2022 },
      { artist: 'aespa', title: 'Spicy', album: 'MY WORLD', genre: ['K-Pop', 'Pop'], year: 2023 },
      
      { artist: 'ITZY', title: 'LOCO', album: 'CRAZY IN LOVE', genre: ['K-Pop', 'Pop'], year: 2021 },
      { artist: 'ITZY', title: 'SNEAKERS', album: 'CHECKMATE', genre: ['K-Pop', 'Pop'], year: 2022 },
      { artist: 'ITZY', title: 'CAKE', album: 'KILL MY DOUBT', genre: ['K-Pop', 'Pop'], year: 2023 }
    ];

    // Türkçe karakter normalizasyonu
    const normalizeText = (text: string) => {
      return text.toLowerCase()
        .replace(/ğ/g, 'g')
        .replace(/ü/g, 'u') 
        .replace(/ş/g, 's')
        .replace(/ı/g, 'i')
        .replace(/ö/g, 'o')
        .replace(/ç/g, 'c')
        .replace(/Ğ/g, 'g')
        .replace(/Ü/g, 'u')
        .replace(/Ş/g, 's')
        .replace(/İ/g, 'i')
        .replace(/Ö/g, 'o')
        .replace(/Ç/g, 'c');
    };

    const normalizedSearchTerm = normalizeText(searchQuery);
    
    const results = musicDatabase
      .filter(song => {
        const normalizedTitle = normalizeText(song.title);
        const normalizedArtist = normalizeText(song.artist);
        const normalizedAlbum = normalizeText(song.album);
        
        return normalizedTitle.includes(normalizedSearchTerm) || 
               normalizedArtist.includes(normalizedSearchTerm) ||
               normalizedAlbum.includes(normalizedSearchTerm) ||
               // Kelime kelime arama - daha esnek
               normalizedSearchTerm.split(' ').some(word => 
                 word.length > 0 && (
                   normalizedTitle.includes(word) ||
                   normalizedArtist.includes(word) ||
                   normalizedAlbum.includes(word)
                 )
               ) ||
               // Kısmi eşleşme - daha esnek
               normalizedTitle.startsWith(normalizedSearchTerm) ||
               normalizedArtist.startsWith(normalizedSearchTerm) ||
               // Herhangi bir kelime eşleşmesi
               song.genre.some(g => normalizeText(g).includes(normalizedSearchTerm));
      })
      .slice(0, 8)
      .map((song, index) => ({
        id: index + 1,
        title: song.title,
        artist: song.artist,
        album: song.album,
        year: song.year,
        genre: song.genre,
        lastfmId: `mock_${index}`,
        cover: null,
        popularity: Math.floor(Math.random() * 100000),
        duration: Math.floor(Math.random() * 180) + 120
      }));

    console.log(`Mock database'den ${results.length} müzik sonucu bulundu (arama: "${searchQuery}")`);
    res.json(results);
  } catch (error) {
    console.error('Music search error:', error);
    res.status(500).json({ error: 'Müzik arama hatası' });
  }
});

// Restoran arama - Foursquare API ile
router.get('/restaurants', authMiddleware, async (req, res) => {
  try {
    const { query } = req.query;
    const searchQuery = typeof query === 'string' ? query : '';
    
    if (!searchQuery || searchQuery.length < 2) {
      return res.json([]);
    }

    // Foursquare API kullanımı
    const FOURSQUARE_API_KEY = process.env.FOURSQUARE_API_KEY;

    // Önce Foursquare API'yi dene
    if (FOURSQUARE_API_KEY && FOURSQUARE_API_KEY !== 'demo_key') {
      try {
        console.log('Foursquare API ile arama yapılıyor:', searchQuery);
        
        // Ankara'da arama yap
        const ankaraResponse = await axios.get('https://api.foursquare.com/v3/places/search', {
          params: {
            query: searchQuery,
            near: 'Ankara,Turkey',
            categories: '13000,13001,13002,13003,13004,13005,13006,13007,13008,13009,13010,13011,13012,13013,13014,13015,13016,13017,13018,13019,13020,13021,13022,13023,13024,13025,13026,13027,13028,13029,13030,13031,13032,13033,13034,13035,13036,13037,13038,13039,13040,13041,13042,13043,13044,13045,13046,13047,13048,13049,13050,13051,13052,13053,13054,13055,13056,13057,13058,13059,13060,13061,13062,13063,13064,13065,13066,13067,13068,13069,13070,13071,13072,13073,13074,13075,13076,13077,13078,13079,13080,13081,13082,13083,13084,13085,13086,13087,13088,13089,13090,13091,13092,13093,13094,13095,13096,13097,13098,13099', // Tüm yemek kategorileri
            limit: 20
          },
          headers: {
            'Authorization': FOURSQUARE_API_KEY,
            'Accept': 'application/json'
          },
          timeout: 10000
        });

        console.log('Foursquare API yanıtı:', ankaraResponse.data);

        if (ankaraResponse.data.results && ankaraResponse.data.results.length > 0) {
          const results = ankaraResponse.data.results.map((place: any, index: number) => ({
            id: place.fsq_id || `fsq_${index}`,
            name: place.name,
            cuisine: place.categories?.[0]?.name || 'Restoran',
            location: place.location?.formatted_address || `${place.location?.locality || 'Ankara'}, Türkiye`,
            address: place.location?.formatted_address || place.location?.address || 'Adres bulunamadı',
            rating: place.rating ? (place.rating / 2).toFixed(1) : (Math.random() * 2 + 3).toFixed(1), // Foursquare 10 üzerinden, biz 5'e çeviriyoruz
            priceRange: place.price ? '$'.repeat(place.price) : '$$',
            type: place.categories?.[0]?.name?.toLowerCase().includes('cafe') ? 'cafe' : 
                  place.categories?.[0]?.name?.toLowerCase().includes('bar') ? 'bar' : 'restaurant',
            googlePlaceId: place.fsq_id,
            photo: place.photos?.[0] ? `${place.photos[0].prefix}400x400${place.photos[0].suffix}` : null,
            phone: place.tel,
            website: place.website,
            openNow: place.hours?.open_now,
            popularity: place.popularity || Math.floor(Math.random() * 100),
            distance: place.distance
          }));

          console.log(`Foursquare'dan ${results.length} sonuç bulundu`);
          return res.json(results.slice(0, 8));
        }

        // Eğer Ankara'da sonuç bulunamazsa, İstanbul'da da dene
        if (!ankaraResponse.data.results || ankaraResponse.data.results.length === 0) {
          console.log('Ankara\'da sonuç bulunamadı, İstanbul\'da deneniyor...');
          
          const istanbulResponse = await axios.get('https://api.foursquare.com/v3/places/search', {
            params: {
              query: searchQuery,
              near: 'Istanbul,Turkey',
              categories: '13000,13001,13002,13003,13004,13005,13006,13007,13008,13009,13010,13011,13012,13013,13014,13015,13016,13017,13018,13019,13020,13021,13022,13023,13024,13025,13026,13027,13028,13029,13030,13031,13032,13033,13034,13035,13036,13037,13038,13039,13040,13041,13042,13043,13044,13045,13046,13047,13048,13049,13050,13051,13052,13053,13054,13055,13056,13057,13058,13059,13060,13061,13062,13063,13064,13065,13066,13067,13068,13069,13070,13071,13072,13073,13074,13075,13076,13077,13078,13079,13080,13081,13082,13083,13084,13085,13086,13087,13088,13089,13090,13091,13092,13093,13094,13095,13096,13097,13098,13099',
              limit: 20
            },
            headers: {
              'Authorization': FOURSQUARE_API_KEY,
              'Accept': 'application/json'
            },
            timeout: 10000
          });

          if (istanbulResponse.data.results && istanbulResponse.data.results.length > 0) {
            const results = istanbulResponse.data.results.map((place: any, index: number) => ({
              id: place.fsq_id || `fsq_${index}`,
              name: place.name,
              cuisine: place.categories?.[0]?.name || 'Restoran',
              location: place.location?.formatted_address || `${place.location?.locality || 'İstanbul'}, Türkiye`,
              address: place.location?.formatted_address || place.location?.address || 'Adres bulunamadı',
              rating: place.rating ? (place.rating / 2).toFixed(1) : (Math.random() * 2 + 3).toFixed(1),
              priceRange: place.price ? '$'.repeat(place.price) : '$$',
              type: place.categories?.[0]?.name?.toLowerCase().includes('cafe') ? 'cafe' : 
                    place.categories?.[0]?.name?.toLowerCase().includes('bar') ? 'bar' : 'restaurant',
              googlePlaceId: place.fsq_id,
              photo: place.photos?.[0] ? `${place.photos[0].prefix}400x400${place.photos[0].suffix}` : null,
              phone: place.tel,
              website: place.website,
              openNow: place.hours?.open_now,
              popularity: place.popularity || Math.floor(Math.random() * 100),
              distance: place.distance
            }));

            console.log(`İstanbul'da ${results.length} sonuç bulundu`);
            return res.json(results.slice(0, 8));
          }
        }
      } catch (foursquareError: any) {
        console.error('Foursquare API error:', {
          message: foursquareError.message,
          response: foursquareError.response?.data,
          status: foursquareError.response?.status
        });
      }
    }

    // Foursquare API çalışmazsa, mock database'e geri dön
    console.log('Foursquare API çalışmadı, mock database kullanılıyor');

    // Kapsamlı Ankara restoranları veritabanı (gerçek mekanlar)
    const restaurantDatabase = [
      // Lüks Restoranlar
      { name: 'Aspava', cuisine: 'Türk Mutfağı', type: 'restaurant', priceRange: '$$', city: 'Ankara' },
      { name: 'Ankuva', cuisine: 'Modern Türk', type: 'restaurant', priceRange: '$$$', city: 'Ankara' },
      { name: 'Yelken Balık', cuisine: 'Balık & Deniz Ürünleri', type: 'restaurant', priceRange: '$$$', city: 'Ankara' },
      { name: 'Panora', cuisine: 'Uluslararası', type: 'restaurant', priceRange: '$$$$', city: 'Ankara' },
      { name: 'Trilye Restaurant', cuisine: 'Balık & Deniz Ürünleri', type: 'restaurant', priceRange: '$$$$', city: 'Ankara' },
      { name: 'Washington Restaurant', cuisine: 'Et & Steakhouse', type: 'restaurant', priceRange: '$$$$', city: 'Ankara' },
      { name: 'Çengelhan Brasserie', cuisine: 'Fransız Mutfağı', type: 'restaurant', priceRange: '$$$$', city: 'Ankara' },
      { name: 'Zenger Paşa Konağı', cuisine: 'Osmanlı Mutfağı', type: 'restaurant', priceRange: '$$$', city: 'Ankara' },
      { name: 'Kale Washington', cuisine: 'Et & Steakhouse', type: 'restaurant', priceRange: '$$$$', city: 'Ankara' },
      { name: 'Divan Brasserie', cuisine: 'Uluslararası', type: 'restaurant', priceRange: '$$$$', city: 'Ankara' },
      
      // Kebap & Et Restoranları
      { name: 'Köşebaşı', cuisine: 'Kebap & Et', type: 'restaurant', priceRange: '$$$', city: 'Ankara' },
      { name: 'Develi', cuisine: 'Kebap & Et', type: 'restaurant', priceRange: '$$$', city: 'Ankara' },
      { name: 'Uludag Kebapçısı', cuisine: 'Kebap & Et', type: 'restaurant', priceRange: '$', city: 'Ankara' },
      { name: 'Hacı Arif Bey', cuisine: 'Türk Mutfağı', type: 'restaurant', priceRange: '$$', city: 'Ankara' },
      { name: 'Kızılkayalar', cuisine: 'Türk Mutfağı', type: 'restaurant', priceRange: '$$', city: 'Ankara' },
      { name: 'Hacı Abdullah', cuisine: 'Osmanlı Mutfağı', type: 'restaurant', priceRange: '$$', city: 'Ankara' },
      
      // Uluslararası Mutfak
      { name: 'Nusr-Et', cuisine: 'Et & Steakhouse', type: 'restaurant', priceRange: '$$$$', city: 'Ankara' },
      { name: 'Mikla', cuisine: 'Modern Türk', type: 'restaurant', priceRange: '$$$$', city: 'Ankara' },
      { name: 'Sushi Co', cuisine: 'Japon', type: 'restaurant', priceRange: '$$', city: 'Ankara' },
      { name: 'Zuma', cuisine: 'Japon', type: 'restaurant', priceRange: '$$$$', city: 'Ankara' },
      { name: 'Pizza Hut', cuisine: 'İtalyan', type: 'restaurant', priceRange: '$$', city: 'Ankara' },
      { name: 'Domino\'s Pizza', cuisine: 'İtalyan', type: 'restaurant', priceRange: '$', city: 'Ankara' },
      { name: 'Burger King', cuisine: 'Fast Food', type: 'restaurant', priceRange: '$', city: 'Ankara' },
      { name: 'McDonald\'s', cuisine: 'Fast Food', type: 'restaurant', priceRange: '$', city: 'Ankara' },
      { name: 'KFC', cuisine: 'Fast Food', type: 'restaurant', priceRange: '$', city: 'Ankara' },
      
      // Kafeler
      { name: 'Starbucks', cuisine: 'Kahve & Tatlı', type: 'cafe', priceRange: '$$', city: 'Ankara' },
      { name: 'Gloria Jean\'s', cuisine: 'Kahve & Tatlı', type: 'cafe', priceRange: '$$', city: 'Ankara' },
      { name: 'Kahve Dünyası', cuisine: 'Kahve & Tatlı', type: 'cafe', priceRange: '$', city: 'Ankara' },
      { name: 'Mado', cuisine: 'Dondurma & Tatlı', type: 'cafe', priceRange: '$', city: 'Ankara' },
      { name: 'Saray Muhallebicisi', cuisine: 'Tatlı & Muhallebi', type: 'cafe', priceRange: '$', city: 'Ankara' },
      
      // Ankara'ya Özel Mekanlar
      { name: 'Ulus 29', cuisine: 'Modern Türk', type: 'restaurant', priceRange: '$$$$', city: 'Ankara' },
      { name: 'Kalbur', cuisine: 'Türk Mutfağı', type: 'restaurant', priceRange: '$$', city: 'Ankara' },
      { name: 'Şeref Büryan', cuisine: 'Türk Mutfağı', type: 'restaurant', priceRange: '$$', city: 'Ankara' },
      { name: 'Günaydın Et Lokantası', cuisine: 'Et & Steakhouse', type: 'restaurant', priceRange: '$$$', city: 'Ankara' },
      { name: 'Beykoz Kundura', cuisine: 'Modern Türk', type: 'restaurant', priceRange: '$$$', city: 'Ankara' },
      { name: 'Çiçek Lokantası', cuisine: 'Türk Mutfağı', type: 'restaurant', priceRange: '$$', city: 'Ankara' },
      { name: 'Kıyı Restaurant', cuisine: 'Balık & Deniz Ürünleri', type: 'restaurant', priceRange: '$$$', city: 'Ankara' },
      { name: 'Balıkçı Sabahattin', cuisine: 'Balık & Deniz Ürünleri', type: 'restaurant', priceRange: '$$$', city: 'Ankara' },
      { name: 'Pandeli', cuisine: 'Osmanlı Mutfağı', type: 'restaurant', priceRange: '$$$', city: 'Ankara' },
      { name: 'Hamdi Et Lokantası', cuisine: 'Et & Steakhouse', type: 'restaurant', priceRange: '$$', city: 'Ankara' },
      
      // Daha Fazla Kafe & Bar
      { name: 'Caribou Coffee', cuisine: 'Kahve & Tatlı', type: 'cafe', priceRange: '$$', city: 'Ankara' },
      { name: 'Tchibo', cuisine: 'Kahve & Tatlı', type: 'cafe', priceRange: '$$', city: 'Ankara' },
      { name: 'Espresso Lab', cuisine: 'Kahve & Tatlı', type: 'cafe', priceRange: '$$', city: 'Ankara' },
      { name: 'Walter\'s Coffee', cuisine: 'Kahve & Tatlı', type: 'cafe', priceRange: '$$', city: 'Ankara' },
      { name: 'Petra Roasting Co.', cuisine: 'Kahve & Tatlı', type: 'cafe', priceRange: '$$', city: 'Ankara' },
      { name: 'Brew Coffee Works', cuisine: 'Kahve & Tatlı', type: 'cafe', priceRange: '$$', city: 'Ankara' },
      { name: 'Coffeemania', cuisine: 'Kahve & Tatlı', type: 'cafe', priceRange: '$$', city: 'Ankara' },
      
      // Etnik Mutfaklar
      { name: 'Çin Seddi', cuisine: 'Çin Mutfağı', type: 'restaurant', priceRange: '$$', city: 'Ankara' },
      { name: 'Taj Mahal', cuisine: 'Hint Mutfağı', type: 'restaurant', priceRange: '$$', city: 'Ankara' },
      { name: 'Sakura', cuisine: 'Japon Mutfağı', type: 'restaurant', priceRange: '$$$', city: 'Ankara' },
      { name: 'Little Italy', cuisine: 'İtalyan Mutfağı', type: 'restaurant', priceRange: '$$', city: 'Ankara' },
      { name: 'Meksika Cantina', cuisine: 'Meksika Mutfağı', type: 'restaurant', priceRange: '$$', city: 'Ankara' },
      { name: 'Beirut', cuisine: 'Lübnan Mutfağı', type: 'restaurant', priceRange: '$$', city: 'Ankara' },
      
      // Yerel Ankara Lezzetleri
      { name: 'Ankara Tava', cuisine: 'Türk Mutfağı', type: 'restaurant', priceRange: '$', city: 'Ankara' },
      { name: 'Beypazarı Kurusu', cuisine: 'Türk Mutfağı', type: 'restaurant', priceRange: '$', city: 'Ankara' },
      { name: 'Simidi Ankara', cuisine: 'Türk Mutfağı', type: 'restaurant', priceRange: '$', city: 'Ankara' },
      { name: 'Dönerci Şahin Usta', cuisine: 'Türk Mutfağı', type: 'restaurant', priceRange: '$', city: 'Ankara' },
      { name: 'Pide Salonu', cuisine: 'Türk Mutfağı', type: 'restaurant', priceRange: '$', city: 'Ankara' },
      
      // Tatlı & Dondurma
      { name: 'Koçak Baklava', cuisine: 'Baklava & Tatlı', type: 'cafe', priceRange: '$', city: 'Ankara' },
      { name: 'Hacı Bekir', cuisine: 'Lokum & Tatlı', type: 'cafe', priceRange: '$', city: 'Ankara' },
      { name: 'Pelit Pastanesi', cuisine: 'Pasta & Tatlı', type: 'cafe', priceRange: '$$', city: 'Ankara' },
      { name: 'Dondurma Dünyası', cuisine: 'Dondurma & Tatlı', type: 'cafe', priceRange: '$', city: 'Ankara' },
      
      // Gece Hayatı & Barlar
      { name: 'Buddha Bar', cuisine: 'Bar & Kokteyl', type: 'bar', priceRange: '$$$', city: 'Ankara' },
      { name: 'Jolly Joker Pub', cuisine: 'Pub & Bar', type: 'bar', priceRange: '$$', city: 'Ankara' },
      { name: 'Rock Bar', cuisine: 'Bar & Müzik', type: 'bar', priceRange: '$$', city: 'Ankara' },
      { name: 'Nardis Jazz Club', cuisine: 'Jazz & Bar', type: 'bar', priceRange: '$$$', city: 'Ankara' },
      
      // Yeni Eklenen Ankara Mekanları
      { name: 'Çankaya Köşkü Restaurant', cuisine: 'Türk Mutfağı', type: 'restaurant', priceRange: '$$$$', city: 'Ankara' },
      { name: 'Atakule Dönen Restaurant', cuisine: 'Uluslararası', type: 'restaurant', priceRange: '$$$', city: 'Ankara' },
      { name: 'Gordion Restaurant', cuisine: 'Modern Türk', type: 'restaurant', priceRange: '$$$', city: 'Ankara' },
      { name: 'Kızılay Meydanı Cafe', cuisine: 'Kahve & Tatlı', type: 'cafe', priceRange: '$$', city: 'Ankara' },
      { name: 'Tunalı Hilmi Bistro', cuisine: 'Bistro', type: 'restaurant', priceRange: '$$', city: 'Ankara' },
      { name: 'Bahçelievler Pide', cuisine: 'Türk Mutfağı', type: 'restaurant', priceRange: '$', city: 'Ankara' },
      { name: 'Çayyolu AVM Food Court', cuisine: 'Fast Food', type: 'restaurant', priceRange: '$', city: 'Ankara' },
      { name: 'Bilkent Center Restaurants', cuisine: 'Uluslararası', type: 'restaurant', priceRange: '$$', city: 'Ankara' },
      { name: 'Armada AVM Yemek Katı', cuisine: 'Çeşitli', type: 'restaurant', priceRange: '$$', city: 'Ankara' },
      { name: 'Ankamall Food Court', cuisine: 'Fast Food', type: 'restaurant', priceRange: '$', city: 'Ankara' },
      
      // Geleneksel Ankara Mekanları
      { name: 'Hamamönü Konakları', cuisine: 'Geleneksel Türk', type: 'restaurant', priceRange: '$$', city: 'Ankara' },
      { name: 'Altındağ Sofrası', cuisine: 'Türk Mutfağı', type: 'restaurant', priceRange: '$', city: 'Ankara' },
      { name: 'Keçiören Pidecisi', cuisine: 'Türk Mutfağı', type: 'restaurant', priceRange: '$', city: 'Ankara' },
      { name: 'Mamak Dönerci', cuisine: 'Türk Mutfağı', type: 'restaurant', priceRange: '$', city: 'Ankara' },
      { name: 'Yenimahalle Kebap', cuisine: 'Kebap & Et', type: 'restaurant', priceRange: '$', city: 'Ankara' },
      { name: 'Sincan Et Lokantası', cuisine: 'Et & Steakhouse', type: 'restaurant', priceRange: '$$', city: 'Ankara' },
      { name: 'Polatlı Tava', cuisine: 'Türk Mutfağı', type: 'restaurant', priceRange: '$', city: 'Ankara' },
      { name: 'Gölbaşı Balık Restaurant', cuisine: 'Balık & Deniz Ürünleri', type: 'restaurant', priceRange: '$$', city: 'Ankara' },
      { name: 'Beypazarı Kurusu Restaurant', cuisine: 'Geleneksel Türk', type: 'restaurant', priceRange: '$$', city: 'Ankara' },
      { name: 'Ayaş Sofrası', cuisine: 'Türk Mutfağı', type: 'restaurant', priceRange: '$', city: 'Ankara' },
      
      // Modern Kafeler ve Restoranlar
      { name: 'Next Level Cafe', cuisine: 'Modern Cafe', type: 'cafe', priceRange: '$$', city: 'Ankara' },
      { name: 'Rooftop Restaurant', cuisine: 'Modern Türk', type: 'restaurant', priceRange: '$$$', city: 'Ankara' },
      { name: 'Garden Bistro', cuisine: 'Bistro', type: 'restaurant', priceRange: '$$', city: 'Ankara' },
      { name: 'Urban Kitchen', cuisine: 'Fusion', type: 'restaurant', priceRange: '$$$', city: 'Ankara' },
      { name: 'Craft Beer House', cuisine: 'Pub & Bira', type: 'bar', priceRange: '$$', city: 'Ankara' },
      { name: 'Wine House Ankara', cuisine: 'Şarap & Meze', type: 'bar', priceRange: '$$$', city: 'Ankara' },
      { name: 'Sushi Zen', cuisine: 'Japon Mutfağı', type: 'restaurant', priceRange: '$$$', city: 'Ankara' },
      { name: 'Taco Bell Ankara', cuisine: 'Meksika Mutfağı', type: 'restaurant', priceRange: '$$', city: 'Ankara' },
      { name: 'Subway Ankara', cuisine: 'Fast Food', type: 'restaurant', priceRange: '$', city: 'Ankara' },
      { name: 'Popeyes Ankara', cuisine: 'Fast Food', type: 'restaurant', priceRange: '$', city: 'Ankara' },
      
      // Özel Konsept Mekanlar
      { name: 'Kitap Cafe', cuisine: 'Kahve & Kitap', type: 'cafe', priceRange: '$$', city: 'Ankara' },
      { name: 'Board Game Cafe', cuisine: 'Oyun & Kahve', type: 'cafe', priceRange: '$$', city: 'Ankara' },
      { name: 'Art Gallery Restaurant', cuisine: 'Sanat & Yemek', type: 'restaurant', priceRange: '$$$', city: 'Ankara' },
      { name: 'Music Lounge', cuisine: 'Müzik & Bar', type: 'bar', priceRange: '$$$', city: 'Ankara' },
      { name: 'Hookah Lounge', cuisine: 'Nargile & Çay', type: 'cafe', priceRange: '$$', city: 'Ankara' },
      { name: 'Breakfast Palace', cuisine: 'Kahvaltı', type: 'restaurant', priceRange: '$$', city: 'Ankara' },
      { name: 'Vegan Corner', cuisine: 'Vegan', type: 'restaurant', priceRange: '$$', city: 'Ankara' },
      { name: 'Organic Market Cafe', cuisine: 'Organik', type: 'cafe', priceRange: '$$', city: 'Ankara' },
      { name: 'Street Food Corner', cuisine: 'Sokak Lezzeti', type: 'restaurant', priceRange: '$', city: 'Ankara' },
      { name: 'Dessert Heaven', cuisine: 'Tatlı & Dondurma', type: 'cafe', priceRange: '$$', city: 'Ankara' }
    ];

    // Türkçe karakter normalizasyonu
    const normalizeText = (text: string) => {
      return text.toLowerCase()
        .replace(/ğ/g, 'g')
        .replace(/ü/g, 'u') 
        .replace(/ş/g, 's')
        .replace(/ı/g, 'i')
        .replace(/ö/g, 'o')
        .replace(/ç/g, 'c')
        .replace(/Ğ/g, 'g')
        .replace(/Ü/g, 'u')
        .replace(/Ş/g, 's')
        .replace(/İ/g, 'i')
        .replace(/Ö/g, 'o')
        .replace(/Ç/g, 'c');
    };
    
    const normalizedSearchTerm = normalizeText(searchQuery);
    
    const results = restaurantDatabase
      .filter(restaurant => {
        const normalizedName = normalizeText(restaurant.name);
        const normalizedCuisine = normalizeText(restaurant.cuisine);
        
        // Tam eşleşme veya kısmi eşleşme
        return normalizedName.includes(normalizedSearchTerm) || 
               normalizedCuisine.includes(normalizedSearchTerm) ||
               // Kelime kelime arama
               normalizedSearchTerm.split(' ').some(word => 
                 word.length > 1 && (
                   normalizedName.includes(word) ||
                   normalizedCuisine.includes(word)
                 )
               );
      })
      .slice(0, 8)
      .map((restaurant, index) => ({
        id: index + 1,
        name: restaurant.name,
        cuisine: restaurant.cuisine,
        location: `${restaurant.city}, Türkiye`,
        address: `Örnek Mahalle, Örnek Sokak No:${index + 1}, ${restaurant.city}`,
        rating: (Math.random() * 2 + 3).toFixed(1),
        priceRange: restaurant.priceRange,
        type: restaurant.type,
        googlePlaceId: `mock_place_${index}`,
        phone: `+90 312 ${Math.floor(Math.random() * 900) + 100} ${Math.floor(Math.random() * 90) + 10} ${Math.floor(Math.random() * 90) + 10}`,
        website: `https://www.${restaurant.name.toLowerCase().replace(/[^a-z0-9]/g, '')}.com`,
        openNow: Math.random() > 0.3,
        photo: null
      }));

    res.json(results);
  } catch (error) {
    console.error('Restaurant search error:', error);
    res.status(500).json({ error: 'Restoran arama hatası' });
  }
});

export default router;