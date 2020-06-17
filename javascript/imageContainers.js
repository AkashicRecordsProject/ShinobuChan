window.imageContainers = window.myNameSpace || {};

//this class deals with keeping track of selected images and navigating the expanded image mode
imageContainers.expandedImageContainer = class {

    body = $("body");
    expandedImageContainer = $("#expanded-image-container");
    expandedImage = $("#expanded-image");
    expandedWebM = $("#expanded-webm");
    catalogContainer = $('#catalog-container');
    positionCounter = $("#image-position-counter");

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
        //open full sized image in new tab on middle click
        this.expandedImage.mouseup(function(e) {
            if (e.which == 2)
                parent.openImageInNewTab();
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
        //navigating using mouse scroll
        parent.expandedImageContainer.on('mousewheel', function(e){
          e.preventDefault();
          event.deltaY < 0 ? parent.goToPreviousImage() : parent.goToNextImage(); 
          return false;
        });
    }
    //open image link
    openImageInNewTab(){
        window.open(this.fullImageLink, '_blank');
    }

    //this is used to reload the image when switching between full size and sample
    reloadImage() {
        this.expandedImage.attr("src", "");
        $(".gallery-image")[this.currentImagePosition].click();
    }
    //go to next image or exit expanded image mode
    goToNextImage() {
        try {
            $(".gallery-image")[this.currentImagePosition + 1].click();
        } catch (error) {
            this.closeImage();
        }
    }
    // go to previous image or exit expanded image mode
    goToPreviousImage() {
        if (this.currentImagePosition > 0)
            $(".gallery-image")[this.currentImagePosition - 1].click()
        else
            this.closeImage();
    }
    //pauses videos, clear src and hide images
    closeImage() {
        this.body.removeClass("invisible-scrollbar");
        this.positionCounter.text("");
        this.expandedImageContainer.hide();
        this.expandedImage.hide();
        this.expandedWebM.hide();
        this.expandedImage.attr("src", "");
        this.expandedWebM.attr("src", "");
        this.expandedWebM.get(0).pause();

        if (parent.oldImagePosition != parent.currentImagePosition)
            parent.currentImagePosition = -1;
    }
    //toggle play pause on videos
    togglePlayPauseVideo() {
        this.expandedWebM[0].paused ? this.expandedWebM[0].play() : this.expandedWebM[0].pause();
    }
    //used for keeping track of selected image for tags and navigation
    setSelectedImagePosition(position) {
        this.oldImagePosition = this.currentImagePosition;
        this.currentImagePosition = position;
    }
    //open expanded image or video
    openImage(imageModel, position) {

        this.body.addClass("invisible-scrollbar");
        this.expandedImage.attr("src", "");
        this.expandedWebM.attr("src", "");
        this.expandedImageContainer.show();
        this.setSelectedImagePosition(position);
        this.fullImageLink = imageModel.url;
        this.expandedImage.attr("title", imageModel.tags.toString().replace(/,/g,"\n"));
        //setting style based on image width
        if (imageModel.isPortrait)
            this.expandedImage.addClass("expanded-tall");

        //displaying the image based on what type of image it is
        switch (imageModel.type) {
            default:
            case 0: //image
                this.expandedWebM.hide();
                this.expandedImage.show();

                if (this.fullImageSettingButton.isSelected) {
                    this.expandedImage.attr("src", imageModel.url);
                } else {
                    this.expandedImage.attr("src", imageModel.sampleUrl);
                    // this.expandedImage.on("error", function() {
                    //     $(this).unbind("error").attr("src", imageModel.sampleUrl.replace("sample/sample-", ""));
                    // });
                }
                break;
            case 2: //zip
            case 1: //webM
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

    parent = this;
    tagList = [];
    expandedImageContainer = null;
    container = $("#catalog-container");;
    sidebarPreviewImage = $("#sidebar-preview-image");
    sidebarPreviewImageTmp = $("#sidebar-preview-image-tmp");
    sidebarPreviewInfo = $("#sidebar-preview-info");
    sidebarPreviewContainer = $("#sidebar-preview-container");
    positionCounter = $("#image-position-counter");
    ctrlHeld = false;


    constructor(expandedImageContainer) {
        this.expandedImageContainer = expandedImageContainer;
    }
    //used to add images to the catalog container
    addImage(imageModel, callback) {

        //hiding broken danbooru images 
        if(imageModel.previewUrl == "")
            return;

        var parent = this;
        var position = this.getNumberOfImages();
        var image = document.createElement("img");
        var catalogItem = document.createElement("div");

        catalogItem.classList.add("catalog-item");
        image.classList.add("gallery-image");
        image.src = imageModel.previewUrl;
        catalogItem.title = imageModel.tags.toString().replace(/,/g,"\n");
        imageModel.isPortrait ? image.classList.add("catalog-image-tall") : image.classList.add("catalog-image-wide");
        //adding tags to all tag list
        imageModel.tags.forEach(tag => {
            if (!this.tagList.includes(tag))
                this.tagList.push(tag)
        });
        //function for creating info rows for sidebar
        function createImageInfoRow(title, value){
            return "<b>" + title + ":</b><br>\xa0\xa0" +  value + "<br>";
        }
        //showing the sidebar preview container
        catalogItem.addEventListener("mouseenter", event => {
            event.stopPropagation();
            this.sidebarPreviewContainer.show();
            this.sidebarPreviewImageTmp.attr("src", "");
            this.sidebarPreviewImage.attr("src", "");
            this.sidebarPreviewImageTmp.attr("src", imageModel.previewUrl);

            if(imageModel.type == 0)
                this.sidebarPreviewImage.attr("src", imageModel.sampleUrl);
            else
                this.sidebarPreviewImage.attr("src", "./images/play.png");

            this.sidebarPreviewInfo.html(
                createImageInfoRow("Post In", imageModel.booru) + 
                createImageInfoRow("Post On", imageModel.postDate ) +
                createImageInfoRow("Rating", imageModel.rating ) +
                createImageInfoRow("Size", imageModel.size ));

            if(imageModel.copyright != "")
                this.sidebarPreviewInfo.append(createImageInfoRow("Show", imageModel.copyright));
        });
        //hiding the sidebar preview container
        catalogItem.addEventListener("mouseleave", event => {
            this.sidebarPreviewContainer.hide();
        });
        //toggling between image tags and catalog tags on middle click
        catalogItem.addEventListener('auxclick', function(event) {
            event.stopPropagation();
            parent.expandedImageContainer.setSelectedImagePosition(position);
            callback.apply(this, [
                (parent.expandedImageContainer.oldImagePosition === parent.expandedImageContainer.currentImagePosition), imageModel
            ]);
        });

        $(document).keydown(function(event) {
            if(event.keyCode == 17) {
                parent.ctrlHeld = true;
                return;
            }
        });

        $(document).keyup(function(event) {
            if(event.keyCode == 17) {
                parent.ctrlHeld = false;
                return;
            }
        });

        //opening expanded image
        catalogItem.onclick = function(e) {
            e.stopPropagation();
            //open image in a new tab instead of expanding it
            if(parent.ctrlHeld){
                window.open(imageModel.url, '_blank');
                return;
            }
            parent.sidebarPreviewContainer.hide();
            parent.expandedImageContainer.openImage(imageModel, position);
            parent.positionCounter.text("[" + (position + 1) + "/" + parent.getNumberOfImages()  + "]");
        }
        //reverting back to catalog tags when middle click on catalog container
        this.container.on('click auxclick contextmenu', function(e) {
            parent.expandedImageContainer.setSelectedImagePosition(position);
            callback.apply(this, [true, -1]);
        });

        catalogItem.appendChild(image);
        this.container.append(catalogItem);
    }
    //returns a list of all tags in the catalog
    getTags() {
        return this.tagList;
    }
    //returns the number of images in the catalog
    getNumberOfImages() {
        return this.container.children().length;
    }
    //used to hide until all pages are loaded
    hide() {
        this.container.hide();
    }
    //used to show after all pages are loaded
    show() {
        this.container.show();
    }

    isVisible() {
        return this.container.is(":visible");
    }

}