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

        const parent = this;
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
        // close the image container
        this.expandedImageContainer.click(function() {
            parent.closeImage();
        });

    }


    //this is used to reload the image when switching between full size and sample
    reloadImage() {
        this.expandedImage.attr("src", "");
        $(".gallery-image")[this.currentImagePosition].click();
    }
    //go to next image or close
    goToNextImage() {
        try {
            $(".gallery-image")[this.currentImagePosition + 1].click();
        } catch (error) {
            this.closeImage();
        }
    }
    // go to previous image or close
    goToPreviousImage() {
        if (this.currentImagePosition >= 1)
            $(".gallery-image")[this.currentImagePosition - 1].click();
        else
            this.closeImage();
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
    openImage(imageModel, position) {

        this.expandedImage.attr("src", "");
        this.expandedImageContainer.show();
        this.setSelectedImagePosition(position);
        this.fullImageLink = imageModel.url;

        //setting style based on image width
        if (imageModel.isPortrait)
            this.expandedImage.addClass("expanded-tall");

        //displaying the image based on what type of image it is
        //only danbooru has zip, webm, and mp4 files
        switch (imageModel.type) {
            default:
            case "IMAGE":
                this.expandedWebM.hide();
                this.expandedImage.show();

                if (this.fullImageSettingButton.isSelected) {
                    this.expandedImage.attr("src", imageModel.url);
                } else {
                    this.expandedImage.attr("src", imageModel.sampleUrl);

                    this.expandedImage.on("error", function() {
                        $(this).unbind("error").attr("src", imageModel.sampleUrl.replace("sample/sample-", ""));
                    });
                }
                break;
            case "ZIP":
            case "VIDEO":
                this.expandedWebM.show();
                this.expandedImage.hide();
                this.expandedImage.attr("src", "");
                this.expandedWebM.attr("src", imageModel.url);
                this.expandedWebM[0].play();
                break;

        }
    }

    isVisible() {
        return this.expandedImageContainer.is(":visible");
    }

}


























//this class deals with the construction of images for the catalog container and their behavior
imageContainers.catalogContainer = class {

    tagList = [];
    container = null; //document.getElementById('catalog-container');
    expandedImageContainer = null;
    parent = this;

    constructor(expandedImageContainer) {
        this.expandedImageContainer = expandedImageContainer;
        this.container = document.getElementById('catalog-container');

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



    addImage(imageModel, callback) {

        var parent = this;
        var catalogItem = document.createElement("div");
        var image = document.createElement("img");
        var position = this.getNumberOfImages();

        catalogItem.classList.add("catalog-item");

        image.src = imageModel.previewUrl;

        //adding tags to all tag list
        imageModel.tags.forEach(tag => {
            if (!this.tagList.includes(tag))
                this.tagList.push(tag)
        });

        image.classList.add("catalog-image-wide");

        if (imageModel.isPortrait)
            image.classList.add("catalog-image-tall");

        image.classList.add("gallery-image");

        catalogItem.appendChild(image);
        this.container.appendChild(catalogItem);

        //toggling between image tags and catalog tags on middle click
        catalogItem.addEventListener('auxclick', function(event) {
            event.stopPropagation();
            parent.expandedImageContainer.setSelectedImagePosition(position);
            callback.apply(this, [
                (parent.expandedImageContainer.oldImagePosition === parent.expandedImageContainer.currentImagePosition), imageModel
            ]);
        });
        //reverting back to catalog tags when middle click on catalog container
        this.container.addEventListener('auxclick', function(event) {
            parent.expandedImageContainer.setSelectedImagePosition(position);
            callback.apply(this, [true, -1]);
        });

        // opening expanded image
        catalogItem.onclick = function() {
            parent.expandedImageContainer.openImage(imageModel, position);
        }

    }
}