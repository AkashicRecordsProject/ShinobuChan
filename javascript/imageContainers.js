window.imageContainers = window.myNameSpace || {};

//this class deals with keeping track of selected images and navigating the expanded image mode
imageContainers.expandedImageContainer = class {

    expandedImageContainer = $("#expanded-image-container");
    expandedImage = $("#expanded-image");
    expandedWebM = $("#expanded-webm");
    catalogContainer = $('#catalog-container');

    fullImageSettingButton = null;
    currentImagePosition = -1;
    oldImagePosition = -1;
    fullImageLink = "";

    constructor(fullImageSettingButton) {

        parent = this;
        this.fullImageSettingButton = fullImageSettingButton;
        this.closeImage();

        this.expandedWebM.click(function(e) {
            e.stopPropagation();
        });
        //open full sized image in new tab
        this.expandedImage.mouseup(function(e) {
            if (e.which == 2)
                window.open(parent.fullImageLink, '_blank');
        });
        //go to next image or close view if on last image
        this.expandedImage.click(function(e) {
            e.stopPropagation();
            try {
                parent.goToNextImage();
            } catch (error) {
                parent.expandedImageContainer.click();
            }

        });
        //close the image container
        parent.expandedImageContainer.click(function() {
            parent.closeImage();
        });

    }

    //this is used to reload the image when switching between full size and sample
    reloadImage() {
        this.expandedImage.attr("src", "");
        $(".gallery-image")[parent.currentImagePosition].click();
    }
    //go to next image or close
    goToNextImage() {
        try {
            $(".gallery-image")[parent.currentImagePosition + 1].click();
        } catch (error) {
            parent.closeImage();
        }
    }
    // go to previous image or close
    goToPreviousImage() {
        if (this.currentImagePosition >= 1)
            $(".gallery-image")[parent.currentImagePosition - 1].click();
        else
            parent.closeImage();

    }

    //pauses videos, clears srcs and hides images
    closeImage() {
        this.expandedImageContainer.hide();
        this.expandedImage.hide();
        this.expandedWebM.hide();
        this.expandedImage.attr("src", "");
        this.expandedWebM.attr("src", "");
        this.expandedWebM.get(0).pause();

        if (parent.oldImagePosition != parent.currentImagePosition)
            parent.currentImagePosition = -1;
    }

    togglePlayPauseVideo() {
        if (this.expandedWebM[0].paused == true) {
            this.expandedWebM[0].play();
        } else {
            this.expandedWebM[0].pause();
        }
    }
    //used for keeping track of selected image for tags and navigation
    setSelectedImagePosition(position) {
        this.oldImagePosition = this.currentImagePosition;
        this.currentImagePosition = position;
    }
    //opens images and videos
    openImage(imageJson, position) {

        this.expandedImage.attr("src", "");
        this.expandedImageContainer.show();
        this.setSelectedImagePosition(position);
        this.fullImageLink = imageJson.file_url;
        var samepleImageURL = null;

        //danbooru uses large_file_url instead of sample_url
        if (imageJson.hasOwnProperty('sample_url'))
            samepleImageURL = imageJson.sample_url;
        else
            samepleImageURL = imageJson.large_file_url;

        //setting style based on image width
        if (imageJson.width < imageJson.height || imageJson.image_width < imageJson.image_height)
            this.expandedImage.addClass("expanded-tall");

        //displaying the image based on what type of image it is
        //only danbooru has zip, webm, and mp4 files
        if (imageJson.file_ext == "webm" || imageJson.file_ext == "mp4") {
            this.expandedImage.attr("src", "");
            this.expandedImage.hide();
            this.expandedWebM.attr("src", imageJson.file_url);
            this.expandedWebM.show();
            this.expandedWebM[0].play();
        } else if (imageJson.file_ext == "zip") {
            this.expandedImage.attr("src", "");
            this.expandedImage.hide();
            this.expandedWebM.attr("src", imageJson.large_file_url);
            this.expandedWebM.show();
            this.expandedWebM[0].play();
        } else {

            this.expandedWebM.hide();

            if (this.fullImageSettingButton.isSelected)
                this.expandedImage.attr("src", imageJson.file_url);
            else {
                this.expandedImage.attr("src", samepleImageURL);

                this.expandedImage.on("error", function() {
                    $(this).unbind("error").attr("src", samepleImageURL.replace("sample/sample-", ""));
                });
            }

            this.expandedImage.show();
        }
    }

    isVisible() {
        return this.expandedImageContainer.is(":visible");
    }

}





//this class deals with the construction of images for the catalog container and their behavior
imageContainers.catalogContainer = class {

    tagList = [];
    container = document.getElementById('catalog-container');
    expandedImageContainer = null;

    constructor(expandedImageContainer) {
        this.expandedImageContainer = expandedImageContainer;
    }

    hide() {
        this.container.style.visibility = "hidden";
    }

    show() {
        this.container.style.visibility = "visible";
    }

    isVisible() {
        return this.container.is(":visible");
    }

    getTags() {
        return this.tagList;
    }

    getNumberOfImages() {
        return this.container.childElementCount;
    }

    //removing all images in container
    clearImages() {

        this.tagList = [];
        while (this.container.firstChild) {
            this.container.removeChild(this.container.firstChild);
        }
    }

    //creating images and adding them to the container
    //creating tags for each image and for the container
    addImageFromJson(imageJson, callback) {

        var parent = this;
        var catalogItem = document.createElement("div");
        var image = document.createElement("img");
        var position = this.getNumberOfImages();
        var samepleImageURL = null;

        // catalogItem.id = "catalog-item";
        catalogItem.classList.add("catalog-item");
        //creating tags for konachan and yandere
        try {
            imageJson.tags.split(" ").forEach(tag => {
                if (!this.tagList.includes(tag))
                    this.tagList.push(tag)
            });

            image.src = imageJson.preview_url;
            samepleImageURL = imageJson.sample_url;

        } //creating tags for danbooru
        catch (error) {

            imageJson.tag_string_general.split(" ").forEach(tag => {
                if (!this.tagList.includes(tag))
                    this.tagList.push(tag)
            });

            imageJson.tag_string_character.split(" ").forEach(tag => {
                if (!this.tagList.includes(tag))
                    this.tagList.push(tag)
            });

            imageJson.tag_string_copyright.split(" ").forEach(tag => {
                if (!this.tagList.includes(tag))
                    this.tagList.push(tag)
            });

            imageJson.tag_string_artist.split(" ").forEach(tag => {
                if (!this.tagList.includes(tag))
                    this.tagList.push(tag)
            });

            image.src = imageJson.preview_file_url;
            samepleImageURL = imageJson.large_file_url;
        }

        if (samepleImageURL == null)
            return;

        image.classList.add("catalog-image-wide");

        //setting tall id for konachan and yandere
        if (imageJson.preview_width != null && imageJson.preview_height > imageJson.preview_width) {
            image.classList.add("catalog-image-tall");
        } //setting tall id for danbooru 
        else if (imageJson.image_width != null && imageJson.image_height > imageJson.image_width) {
            image.classList.add("catalog-image-tall");
        }

        image.classList.add("gallery-image");

        catalogItem.appendChild(image);
        this.container.appendChild(catalogItem);

        //toggling between image tags and catalog tags on middle click
        catalogItem.addEventListener('auxclick', function(event) {
            event.stopPropagation();
            parent.expandedImageContainer.setSelectedImagePosition(position);
            callback.apply(this, [
                (parent.expandedImageContainer.oldImagePosition === parent.expandedImageContainer.currentImagePosition), imageJson
            ]);
        });
        // reverting back to catalog tags when middle click on catalog container
        this.container.addEventListener('auxclick', function(event) {
            parent.expandedImageContainer.setSelectedImagePosition(position);
            callback.apply(this, [true, -1]);
        });

        // opening expanded image
        catalogItem.onclick = function() {
            parent.expandedImageContainer.openImage(imageJson, position);
        }

    }

}