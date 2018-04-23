/* Functions should either do something (modify) or answer something (query), but not both. */

/* STATE MODEL OR JUST VARIABLES */

let _nextToken; 
let _prevToken; 
let _apiData;
let _currentTotal = 0;
let _searchWord;
let _currentVideo;

const setNextToken = (token) => _nextToken = token;
const setPrevToken = (token) => _prevToken = token;
const setSearchWord = () => _searchWord = $('#searchField').val();
const setCount = (results, sign) => _currentTotal += results; 
const setApiData = (data) => _apiData = data;
const setVideo = (video) => _currentVideo = video;


/* CACHED DOM ELEMENTS */

const $search = $('#searchBtn');
const $body = $('body');
const $container = $('.container');
const $header = $('header');
const $nav = $('.nav');




const getDataFromAPI = ({ maxResults = 24, 
                          type = 'video',
                          channelId = undefined,
                          q = undefined,
                          pageToken = undefined } = {}) => {

    const settings = {
        url: 'https://www.googleapis.com/youtube/v3/search',
        data: { 
          part: 'snippet',
          key: '#',
          maxResults,
          q,
          pageToken,
          channelId,
          type
        },
        dataType: 'json',
        type: 'GET',
        success: setDataSuccess,
        error: setDataError
    }
    $.ajax(settings);
};

const searchBtnClick = () => {
    $search.on('click', e => {
        e.preventDefault();
        setPage('main');    
        setSearchWord();
        getDataFromAPI({ q: _searchWord });
    });
};

const setPage = (page) => {
    if (page === 'main')  {
        $body.addClass('main')
        $body.removeClass('channel');
    } else if (page === 'channel') {
        $body.addClass('channel');
        $body.removeClass('main');
    }
}

const getPage = () => {
    return $body.hasClass('main') ? 'main' : 'channel';
}

function videoClick() {
    $body.on('click', '.ytlink', function(e) {
        e.preventDefault();
        let currentVideo = _apiData.items[$(this).data('idx')];
        setVideo(currentVideo);
        openOverlay($(this));
    });
}

const closeClick = () => {
    $body.on('click', '.close', () => removeOverlay());
}

const channelClick = () => {
    $body.on('click', '.btn.channel', function() {
        setPage('channel');
        getDataFromAPI({ channelId: _currentVideo.snippet.channelId });
        removeOverlay();
    });
}

const removeOverlay = () => {
    $('.overlay').remove();
    $body.removeClass('overlayOn');
}

function setDataSuccess(data) {
  _currentTotal === 0 && setCount(data.pageInfo.resultsPerPage);
  setNextToken(data.nextPageToken);
  setPrevToken(data.prevPageToken);
  setApiData(data);

  createHeader();
  createResults(data.pageInfo.totalResults);
  createGrid(data, 3);
  createNavBtns();
};

function setDataError(err) {
    console.log('err: ', err);
};

const createHeader = () => {
    getPage() === 'main' ? txt = 'Thinkful Tube Search' : txt = `Channel: ${_currentVideo.snippet.channelTitle}`;
    $header.html(`<h1 class="text-center">${txt}</h1>`);
};

const openOverlay = (link) => {
    let video = link.attr('href');
    let overlay = `<section class='overlay'>
                    <div class='outer-wrapper'>
                            <h1 class="text-center videoTitle">${_currentVideo.snippet.title}</h1>
                            <div class='wrapper'>
                                <iframe src="${video}"></iframe>
                            </div>
                            <section class='btn-container'>
                                <button class='btn channel'>MORE FROM THIS CHANNEL</button>
                                <button class="close">CLOSE</button>
                            </section>
                        </div>
                    </section>`;
    $body.append(overlay);
    $body.addClass('overlayOn');
}

const createGrid = (data, cols) => {
    console.log(data);
    let columns = '';
    let rows = '';

    data.items.forEach((video, i) => {
      columns+=`<div class="col-${cols}">
                <a class="ytlink" href="https://www.youtube.com/embed/${video.id.videoId}" data-idx="${i}">
                    <div class="bg" style="background-image: url(${video.snippet.thumbnails.medium.url})">
                        <div class="overlayVid">
                            <img src="img/play-button.svg" class="playBtn" alt="play button">         
                        </div>
                    </div>
                    <div class="title">
                        <p>${video.snippet.title.length > 48 ? video.snippet.title.substring(0, 48) + '...' : video.snippet.title}</p>
                    </div>
                </a>
              </div>`;

        // if multiple of 4
        if ((i+1) % cols === 0) {
          rows+= `<div class="row">${columns}</div> \n`;
          columns='';
        }
    });

    const view = `<div class="wrapper">${rows}</div>`;
    $container.html(view);
};


const navTo = () => {
  $body.on('click', '.nav-btn', e => {
    numResults = _apiData.pageInfo.resultsPerPage;
    let moveTo = $(e.target).hasClass('prev') ? _prevToken : _nextToken;
    moveTo === _prevToken ? setCount(-numResults) : setCount(numResults);
    let args = { pageToken: moveTo };
    getPage() === 'main' ? args.q =  _searchWord : args.channelId = _currentVideo.snippet.channelId; 
    getDataFromAPI(args);
  });
};

const createResults = (totalResults) => {
    $('.results').html(`<h1 class="text-center">${_currentTotal} out of ${totalResults} results</h1>`);
};

const createNavBtns = () => {
    $nav.empty();
    _prevToken && $nav.append('<button class="nav-btn prev">PREV</button>');
    _nextToken && $nav.append('<button class="nav-btn next">NEXT</button>');
};

searchBtnClick();
videoClick();
navTo();
channelClick();
closeClick();