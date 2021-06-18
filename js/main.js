/* Configuration files */
const moviesConfig = {
    baseURL: 'https://api.themoviedb.org/3',
    routes: {
        popular: {
            uri: '/movie/popular',
            params: [],
            inlineParams: [],
        },
        genres: {
            uri: '/genre/movie/list',
            params: [],
            inlineParams: [],
        },
        configuration: {
            uri: '/configuration',
            params: [],
            inlineParams: [],
        },
        details: {
            uri: '/movie/{id}',
            params: ['id'],
            inlineParams: [],
        },
        search: {
            uri: '/search/movie',
            params: [],
            inlineParams: [],
            inlineParams: ['query']
        }
    },
    apiKey: 'dd35ac16585fef9381761c24ee51c371',
};

const imagesConfig = {
    baseURL: 'http://image.tmdb.org/t/p/',
};

const panels = [
    {
        name: 'list',
        element: '#movies_list',
        default: true
    },
    {
        name: 'details',
        element: '#movies_details'
    },
    {
        name: 'search',
        element: '#movies_search'
    }
]

/* Util classes */
class PanelsOrganizer {
    constructor(panels) {
        this.panels = panels

        for (const panel of this.panels) {
            if (panel.default) {
                $(panel.element).show();
                panel.lastVisible = false;
                panel.isVisible = true;
            } else {
                $(panel.element).hide();
                panel.lastVisible = false;
                panel.isVisible = false;
            }
        }
    }

    setVisible(panelName) {
        for (const panel of this.panels) {
            panel.lastVisible = false;

            if (panel.isVisible) {
                panel.lastVisible = true;
            }
                
            panel.isVisible = false;
        }

        const panel = this.panels.find(panel => panel.name == panelName);
        if (panel) panel.isVisible = true;
        
        this.setVisualVisibility();
    }

    setVisualVisibility() {
        for (const panel of this.panels) {
            if (panel.isVisible)
                $(panel.element).show();
            else
                $(panel.element).hide();
        }
    }

    empty(panelName) {
        const panel = this.panels.find(panel => panel.name == panelName);
        if (panel) return $(panel.element).empty();
    }

    openLastPanel() {
        const panel = this.panels.find(panel => panel.lastVisible);
        if (panel) {
            this.setVisible(panel.name);
        }
        this.setVisualVisibility();
    }

    getLastPanel() {
        return this.panels.find(panel => panel.isVisible);
    }
}

class TMDBRequester {
    constructor(config) {
        this.baseURL = config.baseURL;
        this.routes = config.routes;
        this.apiKey = config.apiKey;
    }

    getUrl(route, params, inlineParams) {
        const routeUri = this.routes[route];
        if (!routeUri) {
            return;
        }

        let url = this.baseURL + routeUri.uri + '?api_key=' + this.apiKey;

        if (params) {
            for (const param of routeUri.params) {
                url = url.replace('{' + param + '}', params[param]);
            }
        }

        if (inlineParams) {
            for (const inlineParam of routeUri.inlineParams) {
                url += '&' + inlineParam + '=' + inlineParams[inlineParam];
            }
        }

        return url;
    }

    async request(route, params, inlineParams, callback) {
        return await $.get(this.getUrl(route, params, inlineParams), callback);
    }
}

class TMDBImageRequester extends TMDBRequester {
    constructor(config) {
        super(config);
    }

    getUrl(imagePath, imageSize = 'original') {
        return this.baseURL + '/' + imageSize + '/' + imagePath;
    }
}

/* Instantiation */
const movieRequest = new TMDBRequester(moviesConfig);
const imageRequest = new TMDBImageRequester(imagesConfig);

const panelsOrganizer = new PanelsOrganizer(panels);

/* Panels dynamic rendering */
buildMovies = async (movieRequester, imageRequester) => {
    const movies = await movieRequester.request('popular');
    const genres = await movieRequest.request('genres');
    const configuration = await movieRequest.request('configuration');

    for (item of movies.results) {
        item.genres = item.genre_ids.map(genre => genres.genres.find(g => g.id == genre).name).join(', ');
        item.poster_src = imageRequest.getUrl(item.poster_path);
    }

    const html = ejs.render(`
            <h1>Populares</h1>
            <div class="ui divider"></div>
            <div class="movies ui special cards">
                <% for (item of results) {%>
                    <div class="card movie">
                        <div class="blurring dimmable image">
                            <div class="ui dimmer">
                            <div class="content">
                                <div class="center">
                                    <button class="ui button red" onclick="detailsButtonOnClick('<%= item.id %>')" >Detalhes</button>
                                </div>
                            </div>
                            </div>
                            <img src="<%= item.poster_src %>">
                        </div>
                        <div class="content">
                            <a class="header"><%= item.original_title %></a>
                            <!-- <div class="meta">
                                <span class="date"><%= item.overview %></span>
                            </div> -->
                        </div>
                        <div class="extra content">
                            <a>
                                <i class="calendar icon"></i>
                                <%= item.release_date %>
                            </a>
                        </div>
                        <div class="extra content">
                            <a>
                                <i class="tags icon"></i>
                                <%= item.genres %>
                            </a>
                        </div>
                    </div>
                <% } %>
            </div>
        `,
        movies
    );
    $('#movies_list').append(html);
}

detailsButtonOnClick = async (id) => {
    const movieDetail = await movieRequest.request('details', { id });

    panelsOrganizer.setVisible('details');

    const html = ejs.render(`
        <div class="detail_title">
            <h1><%= title %></h1>
            <button class="ui button red" onclick="backOnClick()">
                <i class="arrow left icon"></i>
                Voltar
            </button>
        </div>
        <div class="ui divider"></div>
        <div class="details ui special cards">
            <div class="card detail">
                <div class="blurring dimmable image">
                    <div class="ui dimmer">
                        <div class="content">
                        </div>
                    </div>
                    <img src="<%= imageRequest.getUrl(backdrop_path) %>">
                </div>
                <div class="content">
                    <div class="meta detail_meta">
                        <span class="date"><%= tagline %></span>
                    </div>
                    <div class="description">
                        <span class="date"><%= overview %></span>
                    </div>
                </div>
                <div class="extra content">
                    <a>
                        <i class="tags icon"></i>
                        <%= genres.map(genre => genre.name).join(', ') %>
                    </a>
                </div>
                <div class="extra content">
                    <a>
                        <i class="flag icon"></i>
                        <%= production_countries.map(coutry => coutry.name).join(', ') %>
                    </a>
                </div>
                <div class="ui bottom attached button red">
                    <i class="mouse pointer"></i>
                    <a href="<%= homepage %>" target="_blank">Acessar página</a>
                </div>
            </div>
        </div>
        <div class="detail_title--mobile">
            <button class="ui button red" onclick="backOnClick()">
                <i class="arrow left icon"></i>
                Voltar
            </button>
        </div>
    `,
        movieDetail
    );
    $('#movies_details').append(html);
}

searchOnEnter = async () => {
    panelsOrganizer.empty('search');
    panelsOrganizer.empty('details');

    const inputValue = $('#search-input').val();
    const searchResult = await movieRequest.request('search', {}, { query: inputValue.replaceAll(' ', '+') });

    const genres = await movieRequest.request('genres');

    for (item of searchResult.results) {
        item.genres = item.genre_ids.map(genre => genres.genres.find(g => g.id == genre).name).join(', ');
        item.poster_src = imageRequest.getUrl(item.poster_path);
    }

    const html = ejs.render(`
            <div class="search_title">
                <h1>Resultados da Pesquisa por "<%= inputValue %>"</h1>
                <button class="ui button secondary" onclick="backToListFromDetail()">
                    <i class="close icon"></i>
                    Limpar
                </button>
            </div>
            <div class="ui divider"></div>
            <div class="movies ui special cards">
                <% for (item of results) {%>
                    <div class="card movie">
                        <div class="blurring dimmable image">
                            <div class="ui dimmer">
                            <div class="content">
                                <div class="center">
                                    <button class="ui button red" onclick="detailsButtonOnClick('<%= item.id %>')" >Detalhes</button>
                                </div>
                            </div>
                            </div>
                            <img src="<%= item.poster_src %>">
                        </div>
                        <div class="content">
                            <a class="header"><%= item.original_title %></a>
                            <!-- <div class="meta">
                                <span class="date"><%= item.overview %></span>
                            </div> -->
                        </div>
                        <div class="extra content">
                            <a>
                                <i class="calendar icon"></i>
                                <%= item.release_date %>
                            </a>
                        </div>
                        <div class="extra content">
                            <a>
                                <i class="tags icon"></i>
                                <%= item.genres %>
                            </a>
                        </div>
                    </div>
                <% } %>
            </div>
        `,
        { ...searchResult, inputValue }
    );
    $('#movies_search').append(html);

    panelsOrganizer.setVisible('search');
    setCardsDimm();
}

/* Util methods */
backToListFromDetail = () => {
    panelsOrganizer.setVisible('list');
    panelsOrganizer.empty('details');
    panelsOrganizer.empty('search');
    $('#search-input').val('');
}

backOnClick = () => {
    panelsOrganizer.openLastPanel();
    if (panelsOrganizer.getLastPanel() == 'list') {
        panelsOrganizer.empty('search');
    }
    panelsOrganizer.empty('details');
}

setCardsDimm = () => {
    $('.special.cards .image').dimmer({
        on: 'hover'
    });
}

setInputActions = () => {
    $('#search-input').keypress(ev => { if (ev.keyCode == 13) searchOnEnter();})
}

setDefaultLocalStorage = () => {
    localStorage.setItem('lastPanel', panels.find(panel => panel.default).name);
}

/* Document initialization */
$(document).ready(async _ => {
    await buildMovies(movieRequest, imageRequest);
    setCardsDimm();
    setInputActions();
    setDefaultLocalStorage();
});
