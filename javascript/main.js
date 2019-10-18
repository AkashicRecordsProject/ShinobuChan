$(document).ready(function() {

    var pageNumber = 1;
    var numberOfPagesLoaded = 0;
    var currentImagePosition = 0;
    var oldImagePosition = 0;
    var selectedTagList = "";
    var fullImageLink = "";

    const proxyurl = "https://cors-anywhere.herokuapp.com/";

    //creating the setting buttons
    const danbooruSettingButton = new buttons.SettingsButton($("#danbooru-button"), "searchDanbooru");
    const konachanSettingButton = new buttons.SettingsButton($("#konachan-button"), "searchKonachan");
    const yandereSettingButton = new buttons.SettingsButton($("#yandere-button"), "searchYandere");
    const sfwSettingButton = new buttons.SettingsButton($("#sfw-button"), "showSFW");
    const ecchiSettingButton = new buttons.SettingsButton($("#ecchi-button"), "showEcchi");
    const hentaiSettingButton = new buttons.SettingsButton($("#hentai-button"), "showHentai");
    const fullImageSettingButton = new buttons.SettingsButton($("#full-image-button"), "useFullSizeImage");
    const expandedImageContainer = new imageContainers.expandedImageContainer(fullImageSettingButton);
    const catalogContainer = new imageContainers.catalogContainer(expandedImageContainer);

    const app = document.getElementById('root');
    const searchbar = document.getElementById('search-bar');
    const searchResolution = document.getElementById("searchResolution");
    const pageInput = document.getElementById("page-select-input")
    const historySelector = document.getElementById("history-selector");

    const $previousPageButton = $("#previous-page-button");
    const $nextPageButton = $("#next-page-button");
    const $mascot = $("#mascot");
    const $loading = $("#loading-spinner")
    const $sidebarAllTagContainer = $("#sidebar-all-tags-container");
    const $sidebarImageTagContainer = $("#sidebar-selected-tag-container");

    const $searchButton = $("#search-button");

    var isLightTheme = JSON.parse(localStorage.getItem('isLightTheme')) || false;
    var historyList = JSON.parse(localStorage.getItem("history")) || [];

    setTheme(isLightTheme);
    //getting saved history
    loadHistory();
    //first load 
    loadPage();

    //on history selector clicked search for the value
    historySelector.addEventListener('change', (event) => {
        searchbar.value = event.target.options[event.target.selectedIndex].text;
        search(searchbar.value);
    });

    //on enter click setting search to search bar value and calling search function
    searchbar.addEventListener("keyup", function(event) {
        //enter click
        if (event.keyCode === 13) {
            search(searchbar.value);
        }
    });
    //on search button click setting search to search bar value and calling search function
    $searchButton.click(function() {
        search(searchbar.value);
    });

    //handling keyboard navigation
    $(document).keydown(function(event) {

        //if users not typing in the search bar
        if ($("#searchbar").is(":focus") === false) {
            //f click
            if (event.keyCode === 70) {
                fullImageSettingButton.button.click();

                if (expandedImageContainer.isVisible())
                    expandedImageContainer.reloadImage();
            }
            //t click
            if (event.keyCode === 84) {
                isLightTheme = !isLightTheme;
                localStorage.setItem("isLightTheme", isLightTheme);
                setTheme(isLightTheme);
            }
            //c click
            if (event.keyCode == 67) {
                clearHistory();
            }
        }

        //if catalog is showing
        if (!expandedImageContainer.isVisible()) {
            //back arrow click
            if (event.keyCode == 37) {
                $previousPageButton.click();
            } //forward arrow click
            if (event.keyCode == 39) {
                $nextPageButton.click();
            } //up arrow click
            if (event.keyCode == 38) {
                event.preventDefault();
                $(".image")[0].click();
            }
        } //if expanded image is showing 
        else {
            //forward arrow click
            if (event.keyCode === 39) {
                expandedImageContainer.goToNextImage();
            } //back arrow click
            else if (event.keyCode === 37) {
                expandedImageContainer.goToPreviousImage();
            } //esc, up arrow, down arrow click 
            else if (event.keyCode == 40 || event.keyCode == 27 || event.keyCode == 38) {
                event.preventDefault();
                expandedImageContainer.closeImage();
            } //space bar clicked
            else if (event.keyCode == 32) {
                event.preventDefault();
                expandedImageContainer.togglePlayPauseVideo();
            }
        }

    });

    //adding or removing main_light.css style
    function setTheme(isLightTheme) {
        if (isLightTheme) {
            $('head').append('<link rel="stylesheet" href="./style/main_light.css" type="text/css" />');
        } else {
            $('link[rel=stylesheet][href~="./style/main_light.css"]').remove();
        }
    }


    //on page input change go to the selected page
    pageInput.addEventListener("keyup", function(event) {
        //enter click
        if (event.keyCode === 13) {
            goToPage(this.value);
        }
    });

    //on next page click 
    $nextPageButton.click(function() {
        goToPage(pageNumber + 1);

    });

    $previousPageButton.click(function() {
        goToPage(pageNumber - 1);
    });

    function goToPage(page) {
        pageNumber = page;
        //show previous page button if not on first page
        if (pageNumber <= 1)
            pageNumber = 1;
        else
            $previousPageButton.show();

        loadPage();
    }

    //clearing tags from sidebar selected image tags and adding new tags from the tag list
    function createSelectedImageTagList(tagList) {
        //clearing tags from side bar
        $sidebarImageTagContainer.empty();
        //scrolling back to top
        $sidebarImageTagContainer.scrollTop = 100;
        tagList.sort();
        //adding selected tags to the top of the list
        tagList = Array.from(new Set([...selectedTagList.split(" "), ...tagList]));
        tagList.splice(tagList.indexOf(""), 1);
        createTag(tagList, $sidebarImageTagContainer, false);
    }

    //clearing tags from sidebar catalog tags and adding new tags from the tag list
    function createCatalogTagList(tagList) {
        //clearing tags from side bar
        $sidebarAllTagContainer.empty();
        //clearing seachbar suggestions 
        $('#search-bar-tags').html("");
        //scrolling back to top
        $sidebarAllTagContainer.scrollTop = 100;
        tagList.sort();
        //adding selected tags to the top of the list
        tagList = Array.from(new Set([...selectedTagList.split(" "), ...tagList]));
        tagList.splice(tagList.indexOf(""), 1);
        createTag(tagList, $sidebarAllTagContainer, true);
    }
    //creating the tag buttons and setting their behavior
    function createTag(tagList, tagContainerr, addToSearch) {

        tagList.forEach(tag => {
            var button = document.createElement("button");
            button.innerHTML = tag;
            button.classList.add("tag-item");

            //setting style on selected tags
            if (selectedTagList.split(" ").includes(tag))
                button.classList.add("selected-tag");

            tagContainerr.append(button);
            //adding tag to seachbar suggestion list
            if (addToSearch)
                $('#search-bar-tags').append("<option value='" + tag + "'>");


            button.onclick = function() {

                var tags = selectedTagList.split(" ");
                //preventing duplicate tags
                if (tags.includes(tag))
                    tags.splice(tags.indexOf(tag), 1);
                else
                    tags.push(tag)

                search(tags.join(' '));
            }
        });

    }
    //checking to see if all pages are loaded, setting the catalog tags, and showing the catalog container 
    function onLoaded() {

        $loading.hide();

        var pagesToLoad = 0;
        //adding number of pages to load based on how many request are being made
        if (danbooruSettingButton.isSelected)
            pagesToLoad++;
        if (konachanSettingButton.isSelected)
            pagesToLoad++;
        if (yandereSettingButton.isSelected)
            pagesToLoad++;

        //showing the catalog container and creating the tags after all pages are loaded
        if (pagesToLoad == numberOfPagesLoaded) {
            //letting the user click
            $("body").removeClass("disable")

            catalogContainer.show();
            createCatalogTagList(catalogContainer.getTags());

            $sidebarAllTagContainer.show();
            $sidebarImageTagContainer.hide();
            //no images found preventing going to the next page and showing the mascot
            if (catalogContainer.getNumberOfImages() < 1) {
                $nextPageButton.hide();
                $mascot.show();
            } //not the last page showing next page button 
            else {
                $nextPageButton.show();
                $mascot.hide();
            }
            //showing the previous button if not on the first page
            if (pageNumber == 1)
                $previousPageButton.hide();
            else if (pageNumber == 2)
                $previousPageButton.show();
        } //hiding the catalog until all pages are loaded
        else {
            catalogContainer.hide();
        }

    }

    //adding saved history values to the history Selector
    function loadHistory() {
        for (var i = 0; i < historyList.length; i++) {
            var option = $("<option></option>");
            $(option).val(0);
            $(option).html(historyList[i]);
            $(historySelector).append(option);
        }
    }

    //adding searches to the history in LIFO order
    function addToHistory(item) {
        //preventing empty tags from being added to history
        if (/\S/.test(item) && typeof(item) != "undefined") {
            historyList.unshift(item);
            var option = $("<option></option>");
            $(option).val(0);
            $(option).html(item);
            $(historySelector).prepend(option);
            //only keeping the last 30 searches
            if (historyList.length > 30) {
                historyList.pop();
                document.getElementById("history-selector").remove(30);
            }
            //saving history to local storage
            localStorage.setItem("history", JSON.stringify(historyList));
        }
    }

    //removing all values from history selector and clearing local history
    function clearHistory() {
        var i;
        for (i = document.getElementById("history-selector").options.length - 1; i >= 0; i--) {
            document.getElementById("history-selector").remove(i);
        }
        historyList = [];
        localStorage.setItem("history", JSON.stringify(historyList));
    }

    //adding search to history setting the page number to 1 and loading pages
    function search(tags) {
        selectedTagList = tags;
        addToHistory(tags);
        pageNumber = 1;
        loadPage();
    }
    //setting the search bar and page input values and calling load content
    function loadPage() {
        $("#page-select-input").val(pageNumber);
        searchbar.value = selectedTagList;

        loadContent(createURL("https://konachan.com/post.json?"),
            createURL("https://yande.re/post.json?"),
            createURL("https://danbooru.donmai.us/posts.json?"));

    }

    //uses the settings and selected tags to create a URL
    function createURL(URL) {
        //creating the basic url
        var url = URL +
            "page=" + pageNumber +
            "&tags=" + selectedTagList;

        var resolution = $("#search-bar-resolution-selector option:selected");
        //adding resolution to the URL
        if (resolution.index() != 0) {
            if (resolution.index() <= 4) {
                url += "+width:" + resolution.html().split("x")[0];
                url += "+height:" + resolution.html().split("x")[1];
            } else {
                url += "+width:>=" + resolution.val();
            }
        }
        //adding image rating to the URL
        if (sfwSettingButton.isSelected && ecchiSettingButton.isSelected && hentaiSettingButton.isSelected)
            url += "";
        else if (sfwSettingButton.isSelected && ecchiSettingButton.isSelected)
            url += "+rating:questionableless";
        else if (hentaiSettingButton.isSelected && ecchiSettingButton.isSelected)
            url += "+rating:questionableplus";
        else if (sfwSettingButton.isSelected)
            url += "+rating:s";
        else if (ecchiSettingButton.isSelected)
            url += "+rating:q";
        else if (hentaiSettingButton.isSelected)
            url += "+rating:e";

        return url;
    }

    //adding images to catalog container from json 
    function onJsonLoad(Json) {
        try {
            JSON.parse(Json).forEach(image => {
                //passing toggleTags so they can be updated on middle click
                catalogContainer.addImageFromJson(image, toggleTags);
            });
        } catch (error) {
            console.log(error);
        }

        numberOfPagesLoaded++;
        onLoaded();
    }

    //handling middle click on images
    function toggleTags(isSameImage, imageJson) {

        //checking to see if json is null
        if (typeof(imageJson) == "undefined") {
            return;
        }

        //used to show all catalog tags when catalog container is clicked
        if (imageJson == -1) {
            if ($sidebarImageTagContainer.is(":visible")) {
                $sidebarAllTagContainer.show();
                $sidebarImageTagContainer.hide();
            }
            return;
        }
        //show selected image tags if not already selected
        if (!isSameImage || $sidebarImageTagContainer.is(":hidden")) {
            $sidebarAllTagContainer.hide();
            $sidebarImageTagContainer.show();
            //for konachan and yandere
            if (imageJson.tags != null) {
                createSelectedImageTagList(imageJson.tags.split(" "));
            } //for danbooru
            else {
                createSelectedImageTagList(imageJson.tag_string_general.split(" ").concat(imageJson.tag_string_character.split(" ")).concat(imageJson.tag_string_copyright.split(" ")).concat(imageJson.tag_string_artist.split(" ")));
            }

        } //show catalog container tags 
        else if ($sidebarImageTagContainer.is(":visible")) {
            $sidebarAllTagContainer.show();
            $sidebarImageTagContainer.hide();
        }
    }

    //making request from sites for json 
    function loadContent(konachanURL, yandereURL, danbooruURL) {

        $loading.show();
        catalogContainer.clearImages();

        currentImagePosition = 0;
        numberOfPagesLoaded = 0;

        $("body").addClass("disable")

        //if no site is selected use konachan as default
        if (!konachanSettingButton.isSelected && !danbooruSettingButton.isSelected && !yandereSettingButton.isSelected) {
            konachanSettingButton.button.click();
        }
        //if no image rating is selected use sfw as default, or if hentai and sfw are selected default to sfw
        if (!sfwSettingButton.isSelected && !ecchiSettingButton.isSelected && !hentaiSettingButton.isSelected)
            sfwSettingButton.button.click();
        else if (sfwSettingButton.isSelected && hentaiSettingButton.isSelected && !ecchiSettingButton.isSelected)
            hentaiSettingButton.button.click();


        //requesting json file
        const KonachanRequest = new XMLHttpRequest();
        KonachanRequest.open("GET", proxyurl + konachanURL);

        const yandareRequest = new XMLHttpRequest();
        yandareRequest.open("GET", proxyurl + yandereURL);
        // yandareRequest.withCredentials = true;

        const danboorRequest = new XMLHttpRequest();
        danboorRequest.open("GET", proxyurl + danbooruURL);

        //adding to catalog from json
        KonachanRequest.onload = function() {
            onJsonLoad(this.response);
        }

        yandareRequest.onload = function() {
            onJsonLoad(this.response);
        }

        danboorRequest.onload = function() {
            onJsonLoad(this.response);
        }

        //sending request
        if (konachanSettingButton.isSelected)
            KonachanRequest.send();
        if (yandereSettingButton.isSelected)
            yandareRequest.send();
        if (danbooruSettingButton.isSelected)
            danboorRequest.send();
    }

});