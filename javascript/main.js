$(document).ready(function() {

    var pageNumber = 1;
    var numberOfPagesLoaded = 0;
    var currentImagePosition = 0;
    var oldImagePosition = 0;
    var fullImageLink = "";
    var oldTagListSize = 0;
    var siteUrl = window.location.href.split('?')[0];
    var isLightTheme = JSON.parse(localStorage.getItem('isLightTheme')) || false;
    var historyList = JSON.parse(localStorage.getItem("history")) || [];

    //creating the setting buttons
    const danbooruSettingButton = new buttons.SettingsButton($("#danbooru-button"));
    const konachanSettingButton = new buttons.SettingsButton($("#konachan-button"));
    const yandereSettingButton = new buttons.SettingsButton($("#yandere-button"));
    const sfwSettingButton = new buttons.SettingsButton($("#sfw-button"));
    const ecchiSettingButton = new buttons.SettingsButton($("#ecchi-button"));
    const hentaiSettingButton = new buttons.SettingsButton($("#hentai-button"));
    const fullImageSettingButton = new buttons.SettingsButton($("#full-image-button"));
    const expandedImageContainer = new imageContainers.expandedImageContainer(fullImageSettingButton);
    const catalogContainer = new imageContainers.catalogContainer(expandedImageContainer);
    const booruImages = new booru.images();

    const $body = $("body");
    const $historySelector = $("#history-selector");
    const $pageInput = $("#page-select-input")
    const $searchbar = $("#search-bar");
    const $previousPageButton = $("#previous-page-button");
    const $nextPageButton = $("#next-page-button");
    const $mascot = $("#mascot");
    const $loading = $("#loading-spinner")
    const $sidebarAllTagContainer = $("#sidebar-all-tags-container");
    const $sidebarImageTagContainer = $("#sidebar-selected-tag-container");
    const $searchButton = $("#search-button");
    const $searchbarResolutionSelector = $("#search-bar-resolution-selector")
    const $sidebarPreviewContainer = $("#sidebar-preview-container");
    const $sidebarContainer = $("#sidebar-container")
    const $searchBarTags = $('#search-bar-tags')
    
    //getting parameters setting values
    $searchbarResolutionSelector.val(getUrlParam("size", 1));
    $searchbar.val(getUrlParam("tags", ""));
    fullImageSettingButton.setActive(parseInt(getUrlParam("full", 0)));

    pageNumber = parseInt(getUrlParam("page", 1));
    pageNumber = pageNumber < 1 ? 1 : pageNumber;
    $pageInput.val(pageNumber);
    //disabling the previous page button if on first page
    if(pageNumber == 1)
     $previousPageButton.addClass("disabled-navigation-button");


    //loading page
    document.title = "ShinobuChan | Page " + pageNumber + " | " + $searchbar.val().replace(/,/g, ' ');
    setTheme(isLightTheme);
    loadSettingButtonsFromParams();
    loadHistory();
    loadBooruPages();

    //on history selector clicked search for the value
    $historySelector.on('change', (event) => {
        $searchbar.val(event.target.options[event.target.selectedIndex].text);
        search();
    });
    //checking to see if selected tags are still valid
    $sidebarContainer.hover(function(){
        updateTagsSelection();
    });
    //on enter click setting search to search bar value and calling search function
    $searchbar.keyup(function(event) {
        //enter click
        if(event.keyCode === 13) {
            search();
        }//return, delete key click update the selected tags when 
        if(event.keyCode === 8 || event.keyCode === 46) {
            if(oldTagListSize != getSearchBarTags().length){
                oldTagListSize = getSearchBarTags().length;
                updateTagsSelection();
            } else if(oldTagListSize == 1 &&  $searchbar.val() == ""){
                updateTagsSelection();
            }
        }
    });
    //handling keyboard navigation
    $(document).keydown(function(event) {
        $searchbar.focusout(function(){
            updateTagsSelection();
        });
        //preventing shortcut keys from activating when searching
        if(!$searchbar.is(":focus") && !$pageInput.is(":focus")) {
            //f click toggle full image
            if(event.keyCode === 70) {
                fullImageSettingButton.button.click();

                if(expandedImageContainer.isVisible())
                    expandedImageContainer.reloadImage();
            }
            //t click toggle themes
            if(event.keyCode === 84) {
                isLightTheme = !isLightTheme;
                localStorage.setItem("isLightTheme", isLightTheme);
                setTheme(isLightTheme);
            }
            //c click clear history
            if(event.keyCode == 67) {
                clearHistory();
            }
            //if catalog is showing
            if(!expandedImageContainer.isVisible()) {
                //left arrow click go back a page
                if(event.keyCode == 37) {
                    $previousPageButton.click();
                } //right arrow click go to next page
                else if(event.keyCode == 39) {
                    $nextPageButton.click();
                } //up arrow click open first image
                else if(event.keyCode == 38) {
                    event.preventDefault();
                    $(".gallery-image")[0].click();
                } //return key click go to previous page 
                else if(event.keyCode == 8) {
                    window.history.back();
                }
                //s clicked set filter to SFW
     			if(event.keyCode == 83) {
                    sfwSettingButton.setActive(true);
                    ecchiSettingButton.setActive(false);
                    hentaiSettingButton.setActive(false);
                }
                //e clicked set filter to ecchi
                else if(event.keyCode == 69) {    				
                    sfwSettingButton.setActive(false);
                    ecchiSettingButton.setActive(true);
                    hentaiSettingButton.setActive(false);
                }
                //h clicked set filter to hentai
                else if(event.keyCode == 72) {    				
                    sfwSettingButton.setActive(false);
                    ecchiSettingButton.setActive(false);
                    hentaiSettingButton.setActive(true);
                }
                //enter click while editing page select input
    			if(!$pageInput.is(":focus") && event.keyCode === 13) {
                    search();
    			}

            } //if expanded image is showing
            else {
                //forward arrow click go to next image
                if(event.keyCode === 39) {
                    expandedImageContainer.goToNextImage();
                } //back arrow click go to previous image
                else if(event.keyCode === 37) {
                    expandedImageContainer.goToPreviousImage();
                } //esc, up arrow, down arrow, return click  close expanded image view
                else if(event.keyCode == 40 || event.keyCode == 27 || event.keyCode == 38 || event.keyCode == 8) {
                    event.preventDefault();
                    expandedImageContainer.closeImage();
                } //space bar clicked toggle play pause for videos
                else if(event.keyCode == 32) {
                    event.preventDefault();
                    expandedImageContainer.togglePlayPauseVideo();
                }
                else if(event.keyCode == 79) {
                    expandedImageContainer.openImageInNewTab();
                }
            }
        }
        //comma, space bar clicked while seachbar is in focus update selected tags
        if(event.keyCode === 188 || event.keyCode === 32) {
            updateTagsSelection();
        }
    });
    //on search button click setting search to search bar value and calling search function
    $searchButton.click(function() {
        search();
    });
    //enter clicked when editing page value go to new page
    $pageInput.keyup(function(event) {
        if(event.keyCode === 13) 
            goToPage(this.value); 
    });
    //on next page button click 
    $nextPageButton.click(function() {
        $searchbar.val(getUrlParam("tags", ""));
        loadSettingButtonsFromParams();
        goToPage(pageNumber + 1);
    });
    //on previous page button click
    $previousPageButton.click(function() {
        $searchbar.val(getUrlParam("tags", ""));
        loadSettingButtonsFromParams();
        goToPage(pageNumber - 1);
    });
    //show previous page button if not on first page
    function goToPage(page) {
        pageNumber = parseInt(page);
        loadNewPage();
    }
    //assigning the setting buttons using parameters
    function loadSettingButtonsFromParams(){
        var originalBooruParams = getUrlParam("booru", "");
        var originalfilterParams = getUrlParam("filter", "s");

        danbooruSettingButton.setActive(originalBooruParams.includes("d"));
        konachanSettingButton.setActive(originalBooruParams.includes("k"));
        yandereSettingButton.setActive(originalBooruParams.includes("y"));
        sfwSettingButton.setActive(originalfilterParams.includes("s"));
        ecchiSettingButton.setActive(originalfilterParams.includes("e"));
        hentaiSettingButton.setActive(originalfilterParams.includes("h"));
    }
    //setting theme style
    function setTheme(isLightTheme) {
        if(isLightTheme) 
            $('head').append('<link rel="stylesheet" href="./style/main_light.css" type="text/css" />');
         else 
            $('link[rel=stylesheet][href~="./style/main_light.css"]').remove();
    }
    //adding selected-tag class to searched tags
    function updateTagsSelection(){
        //clearing selected tags
        $("button").removeClass("selected-tag");
        getSearchBarTags().forEach(tag => {
            $("button").filter(function() {
                return $(this).text() === tag;
            }).addClass("selected-tag");
        });
    }
    //clearing tags from sidebar selected image tags and adding new tags from the tag list
    function createSelectedImageTagList(tagList) {
        //clearing tags from side bar
        $sidebarImageTagContainer.empty();
        $sidebarImageTagContainer.scrollTop(0);
        tagList.sort();
        //adding selected tags to the top of the list
        tagList = Array.from(new Set([...getSearchBarTags(), ...tagList]));
        tagList.splice(tagList.indexOf(""), 1);
        createTag(tagList, $sidebarImageTagContainer, false);
    }
    //clearing tags from sidebar catalog tags and adding new tags from the tag list
    function createCatalogTagList(tagList) {
        //adding selected tags to the top of the list
        tagList.sort();
        tagList = Array.from(new Set([...getSearchBarTags(), ...tagList]));
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
            if(getSearchBarTags().includes(tag))
                button.classList.add("selected-tag");

            tagContainerr.append(button);
            //adding tag to seachbar suggestion list
            if(addToSearch)
                $searchBarTags.append("<option value='" + tag + "'>");

            //handling on tag button pressed
            button.onclick = function() {
                //removing selected tags
                if(getSearchBarTags().includes(tag)){
                    tmpSeach = ""
                    tmpSeach = getSearchBarTags().filter(e => e !== tag);
                    $searchbar.val(tmpSeach);
                    this.classList.remove("selected-tag");
                }//adding new tag to search bar
                else { 
                    if($searchbar.val() != "")
                        $searchbar.val($searchbar.val() + "," + tag);
                    else
                        $searchbar.val($searchbar.val() + tag);

                    this.classList.add("selected-tag");
                }
            }
        });
    }
    //handling middle click on images
    function toggleAllTagContainerVisibility(isSameImage, imageModel) {
        //used to show all catalog tags when catalog container is clicked
        if(imageModel == -1) {
            if($sidebarImageTagContainer.is(":visible")) {
                $sidebarAllTagContainer.show();
                $sidebarImageTagContainer.hide();
                $sidebarPreviewContainer.hide();
            }
            return;
        }
        //show selected image tags if not already selected
        if(!isSameImage || $sidebarImageTagContainer.is(":hidden")) {
            $sidebarAllTagContainer.hide();
            $sidebarImageTagContainer.show();
            $sidebarPreviewContainer.hide();
            createSelectedImageTagList(imageModel.tags);
        } //show catalog container tags 
        else if($sidebarImageTagContainer.is(":visible")) {
            $sidebarAllTagContainer.show();
            $sidebarImageTagContainer.hide();
            $sidebarPreviewContainer.show();
        }
    }
    //checking to see if all pages are loaded, creating the catalog and tags
    function onBooruLoad() {
        //adding number of pages to load based on how many request are being made
        numberOfPagesLoaded++;
        var pagesToLoad = 0;
        if(danbooruSettingButton.isSelected)
            pagesToLoad++;
        if(konachanSettingButton.isSelected)
            pagesToLoad++;
        if(yandereSettingButton.isSelected)
            pagesToLoad++;
        //all pages are loaded add images to the catalog and create tags
        if(pagesToLoad == numberOfPagesLoaded) {

            $body.removeClass("disable")
            $loading.hide();
            catalogContainer.show();
            //adding images to the catalog, passing middle click action to images
            booruImages.getImageList().forEach(image => {
                catalogContainer.addImage(image, toggleAllTagContainerVisibility);
            });

            createCatalogTagList(catalogContainer.getTags());
            $sidebarAllTagContainer.fadeIn(300);
            //no images found disable next page button and show the mascot
            if(catalogContainer.getNumberOfImages() < 1) {
                $nextPageButton.addClass("disabled-navigation-button");
                $mascot.show();
            }
        }
    }
    //adding saved history values to the history Selector
    function loadHistory() {
        for (var i = 0; i < historyList.length; i++) {
            var option = $("<option></option>");
            $(option).val(0);
            $(option).html(historyList[i]);
            $historySelector.append(option);
        }
    }
    //adding searches to the history in LIFO order
    function addToHistory(item) {
        //preventing empty tags from being added to history
        if(/\S/.test(item) && typeof(item) != "undefined") {
            historyList.unshift(item);
            var option = $("<option></option>");
            $(option).val(0);
            $(option).html(item);
            $historySelector.prepend(option);
            //only keeping the last 30 searches
            if(historyList.length > 30) {
                historyList.pop();
                document.getElementById("history-selector").remove(30);
            }
            //saving history to local storage
            localStorage.setItem("history", JSON.stringify(historyList));
        }
    }
    //removing all values from history selector and clearing local history
    function clearHistory() {
        for (var i = document.getElementById("history-selector").options.length - 1; i >= 0; i--) {
            document.getElementById("history-selector").remove(i);
        }
        historyList = [];
        localStorage.setItem("history", JSON.stringify(historyList));
    }
    //adding search to history setting the page number to 1 and loading pages
    function search() {
        //removing leading comma from search
        if($searchbar.val().substring(0,1) == ",")
            $searchbar.val($searchbar.val().replace(",", ""));

        addToHistory($searchbar.val());
        pageNumber = 1;
        loadNewPage();
    }
    //setting the parameters and loading a new page
    function loadNewPage() {

        siteUrl += "?";

        if(getSearchBarTags() != 0)
            siteUrl += "tags=" + getSearchBarTags() + "&";
    
        if(pageNumber < 1)
            pageNumber = 1;

        siteUrl += "page=" + pageNumber;
        siteUrl += "&size=" + $searchbarResolutionSelector.find(":selected").val();

        if(danbooruSettingButton.isSelected || konachanSettingButton.isSelected || yandereSettingButton.isSelected){
            siteUrl += "&booru=";
            if(danbooruSettingButton.isSelected)
             siteUrl += "d";
            if(konachanSettingButton.isSelected)
             siteUrl += "k";
            if(yandereSettingButton.isSelected)
             siteUrl += "y";
        }

        if(sfwSettingButton.isSelected || ecchiSettingButton.isSelected || hentaiSettingButton.isSelected) {
            siteUrl += "&filter=";
            if(sfwSettingButton.isSelected)
             siteUrl += "s";
            if(ecchiSettingButton.isSelected)
             siteUrl += "e";
            if(hentaiSettingButton.isSelected)
             siteUrl += "h";
        }

        if(fullImageSettingButton.isSelected)
            siteUrl += "&full=1";

         window.location.href = siteUrl;
    }
    //returning a list of searched tags
    function getSearchBarTags(){
        return $searchbar.val().split(",");
    }
    //creating a booru url using the selected settings
    function createBooruURL(booruURL) {
        //creating the basic url
        var url = booruURL +
            "page=" + pageNumber +
            "&tags=" + getSearchBarTags();
        //adding resolution to the URL
        var resolution = $searchbarResolutionSelector.find(":selected");
        if(resolution.index() != 0) {
            if(resolution.index() <= 4) {
                url += "+width:" + resolution.html().split("x")[0];
                url += "+height:" + resolution.html().split("x")[1];
            } 
            else{
                url += "+width:>=" + resolution.val();
            }
        }
        //adding image rating to the URL
        if(sfwSettingButton.isSelected && ecchiSettingButton.isSelected && hentaiSettingButton.isSelected)
            url += "";
        else if(sfwSettingButton.isSelected && ecchiSettingButton.isSelected)
            url += "+rating:questionableless";
        else if(hentaiSettingButton.isSelected && ecchiSettingButton.isSelected)
            url += "+rating:questionableplus";
        else if(sfwSettingButton.isSelected)
            url += "+rating:s";
        else if(ecchiSettingButton.isSelected)
            url += "+rating:q";
        else if(hentaiSettingButton.isSelected)
            url += "+rating:e";

        return url;
    }
    //getting json files from booru sites
    function loadBooruPages() {
        currentImagePosition = 0;
        numberOfPagesLoaded = 0;
        $body.addClass("disable");
        //if no site is selected use all sites as default
        if(!konachanSettingButton.isSelected && !danbooruSettingButton.isSelected && !yandereSettingButton.isSelected) {
            konachanSettingButton.button.click();
            danbooruSettingButton.button.click();
            yandereSettingButton.button.click();
        }
        //if no image rating is selected use sfw as default, or if hentai and sfw are selected default to sfw
        if(!sfwSettingButton.isSelected && !ecchiSettingButton.isSelected && !hentaiSettingButton.isSelected)
            sfwSettingButton.button.click();
        else if(sfwSettingButton.isSelected && hentaiSettingButton.isSelected && !ecchiSettingButton.isSelected)
            hentaiSettingButton.button.click();

        //creating the url and passing onLoad callback 
        if(konachanSettingButton.isSelected)
            booruImages.loadImages(createBooruURL("https://konachan.com/post.json?"), onBooruLoad);
        if(yandereSettingButton.isSelected)
            booruImages.loadImages(createBooruURL("https://yande.re/post.json?"), onBooruLoad);
        if(danbooruSettingButton.isSelected)
            booruImages.loadImages(createBooruURL("https://danbooru.donmai.us/posts.json?"), onBooruLoad);
    }

    function getUrlParam(parameter, defaultValue){
        var urlParameter = defaultValue;

        if(window.location.href.indexOf(parameter) > -1)
            urlParameter = getUrlVars()[parameter];

        return urlParameter;
    }

    function getUrlVars() {
        var vars = {};
        var parts = window.location.href.replace(/[?&]+([^=&]+)=([^&]*)/gi, function(m,key,value) {
            vars[key] = value;
        });
        return vars;
    }

});