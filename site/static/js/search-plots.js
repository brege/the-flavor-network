// fuse.js options
function searchWithFuse(query, data) {
  const options = {
    shouldSort: true,
    threshold: 0.6,
    location: 0,
    distance: 100,
    maxPatternLength: 32,
    minMatchCharLength: 3,
    keys: [
      "id",
    ]
  };

  const fuse = new Fuse(data, options);
  let maxItems = 20;
  const results = fuse.search(query).slice(0, maxItems);

  return results;
}

// Get a reference to the search form and input field
const searchForm = document.getElementById('search-form');
const searchInput = document.getElementById('search-input');
const searchResultsContainer = document.getElementById('search-results-container');

const searchPath = $("#search-form").data("search-path");
//console.log('searchPath:', searchPath);

// Add an input event listener to the input field
searchInput.addEventListener('input', event => {
  const query = searchInput.value;
  // Check if the input field is empty, then clear the search results
  if (query.length === 0) {
    searchResultsContainer.innerHTML = '';
    return;
  }
  // Perform the search and display the results
  searchJSON(query, searchPath);
});

// Add a focus event listener to the input field
searchInput.addEventListener('focus', event => {
  const query = searchInput.value;
  searchInput.value = '';
});

// If the user is focused on the input field and presses the escape key, clear the search results
document.addEventListener('keydown', event => {
  if (event.key === 'Escape' && searchInput === document.activeElement) {
    searchResultsContainer.innerHTML = '';
  }
});

// If the user is focused on the input field and presses the up or
// down arrow keys, select the previous or next result
searchInput.addEventListener("keydown", event => {
  if (event.key === "ArrowUp" || event.key === "ArrowDown") {
    const current = document.querySelector(".selected");
    const results = document.querySelectorAll(".search-result");
    const index = Array.from(results).indexOf(current);
    if (event.key === "ArrowUp" && index > 0) {
      results[index].classList.remove("selected");
      results[index - 1].classList.add("selected");
      // scroll the selected item into view
      scrollIntoViewIfNeeded(results[index - 1]);

    }
    if (event.key === "ArrowDown" && index < results.length - 1) {
      results[index].classList.remove("selected");
      results[index + 1].classList.add("selected");
      // scroll the selected item into view
      scrollIntoViewIfNeeded(results[index + 1]);
    }
  }
  if(event.key === 'Enter') {
    event.preventDefault();
    const selectedResult = document.querySelector('.selected');
    if (selectedResult) {
      selectedResult.click();
    }
  }
});

// if the selected item is beyond the visible area of the scrollable div
// then scroll the div relative to the top of the div
function scrollIntoViewIfNeeded(element) {

  let searchResults = document.querySelector(".search-results");
  let searchResultsRect = searchResults.getBoundingClientRect();
  let elementRect = element.getBoundingClientRect();

  if (elementRect.top < searchResultsRect.top) {
    searchResults.scrollTop -= searchResultsRect.top - elementRect.top;
  } else if (elementRect.bottom > searchResultsRect.bottom) {
    searchResults.scrollTop += elementRect.bottom - searchResultsRect.bottom;
  }
}




// Perform the search and display the results
async function searchJSON(query, searchPath) {
  const response = await fetch(searchPath);
  const json = await response.json();
  const results = searchWithFuse(query, json);

  let maxItems = 20;
  searchResultsContainer.innerHTML = `
      <div class="search-results">
        <ul>
          ${results.slice(0, maxItems).map(result => `<li class="search-result" onclick="handleResultClick('${String(result.id)}')">${result.id}</li>`).join('')}
        </ul>
      </div>
  `;
  let searchResultsList = document.querySelectorAll(".search-result");
  if (searchResultsList.length > 0) {
    searchResultsList[0].classList.add("selected");
  }

  // the drop down should display with five items out of the 20
  // and then scroll
  let searchResults = document.querySelector(".search-results");
  searchResults.style.height = "14em";
  searchResults.style.overflow = "scroll";

}


let selectedResults = [];

// Add a click event listener to the search results
function handleResultClick(resultId) {
  searchInput.value = resultId;

  // Check if the resultId is in the selectedResults array
  if (!selectedResults.includes(resultId)) {
    // Add the resultId to the selectedResults array
    selectedResults.push(resultId);
    const resultBox = document.createElement('div');
    resultBox.innerHTML = resultId;
    resultBox.classList.add('result-box');
    // Add a click event listener to the result box
    resultBox.addEventListener('click', event => {
      resultBox.parentNode.removeChild(resultBox);
      selectedResults = selectedResults.filter(id => id !== resultId);
      console.log(selectedResults);
      // Pass the selelected results to the node/edge filter 
      // if filterNodesAndEdges is defined
      if (typeof filterNodesAndEdges === 'function') {
        filterNodesAndEdges(selectedResults);
      }
      if (typeof filterHistogram === 'function') {
        filterHistogramData(selectedResults);
      }
      if (typeof recipeApiTrigger === 'function') {
        recipeApiTrigger(selectedResults);
      }
    });
    // Insert the result box before the search form
    searchForm.parentNode.insertBefore(resultBox, searchForm);
  } else {
    // Remove the resultId from the selectedResults array and DOM
    selectedResults = selectedResults.filter(id => id !== resultId);
    document.querySelectorAll('.result-box').forEach(resultBox => {
      if (resultBox.innerHTML === resultId) {
        resultBox.parentNode.removeChild(resultBox);
      }
    });
  }

  // Filter the nodes and edges based on the selected results
  if (typeof filterNodesAndEdges === 'function') {
    filterNodesAndEdges(selectedResults);
  }
  if (typeof filterHistogramData === 'function') {
    filterHistogramData(selectedResults);
  }
	if (typeof recipeApiTrigger === 'function') {
		recipeApiTrigger(selectedResults);
	}
  // Clear the search results and input field
  searchResultsContainer.innerHTML = '';
  searchInput.value = '';     

}
