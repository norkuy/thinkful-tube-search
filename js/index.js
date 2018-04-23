// STATE
const state = {
    apiData: {},  
    currentVideo: {}, // overlay
    currentPage: '',
    searchWord: '', // navTo, ajax
};
// CACHED DOM ELEMENTS
const $search = $('[rel="js-search-btn"]');
const $body = $('body');
const $container = $('.container');

// SET FUNCTIONS
const setTokens = ({ nextPageToken, prevPageToken } = {}) => { 
    state.nextPageToken = nextPageToken;
    state.prevPageToken = prevPageToken;
};
const setSearchWord = () => state.searchWord = $('#searchField').val();
const setApiData = apiData => state.apiData = apiData;
const setVideo = video => state.currentVideo = video;
// const setPage = page => state.currentPage = page;

// API FUNCTION
const getDataFromAPI = ({ q, channelId, pageToken } = {}) => {
    const settings = {
        url: 'https://www.googleapis.com/youtube/v3/search',
        data: { 
          part: 'snippet',
          key: 'AIzaSyDeA5cvCmUpYL1cuskV3OsKDtVQZC9qFLM',
          maxResults: 24,
          type: 'video',
          q,
          pageToken,
          channelId
        },
        dataType: 'json',
        type: 'GET',
        success: setDataSuccess,
        error: logError
    }
    $.ajax(settings);
};

// SUCCESS/ERROR CALLBACKS
function setDataSuccess(data) {
  setTokens({ nextPageToken: data.nextPageToken, prevPageToken: data.prevPageToken });
  setApiData(data.items);
  createGrid(data, 4);
  setUpNavBtns();
};

const logError = (err) => console.log('err: ', err);

// SET UP PAGE
const createGrid = (data, cols) => {
    let columns = '';
    let rows = '';

    data.items.forEach((video, i) => {
      columns+=`<div class="col-${cols}">
                <a class="ytlink" href="https://www.youtube.com/embed/${video.id.videoId}" rel="video">
                    <div class="contain">
                        <div class="bg" style="background-image: url(${video.snippet.thumbnails.medium.url})">
                            <div class="overlayVid">
                                <img src="img/play-button.svg" class="playBtn" alt="play button">         
                            </div>
                        </div>
                    </div>
                    <div class="title">
                        <p>${video.snippet.title.length > 48 ? video.snippet.title.substring(0, 48) + '...' : video.snippet.title}</p>
                    </div>
                </a>
              </div>`;

        if ((i+1) % cols === 0) {
          rows+= `<div class="row">${columns}</div> \n`;
          columns='';
        }
    });

    const view = `<div class="wrapper">${rows}</div>`;
    $container.html(view);
};

const openOverlay = () => {
    const location = state.currentVideo.snippet;
    let overlay = `<section class='overlay'>
                    <div class='outer-wrapper'>
                            <h1 class="text-center videoTitle">${location.channelTitle}</h1>
                            <div class='wrapper'>
                                <iframe src="${`https://www.youtube.com/embed/${state.currentVideo.id.videoId}`}"></iframe>
                            </div>
                            <section class='btn-container text-center'>
                                <button class='btn channel'>MORE FROM THIS CHANNEL</button>
                                <button class="close">CLOSE</button>
                            </section>
                            <h2>DESCRIPTION</h2>
                            <div class="description">${location.description}</div>
                        </div>
                    </section>`;
    $body.append(overlay);
    setCSS('hidden');
}

const setUpNavBtns = () => {
    $('[rel="js-controls"] > [rel*="js-"]').hide();
    state.prevPageToken && $('[rel="js-prev"]').show();
    state.nextPageToken && $('[rel="js-next"]').show();
}

// navTo FUNCTIONS
const getToken = (el) => $(el).attr('rel') === 'js-prev' ? state.prevPageToken : state.nextPageToken;

const setArgs = (pageToken) => {
    return true ? { q: state.searchWord, pageToken } : { channelId: state.currentVideo.channelId, pageToken };
}

// EVENT LISTENERS
const navTo = () => {
    $body.on('click', '[rel="js-controls"]', e => {
        let currToken = getToken(e.target);
        let args = setArgs(currToken);
        getDataFromAPI(args);
    });
};
  
const searchBtnClick = () => {
    $search.on('click', e => {
        e.preventDefault();
        setSearchWord();
        getDataFromAPI({ q: state.searchWord });
    });
};

const videoClick = () => {
  $body.on('click', '[rel="video"]', e => {
    e.preventDefault();
    let idx = $('[rel="video"]').index( $(e.currentTarget) );
    setVideo(state.apiData[idx]);
    openOverlay();
  });
}

const setCSS = (val) => $body.css('overflow', val);

const removeOverlay = () => $body.on('click', '.close', () => {
    $('.overlay').remove();
    setCSS('initial');
});

$(
setUpNavBtns(),
searchBtnClick(),
videoClick(),
navTo(),
removeOverlay()
);

// data.reduce(function(prev, curr, idx, arr) {
//     if ((idx+1) % cols === 0) {
//         return prev + '<div class="row">' + arr.slice((idx+1)-cols, idx+1) + '</div>';
//     } else if ((idx+1) === arr.length && arr.length % cols !== 0){
//         return prev + '<div class="row">' + arr.slice(arr.length - (idx+1) % cols) + '</div>';
//     }
//     return prev + '';
// }, '');
