$(document).ready(function() {

    var pageNumber = 1;
    var numberOfPagesLoaded = 0;
    var currentImagePosition = 0;
    var oldImagePosition = 0;

    var tagList = [];
    var selectedTagList = selectedTagList = "";
    var fullImageLink = "";
    
    const classSidebarSettingsButtonDisabled = "sidebarSettingsButtonDisabled";
    const proxyurl = "https://cors-anywhere.herokuapp.com/";

    const app = document.getElementById('root');
    const catalogContainer = document.getElementById('catalogContainer');
    const searchbar = document.getElementById('searchbar');
    const searchResolution = document.getElementById("searchResolution");
    const pageInput = document.getElementById("pageInput")

    const $expandedImageContainer = $("#expandedImageContainer");
    const $expandedImage = $(".expandedImage");
    const $expandedWebM = $(".expandedWebM");
    const $previousPageButton = $("#previousPageButton");
    const $nextPageButton = $("#nextPageButton");
    const $danbooruButton = $("#danbooruButton");
    const $konachanButton = $("#konachanButton");
    const $fullImageButton = $("#fullImageButton");
    const $sfwButton = $("#sfwButton");
    const $ecchiButton = $("#ecchiButton");
    const $hentaiButton = $("#hentaiButton");
    const $yandereButton = $("#yandereButton");
    const $mascot = $("#mascot");
    const $loading = $("#loading")
    const $sidebarAllTagContainer = $("#sidebarAllTagContainer");
    const $sidebarImageTagContainer = $("#sidebarImageTagContainer");

    var useFullSizeImage = JSON.parse(localStorage.getItem('useFullSizeImage'));
    var showSFW = JSON.parse(localStorage.getItem('showSFW'));
    var showEcchi = JSON.parse(localStorage.getItem('showEcchi'));
    var showHentai = JSON.parse(localStorage.getItem('showHentai'));
    var searchDanbooru = JSON.parse(localStorage.getItem('searchDanbooru'));
    var searchKonachan = JSON.parse(localStorage.getItem('searchKonachan'));
    var searchYandere = JSON.parse(localStorage.getItem('searchYandere'));
    var isLightTheme = JSON.parse(localStorage.getItem('isLightTheme'));

    $mascot.hide();
    $expandedImageContainer.hide();
    $previousPageButton.hide();

    if (useFullSizeImage == null)
        useFullSizeImage = false;

    if (showSFW == null)
        showSFW = true;

    if (showEcchi == null)
        showEcchi = false;

    if (showHentai == null)
        showHentai = false;

    if (searchDanbooru == null)
        searchDanbooru = false;

    if (searchKonachan == null)
        searchKonachan = true;

    if (searchYandere == null)
        searchYandere = false;

    if (isLightTheme == null)
        isLightTheme = false;

    if (useFullSizeImage == false)
        $fullImageButton.addClass(classSidebarSettingsButtonDisabled);

    if (showSFW == false)
        $sfwButton.addClass(classSidebarSettingsButtonDisabled);

    if (showEcchi == false)
        $ecchiButton.addClass(classSidebarSettingsButtonDisabled);

    if (showHentai == false)
        $hentaiButton.addClass(classSidebarSettingsButtonDisabled);

    if (searchDanbooru == false)
        $danbooruButton.addClass(classSidebarSettingsButtonDisabled);

    if (searchKonachan == false)
        $konachanButton.addClass(classSidebarSettingsButtonDisabled);

    if (searchYandere == false)
        $yandereButton.addClass(classSidebarSettingsButtonDisabled);


    setTheme(isLightTheme);

    pageInput.addEventListener("keyup", function(event) {

        if (event.keyCode === 13) {

            if (this.value < 1)
                this.value = 1;

            if (this.value >= 2)
                $previousPageButton.show();

            pageNumber = this.value;
            goToPage();

        }
    });


    searchbar.addEventListener("keyup", function(event) {

        if (event.keyCode === 13) {
            selectedTagList = searchbar.value;
            search();
        }
    });


    $(document).keydown(function(event) {

        if ($("#searchbar").is(":focus") === false) {

            if (event.keyCode === 70) {
                $fullImageButton.click();

                if ($expandedImageContainer.is(":visible"))
                    $(".image")[currentImagePosition].click();
            }

            if (event.keyCode === 84) {
                isLightTheme = !isLightTheme;
                localStorage.setItem("isLightTheme", isLightTheme);
                setTheme(isLightTheme);
            }
        }

        if ($expandedImageContainer.is(":hidden"))
            return;

        if (event.keyCode === 39) {
            try {
                $(".image")[currentImagePosition + 1].click();
            } catch (error) {
                expandedImageContainer.click();
            }
        } else if (event.keyCode === 37) {

            if (currentImagePosition >= 1)
                $(".image")[currentImagePosition - 1].click();
            else
                expandedImageContainer.click();
        } else if (event.keyCode == 40) {

            event.preventDefault();
            expandedImageContainer.click();
        } else if (event.keyCode == 32) {

            event.preventDefault();
            if ($expandedWebM[0].paused == true) {
                $expandedWebM[0].play();
            } else {
                $expandedWebM[0].pause();
            }
        }

    });


    $("#clearButton").click(function() {
        selectedTagList = "";
        search();
    });


    $("#searchButton").click(function() {
        selectedTagList = searchbar.value;
        search();
    });


    $danbooruButton.click(function() {
        searchDanbooru = !searchDanbooru;
        localStorage.setItem("searchDanbooru", searchDanbooru);
        toggleSettingsItem(this, searchDanbooru);

    });

    $konachanButton.click(function() {
        searchKonachan = !searchKonachan;
        localStorage.setItem("searchKonachan", searchKonachan);
        toggleSettingsItem(this, searchKonachan);
    });

    $yandereButton.click(function() {
        searchYandere = !searchYandere;
        localStorage.setItem("searchYandere", searchYandere);
        toggleSettingsItem(this, searchYandere);
    });

    $sfwButton.click(function() {
        showSFW = !showSFW;
        localStorage.setItem("showSFW", showSFW);
        toggleSettingsItem(this, showSFW);
    });

    $ecchiButton.click(function() {
        showEcchi = !showEcchi;
        localStorage.setItem("showEcchi", showEcchi);
        toggleSettingsItem(this, showEcchi);
    });

    $hentaiButton.click(function() {
        showHentai = !showHentai;
        localStorage.setItem("showHentai", showHentai);
        toggleSettingsItem(this, showHentai);
    });


    $fullImageButton.click(function() {
        useFullSizeImage = !useFullSizeImage;
        localStorage.setItem("useFullSizeImage", useFullSizeImage);
        toggleSettingsItem(this, useFullSizeImage);
    });


    function toggleSettingsItem(button, state) {
        if (state)
            $(button).removeClass(classSidebarSettingsButtonDisabled);
        else
            $(button).addClass(classSidebarSettingsButtonDisabled);
    }

    function setTheme(isLightTheme) {
        if (isLightTheme) {
            $('head').append('<link rel="stylesheet" href="./style/main_light.css" type="text/css" />');
        } else {
            $('link[rel=stylesheet][href~="./style/main_light.css"]').remove();
        }
    }


    $nextPageButton.click(function() {

        pageNumber++;
        goToPage();
        $expandedImageContainer.hide();

        if (pageNumber >= 2)
            $previousPageButton.show();

    });


    $previousPageButton.click(function() {

        pageNumber--;
        goToPage();
        $expandedImageContainer.hide();

        if (pageNumber <= 1)
            $previousPageButton.hide();

    });


    goToPage();

    function createImageContainer(imageJson) {

        var catalogItem = document.createElement("div");
        var image = document.createElement("img");
        catalogItem.id = "catalogItem"

        var samepleImageURL;
        var fileExt;

        try {
            imageJson.tags.split(" ").forEach(tag => {
                if (!tagList.includes(tag))
                    tagList.push(tag)
            });

            image.src = imageJson.preview_url;
            samepleImageURL = imageJson.sample_url;

        } catch (error) {

            imageJson.tag_string_general.split(" ").forEach(tag => {
                if (!tagList.includes(tag))
                    tagList.push(tag)
            });

            imageJson.tag_string_character.split(" ").forEach(tag => {
                if (!tagList.includes(tag))
                    tagList.push(tag)
            });

            imageJson.tag_string_copyright.split(" ").forEach(tag => {
                if (!tagList.includes(tag))
                    tagList.push(tag)
            });

            imageJson.tag_string_artist.split(" ").forEach(tag => {
                if (!tagList.includes(tag))
                    tagList.push(tag)
            });


            image.src = imageJson.preview_file_url;
            samepleImageURL = imageJson.large_file_url;
            fileExt = imageJson.file_ext;
        }

        if (samepleImageURL == null)
            return;

        if (imageJson.width > imageJson.height)
            image.id = "catalogImageW";
        else
            image.id = "catalogImageH";

        image.classList.add("image");
        catalogItem.appendChild(image);
        catalogContainer.appendChild(catalogItem);

        var position = currentImagePosition;
        currentImagePosition++;

        image.addEventListener('auxclick', function(event) {
            event.stopPropagation();

            oldImagePosition = currentImagePosition;
            currentImagePosition = position;

            if (oldImagePosition != currentImagePosition || $sidebarImageTagContainer.is(":hidden")) {
                $sidebarAllTagContainer.hide();
                $sidebarImageTagContainer.show();
                if (imageJson.tags != null) {
                    createImageTagList(imageJson.tags.split(" "));
                } else {

                    createImageTagList(imageJson.tag_string_general.split(" ").concat(imageJson.tag_string_character.split(" ")).concat(imageJson.tag_string_copyright.split(" ")).concat(imageJson.tag_string_artist.split(" ")));
                }

            } else if ($sidebarImageTagContainer.is(":visible")) {
                $sidebarAllTagContainer.show();
                $sidebarImageTagContainer.hide();
            }

        });


        image.onclick = function() {

            $expandedImageContainer.show();
            oldImagePosition = currentImagePosition;
            currentImagePosition = position;
            fullImageLink = imageJson.file_url;

            $expandedImage.hide();
            $expandedWebM.hide();
            $expandedImage.attr("src", "");
            $expandedWebM.attr("src", "");

            if (imageJson.width > imageJson.height)
                $expandedImage.attr("id", "expandedImageW");
            else
                $expandedImage.attr("id", "expandedImageH");

            if (fileExt == "webm" || fileExt == "mp4") {
                $expandedWebM.attr("src", imageJson.file_url);
                $expandedWebM.show();
                $expandedWebM[0].play();
            } else if (fileExt == "zip") {
                $expandedWebM.attr("src", imageJson.large_file_url);
                $expandedWebM.show();
                $expandedWebM[0].play();
            } else {
                console.log(samepleImageURL);

                if (useFullSizeImage)
                    $expandedImage.attr("src", imageJson.file_url);
                else {
                    $expandedImage.attr("src", samepleImageURL);


                    $expandedImage.on("error", function() {
                        $(this).unbind("error").attr("src", samepleImageURL.replace("sample/sample-", ""));
                    });
                }

                $expandedImage.show();

            }
        }

    }


    catalogContainer.addEventListener('auxclick', function(event) {

        if ($sidebarImageTagContainer.is(":visible")) {
            $sidebarAllTagContainer.show();
            $sidebarImageTagContainer.hide();
        }
    });

    $expandedWebM.click(function(e) {
        e.stopPropagation();
    });

    $expandedImage.mouseup(function(e) {
        if (e.which == 2)
            window.open(fullImageLink, '_blank');
    });

    $expandedImage.click(function(e) {
        e.stopPropagation();
        try {
            $(".image")[currentImagePosition + 1].click();
        } catch (error) {
            expandedImageContainer.click();
        }

    });

    $expandedImageContainer.click(function() {
        $expandedImageContainer.hide();
        $expandedWebM[0].pause();
        $expandedImage.attr("src", "");

        if (oldImagePosition != currentImagePosition)
            currentImagePosition = -1;

    });



    function createImageTagList(tagList) {

        while (sidebarImageTagContainer.firstChild) {
            sidebarImageTagContainer.removeChild(sidebarImageTagContainer.firstChild);
        }

        sidebarImageTagContainer.scrollTop = 100;
        tagList.sort();

        tagList = Array.from(new Set([...selectedTagList.split(" "), ...tagList]));
        tagList.splice(tagList.indexOf(""), 1);
        createTag(tagList, sidebarImageTagContainer, false);
    }

    function createTagList() {

        while (sidebarAllTagContainer.firstChild) {
            sidebarAllTagContainer.removeChild(sidebarAllTagContainer.firstChild);
        }

        $('#searchbarTags').html("");

        sidebarAllTagContainer.scrollTop = 100;
        tagList.sort();

        tagList = Array.from(new Set([...selectedTagList.split(" "), ...tagList]));
        tagList.splice(tagList.indexOf(""), 1);
        createTag(tagList, sidebarAllTagContainer, true);
    }

    function createTag(tagList, tagContainerr, addToSearch) {

        tagList.forEach(tag => {
            var button = document.createElement("button");
            button.innerHTML = tag;
            button.id = "tagItem";

            if (selectedTagList.split(" ").includes(tag))
                button.id = "tagItemSelected";


            tagContainerr.appendChild(button);

            if (addToSearch)
                $('#searchbarTags').append("<option value='" + tag + "'>");


            button.onclick = function() {

                var tags = selectedTagList.split(" ");

                if (tags.includes(tag))
                    tags.splice(tags.indexOf(tag), 1);
                else
                    tags.push(tag)

                selectedTagList = tags.join(' ');

                search();
            }
        });

    }

    function onLoaded() {

        $loading.hide();

        var pagesToLoad = 0;

        if (searchDanbooru)
            pagesToLoad++;
        if (searchKonachan)
            pagesToLoad++;
        if (searchYandere)
            pagesToLoad++;

        if (pagesToLoad == numberOfPagesLoaded) {

            $("body").removeClass("disable")

            catalogContainer.style.visibility = "visible";
            createTagList(catalogContainer);
            $sidebarAllTagContainer.show();
            $sidebarImageTagContainer.hide();

            if (catalogContainer.childElementCount < 1) {
                $nextPageButton.hide();
                $mascot.show();
            } else {
                $nextPageButton.show();
                $mascot.hide();
            }

            if (pageNumber == 1)
                $previousPageButton.hide();
            else if (pageNumber == 2)
                $previousPageButton.show();
        } else {
            catalogContainer.style.visibility = "hidden";
        }

    }


    function search() {
        pageNumber = 1;
        goToPage(selectedTagList);
    }

    function goToPage() {

        $("#pageInput").val(pageNumber);

        searchbar.value = selectedTagList;

        loadContent(createURL("https://konachan.com/post.json?"),
            createURL("https://yande.re/post.json?"),
            createURL("https://danbooru.donmai.us/posts.json?"));

    }


    function createURL(URL) {

        var url = URL +
            "page=" + pageNumber +
            "&tags=" + selectedTagList;

        var resolution = $("#searchResolutionSelector option:selected");

        if (resolution.index() != 0) {
            if(resolution.index() <= 4) {
                url += "+width:" + resolution.html().split("x")[0];
                url += "+height:" + resolution.html().split("x")[1];
            } else {
                url += "+width:>=" + resolution.val();// + resolution.html();
                console.log(url);
            }
        }

        if (showSFW && showEcchi && showHentai)
            url += "";
        else if (showSFW && showEcchi)
            url += "+rating:questionableless";
        else if (showHentai && showEcchi)
            url += "+rating:questionableplus";
        else if (showSFW)
            url += "+rating:s";
        else if (showEcchi)
            url += "+rating:q";
        else if (showHentai)
            url += "+rating:e";

        return url;
    }

    function onJsonLoad(Json) {
        try {
            JSON.parse(Json).forEach(image => {
                createImageContainer(image);
            });
        } catch (error) {
            console.log(error);
        }

        numberOfPagesLoaded++;
        onLoaded();
    }

    function loadContent(konachanURL, yandereURL, danbooruURL) {
        $loading.show();

        tagList = [];
        currentImagePosition = 0;
        numberOfPagesLoaded = 0;
        $("body").addClass("disable")

        if (!searchKonachan && !searchDanbooru && !searchYandere) {
            $konachanButton.click();
        }

        if (!showSFW && !showEcchi && !showHentai)
            $sfwButton.click();
        else if (showSFW && showHentai && !showEcchi)
            $hentaiButton.click();

        while (catalogContainer.firstChild) {
            catalogContainer.removeChild(catalogContainer.firstChild);
        }

        const KonachanRequest = new XMLHttpRequest();
        KonachanRequest.open("GET", proxyurl + konachanURL);
        // KonachanRequest.withCredentials = true;

        const yandareRequest = new XMLHttpRequest();
        yandareRequest.open("GET", proxyurl + yandereURL);


        const danboorRequest = new XMLHttpRequest();
        danboorRequest.open("GET", proxyurl + danbooruURL);

        KonachanRequest.onload = function() {
            onJsonLoad(this.response);
        }

        yandareRequest.onload = function() {
            onJsonLoad(this.response);
        }

        danboorRequest.onload = function() {
            onJsonLoad(this.response);
        }

        if (searchKonachan)
            KonachanRequest.send(null);
        if (searchYandere)
            yandareRequest.send();
        if (searchDanbooru)
            danboorRequest.send();
    }

});