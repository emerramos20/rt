(function() {
    const M3U_URL = "http://planettvweb.com";
    let cachedMovies = [];
    let cachedCategories = [];

    function parseM3U(text) {
        const lines = text.split('\n');
        const movies = [];
        const categoriesSet = new Set();
        let currentItem = null;

        for (let i = 0; i < lines.length; i++) {
            const line = lines[i].trim();
            if (line.startsWith('#EXTINF:')) {
                currentItem = {};
                const nameMatch = line.match(/,(.+)\$/);
                currentItem.title = nameMatch ? nameMatch[1].trim() : "Película";
                
                const logoMatch = line.match(/tvg-logo="([^"]+)"/);
                currentItem.poster = logoMatch ? logoMatch[1] : "https://githubusercontent.com";
                
                const groupMatch = line.match(/group-title="([^"]+)"/);
                currentItem.category = groupMatch ? groupMatch[1] : "OTROS";
                categoriesSet.add(currentItem.category);
            } else if (line.startsWith('http') && currentItem) {
                currentItem.url = line;
                currentItem.id = "mov_" + Math.random().toString(36).substr(2, 9);
                movies.push(currentItem);
                currentItem = null;
            }
        }
        return { movies, categories: Array.from(categoriesSet) };
    }

    const PlanetTVPlugin = {
        init: async function() {
            try {
                const response = await fetch(M3U_URL);
                const text = await response.text();
                const parsed = parseM3U(text);
                cachedMovies = parsed.movies;
                cachedCategories = parsed.categories;
            } catch (error) {
                console.error("Error:", error);
            }
        },

        getHomeRows: async function() {
            if (cachedCategories.length === 0) {
                return [{ id: "loading", title: "Cargando Planet TV de NellyV...", items: [] }];
            }
            // Mostramos solo las primeras 15 categorías para que NO te diga que la lista es muy grande
            return cachedCategories.slice(0, 15).map(category => ({
                id: `cat_${category.replace(/\s+/g, '_')}`,
                title: category,
                items: []
            }));
        },

        getCategoryItems: async function(categoryId) {
            const cleanCatId = categoryId.replace("cat_", "");
            const targetCategory = cachedCategories.find(cat => cat.replace(/\s+/g, '_') === cleanCatId);
            if (!targetCategory) return [];

            const filtered = cachedMovies.filter(movie => movie.category === targetCategory);
            // Limitamos a 40 películas por fila para mantener la fluidez de la app
            return filtered.slice(0, 40).map(movie => ({
                id: movie.id,
                title: movie.title,
                poster: movie.poster,
                type: "movie"
            }));
        },

        getStreams: async function(itemId) {
            const movie = cachedMovies.find(m => m.id === itemId);
            if (movie) {
                return [{
                    title: movie.title,
                    url: movie.url,
                    type: "mp4"
                }];
            }
            return [];
        }
    };

    Kino.registerPlugin(PlanetTVPlugin);
})();
                                                  
