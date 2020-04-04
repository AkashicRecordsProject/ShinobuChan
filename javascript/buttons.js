window.buttons = window.myNameSpace || {};
//this class deals with the construction and behavior of settings buttons
buttons.SettingsButton = class {
    isSelected = false;
    
    constructor(button, storageName) {
        const disabledButton = "sidebar-setting-button-disabled";
        var parent = this;
        this.button = button;
        this.storageName = storageName;
        //adding disabled class if disabled
        if (this.isSelected == false)
            button.addClass(disabledButton);
        //toggling enabled / disabled and saving to local storage
        button.click(function() {
            parent.isSelected = !parent.isSelected;
            if (parent.isSelected)
                button.removeClass(disabledButton);
            else
                button.addClass(disabledButton);
        });
    }

    setActive(isActive){
        if(!this.isSelected && isActive)
            this.button.click();
        else if(this.isSelected && !isActive)
            this.button.click();
    }
};