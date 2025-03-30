(function polyfill() {
  const relList = document.createElement("link").relList;
  if (relList && relList.supports && relList.supports("modulepreload")) {
    return;
  }
  for (const link of document.querySelectorAll('link[rel="modulepreload"]')) {
    processPreload(link);
  }
  new MutationObserver((mutations) => {
    for (const mutation of mutations) {
      if (mutation.type !== "childList") {
        continue;
      }
      for (const node of mutation.addedNodes) {
        if (node.tagName === "LINK" && node.rel === "modulepreload")
          processPreload(node);
      }
    }
  }).observe(document, { childList: true, subtree: true });
  function getFetchOpts(link) {
    const fetchOpts = {};
    if (link.integrity) fetchOpts.integrity = link.integrity;
    if (link.referrerPolicy) fetchOpts.referrerPolicy = link.referrerPolicy;
    if (link.crossOrigin === "use-credentials")
      fetchOpts.credentials = "include";
    else if (link.crossOrigin === "anonymous") fetchOpts.credentials = "omit";
    else fetchOpts.credentials = "same-origin";
    return fetchOpts;
  }
  function processPreload(link) {
    if (link.ep)
      return;
    link.ep = true;
    const fetchOpts = getFetchOpts(link);
    fetch(link.href, fetchOpts);
  }
})();
const fetchMovies = async (endpoint) => {
  const url = `https://api.themoviedb.org/3/${endpoint}`;
  const options = {
    method: "GET",
    headers: {
      accept: "application/json",
      Authorization: `Bearer ${"eyJhbGciOiJIUzI1NiJ9.eyJhdWQiOiI0N2NlOWYwOTc1NzY1ZjZkYjVmMzhlYWJkYTU3YmY4YyIsIm5iZiI6MTc0MjI2MjUwNi4yNjU5OTk4LCJzdWIiOiI2N2Q4ZDBlYTAwOWVhNjJiZGFlZWEwMDYiLCJzY29wZXMiOlsiYXBpX3JlYWQiXSwidmVyc2lvbiI6MX0.IaRoj_pm6ULc6XauMWFsROQxyJmjq8M029BDvv0H2Gc"}`
    }
  };
  try {
    const res = await fetch(url, options);
    if (!res.ok) {
      throw new Error("성공적으로 받아오지 못했습니다.");
    }
    const response = await res.json();
    return response ?? { results: [], page: 1, total_pages: 1, total_results: 0 };
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(error.message);
    }
  }
};
const getPopularMovies = async (page = 1) => {
  return fetchMovies(`movie/popular?language=ko-KR&page=${page}`);
};
const getSearchedMovies = async (searchKeyword, pageNumber = 1) => {
  const query = encodeURIComponent(searchKeyword);
  return fetchMovies(
    `search/movie?query=${query}&include_adult=false&language=ko-KR&page=${pageNumber}`
  );
};
const createElementWithAttributes = ({
  tag,
  id = "",
  className = "",
  attributes = {},
  textContent = "",
  children = []
}) => {
  const element = document.createElement(tag);
  if (id) {
    element.setAttribute("id", id);
  }
  if (className) {
    element.classList.add(...className.split(" "));
  }
  Object.entries(attributes).forEach(([key, value]) => {
    element.setAttribute(key, value);
  });
  if (textContent) {
    element.textContent = textContent;
  }
  if (Array.isArray(children) && children.length) {
    const fragment = document.createDocumentFragment();
    children.forEach((child) => {
      if (child instanceof HTMLElement) {
        fragment.append(child);
      } else {
        fragment.append(createElementWithAttributes(child));
      }
    });
    element.append(fragment);
  }
  return element;
};
const backgroundContainer = createElementWithAttributes({
  tag: "div",
  className: "background-container",
  children: [
    {
      tag: "div",
      className: "overlay overlay-background",
      attributes: {
        "aria-hidden": "true"
      }
    },
    {
      tag: "img",
      className: "overlay overlay-image",
      attributes: {
        src: "https://image.tmdb.org/t/p/w1920_and_h800_multi_faces/stKGOm8UyhuLPR9sZLjs5AkmncA.jpg",
        alt: "배너 이미지"
      }
    },
    {
      tag: "div",
      className: "top-rated-container",
      children: [
        {
          tag: "div",
          className: "top-rated-movie",
          children: [
            {
              tag: "div",
              className: "rate",
              children: [
                {
                  tag: "img",
                  className: "star",
                  attributes: {
                    src: "./images/star_empty.png"
                  }
                },
                {
                  tag: "span",
                  className: "rate-value",
                  textContent: "9.5"
                }
              ]
            },
            {
              tag: "div",
              className: "title",
              textContent: "인사이드 아웃2"
            }
          ]
        }
      ]
    }
  ]
});
function $(selector, scope = document) {
  if (!selector) throw new Error("No selector provided");
  return scope.querySelector(selector);
}
const handleError = (error) => {
  if (error instanceof Error) {
    const $main = $("main");
    $main == null ? void 0 : $main.replaceChildren();
    const $backgroundContainer = $(".background-container");
    $backgroundContainer == null ? void 0 : $backgroundContainer.remove();
    const $errorContainer = createElementWithAttributes({
      tag: "div",
      className: "error-container",
      children: [
        { tag: "h1", textContent: `${error.message} 새로고침 해주세요!` }
      ]
    });
    $main == null ? void 0 : $main.append($errorContainer);
  }
};
const skeletonContainer = (count) => {
  const $skeletonContainer = createElementWithAttributes({
    tag: "section",
    className: "skeleton-container",
    children: [
      {
        tag: "ul",
        className: "skeleton-thumbnail-list",
        children: Array.from({ length: count }, () => ({
          tag: "li",
          className: "skeleton-movie",
          children: [
            {
              tag: "div",
              className: "skeleton skeleton-thumbnail"
            },
            {
              tag: "div",
              className: "skeleton skeleton-desc"
            }
          ]
        }))
      }
    ]
  });
  return $skeletonContainer;
};
const getDetailMovies = async (id) => {
  return fetchMovies(`movie/${id}?language=ko-KR`);
};
const handleModalEvents = ($modal, closeButtonSelector = ".close-modal") => {
  if (!$modal) return;
  const closeModal = () => $modal.close();
  $modal.addEventListener("click", (event) => {
    if (event.target === $modal) {
      closeModal();
    }
  });
  const $closeButton = $(closeButtonSelector, $modal);
  $closeButton == null ? void 0 : $closeButton.addEventListener("click", closeModal);
};
const SCORE_TEXT = {
  2: "최악이에요",
  4: "별로예요",
  6: "보통이에요",
  8: "재미있어요",
  10: "명작이에요"
};
const createRatingBox = (movieId) => {
  const savedRatings = JSON.parse(localStorage.getItem("rateValue") || "{}");
  const initialScore = savedRatings[movieId] || 0;
  const $scoreText = createElementWithAttributes({
    tag: "span",
    className: "score-text",
    textContent: initialScore ? SCORE_TEXT[initialScore] : "0점"
  });
  const $score = createElementWithAttributes({
    tag: "span",
    className: "score",
    textContent: `(${initialScore}/10)`
  });
  const $stars = Object.keys(SCORE_TEXT).map((score) => {
    const starScore = Number(score);
    const $star = createElementWithAttributes({
      tag: "img",
      className: "star",
      attributes: { src: "./images/star_empty.png", alt: `${starScore}` }
    });
    $star.addEventListener("click", () => {
      updateStars(starScore);
      saveRating(movieId, starScore);
    });
    return $star;
  });
  const updateStars = (score) => {
    $scoreText.textContent = SCORE_TEXT[score] || "0점";
    $score.textContent = `(${score}/10)`;
    $stars.forEach((star, index) => {
      const starScore = (index + 1) * 2;
      star.src = starScore <= score ? "./images/star_filled.png" : "./images/star_empty.png";
    });
  };
  if (initialScore) updateStars(initialScore);
  const saveRating = (movieId2, score) => {
    const updatedRatings = {
      ...JSON.parse(localStorage.getItem("rateValue") || "{}"),
      [movieId2]: score
    };
    localStorage.setItem("rateValue", JSON.stringify(updatedRatings));
  };
  const starsWrapper = createElementWithAttributes({
    tag: "div",
    className: "stars-wrapper",
    children: [...$stars]
  });
  const myStarText = createElementWithAttributes({
    tag: "div",
    className: "my-star-text",
    children: [$scoreText, $score]
  });
  return createElementWithAttributes({
    tag: "div",
    className: "my-star-box",
    children: [starsWrapper, myStarText]
  });
};
const movieDetailModal = (detailMovie) => {
  const genres = detailMovie.genres.map((genre) => genre.name).join(", ");
  const releaseYear = new Date(detailMovie.release_date).getFullYear();
  const $movieDetailModal = createElementWithAttributes({
    tag: "div",
    className: "modal-container",
    children: [
      {
        tag: "button",
        id: "closeModal",
        className: "close-modal",
        children: [
          {
            tag: "img",
            attributes: { src: "./images/modal_button_close.png" }
          }
        ]
      },
      {
        tag: "div",
        className: "modal-image",
        children: [
          {
            tag: "img",
            attributes: {
              src: `https://image.tmdb.org/t/p/original/${detailMovie.poster_path}`
            }
          }
        ]
      },
      {
        tag: "div",
        className: "modal-description",
        children: [
          {
            tag: "div",
            className: "movie-info-container",
            children: [
              {
                tag: "h2",
                textContent: `${detailMovie.title}`
              },
              {
                tag: "p",
                className: "category",
                textContent: `${releaseYear} · ${genres}`
              },
              {
                tag: "p",
                className: "rate",
                children: [
                  {
                    tag: "p",
                    className: "rate-text",
                    textContent: "평점"
                  },
                  {
                    tag: "img",
                    className: "star",
                    attributes: { src: "./images/star_filled.png" }
                  },
                  {
                    tag: "span",
                    className: "average-rate",
                    textContent: String(detailMovie.vote_average).slice(0, 3)
                  }
                ]
              }
            ]
          },
          {
            tag: "div",
            className: "my-star-container",
            children: [
              {
                tag: "h4",
                className: "modal-subtitle",
                textContent: "내 별점"
              },
              createRatingBox(detailMovie.id)
            ]
          },
          {
            tag: "div",
            className: "overview-container",
            children: [
              {
                tag: "h4",
                className: "modal-subtitle",
                textContent: "줄거리"
              },
              {
                tag: "p",
                className: "detail-overview",
                textContent: `${detailMovie.overview}`
              }
            ]
          }
        ]
      }
    ]
  });
  return $movieDetailModal;
};
const noImage = "/javascript-movie-review/images/no_image.png";
const movieItem = (movie) => {
  const movieItemOptions = {
    tag: "li",
    className: "item",
    children: [
      {
        tag: "img",
        className: "thumbnail",
        attributes: {
          src: movie.poster_path === null ? noImage : `https://image.tmdb.org/t/p/w440_and_h660_face${movie.poster_path}`,
          alt: movie.title
        }
      },
      {
        tag: "div",
        className: "item-desc",
        children: [
          {
            tag: "p",
            className: "rate",
            children: [
              {
                tag: "img",
                className: "star",
                attributes: {
                  src: `./images/star_empty.png`
                }
              },
              {
                tag: "span",
                textContent: String(movie.vote_average).slice(0, 3)
              }
            ]
          },
          { tag: "strong", textContent: movie.title }
        ]
      }
    ]
  };
  const $movieItemOptions = createElementWithAttributes(movieItemOptions);
  $movieItemOptions.addEventListener("click", async () => {
    const $modal = $(".modal");
    const detailMovie = await getDetailMovies(movie.id);
    $modal.replaceChildren(movieDetailModal(detailMovie));
    handleModalEvents($modal);
    $modal.showModal();
  });
  return $movieItemOptions;
};
const movieList = (movies) => {
  const $movieList = createElementWithAttributes({
    tag: "ul",
    className: "thumbnail-list",
    children: movies.map((movie) => movieItem(movie))
  });
  return $movieList;
};
const MAX_PAGES = 500;
const movieContainer = (movieListTitle, movieData, loadMoreCallback) => {
  const $movieContainer = createElementWithAttributes({
    tag: "section",
    className: "movie-container",
    children: [
      {
        tag: "h2",
        textContent: movieListTitle
      }
    ]
  });
  const { results, total_pages, total_results } = movieData;
  if (total_results === 0) {
    const $noSearchContainer = createElementWithAttributes({
      tag: "div",
      className: "no_search_container",
      children: [
        {
          tag: "img",
          className: "no_search_result_img",
          attributes: {
            src: "./images/no_search_result.png",
            alt: "검색 결과가 없습니다."
          }
        },
        {
          tag: "h3",
          textContent: "검색 결과가 없습니다.",
          className: "no_search_result_text"
        }
      ]
    });
    $movieContainer.append($noSearchContainer);
    return $movieContainer;
  }
  const $movieList = movieList(results);
  $movieContainer.append($movieList);
  const $observerTarget = createElementWithAttributes({
    tag: "div",
    className: "observer-target",
    attributes: {
      style: "height: 10px; width: 100%;"
    }
  });
  $movieContainer.append($observerTarget);
  let pageNumber = 1;
  let isLoading = false;
  let hasMoreContent = pageNumber < total_pages && pageNumber < MAX_PAGES;
  const observer = new IntersectionObserver(
    async (entries) => {
      const entry = entries[0];
      if (entry.isIntersecting && !isLoading && hasMoreContent) {
        isLoading = true;
        pageNumber += 1;
        const $skeleton = skeletonContainer(20);
        $movieContainer.insertBefore($skeleton, $observerTarget);
        try {
          const { results: newResults } = await loadMoreCallback(pageNumber);
          newResults.forEach((movie) => {
            const $movieItem = movieItem(movie);
            $movieList.append($movieItem);
          });
          hasMoreContent = pageNumber < total_pages && pageNumber < MAX_PAGES;
          if (!hasMoreContent) {
            observer.disconnect();
          }
        } catch (error) {
          handleError(error);
        } finally {
          $skeleton.remove();
          isLoading = false;
        }
      }
    },
    {
      root: null,
      rootMargin: "100px",
      threshold: 0.1
    }
  );
  observer.observe($observerTarget);
  return $movieContainer;
};
const skeletonContainerTitle = () => {
  return createElementWithAttributes({
    tag: "h2",
    className: "skeleton skeleton-container-title"
  });
};
const onSearch = async (event) => {
  var _a, _b;
  if (!(event.target instanceof HTMLFormElement)) return;
  event.preventDefault();
  try {
    const formData = new FormData(event.target);
    const searchKeyword = formData.get("search-bar");
    if (typeof searchKeyword !== "string" || searchKeyword.length === 0) {
      return;
    }
    const $main = $("main");
    (_a = $(".background-container")) == null ? void 0 : _a.remove();
    $main == null ? void 0 : $main.classList.add("no-background");
    (_b = $(".movie-container")) == null ? void 0 : _b.remove();
    const $skeleton = skeletonContainer(20);
    $skeleton.prepend(skeletonContainerTitle());
    $main == null ? void 0 : $main.append($skeleton);
    const { results, page, total_pages, total_results } = await getSearchedMovies(searchKeyword);
    $skeleton.remove();
    const loadMoreCallback = async (pageNumber) => await getSearchedMovies(searchKeyword, pageNumber);
    const $searchedMovieContainer = movieContainer(
      `"${searchKeyword}" 검색 결과`,
      { results, page, total_pages, total_results },
      loadMoreCallback
    );
    $main == null ? void 0 : $main.append($searchedMovieContainer);
  } catch (error) {
    handleError(error);
  }
};
const initializeMovie = async () => {
  const $main = $("main");
  const $skeleton = skeletonContainer(20);
  $skeleton.prepend(skeletonContainerTitle());
  $main == null ? void 0 : $main.append($skeleton);
  try {
    const { results, page, total_pages, total_results } = await getPopularMovies();
    $skeleton.remove();
    const loadMoreCallback = async (pageNumber) => await getPopularMovies(pageNumber);
    const $movieContainer = movieContainer(
      "지금 인기 있는 영화",
      { results, page, total_pages, total_results },
      loadMoreCallback
    );
    $main == null ? void 0 : $main.append($movieContainer);
  } catch (error) {
    handleError(error);
  }
};
const $header = $("header");
$header == null ? void 0 : $header.append(backgroundContainer);
const initializeApp = async () => {
  try {
    await initializeMovie();
    const $searchBar = $("#search-bar-container");
    $searchBar == null ? void 0 : $searchBar.addEventListener("submit", onSearch);
  } catch (error) {
    handleError(error);
  }
};
initializeApp();
